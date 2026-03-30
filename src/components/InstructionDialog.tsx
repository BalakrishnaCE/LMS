import React, { useEffect, useCallback, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  FileText,
  Play,
  X
} from 'lucide-react';

interface InstructionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: () => void;
  type: 'quiz' | 'qa';
  title: string;
  description?: string;
  timeLimit?: number;
  maxScore?: number;
  questionCount?: number;
  loading?: boolean;
  hasExistingProgress?: boolean;
  onViewProgress?: () => void;
}

const InstructionDialog: React.FC<InstructionDialogProps> = ({
  open,
  onOpenChange,
  onStart,
  type,
  title,
  description,
  timeLimit,
  maxScore,
  questionCount,
  loading = false,
  hasExistingProgress = false,
  onViewProgress
}) => {
  console.log('InstructionDialog props:', { open, type, title, questionCount });
  const isQuiz = type === 'quiz';

  // Handle keyboard events to prevent unwanted dialog closing
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!open) return;
      
      // Prevent dialog from closing on Escape, Space, or Enter
      if (event.key === 'Escape' || event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        
        // Only allow Escape to close the dialog if it's pressed while focused on the close button
        if (event.key === 'Escape') {
          const activeElement = document.activeElement;
          const closeButton = activeElement?.closest('[data-radix-dialog-close]');
          if (closeButton) {
            onOpenChange(false);
          }
        }
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown, true);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [open]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // Prevent default keyboard behavior that closes the dialog
    if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  const instructions = useMemo(() => [
    {
      icon: <BookOpen className="h-5 w-5 text-primary" />,
      title: "Read Carefully",
      description: isQuiz 
        ? "Read each question and all answer options carefully before selecting your answer."
        : "Read each question carefully and provide detailed, thoughtful answers."
    },
    {
      icon: <Clock className="h-5 w-5 text-primary" />,
      title: "Time Management",
      description: timeLimit 
        ? `You have ${timeLimit} minutes to complete this ${type}. Use your time wisely.`
        : `Take your time to provide quality answers. There's no time limit.`
    },
    {
      icon: <CheckCircle className="h-5 w-5 text-primary" />,
      title: isQuiz ? "Multiple Choice" : "Written Answers",
      description: isQuiz
        ? "Select the best answer for each question. You can only choose one option per question."
        : "Provide detailed written answers. Be thorough and demonstrate your understanding."
    },
    {
      icon: <AlertTriangle className="h-5 w-5 text-primary" />,
      title: "Important Notes",
      description: isQuiz
        ? "Once you submit, you cannot change your answers. Make sure you're satisfied before submitting."
        : "Your answers will be reviewed by an instructor. Ensure clarity and completeness in your responses."
    }
  ], [isQuiz, timeLimit, type]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" />
        <Dialog.Content 
          className="fixed inset-0 z-50 flex items-center justify-center p-4" 
          style={{ outline: 'none' }}
          onKeyDown={handleKeyDown}
        >
          <Dialog.Description className="sr-only">
            {isQuiz ? 'Quiz Instructions' : 'Question & Answer Instructions'}
          </Dialog.Description>
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-background w-full max-w-2xl mx-auto rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  {isQuiz ? (
                    <BookOpen className="h-6 w-6 text-primary" />
                  ) : (
                    <FileText className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div>
                  <Dialog.Title className="text-xl font-bold">{title}</Dialog.Title>
                  <p className="text-sm text-muted-foreground">
                    {isQuiz ? 'Quiz Instructions' : 'Question & Answer Instructions'}
                  </p>
                </div>
              </div>
              <Dialog.Close asChild>
                <button className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </button>
              </Dialog.Close>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
              {/* Overview */}
              <div className="mb-6 p-4 bg-muted/50 rounded-lg">
                <h3 className="font-semibold mb-2">Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {questionCount && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span>{questionCount} {isQuiz ? 'Questions' : 'Questions'}</span>
                    </div>
                  )}
                  {maxScore && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-muted-foreground" />
                      <span>Max Score: {maxScore} points</span>
                    </div>
                  )}
                  {timeLimit && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>Time Limit: {timeLimit} minutes</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {description && (
                <div className="mb-6">
                  <h3 className="font-semibold mb-2">Description</h3>
                  <div 
                    className="text-sm text-muted-foreground prose prose-sm max-w-none"
                    dangerouslySetInnerHTML={{ __html: description }}
                  />
                </div>
              )}

              {/* Instructions */}
              <div className="space-y-4">
                <h3 className="font-semibold">Instructions</h3>
                <div className="space-y-3">
                  {instructions.map((instruction, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex gap-3 p-3 rounded-lg border bg-background"
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {instruction.icon}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm mb-1">{instruction.title}</h4>
                        <p className="text-sm text-muted-foreground">{instruction.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Additional Notes */}
              <div className="mt-6 p-4 bg-muted/50 rounded-lg border">
                <div className="flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-foreground mb-1">
                      Ready to begin?
                    </p>
                    <p className="text-muted-foreground">
                      {isQuiz 
                        ? "Make sure you have a stable internet connection and won't be interrupted during the quiz."
                        : "Take your time to provide thoughtful, well-structured answers that demonstrate your understanding."
                      }
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t flex justify-between items-center">
              <div className="flex gap-2">
                <button 
                  onClick={() => onOpenChange(false)}
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
                >
                  Cancel
                </button>
                {hasExistingProgress && onViewProgress && (
                  <button 
                    onClick={onViewProgress}
                    disabled={loading}
                    className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 gap-2"
                  >
                    <CheckCircle className="h-4 w-4" />
                    View Previous Progress
                  </button>
                )}
              </div>
              <button 
                onClick={onStart}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Starting...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Start {isQuiz ? 'Quiz' : 'Q&A'}
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default InstructionDialog; 