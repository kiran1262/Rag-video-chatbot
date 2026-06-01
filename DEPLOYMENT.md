# Production Deployment with Docker

## Build Images
```bash
docker build -t rag-video-backend:latest ./backend
docker build -t rag-video-frontend:latest ./frontend
```

## Deploy to AWS ECS, Google Cloud Run, or DigitalOcean App Platform

### Environment Variables (Required for Production)
- `OPENAI_API_KEY` - OpenAI API key for GPT-4o
- `PINECONE_API_KEY` - Pinecone vector DB API key
- `PINECONE_INDEX_NAME` - Name of Pinecone index
- `PINECONE_ENVIRONMENT` - Pinecone region (e.g., us-east-1)
- `ENVIRONMENT` - Set to "production"

### Health Check Endpoints
- Backend: `GET /` (returns `{"status": "ok"}`)
- Frontend: Health check on port 3000