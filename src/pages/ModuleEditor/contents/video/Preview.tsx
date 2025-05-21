import React from "react";
import { motion } from "framer-motion";

export default function VideoPreview({ src }: { src: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative aspect-video"
    >
      <video src={src} controls className="w-full h-full rounded-lg shadow-lg" />
    </motion.div>
  );
} 