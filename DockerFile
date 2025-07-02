FROM python:3.11-slim

WORKDIR /app

# Install ffmpeg
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# Copy the rest of the app
COPY . .

# Expose the port Railway expects
EXPOSE 8000

# Start the FastAPI app with Uvicorn
CMD ["uvicorn", "scripts.yt_metadata_api:app", "--host", "0.0.0.0", "--