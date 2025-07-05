# YouTube Downloader API - Railway Deployment
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Update system and install dependencies
RUN apt-get update && \
    apt-get install -y ffmpeg curl && \
    rm -rf /var/lib/apt/lists/* && \
    apt-get clean

# Copy and install Python requirements
COPY requirements.txt ./
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Create non-root user
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app
USER appuser

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Start application directly with Python
CMD ["python", "-c", "import os; import uvicorn; from scripts.yt_metadata_api import app; port = int(os.environ.get('PORT', 8000)); uvicorn.run(app, host='0.0.0.0', port=port)"]