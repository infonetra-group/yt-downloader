# YouTube HD Downloader

A modern YouTube video downloader with a beautiful React frontend and FastAPI backend.

## Features

- 🎥 Download YouTube videos in multiple qualities (4K, 1080p, 720p, etc.)
- 🎵 Audio-only downloads
- 📱 Responsive design with glassmorphism UI
- 🚀 Real-time download progress
- 🎨 Beautiful 3D background animations
- 🔒 Secure backend API

## Architecture

- **Frontend**: React + TypeScript + Tailwind CSS + Three.js
- **Backend**: FastAPI + yt-dlp + Python
- **Deployment**: Netlify (Frontend) + Railway (Backend)

## Local Development

### Backend Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Run the FastAPI server:
```bash
python -m uvicorn scripts.yt_metadata_api:app --reload --host 0.0.0.0 --port 8000
```

### Frontend Setup

1. Install Node.js dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

## Deployment

### Backend (Railway)

1. Push code to GitHub
2. Connect repository to Railway
3. Railway will auto-deploy using the configuration files

### Frontend (Netlify)

1. Update `src/config.ts` with your Railway backend URL
2. Deploy to Netlify (auto-deploys from this repository)

## API Endpoints

- `GET /health` - Health check
- `POST /metadata` - Extract video metadata
- `POST /download` - Download video

## Environment Variables

- `PORT` - Server port (automatically set by Railway)

## License

MIT License