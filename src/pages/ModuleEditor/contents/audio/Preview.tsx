import React from "react";
import { motion } from "framer-motion";

export default function AudioPreview({ src }: { src: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative"
    >
      <audio src={src} controls className="w-full rounded-lg shadow-lg" />
    </motion.div>
  );
} 