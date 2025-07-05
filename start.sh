#!/bin/bash
set -e

# Get port from environment variable, default to 8000
PORT=${PORT:-8000}

echo "Starting YouTube Downloader API on port $PORT"
echo "Python version: $(python --version)"
echo "Working directory: $(pwd)"

# Start the application using Python directly
exec python -c "
import uvicorn
from scripts.yt_metadata_api import app
import os

port = int(os.environ.get('PORT', 8000))
print(f'Starting server on port {port}')
uvicorn.run(app, host='0.0.0.0', port=port, log_level='info', access_log=True)
"