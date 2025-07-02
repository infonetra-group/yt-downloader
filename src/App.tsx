import React, { useState } from 'react';
import { Download, Play, AlertCircle } from 'lucide-react';
import { BackgroundScene } from './components/BackgroundScene';
import { GlassmorphismCard } from './components/GlassmorphismCard';
import { ProgressBar } from './components/ProgressBar';
import { QualitySelector } from './components/QualitySelector';
import { MetadataDisplay } from './components/MetadataDisplay';
import { API_ENDPOINTS } from './config';

export interface VideoMetadata {
  title: string;
  duration: string;
  views: string;
  likes?: string;
  author: string;
  uploadDate: string;
  thumbnail: string;
  description: string;
  availableFormats: string[];
}

export interface DownloadProgress {
  percent: number;
  speed: string;
  eta: string;
  status: 'idle' | 'fetching' | 'starting' | 'downloading' | 'finishing' | 'finished' | 'error';
  message: string;
}

function App() {
  const [url, setUrl] = useState('');
  const [selectedQuality, setSelectedQuality] = useState('720p');
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [progress, setProgress] = useState<DownloadProgress>({
    percent: 0,
    speed: '',
    eta: '',
    status: 'idle',
    message: ''
  });
  const [error, setError] = useState('');
  const [downloadInitMessage, setDownloadInitMessage] = useState<string>('');

  const wholesomeMessages = [
    "You're doing great!",
    "Good things take time!",
    "Almost there, hang tight!",
    "A little patience goes a long way!",
    "The internet is working its magic!",
    "Thanks for being awesome!",
    "Your video is on its way!",
    "We appreciate your patience!",
    "This will be worth the wait!",
    "You're a star!",
    "Downloading happiness...",
    "Stay positive, stay patient!",
    "Great things are coming!",
    "You're the best!",
    "Magic is happening behind the scenes!"
  ];

  // Quality format mapping based the Python script
  const getFormatDescription = (quality: string) => {
    switch (quality) {
      case '2160p':
        return 'Best video ≤2160p + Best audio (4K Ultra HD)';
      case '1440p':
        return 'Best video ≤1440p + Best audio (2K QHD)';
      case '1080p':
        return 'Best video ≤1080p + Best audio (Full HD)';
      case '720p':
        return 'Best video ≤720p + Best audio (HD)';
      case '480p':
        return 'Best video ≤480p + Best audio (SD)';
      case '360p':
        return 'Best video ≤360p + Best audio (Low)';
      case 'audio':
        return 'Audio only (best quality)';
      default:
        return 'Best available quality';
    }
  };

  // Helper functions for formatting
  function formatDuration(seconds: number): string {
    if (!seconds) return "0:00";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  function formatNumber(num: number): string {
    if (!num) return "0";
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(1) + 'B';
    }
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  function formatDate(dateStr: string): string {
    if (!dateStr) return "Unknown";
    if (dateStr.length === 8) {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return `${year}-${month}-${day}`;
    }
    return dateStr;
  }

  // Metadata fetching using backend 
  const fetchMetadata = async (videoUrl: string) => {
    setProgress(prev => ({ ...prev, status: 'fetching', message: 'Extracting metadata...', percent: 0 }));
    setError('');
    let progressValue = 0;
    let progressTimer: NodeJS.Timeout | null = null;
    const totalDuration = 8000; // 8 seconds
    const interval = 100; // ms
    const maxPercent = 90;
    const increment = maxPercent / (totalDuration / interval);
    // Simulate progress
    const startSimulatedProgress = () => {
      progressTimer = setInterval(() => {
        progressValue = Math.min(progressValue + increment, maxPercent);
        setProgress(prev => ({ ...prev, percent: progressValue }));
      }, interval);
    };
    startSimulatedProgress();
    try {
      // Enhanced URL validation
      const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)\w+/;
      const isValidUrl = youtubeRegex.test(videoUrl);
      
      if (!isValidUrl) {
        setError('Please enter a valid YouTube URL (youtube.com or youtu.be)');
        setProgress(prev => ({ ...prev, status: 'error', percent: 0, message: 'Invalid URL format' }));
        return;
      }

      // Call the Python backend for metadata extraction
      const response = await fetch(API_ENDPOINTS.metadata, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: videoUrl })
      });

      const result = await response.json();
      
      if (!response.ok || result.error) {
        if (progressTimer) clearInterval(progressTimer);
        setError(result.error || 'Failed to extract video metadata');
        setProgress(prev => ({ ...prev, status: 'error', percent: 0, message: result.error || 'Metadata extraction failed' }));
        return;
      }

      if (progressTimer) clearInterval(progressTimer);
      setProgress(prev => ({ ...prev, percent: 100 }));
      setTimeout(() => {
        setProgress(prev => ({ ...prev, status: 'idle', message: 'Video analyzed successfully - Ready to download', percent: 0 }));
      }, 400); // short delay to show 100%
      setMetadata({
        title: result.title,
        duration: formatDuration(result.duration),
        views: formatNumber(result.view_count),
        likes: result.like_count ? formatNumber(result.like_count) : undefined,
        author: result.uploader,
        uploadDate: formatDate(result.upload_date),
        thumbnail: result.thumbnail,
        description: result.description,
        availableFormats: result.available_formats || [],
      });
      
    } catch {
      if (progressTimer) clearInterval(progressTimer);
      setProgress(prev => ({ ...prev, status: 'error', percent: 0, message: 'Connection failed' }));
      setError('Failed to connect to metadata service. Please try again.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      fetchMetadata(url);
    }
  };

  const resetDownload = () => {
    setMetadata(null);
    setProgress({ percent: 0, speed: '', eta: '', status: 'idle', message: '' });
    setError('');
    setUrl('');
  };

  const handleRealDownload = async () => {
    if (!metadata || !url) return;
    setProgress(prev => ({ ...prev, status: 'starting', message: 'Initializing download...' }));
    setDownloadInitMessage('');
    setError('');
    let patienceTimeout: NodeJS.Timeout | null = null;
    let magicTimeout: NodeJS.Timeout | null = null;
    let wholesomeInterval: NodeJS.Timeout | null = null;
    let wholesomeCount = 0;
    const maxWholesome = 2 * 60 * 1000; // 2 minutes
    // After 30 seconds, show 'Please be patient'
    patienceTimeout = setTimeout(() => {
      setDownloadInitMessage('Please be patient');
      // After 5 more seconds, show 'Let the app do its magic'
      magicTimeout = setTimeout(() => {
        setDownloadInitMessage('Let the app do its magic');
        // After that, every 5 seconds for 2 minutes, show a random wholesome message
        wholesomeInterval = setInterval(() => {
          wholesomeCount += 5000;
          if (wholesomeCount >= maxWholesome) {
            if (wholesomeInterval) clearInterval(wholesomeInterval);
            return;
          }
          const msg = wholesomeMessages[Math.floor(Math.random() * wholesomeMessages.length)];
          setDownloadInitMessage(msg);
        }, 5000);
      }, 5000);
    }, 30000);
    try {
      const response = await fetch(API_ENDPOINTS.download, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, quality: selectedQuality })
      });
      if (patienceTimeout) clearTimeout(patienceTimeout);
      if (magicTimeout) clearTimeout(magicTimeout);
      if (wholesomeInterval) clearInterval(wholesomeInterval);
      setDownloadInitMessage('');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to download video');
      }
      // Get filename from Content-Disposition header or use video title
      let filename = 'video.mp4';
      const disposition = response.headers.get('Content-Disposition');
      if (disposition && disposition.indexOf('filename=') !== -1) {
        filename = disposition.split('filename=')[1].replace(/"/g, '').trim();
      } else if (metadata && metadata.title) {
        // Sanitize the title for use as a filename
        filename = metadata.title.replace(/[^a-zA-Z0-9-_. ]/g, "_") + '.mp4';
      }
      const blob = await response.blob();
      const urlBlob = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlBlob;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(urlBlob);
      setProgress(prev => ({ ...prev, status: 'finished', message: 'Download completed successfully!' }));
    } catch (error: unknown) {
      let message = 'Failed to download video';
      if (error instanceof Error) {
        message = error.message;
      }
      setError(message);
      setProgress(prev => ({ ...prev, status: 'error', message: message || 'Download failed' }));
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      <BackgroundScene downloadStatus={progress.status} />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-4xl space-y-6">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold text-white mb-4 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              YouTube HD Downloader
            </h1>
            <p className="text-xl text-gray-300">
              Made by{' '}
              <a
                href="https://github.com/hadiwyne"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-400 underline hover:text-blue-600 transition-colors"
              >
                Abdul Hadi
              </a>
            </p>
          </div>

          {/* Main Content */}
          {!metadata ? (
            <GlassmorphismCard>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-gray-200 mb-2">
                    YouTube URL
                  </label>
                  <div className="relative">
                    <input
                      type="url"
                      id="url"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg 
                               backdrop-blur-sm text-white placeholder-gray-400 
                               focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent
                               transition-all duration-300"
                      placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                      required
                    />
                    <Play className="absolute right-3 top-3 h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Supports youtube.com and youtu.be URLs
                  </p>
                </div>

                <QualitySelector
                  selectedQuality={selectedQuality}
                  onQualityChange={setSelectedQuality}
                  formatDescription={getFormatDescription(selectedQuality)}
                />

                {error && (
                  <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg backdrop-blur-sm">
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="w-5 h-5 text-red-400" />
                      <p className="text-red-200">{error}</p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={progress.status === 'fetching'}
                  className="w-full py-3 px-6 bg-gradient-to-r from-purple-500 to-blue-500 
                           text-white font-semibold rounded-lg shadow-lg
                           hover:from-purple-600 hover:to-blue-600 
                           focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 focus:ring-offset-transparent
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all duration-300 transform hover:scale-105"
                >
                  {progress.status === 'fetching' ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Extracting metadata...</span>
                    </div>
                  ) : (
                    'Extract Video Metadata'
                  )}
                </button>
              </form>
            </GlassmorphismCard>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <MetadataDisplay metadata={metadata} />
              
              <GlassmorphismCard>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-white">Download Options</h3>
                    <button
                      onClick={resetDownload}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      ✕
                    </button>
                  </div>

                  <QualitySelector
                    selectedQuality={selectedQuality}
                    onQualityChange={setSelectedQuality}
                    formatDescription={getFormatDescription(selectedQuality)}
                    availableFormats={metadata.availableFormats}
                  />

                  {(progress.status === 'starting' || progress.status === 'downloading' || progress.status === 'finishing') && (
                    <ProgressBar
                      percent={progress.percent}
                      speed={progress.speed}
                      eta={progress.eta}
                      status={progress.status}
                      message={progress.message}
                    />
                  )}

                  {progress.status === 'finished' ? (
                    <div className="p-4 bg-green-500/20 border border-green-500/30 rounded-lg backdrop-blur-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <Download className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-green-200 font-medium">Download completed!</p>
                          <p className="text-green-300 text-sm">{progress.message}</p>
                        </div>
                      </div>
                    </div>
                  ) : progress.status === 'error' ? (
                    <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg backdrop-blur-sm">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-5 h-5 text-red-400" />
                        <div>
                          <p className="text-red-200 font-medium">Download failed</p>
                          <p className="text-red-300 text-sm">{progress.message}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={handleRealDownload}
                      className="w-full py-3 px-6 bg-gradient-to-r from-green-500 to-emerald-500 
                               text-white font-semibold rounded-lg shadow-lg
                               hover:from-green-600 hover:to-emerald-600 
                               focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-transparent
                               disabled:opacity-50 disabled:cursor-not-allowed
                               transition-all duration-300 transform hover:scale-105"
                    >
                      {progress.status === 'starting' || progress.status === 'downloading' || progress.status === 'finishing' ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>
                            {downloadInitMessage
                              ? downloadInitMessage
                              : progress.status === 'starting' && 'Initializing...'}
                            {progress.status === 'downloading' && 'Downloading...'}
                            {progress.status === 'finishing' && 'Finalizing...'}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center space-x-2">
                          <Download className="w-5 h-5" />
                          <span>Start Download ({selectedQuality})</span>
                        </div>
                      )}
                    </button>
                  )}

                  {(progress.status === 'idle' || progress.status === 'finished') && (
                    <button
                      onClick={handleRealDownload}
                      className="w-full py-3 px-6 bg-gradient-to-r from-green-500 to-blue-500 text-white font-semibold rounded-lg shadow-lg hover:from-green-600 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105"
                      disabled={progress.status !== 'idle' && progress.status !== 'finished'}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <Download className="w-5 h-5" />
                        <span>Download MP4</span>
                      </div>
                    </button>
                  )}
                </div>
              </GlassmorphismCard>
            </div>
          )}

          {progress.status === 'fetching' && (
            <ProgressBar
              percent={progress.percent}
              speed={''}
              eta={''}
              status={progress.status}
              message={progress.message}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;