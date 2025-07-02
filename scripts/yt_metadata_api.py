from fastapi import FastAPI, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import yt_dlp
import tempfile
import os
import logging
from pydantic import BaseModel
from typing import Any, Dict

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="YouTube Metadata API", version="1.0.0")

# Updated CORS to allow your deployed frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MetadataRequest(BaseModel):
    url: str

class DownloadRequest(BaseModel):
    url: str
    quality: str = 'best'

@app.get("/")
async def root():
    logger.info("Root endpoint called")
    return {"message": "YouTube Metadata API is running!", "status": "healthy", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    logger.info("Health check endpoint called")
    return {"status": "healthy", "service": "youtube-metadata-api", "version": "1.0.0"}

def get_video_metadata(url: str) -> Dict[str, Any]:
    logger.info(f"Getting metadata for URL: {url}")
    ydl_opts = {'quiet': True, 'skip_download': True}
    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            # Extract unique qualities
            formats = []
            for f in info.get("formats", []):
                if f.get("height"):
                    label = f"{f['height']}p"
                    if label not in formats:
                        formats.append(label)
            
            result = {
                "title": info.get("title"),
                "uploader": info.get("uploader"),
                "duration": info.get("duration"),
                "view_count": info.get("view_count"),
                "like_count": info.get("like_count"),
                "upload_date": info.get("upload_date"),
                "description": info.get("description"),
                "thumbnail": info.get("thumbnail"),
                "available_formats": formats,
            }
            logger.info(f"Successfully extracted metadata for: {result.get('title', 'Unknown')}")
            return result
    except Exception as e:
        logger.error(f"Error extracting metadata: {str(e)}")
        return {"error": str(e)}

def get_format_code(quality):
    if quality == "1080p":
        return "bestvideo[height<=1080]+bestaudio/best[height<=1080]"
    elif quality == "720p":
        return "bestvideo[height<=720]+bestaudio/best[height<=720]"
    elif quality == "480p":
        return "bestvideo[height<=480]+bestaudio/best[height<=480]"
    elif quality == "audio":
        return "bestaudio"
    else:
        return "bv*+ba/b"

@app.post("/metadata")
async def metadata_endpoint(request: MetadataRequest):
    logger.info(f"Metadata request received for URL: {request.url}")
    url = request.url
    if not url:
        return {"error": "URL is required"}
    result = get_video_metadata(url)
    return result 

@app.post("/download")
async def download_endpoint(request: DownloadRequest, background_tasks: BackgroundTasks):
    logger.info(f"Download request received for URL: {request.url}, Quality: {request.quality}")
    url = request.url
    quality = request.quality
    if not url:
        return {"error": "URL is required"}
    
    # Use /tmp directory for Railway
    tmpdir = "/tmp"
    os.makedirs(tmpdir, exist_ok=True)
    
    format_code = get_format_code(quality)
    ydl_opts = {
        'format': format_code,
        'merge_output_format': 'mp4',
        'outtmpl': os.path.join(tmpdir, '%(title)s.%(ext)s'),
        'quiet': True,
        'noplaylist': True,
    }
    try:
        logger.info(f"Starting download with format: {format_code}")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)
        
        logger.info(f"Download completed: {filename}")
        # Schedule file deletion after response is sent
        background_tasks.add_task(os.remove, filename)
        return FileResponse(
            filename,
            media_type='video/mp4',
            filename=os.path.basename(filename),
            background=background_tasks
        )
    except Exception as e:
        logger.error(f"Download error: {str(e)}")
        return {"error": str(e)}

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("YouTube Metadata API starting up...")
    logger.info(f"Python version: {os.sys.version}")
    logger.info(f"Working directory: {os.getcwd()}")
    logger.info(f"PORT environment variable: {os.environ.get('PORT', 'Not set')}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    logger.info(f"Starting server on port {port}")
    uvicorn.run(app, host="0.0.0.0", port=port)