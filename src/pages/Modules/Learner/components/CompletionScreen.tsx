import React, { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ROUTES } from "@/config/routes";
import CelebrationLottie from '@/assets/Celebration.json';
import Lottie from 'lottie-react';
import { Loader2 } from 'lucide-react';

interface CompletionScreenProps {
  onReview: () => void;
  quizQAScores?: {
    allItems: Array<{ title: string; type: string }>;
    scores: Array<{ title: string; score: number; maxScore: number; type: string }>;
  };
}

export function CompletionScreen({ onReview, quizQAScores }: CompletionScreenProps) {
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
          {quizQAScores && quizQAScores.allItems && quizQAScores.allItems.length > 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="mb-6 w-full"
            >
              <div className="text-lg font-semibold mb-2 text-primary">Quiz & QA Scores</div>
              <div className="flex flex-col gap-3 items-center">
                {quizQAScores.allItems.map((item, idx) => {
                  const scoreObj = quizQAScores.scores?.find((s: any) => s.title === item.title && s.type === item.type);
                  if (item.type === 'Question Answer' && !scoreObj) {
                    // Pending review for QA
                    return (
                      <div key={item.title + idx} className="w-full flex items-center justify-between bg-muted/60 rounded-lg px-4 py-3 shadow-sm border border-border">
                        <div className="flex flex-col">
                          <span className="font-medium text-base text-foreground">{item.type}: {item.title}</span>
                        </div>
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-orange-600 bg-orange-100 rounded-full px-4 py-1 ml-4 min-w-[120px] text-center">
                          <Loader2 className="animate-spin h-4 w-4" /> Review Pending
                        </span>
                      </div>
                    );
                  }
                  // Show percentage for scored items (Quiz or QA)
                  const percent = scoreObj && scoreObj.maxScore > 0 ? Math.round((scoreObj.score / scoreObj.maxScore) * 100) : 0;
                  return (
                    <div key={item.title + idx} className="w-full flex items-center justify-between bg-muted/60 rounded-lg px-4 py-3 shadow-sm border border-border">
                      <div className="flex flex-col">
                        <span className="font-medium text-base text-foreground">{item.type}: {item.title}</span>
                      </div>
                      <span className="inline-block text-lg font-bold text-primary bg-primary/10 rounded-full px-4 py-1 ml-4 min-w-[60px] text-center">
                        {percent}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
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