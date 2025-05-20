import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

export default function SidebarToggle({ isOpen, onClick }: { isOpen: boolean; onClick: () => void }) {
  return (
    <motion.button
      className="fixed left-0 top-1/2 transform -translate-y-1/2 z-20 flex items-center justify-center w-10 h-10 bg-background hover:bg-gray-300 border border-gray-300 rounded-full shadow-lg focus:outline-none transition-colors duration-200"
      onClick={onClick}
      aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
      initial={{ x: isOpen ? 256 : 0, opacity: 0.7 }}
      animate={{ x: isOpen ? 256 : 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
    >
      {isOpen ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
    </motion.button>
  );
} 