import React from "react";
import { motion } from "framer-motion";

export default function ImagePreview({ src }: { src: string }) {
  return (
    <motion.img
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      src={src}
      alt="Preview"
      className="max-w-full h-auto rounded-lg shadow-lg"
    />
  );
} 