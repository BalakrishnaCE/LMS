import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

interface WelcomeScreenProps {
  moduleName: string;
  moduleDescription: string;
  onStart: () => void;
  isLoading: boolean;
}

export function WelcomeScreen({
  moduleName,
  moduleDescription,
  onStart,
  isLoading
}: WelcomeScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl shadow p-8 w-full max-w-xl text-center"
    >
      <motion.h2
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-2xl font-bold mb-4 text-foreground"
      >
        {moduleName}
      </motion.h2>
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-6 text-muted-foreground"
        dangerouslySetInnerHTML={{ __html: moduleDescription }}
      />
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Button
          size="lg"
          className="w-full"
          onClick={onStart}
          disabled={isLoading}
        >
          {isLoading ? "Starting..." : "Start Module"}
        </Button>
      </motion.div>
    </motion.div>
  );
} 