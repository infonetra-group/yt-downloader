import React from 'react';
import { Monitor, Smartphone, Tablet, Headphones, Zap } from 'lucide-react';

interface QualitySelectorProps {
  selectedQuality: string;
  onQualityChange: (quality: string) => void;
  formatDescription?: string;
  availableFormats?: string[];
}

const qualityOptions = [
  { value: '2160p', label: '4K Ultra HD (2160p)', icon: Monitor, description: 'Best video ≤2160p + Best audio', premium: true },
  { value: '1440p', label: '2K QHD (1440p)', icon: Monitor, description: 'Best video ≤1440p + Best audio', premium: true },
  { value: '1080p', label: 'Full HD (1080p)', icon: Monitor, description: 'Best video ≤1080p + Best audio' },
  { value: '720p', label: 'HD (720p)', icon: Tablet, description: 'Best video ≤720p + Best audio' },
  { value: '480p', label: 'SD (480p)', icon: Smartphone, description: 'Best video ≤480p + Best audio' },
  { value: '360p', label: 'Low (360p)', icon: Smartphone, description: 'Fastest download' },
  { value: 'audio', label: 'Audio Only', icon: Headphones, description: 'Best audio quality only' },
];

export function QualitySelector({ 
  selectedQuality, 
  onQualityChange, 
  formatDescription,
  availableFormats 
}: QualitySelectorProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-200">
          Video Quality & Format
        </label>
        {formatDescription && (
          <div className="flex items-center space-x-1 text-xs text-purple-300">
            <Zap className="w-3 h-3" />
            <span>Format</span>
          </div>
        )}
      </div>
      
      {formatDescription && (
        <div className="p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
          <p className="text-xs text-purple-200">{formatDescription}</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {qualityOptions.map((option) => {
          const IconComponent = option.icon;
          const isAvailable = !availableFormats || availableFormats.includes(option.value);
          
          return (
            <button
              key={option.value}
              onClick={() => isAvailable && onQualityChange(option.value)}
              disabled={!isAvailable}
              className={`
                p-3 rounded-lg border transition-all duration-200 text-left relative
                ${selectedQuality === option.value
                  ? 'bg-purple-500/30 border-purple-400 text-white'
                  : isAvailable
                  ? 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30'
                  : 'bg-gray-500/10 border-gray-500/20 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              <div className="flex items-center space-x-3">
                <IconComponent className="w-5 h-5" />
                <div className="flex-1">
                  <div className="font-medium text-sm flex items-center space-x-2">
                    <span>{option.label}</span>
                    {option.premium && (
                      <span className="px-1.5 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-400 text-black text-xs rounded font-bold">
                        4K
                      </span>
                    )}
                  </div>
                  <div className="text-xs opacity-70">{option.description}</div>
                </div>
              </div>
              {!isAvailable && (
                <div className="absolute inset-0 bg-gray-900/50 rounded-lg flex items-center justify-center">
                  <span className="text-xs text-gray-400">Not Available</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}