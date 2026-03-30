import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MessageSquare, Clock, Trophy } from "lucide-react";

export default function QuestionAnswerPreview({ 
  title = "Q&A Session", 
  description = "Interactive questions and answers",
  max_score = 20,
  time_limit_mins = 30,
  questions = []
}: { 
  title?: string;
  description?: string;
  max_score?: number;
  time_limit_mins?: number;
  questions?: any[];
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("border rounded-lg p-4 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20")}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <MessageSquare className="h-6 w-6 text-green-600" />
        </div>
        <div className="flex-1 space-y-2">
          <h3 className="font-semibold text-lg">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Trophy className="h-3 w-3" />
              <span>{max_score} points</span>
            </div>
            {time_limit_mins > 0 && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{time_limit_mins} minutes</span>
              </div>
            )}
            <div className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              <span>{questions.length} questions</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
} 