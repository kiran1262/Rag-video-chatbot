# RAG Video Chatbot 🎥💬

A full-stack Retrieval-Augmented Generation (RAG) chatbot that analyzes and compares social media videos (YouTube & Instagram Reels) using LangChain, vector embeddings, and streaming chat responses.

## 📋 Project Overview

### What It Does
1. **Ingests** 2 social media video URLs (YouTube + Instagram Reels)
2. **Extracts** transcripts, metadata (views, likes, comments, creator info, etc.)
3. **Computes** engagement metrics (engagement_rate = (likes + comments) / views × 100)
4. **Chunks & Embeds** transcripts using OpenAI embeddings
5. **Stores** embeddings in Pinecone vector database
6. **Provides** intelligent chat interface to compare videos and answer questions
7. **Streams** responses with source citations and maintains conversation memory

### Example Queries
- *Why did Video A get more engagement than Video B?*
- *What's the engagement rate of each video?*
- *Compare the hooks in the first 5 seconds.*
- *Who's the creator of Video B and what's their follower count?*
- *Suggest improvements for B based on what worked in A.*

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|----------|
| **Frontend** | Next.js 14 + React 18 + TailwindCSS | Side-by-side video cards + chat UI |
| **Backend** | FastAPI + Python 3.11 | API for video processing & RAG |
| **LLM Orchestration** | LangChain + LangGraph | RAG pipeline & memory management |
| **Embeddings** | OpenAI `text-embedding-3-small` | Convert text to vectors (1536-dim) |
| **Vector DB** | Pinecone | Store & retrieve embeddings (O(1) lookup) |
| **LLM** | GPT-4o (via OpenAI API) | Main reasoning engine |
| **Transcripts** | `youtube-transcript-api` + `yt-dlp` | Extract video text |
| **Streaming** | FastAPI SSE (Server-Sent Events) | Stream chat responses in real-time |

---

## 📊 Cost Analysis at Scale (1,000 creators/day)

### Daily Volume: 2,000 videos

| **Component** | **Cost/1000 videos** | **Notes** |
|---|---|---|
| **GPT-4o (chat)** | $60–80 | ~2K tokens per comparison |
| **Embeddings (OpenAI)** | $0.40 | ~200K tokens to embed all chunks |
| **Vector DB (Pinecone)** | $100/mo | Standard tier, ~2M vectors/month |
| **YouTube API** | $0 | Free quota for public videos |
| **Server (AWS EC2/DO)** | $50–150/mo | FastAPI + Next.js deployment |
| **Total/mo** | ~$200–330 | **$6–10 per creator** |

### Why This Is Cost-Efficient
- ✅ **Vector DB reuses embeddings** — No re-computation once stored
- ✅ **Streaming reduces token usage** — Partial responses vs. full context
- ✅ **Pinecone indexing is O(1)** — Sub-100ms retrieval at any scale
- ✅ **OpenAI embeddings are cheap** — $0.02/1M tokens
- ✅ **YouTube API is free** — No transcript extraction costs for public videos

---

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+
- API Keys: OpenAI, Pinecone

### Installation

```bash
# Clone repo
git clone https://github.com/kiran1262/Rag-video-chatbot.git
cd Rag-video-chatbot

# Backend setup
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your API keys
uvicorn main:app --reload

# Frontend setup (new terminal)
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

Visit `http://localhost:3000`

---

## 📁 Project Structure

```
Rag-video-chatbot/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   ├── .env.example
│   ├── services/
│   │   ├── video_processor.py
│   │   ├── embeddings.py
│   │   ├── rag_chain.py
│   │   ├── vector_store.py
│   │   ├── youtube_extractor.py
│   │   └── instagram_extractor.py
│   ├── models/
│   │   └── schemas.py
│   └── utils/
│       ├── transcript_parser.py
│       ├── engagement_metrics.py
│       └── logger.py
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   ├── components/
│   │   │   ├── VideoCard.tsx
│   │   │   ├── ChatPanel.tsx
│   │   │   └── EngagementMetrics.tsx
│   │   └── api/
│   │       ├── process-videos/route.ts
│   │       └── chat/route.ts
│   ├── package.json
│   └── .env.example
├── docker-compose.yml
└── .gitignore
```

---

## 🔄 Data Flow

1. **User provides 2 video URLs** → FastAPI validates
2. **Extract transcripts & metadata** → YouTube API / Instagram scraper
3. **Chunk transcripts** → 300-token chunks with 50% overlap
4. **Embed chunks** → OpenAI embeddings (1536-dim)
5. **Store in Pinecone** → Tagged with video_id
6. **User asks question** → Retrieve top-5 chunks via semantic search
7. **LLM generates response** → Stream with citations

---

## 💻 API Endpoints

### `POST /api/process-videos`
Ingest two videos.

### `POST /api/chat`
Stream chat responses with sources.

### `GET /api/metrics/{session_id}`
Get engagement metrics.

---

## 🎓 Design Decisions

### Why Pinecone?
- Fully managed, sub-100ms latency at 1M+ vectors
- Multi-region failover
- Best for production scale

### Why OpenAI Embeddings?
- Best-in-class performance (MTEB #1)
- Seamless LangChain integration
- Fast inference

### Why GPT-4o?
- Superior instruction-following for RAG
- Fastest token generation
- Best cost-to-quality ratio

### Chunk Size: 300 tokens
- Balances context completeness with retrieval precision
- Covers ~1-2 complete thoughts
- 50% overlap prevents information loss at boundaries

---

## 🧪 Testing

```bash
cd backend
pytest tests/ -v
pytest tests/ --cov=services --cov-report=html
```

---

## 🚢 Deployment

```bash
docker-compose up -d
```

---

## 📝 License

MIT License

---

## 🤝 Support

For issues or questions, open a GitHub Issue.

**Built with ❤️ as a Top 1% Engineer Screening Demo**
