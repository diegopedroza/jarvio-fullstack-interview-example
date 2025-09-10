from typing import Dict, Any, List
from sqlalchemy.orm import Session
from app import models


class WorkflowEngine:
    def __init__(self, db: Session):
        self.db = db
    
    def execute_workflow(self, workflow: models.Workflow, user: models.User) -> Dict[str, Any]:
        """Execute a workflow and return results"""
        flow_data = workflow.flow_data
        nodes = flow_data.get("nodes", [])
        edges = flow_data.get("edges", [])

        try:
            # Build execution graph
            execution_order = self._get_execution_order(nodes, edges)
            nodes_by_id = {node["id"]: node for node in nodes}
            
            # Create an adjacency list for quick lookups of outgoing edges
            adj = {node_id: [] for node_id in nodes_by_id}
            for edge in edges:
                adj[edge["source"]].append(edge["target"])

            results = self._execute_graph(execution_order, nodes_by_id, adj, edges, user)

            return {"status": "success", "results": results}
        except Exception as e:
            return {"status": "error", "error": str(e)}

    def _execute_graph(self, execution_order: List[str], nodes_by_id: Dict[str, Dict], adj: Dict[str, List[str]], edges: List[Dict], user: models.User) -> Dict[str, Any]:
        """Executes the workflow graph, handling loops and branches."""
        results = {}
        execution_queue = [node_id for node_id in execution_order]
        
        # Stack to manage the state of active loops
        loop_stack = []

        # Set of visited nodes to handle graph traversal
        visited = set()

        while execution_queue:
            node_id = execution_queue.pop(0)

            if node_id in visited and not (loop_stack and node_id == loop_stack[-1]["loop_body_start_node"]):
                continue # Skip if already visited and not part of a loop iteration
            
            node = nodes_by_id[node_id]
            node_type = node.get("type")

            # Check if this node is the merge point of an active loop
            if loop_stack and node_id == loop_stack[-1]["merge_node_id"]:
                self._handle_loop_iteration(node, results, edges, loop_stack, execution_queue, adj)
                continue
            
            # If in a loop, provide the current item as context for nodes in the loop body
            if loop_stack:
                current_loop = loop_stack[-1]
                if current_loop["iteration_index"] < len(current_loop["iterable_data"]):
                    current_item = current_loop["iterable_data"][current_loop["iteration_index"]]
                    # The context provides the item as a "single_asin" type for the next node
                    results["loop_context"] = {"type": "single_asin", "value": current_item}

            # Execute the node
            if node_type == "loop":
                self._execute_loop_node(node, results, edges, loop_stack, adj)
            else:
                try:
                    result = self._execute_node(node, results, edges, user)
                    if result is not None:
                        results[node_id] = result
                except Exception as e:
                    if loop_stack:
                        # Add context to errors that happen inside a loop
                        current_item = results.get("loop_context", {}).get("value", "unknown")
                        raise ValueError(f"Failed processing item '{current_item}' in loop: {e}") from e
                    raise e

            visited.add(node_id)

            # Add next nodes to the queue
            for neighbor in adj.get(node_id, []):
                if neighbor not in execution_queue:
                    execution_queue.append(neighbor)

        return results

    def _execute_node(self, node: Dict, results: Dict, edges: List[Dict], user: models.User) -> Any:
        """Executes a single node based on its type."""
        node_id = node["id"]
        node_type = node.get("type")

        if node_type == "get_bestselling_asins":
            return self._execute_get_bestselling_asins(node, user)
        elif node_type == "get_asin_by_index":
            # This node is now handled inside the loop logic
            # We pass the iteration context to it
            return self._execute_get_asin_by_index(node, results, edges)
        elif node_type == "get_asin_details":
            return self._execute_get_asin_details(node, results, edges)
        elif node_type == "merge":
            # This is for non-loop merges
            return self._execute_merge(node, results, edges)
        
        # Return None for nodes that don't produce a direct result (like 'loop')
        return None

    def _get_execution_order(self, nodes: List[Dict], edges: List[Dict]) -> List[str]:
        """Determine execution order based on node dependencies"""
        # Validate loop-merge pairings before sorting
        loop_nodes = {node["id"]: node for node in nodes if node.get("type") == "loop"}
        merge_nodes = {node["id"]: node for node in nodes if node.get("type") == "merge"}

        for loop_id, loop_node in loop_nodes.items():
            merge_id = loop_node.get("data", {}).get("mergeId")
            if not merge_id:
                raise ValueError(f"Loop node {loop_id} is missing a mergeId.")
            if merge_id not in merge_nodes:
                raise ValueError(f"Loop node {loop_id} points to a non-existent or non-merge node {merge_id}.")
            
            merge_node = merge_nodes[merge_id]
            if merge_node.get("data", {}).get("loopId") != loop_id:
                raise ValueError(f"Merge node {merge_id} does not point back to loop node {loop_id}.")

        for merge_id, merge_node in merge_nodes.items():
            loop_id = merge_node.get("data", {}).get("loopId")
            if not loop_id:
                raise ValueError(f"Merge node {merge_id} is missing a loopId.")
            if loop_id not in loop_nodes:
                raise ValueError(f"Merge node {merge_id} points to a non-existent or non-loop node {loop_id}.")

        # Perform topological sort
        in_degree = {node["id"]: 0 for node in nodes}
        
        for edge in edges:
            in_degree[edge["target"]] += 1
        
        queue = [node_id for node_id, degree in in_degree.items() if degree == 0]
        result = []
        
        while queue:
            node_id = queue.pop(0)
            result.append(node_id)
            
            for edge in edges:
                if edge["source"] == node_id:
                    in_degree[edge["target"]] -= 1
                    if in_degree[edge["target"]] == 0:
                        queue.append(edge["target"])
        
        return result
    
    def _execute_get_bestselling_asins(self, node: Dict, user: models.User) -> Dict[str, Any]:
        """Execute get_bestselling_asins node"""
        node_data = node.get("data", {})
        top_count = node_data.get("topCount", 10)
        
        products = (
            self.db.query(models.MyProduct)
            .order_by(models.MyProduct.sales_amount.desc())
            .limit(top_count)
            .all()
        )
        
        asins = [product.asin for product in products]
        return {"type": "asin_list", "value": asins, "count": len(asins)}
    
    def _execute_get_asin_by_index(self, node: Dict, results: Dict, edges: List[Dict]) -> Dict[str, Any]:
        """Execute get_asin_by_index node"""
        node_data = node.get("data", {})
        index = node_data.get("index", 0)

        # Check for loop context first
        loop_context = results.get("loop_context")
        if loop_context:
            input_data = loop_context
        else:
            # Fallback to standard edge input
            inputs = self._get_input_from_edges(node["id"], edges, results)
            if not inputs:
                raise ValueError(f"No input found for node {node['id']}")
            input_data = list(inputs.values())[0]


        if input_data["type"] != "asin_list":
            raise ValueError(f"Expected asin_list input, got {input_data['type']}")
        
        asin_list = input_data["value"]
        if index >= len(asin_list):
            raise ValueError(f"Index {index} out of range for list of length {len(asin_list)}")
        
        selected_asin = asin_list[index]
        return {"type": "single_asin", "value": selected_asin}
    
    def _execute_get_asin_details(self, node: Dict, results: Dict, edges: List[Dict]) -> Dict[str, Any]:
        """Execute get_asin_details node"""
        # The loop context is the primary source of input when inside a loop
        loop_context = results.get("loop_context")
        if loop_context:
            input_data = loop_context
        else:
            # Fallback for non-loop execution
            inputs = self._get_input_from_edges(node["id"], edges, results)
            if not inputs:
                raise ValueError(f"No input found for get_asin_details node {node['id']}")
            input_data = list(inputs.values())[0]

        if input_data["type"] != "single_asin":
            raise ValueError(f"Expected single_asin input, got {input_data['type']}")
        
        asin = input_data["value"]
        product = self.db.query(models.MyProduct).filter(models.MyProduct.asin == asin).first()
        
        if not product:
            raise ValueError(f"Product not found for ASIN: {asin}")
        
        return {
            "type": "product_details",
            "value": {
                # Use ASIN as key for easier merging
                product.asin: {
                    "asin": product.asin,
                    "title": product.title,
                    "description": product.description,
                    "bullet_points": product.bullet_points
                }
            } # The value is now a dictionary keyed by the ASIN
        }

    def _execute_merge(self, node: Dict, results: Dict, edges: List[Dict]) -> Dict[str, Any]:
        """Merges multiple inputs into a single dictionary."""
        # This method now only handles non-loop merges. Loop merges are handled by _handle_loop_iteration
        inputs = self._get_input_from_edges(node["id"], edges, results, exclude_loop_context=True)
        if not inputs:
            # Merge node with no inputs returns an empty object
            return {"type": "merged_data", "value": {}}

        merged_data = {}
        for source_id, input_data in inputs.items():
            if isinstance(input_data.get("value"), dict):
                merged_data.update(input_data["value"])

        return {"type": "merged_data", "value": merged_data}

    def _get_input_from_edges(self, node_id: str, edges: List[Dict], results: Dict[str, Any], exclude_loop_context: bool = False) -> Dict[str, Any]:
        """Gathers all inputs for a given node from the executed results."""
        inputs = {}
        for edge in edges:
            if edge["target"] == node_id and edge["source"] in results:
                if exclude_loop_context and edge["source"] == "loop_context":
                    continue
                inputs[edge["source"]] = results[edge["source"]]
        return inputs

    def _execute_loop_node(self, node: Dict, results: Dict, edges: List[Dict], loop_stack: List[Dict], adj: Dict[str, List[str]]):
        """Initializes a loop's state and pushes it to the loop stack."""
        inputs = self._get_input_from_edges(node["id"], edges, results)
        if not inputs:
            raise ValueError(f"Loop node {node['id']} requires an input.")
        
        input_data = list(inputs.values())[0]
        iterable_data = input_data.get("value", [])

        if not isinstance(iterable_data, list):
            raise ValueError(f"Loop input must be a list, but got {type(iterable_data)}.")

        # Find the start of the loop body (the node connected from the loop node)
        loop_body_start_nodes = adj.get(node["id"], [])
        if not loop_body_start_nodes:
            # A loop with no body, just finish it.
            return

        loop_state = {
            "loop_node_id": node["id"],
            "merge_node_id": node["data"]["mergeId"],
            "iterable_data": iterable_data,
            "iteration_index": 0,
            "iteration_results": [],
            "loop_body_start_node": loop_body_start_nodes[0],
        }
        loop_stack.append(loop_state)

    def _handle_loop_iteration(self, merge_node: Dict, results: Dict, edges: List[Dict], loop_stack: List[Dict], execution_queue: List[str], adj: Dict[str, List[str]]):
        """Manages the state of a loop at its merge point."""
        loop_state = loop_stack[-1]

        # Gather results from the last iteration
        iteration_inputs = self._get_input_from_edges(merge_node["id"], edges, results)
        loop_state["iteration_results"].append(iteration_inputs)

        loop_state["iteration_index"] += 1

        if loop_state["iteration_index"] < len(loop_state["iterable_data"]):
            # More items to process, queue up the start of the loop body again
            # Clean up the context from the previous iteration before starting the next one
            if "loop_context" in results:
                del results["loop_context"]

            execution_queue.insert(0, loop_state["loop_body_start_node"])
        else:
            # Loop finished, pop from stack and set the final result for the merge node
            finished_loop = loop_stack.pop()
            final_merged_data = {}
            for res in finished_loop["iteration_results"]:
                for item in res.values():
                    if isinstance(item.get("value"), dict):
                        final_merged_data.update(item["value"])
            
            results[merge_node["id"]] = {"type": "product_details_table", "value": list(final_merged_data.values())}
            
            # Final cleanup of loop context
            if "loop_context" in results:
                del results["loop_context"]