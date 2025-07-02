from fastapi import FastAPI, Request, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
import yt_dlp
import tempfile
import os
import logging
import sys
from pydantic import BaseModel
from typing import Any, Dict
import asyncio
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Log Python version and path for debugging
logger.info(f"Python version: {sys.version}")
logger.info(f"Python executable: {sys.executable}")
logger.info(f"PORT environment variable: {os.environ.get('PORT', 'Not set')}")

app = FastAPI(
    title="YouTube Downloader API",
    description="API for downloading YouTube videos",
    version="1.0.0"
)

# Enhanced CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your Netlify domain
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

class MetadataRequest(BaseModel):
    url: str

class DownloadRequest(BaseModel):
    url: str
    quality: str = 'best'

def get_video_metadata(url: str) -> Dict[str, Any]:
    """Extract video metadata using yt-dlp"""
    ydl_opts = {
        'quiet': True, 
        'skip_download': True,
        'no_warnings': True,
        'extract_flat': False
    }
    
    try:
        logger.info(f"Extracting metadata for URL: {url}")
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            # Extract unique qualities from formats
            formats = []
            seen_heights = set()
            
            for f in info.get("formats", []):
                height = f.get("height")
                if height and height not in seen_heights:
                    formats.append(f"{height}p")
                    seen_heights.add(height)
            
            # Sort formats by quality (highest first)
            quality_order = {'2160': 0, '1440': 1, '1080': 2, '720': 3, '480': 4, '360': 5, '240': 6, '144': 7}
            formats.sort(key=lambda x: quality_order.get(x.replace('p', ''), 999))
            
            metadata = {
                "title": info.get("title", "Unknown Title"),
                "uploader": info.get("uploader", "Unknown Uploader"),
                "duration": info.get("duration", 0),
                "view_count": info.get("view_count", 0),
                "like_count": info.get("like_count"),
                "upload_date": info.get("upload_date", ""),
                "description": info.get("description", "")[:500] + "..." if info.get("description", "") else "",
                "thumbnail": info.get("thumbnail", ""),
                "available_formats": formats,
            }
            
            logger.info(f"Successfully extracted metadata for: {metadata['title']}")
            return metadata
            
    except Exception as e:
        logger.error(f"Error extracting metadata: {str(e)}")
        return {"error": f"Failed to extract video metadata: {str(e)}"}

def get_format_code(quality: str) -> str:
    """Get yt-dlp format code for specified quality"""
    format_map = {
        "2160p": "bestvideo[height<=2160]+bestaudio/best[height<=2160]",
        "1440p": "bestvideo[height<=1440]+bestaudio/best[height<=1440]", 
        "1080p": "bestvideo[height<=1080]+bestaudio/best[height<=1080]",
        "720p": "bestvideo[height<=720]+bestaudio/best[height<=720]",
        "480p": "bestvideo[height<=480]+bestaudio/best[height<=480]",
        "360p": "bestvideo[height<=360]+bestaudio/best[height<=360]",
        "audio": "bestaudio/best",
        "best": "bv*+ba/b"
    }
    return format_map.get(quality, format_map["best"])

@app.on_event("startup")
async def startup_event():
    """Log startup information"""
    port = os.environ.get("PORT", "8000")
    logger.info(f"Application starting up on port {port}")
    logger.info(f"Health check endpoint: /health")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "YouTube Downloader API", 
        "status": "running",
        "python_version": sys.version,
        "environment": os.environ.get("RAILWAY_ENVIRONMENT", "unknown"),
        "port": os.environ.get("PORT", "8000")
    }

@app.get("/health")
async def health_check():
    """Health check endpoint for Railway"""
    try:
        # Test yt-dlp functionality
        with yt_dlp.YoutubeDL({'quiet': True}) as ydl:
            pass
        
        logger.info("Health check passed")
        return {
            "status": "healthy", 
            "service": "youtube-downloader-api",
            "python_version": sys.version,
            "yt_dlp_available": True,
            "port": os.environ.get("PORT", "8000")
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "unhealthy",
            "error": str(e),
            "python_version": sys.version,
            "yt_dlp_available": False
        }

@app.post("/metadata")
async def metadata_endpoint(request: MetadataRequest):
    """Extract video metadata"""
    try:
        url = request.url.strip()
        if not url:
            raise HTTPException(status_code=400, detail="URL is required")
        
        # Basic URL validation
        if not any(domain in url for domain in ['youtube.com', 'youtu.be']):
            raise HTTPException(status_code=400, detail="Please provide a valid YouTube URL")
        
        result = get_video_metadata(url)
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in metadata endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/download")
async def download_endpoint(request: DownloadRequest, background_tasks: BackgroundTasks):
    """Download video and return file"""
    try:
        url = request.url.strip()
        quality = request.quality
        
        if not url:
            raise HTTPException(status_code=400, detail="URL is required")
        
        logger.info(f"Starting download for URL: {url}, Quality: {quality}")
        
        # Create temporary directory
        with tempfile.TemporaryDirectory() as tmpdir:
            format_code = get_format_code(quality)
            
            # Configure yt-dlp options
            ydl_opts = {
                'format': format_code,
                'merge_output_format': 'mp4',
                'outtmpl': os.path.join(tmpdir, '%(title)s.%(ext)s'),
                'quiet': True,
                'no_warnings': True,
                'noplaylist': True,
                'extract_flat': False,
                'writethumbnail': False,
                'writeinfojson': False,
            }
            
            try:
                with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                    # Extract info first to get the filename
                    info = ydl.extract_info(url, download=False)
                    filename = ydl.prepare_filename(info)
                    
                    # Now download
                    ydl.download([url])
                
                # Check if file exists
                if not os.path.exists(filename):
                    # Try to find the actual downloaded file
                    downloaded_files = [f for f in os.listdir(tmpdir) if f.endswith('.mp4')]
                    if downloaded_files:
                        filename = os.path.join(tmpdir, downloaded_files[0])
                    else:
                        raise HTTPException(status_code=500, detail="Download completed but file not found")
                
                # Move file to a persistent location temporarily
                final_filename = os.path.basename(filename)
                final_path = os.path.join("/tmp", final_filename)
                
                # Ensure /tmp directory exists
                os.makedirs("/tmp", exist_ok=True)
                
                # Copy file to final location
                import shutil
                shutil.copy2(filename, final_path)
                
                logger.info(f"Download completed: {final_filename}")
                
                # Schedule cleanup
                background_tasks.add_task(cleanup_file, final_path)
                
                return FileResponse(
                    final_path,
                    media_type='video/mp4',
                    filename=final_filename,
                    headers={
                        "Content-Disposition": f"attachment; filename=\"{final_filename}\"",
                        "Cache-Control": "no-cache"
                    }
                )
                
            except Exception as e:
                logger.error(f"yt-dlp error: {str(e)}")
                raise HTTPException(status_code=400, detail=f"Download failed: {str(e)}")
                
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in download endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

async def cleanup_file(file_path: str):
    """Clean up temporary files"""
    try:
        await asyncio.sleep(60)  # Wait 1 minute before cleanup
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"Cleaned up file: {file_path}")
    except Exception as e:
        logger.error(f"Error cleaning up file {file_path}: {str(e)}")

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request: Request, exc):
    return JSONResponse(
        status_code=404,
        content={"detail": "Endpoint not found"}
    )

@app.exception_handler(500)
async def internal_error_handler(request: Request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    logger.info(f"Starting server on port {port}")
    uvicorn.run(
        app, 
        host="0.0.0.0", 
        port=port,
        log_level="info",
        access_log=True
    )