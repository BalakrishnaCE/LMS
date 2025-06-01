import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ROUTES } from "@/config/routes";
import CelebrationLottie from '@/assets/Celebration.json';
import Lottie from 'lottie-react';

interface CompletionScreenProps {
  onReview: () => void;
}

export function CompletionScreen({ onReview }: CompletionScreenProps) {
  // Focus trap for accessibility
  const modalRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    modalRef.current?.focus();
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        tabIndex={-1}
        aria-modal="true"
        role="dialog"
        ref={modalRef}
      >
        {/* Celebration Lottie Animation Overlay */}
        <div className="fixed inset-0 w-full h-full z-50 pointer-events-none flex items-center justify-center">
          <Lottie
            animationData={CelebrationLottie}
            loop
            autoplay
            style={{ width: '100vw', height: '100vh', pointerEvents: 'none' }}
          />
        </div>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="flex flex-col items-center justify-center text-center bg-card rounded-xl shadow-2xl p-12 w-full max-w-lg relative"
        >
          {/* Confetti or animated checkmark */}
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1.2, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.1 }}
            className="mb-4"
            aria-hidden="true"
          >
            <span className="text-6xl">🎉</span>
          </motion.div>
          <motion.h2
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold mb-2 text-primary"
          >
            Module Completed!
          </motion.h2>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-muted-foreground mb-6"
          >
            Congratulations! You have completed all lessons and chapters in this module.
          </motion.div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col gap-3 w-full items-center"
          >
            <Button
              size="lg"
              className="w-full"
              onClick={onReview}
              autoFocus
            >
              Review Again
            </Button>
            <Link href={ROUTES.LEARNER_MODULES} className="w-full">
              <Button
                size="lg"
                variant="outline"
                className="w-full"
              >
                Back to Modules
              </Button>
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
} 