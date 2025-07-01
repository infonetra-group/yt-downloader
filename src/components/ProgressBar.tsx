import React from 'react';
import { Download, Clock, Zap, Loader, CheckCircle } from 'lucide-react';

interface ProgressBarProps {
  percent: number;
  speed?: string;
  eta?: string;
  status: 'starting' | 'downloading' | 'finishing' | 'finished' | 'error' | 'fetching';
  message?: string;
}

export function ProgressBar({ percent, speed, eta, status, message }: ProgressBarProps) {
  const getStatusIcon = () => {
    switch (status) {
      case 'starting':
        return <Loader className="w-4 h-4 text-blue-400 animate-spin" />;
      case 'downloading':
        return <Download className="w-4 h-4 text-green-400" />;
      case 'finishing':
        return <Loader className="w-4 h-4 text-yellow-400 animate-spin" />;
      case 'finished':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      default:
        return <Download className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'starting':
        return 'from-blue-400 to-blue-500';
      case 'downloading':
        return 'from-green-400 to-emerald-500';
      case 'finishing':
        return 'from-yellow-400 to-orange-500';
      case 'finished':
        return 'from-green-400 to-emerald-500';
      default:
        return 'from-gray-400 to-gray-500';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'starting':
        return 'Initializing download...';
      case 'downloading':
        return 'Downloading video...';
      case 'finishing':
        return 'Merging and finalizing...';
      case 'finished':
        return 'Download completed!';
      default:
        return 'Processing...';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm text-gray-300">
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span>{getStatusText()}</span>
        </div>
        <span className="font-medium">{Math.round(percent)}%</span>
      </div>
      
      <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
        <div 
          className={`absolute top-0 left-0 h-full bg-gradient-to-r ${getStatusColor()} rounded-full transition-all duration-300 ease-out`}
          style={{ width: `${percent}%` }}
        />
        {status === 'downloading' && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
        )}
      </div>
      
      <div className="space-y-2">
        <div className="text-sm text-gray-400">
          {message}
        </div>
        
        {status === 'downloading' && speed && eta && (
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2 text-gray-300">
              <Zap className="w-4 h-4 text-green-400" />
              <span>Speed: {speed}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>ETA: {eta}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}