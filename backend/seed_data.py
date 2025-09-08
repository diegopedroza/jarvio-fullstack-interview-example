import uuid
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app import models

def create_seed_data():
    db = SessionLocal()
    
    try:
        # Create sample user
        user = models.User(
            email="demo@example.com",
            name="Demo User"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create sample products
        sample_products = [
            {
                "asin": "B08N5WRWNW",
                "title": "Echo Dot (4th Gen) | Smart speaker with Alexa | Charcoal",
                "description": "Our most popular smart speaker with a fabric design. It is our most compact smart speaker that fits perfectly into small spaces.",
                "bullet_points": [
                    "Crisp vocals and balanced bass",
                    "Voice control your music",
                    "Ready to help"
                ],
                "sales_amount": 15000.50
            },
            {
                "asin": "B085HV4BZ6",
                "title": "Fire TV Stick 4K | Streaming Media Player",
                "description": "The most powerful streaming media stick with 4K Ultra HD and Alexa Voice Remote.",
                "bullet_points": [
                    "4K Ultra HD streaming",
                    "Alexa Voice Remote included",
                    "Thousands of channels, apps, and Alexa skills"
                ],
                "sales_amount": 12500.75
            },
            {
                "asin": "B07H8XQZPX",
                "title": "Kindle Paperwhite – Now Waterproof with 2x the Storage",
                "description": "The best Kindle, now waterproof with 32 GB storage and weeks of battery life.",
                "bullet_points": [
                    "Waterproof design",
                    "32 GB of storage",
                    "Weeks of battery life"
                ],
                "sales_amount": 8900.25
            },
            {
                "asin": "B07XJ8C8F7",
                "title": "Ring Video Doorbell 3 – Enhanced WiFi, Motion Detection",
                "description": "See, hear and speak to visitors from your phone, tablet and PC with 1080p HD video.",
                "bullet_points": [
                    "1080p HD video",
                    "Enhanced WiFi",
                    "Motion detection"
                ],
                "sales_amount": 6750.80
            },
            {
                "asin": "B01E6AO69U",
                "title": "Amazon Basics High-Speed HDMI Cable",
                "description": "High-speed HDMI cable supports 4K video at 60 Hz, 2160p, 48 bit/px color depth.",
                "bullet_points": [
                    "Supports 4K video at 60 Hz",
                    "2160p resolution",
                    "Gold-plated connectors"
                ],
                "sales_amount": 3200.40
            }
        ]
        
        for product_data in sample_products:
            product = models.MyProduct(**product_data)
            db.add(product)
        
        db.commit()
        
        # Create sample workflow
        sample_workflow = {
            "name": "Get Top Product Details",
            "description": "Gets the best selling product and shows its details",
            "flow_data": {
                "nodes": [
                    {
                        "id": "get-top-asins",
                        "type": "get_bestselling_asins",
                        "position": {"x": 100, "y": 100},
                        "data": {"topCount": 5, "label": "Get Top 5 ASINs"}
                    },
                    {
                        "id": "select-first",
                        "type": "get_asin_by_index",
                        "position": {"x": 400, "y": 100},
                        "data": {"index": 0, "label": "Get First ASIN"}
                    },
                    {
                        "id": "get-details",
                        "type": "get_asin_details",
                        "position": {"x": 700, "y": 100},
                        "data": {"label": "Get ASIN Details"}
                    }
                ],
                "edges": [
                    {
                        "id": "edge-1",
                        "source": "get-top-asins",
                        "target": "select-first",
                        "type": "smoothstep"
                    },
                    {
                        "id": "edge-2",
                        "source": "select-first",
                        "target": "get-details",
                        "type": "smoothstep"
                    }
                ]
            },
            "user_id": user.id
        }
        
        workflow = models.Workflow(**sample_workflow)
        db.add(workflow)
        db.commit()
        db.refresh(workflow)
        
        # Create sample workflow run
        sample_run = models.WorkflowRun(
            workflow_id=workflow.id,
            user_id=user.id,
            status="completed",
            results={
                "get-top-asins": {
                    "type": "asin_list",
                    "value": ["B08N5WRWNW", "B085HV4BZ6", "B07H8XQZPX", "B07XJ8C8F7", "B01E6AO69U"],
                    "count": 5
                },
                "select-first": {
                    "type": "single_asin",
                    "value": "B08N5WRWNW"
                },
                "get-details": {
                    "type": "product_details",
                    "value": {
                        "asin": "B08N5WRWNW",
                        "title": "Echo Dot (4th Gen) | Smart speaker with Alexa | Charcoal",
                        "description": "Our most popular smart speaker with a fabric design. It is our most compact smart speaker that fits perfectly into small spaces.",
                        "bullet_points": [
                            "Crisp vocals and balanced bass",
                            "Voice control your music",
                            "Ready to help"
                        ]
                    }
                }
            }
        )
        db.add(sample_run)
        db.commit()
        
        print("Seed data created successfully!")
        
    except Exception as e:
        print(f"Error creating seed data: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    create_seed_data()