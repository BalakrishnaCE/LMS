import React, { useState, useEffect } from "react";
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import RichEditor from '@/components/RichEditor';
import { useUser } from "@/hooks/use-user";
import { useFrappeGetDoc, useFrappePostCall, useFrappePutCall, useFrappeGetDocList } from 'frappe-react-sdk';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, XCircle, BookOpen, Eye, FileText } from 'lucide-react';
import Lottie from 'lottie-react';
import emptyAnimation from '@/assets/Empty.json';
import timeoutAnimation from '@/assets/timeout.json';
import errorAnimation from '@/assets/Error.json';
import loadingAnimation from '@/assets/Loading.json';
import { LMS_API_BASE_URL } from "@/config/routes";

interface QuestionAnswerProps {
  questionAnswerId: string;
  moduleId?: string;
}

const QuestionAnswer: React.FC<QuestionAnswerProps> = ({ questionAnswerId, moduleId }) => {
  const { user, isLoading: userLoading, isLMSAdmin } = useUser();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [timerActive, setTimerActive] = useState(false);
  
  // Progress tracking states
  const [progressLoading, setProgressLoading] = useState(false);
  const [showProgressOnly, setShowProgressOnly] = useState(false);
  const [showReviewOnly, setShowReviewOnly] = useState(false);
  const [qaProgressId, setQaProgressId] = useState<string | null>(null);
  const [qaProgress, setQaProgress] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [allSubmitted, setAllSubmitted] = useState(false);
  const [progressCreated, setProgressCreated] = useState(false);

  // API calls for progress
  const { call: addQAProgress, loading: adding, error: addError } = useFrappePostCall("addQAProgress");
  const { call: updateQAProgress, loading: updating, error: updateError } = useFrappePutCall("updateQAProgress");
  
  // Check for existing progress (both completed and under review)
  const { data: existingProgress, isValidating: checkingProgress } = useFrappeGetDocList(
    'Question Answer Progress',
    {
      fields: ['name', 'score', 'max_score', 'score_added'],
      filters: [
        ['question_answer', '=', questionAnswerId],
        ['user', '=', user?.name || '']
      ],
      limit: 1
    },
    {
      enabled: !!user && !!questionAnswerId
    }
  );

  const { data: progressDoc, isValidating: progressDocLoading, error: progressDocError } = useFrappeGetDoc('Question Answer Progress', qaProgressId || '', { enabled: !!qaProgressId });

  const handleStartQA = () => {
    // 1. Handle case where we already know about existing progress from the initial fetch.
    if (existingProgress && existingProgress.length > 0) {
      const progress = existingProgress[0];
      if (progress.score_added === 1) {
        setShowProgressOnly(true);
        setShowReviewOnly(false);
      } else {
        setShowProgressOnly(false);
        setShowReviewOnly(true);
      }
      setOpen(true);
      return;
    }

    // 2. Handle admin view
    if (isLMSAdmin) {
      setOpen(true);
      return;
    }

    // 3. If no progress was found initially, try to create it.
    // This also handles the race condition where the initial fetch was slow.
    if (user && data) {
      addQAProgress({
        qa_id: data.name,
        module: moduleId,
      })
        .then((res: any) => {
          if (res && res.message === "Already started" && res.progress_id) {
            // The API confirms progress exists. Fetch it to show the correct dialog.
            fetch(`${LMS_API_BASE_URL}/api/resource/Question Answer Progress/${res.progress_id}`, { credentials: 'include' })
              .then(res => res.json())
              .then(progressRes => {
                const progressData = progressRes.data;
                setQaProgress(progressData);
                
                // Load existing answers if available
                if (progressData.responses && data) {
                  const existingAnswers: Record<string, string> = {};
                  const existingSubmitted: Record<string, boolean> = {};
                  
                  progressData.responses.forEach((response: any) => {
                    // Use question text as the key since questions don't have unique IDs
                    existingAnswers[response.question] = response.answer || "";
                    existingSubmitted[response.question] = true; // Mark as submitted since it's in progress
                  });
                  
                  setAnswers(existingAnswers);
                  setSubmitted(existingSubmitted);
                }
                
                if (progressData.score_added === 1) {
                  setShowProgressOnly(true);
                  setShowReviewOnly(false);
                } else {
                  setShowProgressOnly(false);
                  setShowReviewOnly(true);
                }
                setOpen(true);
              })
              .catch(fetchErr => setApiError(`Failed to load existing progress: ${fetchErr.message}`));
          } else {
            // This is a new attempt, open the main Q&A dialog.
            setQaProgress(res);
            setProgressCreated(true);
            setOpen(true);
          }
        })
        .catch((err) => {
          setApiError("Could not start Q&A: " + err.message);
        });
    }
  };

  const handleSubmitAll = () => {
    if (isLMSAdmin) return; // No submission for admin
    
    // Prepare answers for API
    const answersArray = data?.questions?.map((q: any) => ({
      question: q.question,
      answer: answers[q.question] || ""
    })) || [];

    if (user && data) {
      updateQAProgress({
        qa_id: data.name,
        module: moduleId,
        answers: answersArray,
      })
        .then((res: any) => {
          if (res && (res.message === 'Question Answer Progress saved' || res.message === 'Responses submitted')) {
            setQaProgress(res);
            setAllSubmitted(true);
            setTimerActive(false);
            // Mark all questions as submitted
            const allSubmittedState = data.questions.reduce((acc: any, q: any) => {
              acc[q.question] = true;
              return acc;
            }, {});
            setSubmitted(allSubmittedState);
          }
        })
        .catch((err) => setApiError("Could not update Q&A progress: " + err.message));
    }
  };

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timerActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setTimerActive(false);
            // Auto-submit all unanswered questions when time runs out
            handleSubmitAll();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timerActive, timeLeft, data, submitted, handleSubmitAll]);

  // Start timer when modal opens
  useEffect(() => {
    if (open && data?.time_limit_mins && !isLMSAdmin) {
      setTimeLeft(data.time_limit_mins * 60);
      setTimerActive(true);
    }
  }, [open, data, isLMSAdmin]);

  // Check for existing progress and determine state
  useEffect(() => {
    if (open && user && data && !isLMSAdmin && !checkingProgress) {
      // If we found existing progress, check its state
      if (existingProgress && existingProgress.length > 0) {
        const progress = existingProgress[0];
        setQaProgressId(progress.name);
        setProgressCreated(true);
        
        if (progress.score_added === 1) {
          // Completed - show percentage
          setShowProgressOnly(true);
          setShowReviewOnly(false);
        } else {
          // Under review - show review status
          setShowProgressOnly(false);
          setShowReviewOnly(true);
        }
        setProgressLoading(false);
        return;
      }

      // No existing progress - allow new submission
      setShowProgressOnly(false);
      setShowReviewOnly(false);
      setProgressLoading(false);
    } else if (!open) {
      setQaProgressId(null);
      setShowProgressOnly(false);
      setShowReviewOnly(false);
      setAllSubmitted(false);
      setProgressCreated(false);
    }
  }, [open, user, data, isLMSAdmin, existingProgress, checkingProgress]);

  // Load existing answers when progress data is available
  useEffect(() => {
    if (open && data && !isLMSAdmin) {
      const progressData = qaProgress || progressDoc;
      if (progressData && progressData.responses) {
        // Load existing answers from progress data
        const existingAnswers: Record<string, string> = {};
        const existingSubmitted: Record<string, boolean> = {};
        
        progressData.responses.forEach((response: any) => {
          // Use question text as the key since questions don't have unique IDs
          existingAnswers[response.question] = response.answer || "";
          existingSubmitted[response.question] = true; // Mark as submitted since it's in progress
        });
        
        setAnswers(existingAnswers);
        setSubmitted(existingSubmitted);
      }
    }
  }, [open, data, qaProgress, progressDoc, isLMSAdmin]);

  // Reset states when the dialog is closed
  useEffect(() => {
    if (!open) {
      setQaProgressId(null);
      setShowProgressOnly(false);
      setShowReviewOnly(false);
      setAllSubmitted(false);
      setProgressCreated(false);
    }
  }, [open]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetch(`${LMS_API_BASE_URL}/api/resource/Question Answer/${questionAnswerId}`, {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(e => {
        setError("Failed to load Q&A");
        setLoading(false);
      });
  }, [questionAnswerId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const hasUnsubmittedAnswers = data?.questions?.some((q: any) => 
    answers[q.question] && answers[q.question].trim() && !submitted[q.question]
  );

  if (userLoading) return (
    <div className="flex flex-col items-center justify-center p-8">
      <Lottie animationData={loadingAnimation} loop style={{ width: 120, height: 120 }} />
      <div className="mt-4 text-muted-foreground">Loading user...</div>
    </div>
  );
  if (adding || updating) return (
    <div className="flex flex-col items-center justify-center p-8">
      <Lottie animationData={loadingAnimation} loop style={{ width: 120, height: 120 }} />
      <div className="mt-4 text-muted-foreground">Saving progress...</div>
    </div>
  );
  if (addError) return (
    <div className="flex flex-col items-center justify-center p-8">
      <Lottie animationData={errorAnimation} loop style={{ width: 120, height: 120 }} />
      <div className="mt-4 text-red-500">Error: {addError.message}</div>
    </div>
  );
  if (updateError) return (
    <div className="flex flex-col items-center justify-center p-8">
      <Lottie animationData={timeoutAnimation} loop style={{ width: 120, height: 120 }} />
      {/* <div className="mt-4 text-red-500">Error: {updateError.message}</div> */}
    </div>
  );
  if (progressLoading || progressDocLoading || checkingProgress) return (
    <div className="flex flex-col items-center justify-center p-8">
      <Lottie animationData={loadingAnimation} loop style={{ width: 120, height: 120 }} />
      <div className="mt-4 text-muted-foreground">Loading progress...</div>
    </div>
  );
  
  // Show completed Q&A progress (score_added = 1)
  if (showProgressOnly && (qaProgress || progressDoc || (existingProgress && existingProgress.length > 0))) {
    const progressData = qaProgress || progressDoc || (existingProgress && existingProgress[0]);
    const score = progressData?.score || 0;
    const maxScore = progressData?.max_score || data?.max_score || 0;
    const percent = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    
    // Color for score
    let scoreColor = '#22c55e'; // green
    if (percent < 40) scoreColor = '#ef4444'; // red
    else if (percent < 70) scoreColor = '#eab308'; // yellow
    
    return (
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <Button variant="outline">View Q&A Results</Button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center" style={{ outline: 'none' }}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-background w-full h-full max-w-md mx-auto rounded-2xl shadow-2xl flex flex-col items-center justify-center p-8 gap-8 relative"
              style={{ minHeight: 400 }}
            >
              <Dialog.Close asChild>
                <Button variant="ghost" size="sm" className="absolute top-4 right-4 z-10">✕</Button>
              </Dialog.Close>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col items-center gap-2"
              >
                <CheckCircle className="h-10 w-10 text-green-500 mb-1" />
                <div className="text-2xl font-bold text-center">Q&A Completed!</div>
              </motion.div>
              {/* Circular Progress */}
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="relative flex items-center justify-center my-4"
                style={{ width: 140, height: 140 }}
              >
                <svg width="140" height="140" viewBox="0 0 140 140">
                  <circle
                    cx="70"
                    cy="70"
                    r="60"
                    stroke="#e5e7eb"
                    strokeWidth="14"
                    fill="none"
                  />
                  <motion.circle
                    cx="70"
                    cy="70"
                    r="60"
                    stroke={scoreColor}
                    strokeWidth="14"
                    fill="none"
                    strokeDasharray={2 * Math.PI * 60}
                    strokeDashoffset={2 * Math.PI * 60 * (1 - percent / 100)}
                    strokeLinecap="round"
                    initial={{ strokeDashoffset: 2 * Math.PI * 60 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 60 * (1 - percent / 100) }}
                    transition={{ duration: 1 }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-extrabold" style={{ color: scoreColor }}>{percent}%</span>
                  <span className="text-xs text-muted-foreground mt-1">Score</span>
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center"
              >
                <div className="text-2xl font-bold text-primary mb-2">{score}/{maxScore}</div>
                <div className="text-muted-foreground">Points Achieved</div>
              </motion.div>
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  // Show under review status (score_added = 0)
  if (showReviewOnly) {
    return (
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <Button variant="outline">View Q&A Status</Button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed inset-0 z-50 flex items-center justify-center" style={{ outline: 'none' }}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="bg-background w-full h-full max-w-md mx-auto rounded-2xl shadow-2xl flex flex-col items-center justify-center p-8 gap-8 relative"
              style={{ minHeight: 400 }}
            >
              <Dialog.Close asChild>
                <Button variant="ghost" size="sm" className="absolute top-4 right-4 z-10">✕</Button>
              </Dialog.Close>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col items-center gap-2"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                >
                  <Eye className="h-10 w-10 text-blue-500 mb-1" />
                </motion.div>
                <div className="text-2xl font-bold text-center">Under Review</div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="text-center space-y-4"
              >
                <div className="flex items-center justify-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <span className="font-semibold">Answers Submitted</span>
                </div>
                <div className="text-muted-foreground max-w-sm">
                  Your answers have been submitted successfully and are currently being reviewed by the instructor. 
                  You will be notified once the review is complete.
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-sm text-blue-500 font-medium"
                >
                  Please wait for review...
                </motion.div>
              </motion.div>
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="outline" onClick={handleStartQA} disabled={checkingProgress}>
          {checkingProgress ? "Checking..." : "Start Q&A"}
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" />
        <Dialog.Content
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ outline: 'none' }}
        >
          <div className="bg-background w-full h-full max-w-5xl mx-auto rounded-lg shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <Dialog.Title className="text-xl font-semibold">{data?.title || "Q&A"}</Dialog.Title>
              {data?.time_limit_mins > 0 && !allSubmitted && (
                <span className={
                  "ml-4 text-base font-mono " + (timeLeft <= 10 ? "text-red-500 font-bold" : "text-muted-foreground")
                }>
                  {formatTime(timeLeft)}
                </span>
              )}
              <Dialog.Close asChild>
                <Button variant="ghost" size="sm">✕</Button>
              </Dialog.Close>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              {loading && <div className="p-8 text-center">Loading...</div>}
              {error && <div className="p-8 text-center text-destructive">{error}</div>}
              {apiError && <div className="mb-2 text-destructive">{apiError}</div>}
              
              {allSubmitted && qaProgress ? (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center justify-center min-h-[60vh] w-full px-2"
                  >
                    <div className="bg-background max-w-md w-full mx-auto rounded-2xl shadow-2xl flex flex-col items-center justify-center p-8 gap-8">
                      <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col items-center gap-2"
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                        >
                          <Eye className="h-10 w-10 text-blue-500 mb-1" />
                        </motion.div>
                        <div className="text-2xl font-bold text-center">Submitted for Review!</div>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.3 }}
                        className="text-center space-y-4"
                      >
                        <div className="flex items-center justify-center gap-2 text-lg">
                          <CheckCircle className="h-5 w-5 text-green-500" />
                          <span className="font-semibold">Answers Submitted Successfully</span>
                        </div>
                        <div className="text-muted-foreground max-w-sm">
                          Your answers have been submitted and are now under review. 
                          You will be notified once the instructor completes the evaluation.
                        </div>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: [0, 1, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="text-sm text-blue-500 font-medium"
                        >
                          Please wait for review...
                        </motion.div>
                      </motion.div>
                    </div>
                  </motion.div>
                </AnimatePresence>
              ) : (
                data && (
                  <>
                    <div className="mb-2 text-sm text-muted-foreground">Max Score: {data.max_score}</div>
                    <div className="mb-4 prose prose-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: data.description }} />
                    <div className="space-y-6">
                      {data.questions?.map((q: any, idx: number) => (
                        <div key={q.id} className="border rounded-lg p-4 bg-muted/50">
                          <span>Q{idx + 1}</span>
                          <div className="font-semibold mb-2"
                          dangerouslySetInnerHTML={{ __html: q.question }}
                          />
                          <div className="mb-2 text-xs text-muted-foreground">Score: {q.score}</div>
                          {q.suggested_answer && isLMSAdmin && (
                            <>
                              <div className="mb-2 text-xs text-muted-foreground">Suggested Answer:</div>
                              <div className="prose prose-sm bg-background p-2 rounded mb-2" dangerouslySetInnerHTML={{ __html: q.suggested_answer }} />
                            </>
                          )}
                          <div className="mb-2">
                            {!isLMSAdmin && 
                            <RichEditor
                              content={answers[q.question] || ""}
                              onChange={val => setAnswers(a => ({ ...a, [q.question]: val }))}
                              disabled={submitted[q.question] || (data?.time_limit_mins > 0 && !timerActive) || allSubmitted}
                            />
                          }
                          </div>
                          {submitted[q.question] && <span className="text-green-600 flex items-center gap-1"><CheckCircle className="h-4 w-4" />Answer submitted!</span>}
                        </div>
                      ))}
                    </div>
                  </>
                )
              )}
            </div>
            {/* Footer */}
            {!allSubmitted && (
              <div className="p-4 border-t flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {data?.questions?.filter((q: any) => submitted[q.id]).length || 0} of {data?.questions?.length || 0} questions submitted
                </div>
                {!isLMSAdmin && !allSubmitted && (
                <div className="space-x-2">
                  <Button
                    onClick={handleSubmitAll}
                    disabled={updating || !progressCreated}
                    variant="default"
                  >
                    {updating ? "Submitting..." : "Submit All Answers"}
                  </Button>
                    <Button onClick={() => setOpen(false)}>Close</Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default QuestionAnswer; 