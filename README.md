# Workflow Builder - Take-Home Interview Project

A comprehensive full-stack application demonstrating a workflow builder similar to n8n, built for take-home interview assessments.

## 🏗️ Architecture

### Frontend
- **React 18** with **TypeScript** (strict mode)
- **Vite** for fast development and building
- **React Router** for navigation
- **Zustand** for state management
- **React Query** + **Axios** for data fetching
- **Tailwind CSS** for styling
- **React Hook Form** + **Zod** for form handling
- **ReactFlow** for workflow canvas
- **Lucide React** for icons

### Backend
- **FastAPI** with **Python 3.11**
- **SQLAlchemy** ORM with **Alembic** migrations
- **PostgreSQL 16** database
- **JWT** authentication (mock implementation)
- **Pydantic** for data validation
- **Docker** containerization
- **Gunicorn + Uvicorn** for production serving

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local frontend development)

### Setup (One Command)
```bash
./setup.sh
```

### Run (One Command)
```bash
./run.sh
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **API Docs**: http://localhost:8080/docs

### Demo Credentials
- **Email**: `demo@example.com`
- **Name**: `Demo User`

## 🛠️ Features

### Workflow Builder
The application includes a visual workflow builder with three types of nodes:

1. **Get Best Selling ASINs**
   - Fetches top N products by sales amount
   - Configurable count parameter
   - Returns list of ASINs

2. **Get ASIN by Index**
   - Selects a specific ASIN from a list by index
   - Configurable index parameter
   - Takes ASIN list as input, returns single ASIN

3. **Get ASIN Details**
   - Fetches detailed information for a single ASIN
   - Returns title, description, and bullet points
   - Takes single ASIN as input

### Core Functionality
- **Visual Workflow Designer**: Drag-and-drop interface using ReactFlow
- **Workflow Execution**: Run workflows and view results
- **Result Persistence**: All workflow runs are stored and accessible
- **Authentication**: JWT-based auth with mock implementation
- **Real-time Updates**: Live workflow execution results

### Sample Data
The application comes pre-seeded with:
- 5 sample Amazon products with realistic data
- 1 example workflow demonstrating all three node types
- 1 sample workflow run with results

## 🏃‍♂️ Development

### Local Development Setup

1. **Backend Development**:
```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
python seed_data.py
uvicorn app.main:app --reload --port 8080
```

2. **Frontend Development**:
```bash
cd frontend
npm install
npm run dev
```

### Database Management

**Create Migration**:
```bash
docker-compose exec backend alembic revision --autogenerate -m "Migration message"
```

**Apply Migrations**:
```bash
docker-compose exec backend alembic upgrade head
```

**Seed Data**:
```bash
docker-compose exec backend python seed_data.py
```

### Testing

**Backend Tests**:
```bash
cd backend
pytest
```

**Linting and Formatting**:
```bash
cd backend
black .
isort .
flake8 .
```

**Pre-commit Hooks**:
```bash
cd backend
pre-commit install
pre-commit run --all-files
```

## 📁 Project Structure

```
workflow-builder/
├── frontend/                 # React TypeScript frontend
│   ├── src/
│   │   ├── components/      # Reusable components
│   │   ├── pages/           # Page components
│   │   ├── hooks/           # Custom React hooks
│   │   ├── stores/          # Zustand stores
│   │   ├── types/           # TypeScript type definitions
│   │   └── utils/           # Utility functions
│   ├── package.json
│   └── vite.config.ts
├── backend/                  # FastAPI Python backend
│   ├── app/
│   │   ├── routers/         # API route handlers
│   │   ├── models.py        # SQLAlchemy models
│   │   ├── schemas.py       # Pydantic schemas
│   │   ├── auth.py          # Authentication logic
│   │   ├── database.py      # Database configuration
│   │   ├── config.py        # Application settings
│   │   └── workflow_engine.py # Workflow execution engine
│   ├── alembic/             # Database migrations
│   ├── tests/               # Test files
│   └── requirements.txt
├── docker-compose.yml        # Docker services configuration
├── setup.sh                 # Setup script
├── run.sh                   # Run script
└── README.md
```

## 🔧 Configuration

### Environment Variables

Create `.env` files based on the `.env.example` template:

**Backend** (`backend/.env`):
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/workflow_builder
JWT_SECRET=your-secret-key
AWS_ACCESS_KEY_ID=your-aws-key (optional)
AWS_SECRET_ACCESS_KEY=your-aws-secret (optional)
SLACK_WEBHOOK_URL=your-slack-webhook (optional)
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:8080
```

## 🚀 Production Deployment

The application is containerized and production-ready:

1. **Backend**: Uses Gunicorn + Uvicorn for optimal performance
2. **Frontend**: Builds optimized static assets
3. **Database**: PostgreSQL 16 with proper migrations
4. **CORS**: Configured for cross-origin requests

### Docker Production Build
```bash
docker-compose -f docker-compose.prod.yml up --build
```

## 🧪 Key Technical Decisions

### Authentication Strategy
- **Mock JWT Implementation**: Perfect for isolated local development
- **No External Dependencies**: Eliminates AWS Cognito setup complexity
- **Realistic Flow**: Maintains production-like authentication patterns

### State Management
- **Zustand**: Lightweight, TypeScript-friendly alternative to Redux
- **React Query**: Handles server state with caching and synchronization
- **Persistent Storage**: Auth state persists across browser sessions

### Workflow Engine
- **Simple Topological Sort**: Determines node execution order
- **Result Chaining**: Passes data between connected nodes
- **Error Handling**: Graceful failure with detailed error messages

### Database Design
- **Normalized Schema**: Separate tables for users, workflows, runs, and products
- **JSON Storage**: Flexible workflow definition storage
- **UUID Primary Keys**: Better for distributed systems

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with proper tests
4. Run pre-commit hooks
5. Submit a pull request

## 📋 Interview Assessment Criteria

This project demonstrates:

✅ **Full-Stack Proficiency**: React + FastAPI integration  
✅ **Modern Tooling**: Vite, TypeScript strict mode, React Query  
✅ **Database Skills**: SQLAlchemy, Alembic migrations, PostgreSQL  
✅ **Authentication**: JWT implementation and protected routes  
✅ **UI/UX**: Interactive workflow builder with ReactFlow  
✅ **Testing**: Backend tests with pytest  
✅ **DevOps**: Docker containerization and development setup  
✅ **Code Quality**: Pre-commit hooks, linting, formatting  
✅ **Documentation**: Comprehensive setup and usage instructions  
✅ **Architecture**: Clean separation of concerns and scalable structure

## 🛑 Stopping the Application

```bash
docker-compose down
```

To remove all data:
```bash
docker-compose down -v
```

---

**Built with ❤️ for take-home interview assessments**# fullstack-interview-example
