from fastapi import FastAPI, Request, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
import yt_dlp
import tempfile
import os
from pydantic import BaseModel
from typing import Any, Dict

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
    return {"message": "YouTube Metadata API is running!", "status": "healthy"}

@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "youtube-metadata-api"}

def get_video_metadata(url: str) -> Dict[str, Any]:
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
            return {
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
    except Exception as e:
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
    url = request.url
    if not url:
        return {"error": "URL is required"}
    result = get_video_metadata(url)
    return result 

@app.post("/download")
async def download_endpoint(request: DownloadRequest, background_tasks: BackgroundTasks):
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
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            filename = ydl.prepare_filename(info)
        
        # Schedule file deletion after response is sent
        background_tasks.add_task(os.remove, filename)
        return FileResponse(
            filename,
            media_type='video/mp4',
            filename=os.path.basename(filename),
            background=background_tasks
        )
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)