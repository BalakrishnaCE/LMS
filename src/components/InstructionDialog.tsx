import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
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
  loading = false
}) => {
  const isQuiz = type === 'quiz';
  const isQA = type === 'qa';

  const instructions = [
    {
      icon: <BookOpen className="h-5 w-5 text-blue-500" />,
      title: "Read Carefully",
      description: isQuiz 
        ? "Read each question and all answer options carefully before selecting your answer."
        : "Read each question carefully and provide detailed, thoughtful answers."
    },
    {
      icon: <Clock className="h-5 w-5 text-orange-500" />,
      title: "Time Management",
      description: timeLimit 
        ? `You have ${timeLimit} minutes to complete this ${type}. Use your time wisely.`
        : `Take your time to provide quality answers. There's no time limit.`
    },
    {
      icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      title: isQuiz ? "Multiple Choice" : "Written Answers",
      description: isQuiz
        ? "Select the best answer for each question. You can only choose one option per question."
        : "Provide detailed written answers. Be thorough and demonstrate your understanding."
    },
    {
      icon: <AlertTriangle className="h-5 w-5 text-red-500" />,
      title: "Important Notes",
      description: isQuiz
        ? "Once you submit, you cannot change your answers. Make sure you're satisfied before submitting."
        : "Your answers will be reviewed by an instructor. Ensure clarity and completeness in your responses."
    }
  ];

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" />
        <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ outline: 'none' }}>
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
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <X className="h-4 w-4" />
                </Button>
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
              <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex gap-2">
                  <AlertTriangle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                      Ready to begin?
                    </p>
                    <p className="text-blue-700 dark:text-blue-300">
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
              <Button 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button 
                onClick={onStart}
                disabled={loading}
                className="flex items-center gap-2"
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
              </Button>
            </div>
          </motion.div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default InstructionDialog; 