import React from 'react';
import { Play, Clock, Eye, User, Calendar, Heart } from 'lucide-react';
import { GlassmorphismCard } from './GlassmorphismCard';
import { VideoMetadata } from '../App';

interface MetadataDisplayProps {
  metadata: VideoMetadata;
}

export function MetadataDisplay({ metadata }: MetadataDisplayProps) {
  return (
    <GlassmorphismCard>
      <div className="space-y-4">
        <div className="aspect-video bg-gray-800 rounded-lg overflow-hidden relative group">
          <img
            src={metadata.thumbnail}
            alt={metadata.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback to a placeholder if thumbnail fails to load
              e.currentTarget.src = 'https://images.pexels.com/photos/1761279/pexels-photo-1761279.jpeg?auto=compress&cs=tinysrgb&w=400';
            }}
          />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Play className="w-12 h-12 text-white" />
          </div>
        </div>
        
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white line-clamp-2">
            {metadata.title}
          </h3>
          
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="flex items-center space-x-2 text-gray-300">
              <Clock className="w-4 h-4 text-blue-400" />
              <span>{metadata.duration}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <Eye className="w-4 h-4 text-green-400" />
              <span>{metadata.views} views</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <User className="w-4 h-4 text-purple-400" />
              <span className="truncate">{metadata.author}</span>
            </div>
            <div className="flex items-center space-x-2 text-gray-300">
              <Calendar className="w-4 h-4 text-orange-400" />
              <span>{metadata.uploadDate}</span>
            </div>
            {metadata.likes && (
              <div className="flex items-center space-x-2 text-gray-300 col-span-2">
                <Heart className="w-4 h-4 text-red-400" />
                <span>{metadata.likes} likes</span>
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-200">Description</h4>
            <p className="text-sm text-gray-400 line-clamp-4">
              {metadata.description || 'No description available'}
            </p>
          </div>

          {metadata.availableFormats && metadata.availableFormats.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-200">Available Qualities</h4>
              <div className="flex flex-wrap gap-2">
                {metadata.availableFormats.map((format) => (
                  <span
                    key={format}
                    className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-xs text-purple-200"
                  >
                    {format}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </GlassmorphismCard>
  );
}