import React, { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

export default function VideoPreview({ src }: { src: string }) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const updateTime = () => setCurrentTime(video.currentTime);
      const updateDuration = () => setDuration(video.duration);
      
      video.addEventListener('timeupdate', updateTime);
      video.addEventListener('loadedmetadata', updateDuration);
      
      return () => {
        video.removeEventListener('timeupdate', updateTime);
        video.removeEventListener('loadedmetadata', updateDuration);
      };
    }
  }, []);

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative aspect-video"
    >
      <video 
        ref={videoRef}
        src={src} 
        controls 
        className="w-full h-full rounded-lg shadow-lg" 
      />
      {/* Custom progress bar overlay */}
      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 rounded-b-lg">
        <div className="flex justify-between text-sm">
          <span>{formatTime(currentTime)}</span>
          <span>/ {formatTime(duration)}</span>
        </div>
        <div className="w-full bg-gray-600 rounded-full h-1 mt-1">
          <div 
            className="bg-white h-1 rounded-full transition-all duration-100"
            style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
          />
        </div>
      </div>
    </motion.div>
  );
} 