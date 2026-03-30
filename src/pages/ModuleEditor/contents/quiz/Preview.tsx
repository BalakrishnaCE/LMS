import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { HelpCircle, Clock, Trophy } from "lucide-react";

export default function QuizPreview({ 
  title = "Sample Quiz", 
  description = "Test your knowledge with this interactive quiz",
  total_score = 10,
  time_limit_mins = 15,
  questions = []
}: { 
  title?: string;
  description?: string;
  total_score?: number;
  time_limit_mins?: number;
  questions?: any[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("border rounded-lg p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20")}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <HelpCircle className="h-6 w-6 text-blue-600" />
        </div>
        <div className="flex-1 space-y-2">
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              <span>{total_score} points</span>
            </div>
            {time_limit_mins > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{time_limit_mins} minutes</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <HelpCircle className="h-3 w-3" />
              <span>{questions.length} questions</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 