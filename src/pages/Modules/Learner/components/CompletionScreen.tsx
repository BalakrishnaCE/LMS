import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface CompletionScreenProps {
  onReview: () => void;
}

export function CompletionScreen({ onReview }: CompletionScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center bg-card rounded-xl shadow p-12 w-full max-w-xl"
    >
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="text-4xl mb-4"
      >
        🎉
      </motion.div>
      <motion.h2
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-2xl font-bold mb-2 text-primary"
      >
        Module Completed!
      </motion.h2>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="text-muted-foreground mb-6"
      >
        Congratulations! You have completed all lessons and chapters in this module.
      </motion.div>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          size="lg"
          className="w-full"
          onClick={onReview}
        >
          Review Again
        </Button>
      </motion.div>
    </motion.div>
  );
} 