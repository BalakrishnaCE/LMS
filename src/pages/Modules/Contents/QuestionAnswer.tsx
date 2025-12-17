import React, { useState, useEffect } from "react";
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import RichEditor from '@/components/RichEditor';
import { useUser } from "@/hooks/use-user";
import { useFrappePostCall, useFrappePutCall, useFrappeGetDocList } from 'frappe-react-sdk';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Eye, FileText, Play } from 'lucide-react';
import Lottie from 'lottie-react';
import errorAnimation from '@/assets/Error.json';
import loadingAnimation from '@/assets/Loading.json';
import { LMS_API_BASE_URL } from "@/config/routes";
import InstructionDialog from '@/components/InstructionDialog';

interface QuestionAnswerProps {
  questionAnswerId?: string;
  contentReference?: string;
  moduleId?: string;
}

const QuestionAnswer: React.FC<QuestionAnswerProps> = ({ questionAnswerId, contentReference, moduleId }) => {
  // Use contentReference if questionAnswerId is not provided
  const qaId = questionAnswerId || contentReference;
  const { user, isLoading: userLoading, isLMSAdmin } = useUser();
  const [open, setOpen] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [timerActive, setTimerActive] = useState(false);
  
  // Progress tracking states
  const [showProgressOnly, setShowProgressOnly] = useState(false);
  const [showReviewOnly, setShowReviewOnly] = useState(false);
  const [qaProgress, setQaProgress] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [allSubmitted, setAllSubmitted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // API calls for progress
  const { call: addQAProgress, loading: adding } = useFrappePostCall("novel_lms.novel_lms.api.quiz_qa_progress.add_qa_progress");
  const { call: updateQAProgress, loading: updating } = useFrappePutCall("novel_lms.novel_lms.api.quiz_qa_progress.update_qa_progress");
  
  // Check for existing progress
  const { data: existingProgress, isValidating: checkingProgress } = useFrappeGetDocList(
    'Question Answer Progress',
    {
      fields: ['name', 'score', 'max_score', 'score_added', 'question_answer_response'],
      filters: [
        ['question_answer', '=', qaId || ''],
        ['user', '=', user?.name || '']
      ],
      limit: 1
    },
    {
      enabled: !!user && !!qaId
    }
  );

  const handleStartQA = async () => {
    if (loading || !data) {
      console.warn('Q&A data not loaded yet, cannot start');
      return;
    }

    // Handle existing progress
    if (existingProgress && existingProgress.length > 0) {
      const progress = existingProgress[0];
      setQaProgress(progress);
      
      // Load existing answers
      if (progress.question_answer_response && data) {
        const existingAnswers: Record<string, string> = {};
        const existingSubmitted: Record<string, boolean> = {};
        
        progress.question_answer_response.forEach((response: any) => {
          existingAnswers[response.question] = response.answer || "";
          existingSubmitted[response.question] = !!(response.answer && response.answer.trim());
        });
        
        setAnswers(existingAnswers);
        setSubmitted(existingSubmitted);
      }
      
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

    // Handle admin view
    if (isLMSAdmin) {
      setOpen(true);
      return;
    }

    // Create new progress
    if (user && data) {
      try {
        const res = await addQAProgress({
          qa_id: data.name,
          module: moduleId,
        });
        
        if (res && res.message === "Already started" && res.progress_id) {
          // Fetch the existing progress
          const progressRes = await fetch(`${LMS_API_BASE_URL}/api/resource/Question Answer Progress/${res.progress_id}`, {
            credentials: 'include'
          });
          const progressData = await progressRes.json();
          setQaProgress(progressData.data);
          
          // Load existing answers
          if (progressData.data.question_answer_response) {
            const existingAnswers: Record<string, string> = {};
            const existingSubmitted: Record<string, boolean> = {};
            
            progressData.data.question_answer_response.forEach((response: any) => {
              existingAnswers[response.question] = response.answer || "";
              existingSubmitted[response.question] = !!(response.answer && response.answer.trim());
            });
            
            setAnswers(existingAnswers);
            setSubmitted(existingSubmitted);
          }
          
          if (progressData.data.score_added === 1) {
            setShowProgressOnly(true);
            setShowReviewOnly(false);
          } else {
            setShowProgressOnly(false);
            setShowReviewOnly(true);
          }
        } else {
          // New progress created
          setQaProgress(res);
        }
        setOpen(true);
      } catch (err: any) {
        setApiError("Could not start Q&A: " + err.message);
      }
    }
  };

  const handleNextQuestion = async () => {
    if (isLMSAdmin) return;
    
    const currentQuestion = data?.questions?.[currentQuestionIndex];
    if (!currentQuestion) return;
    
    const answerData = {
      question: currentQuestion.question,
      answer: answers[currentQuestion.question] || "",
      suggested_answer: currentQuestion.suggested_answer || ""
    };

    try {
      await updateQAProgress({
        qa_id: data.name,
        module: moduleId,
        answers: [answerData],
      });
      
      setSubmitted(prev => ({ ...prev, [currentQuestion.question]: true }));
      
      if (currentQuestionIndex < (data?.questions?.length || 0) - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    } catch (err) {
      console.error('Error saving answer:', err);
      setSubmitted(prev => ({ ...prev, [currentQuestion.question]: true }));
      if (currentQuestionIndex < (data?.questions?.length || 0) - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    }
  };

  const handlePreviousQuestion = async () => {
    if (currentQuestionIndex > 0) {
      const currentQuestion = data?.questions?.[currentQuestionIndex];
      if (currentQuestion && answers[currentQuestion.question]?.trim()) {
        const answerData = {
          question: currentQuestion.question,
          answer: answers[currentQuestion.question] || "",
          suggested_answer: currentQuestion.suggested_answer || ""
        };

        try {
          await updateQAProgress({
            qa_id: data.name,
            module: moduleId,
            answers: [answerData],
          });
          setSubmitted(prev => ({ ...prev, [currentQuestion.question]: true }));
        } catch (err) {
          console.error('Error saving answer:', err);
          setSubmitted(prev => ({ ...prev, [currentQuestion.question]: true }));
        }
      }
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitAll = async () => {
    if (isLMSAdmin) return;
    
    const answersArray = data?.questions?.map((q: any) => ({
      question: q.question,
      answer: answers[q.question] || "",
      suggested_answer: q.suggested_answer || ""
    })) || [];

    try {
      await updateQAProgress({
        qa_id: data.name,
        module: moduleId,
        answers: answersArray,
      });
      
      setAllSubmitted(true);
      setTimerActive(false);
      
      const allSubmittedState = data.questions.reduce((acc: any, q: any) => {
        acc[q.question] = true;
        return acc;
      }, {});
      setSubmitted(allSubmittedState);
    } catch (err) {
      console.error('Error submitting all answers:', err);
      setAllSubmitted(true);
      setTimerActive(false);
      const allSubmittedState = data.questions.reduce((acc: any, q: any) => {
        acc[q.question] = true;
        return acc;
      }, {});
      setSubmitted(allSubmittedState);
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
            handleSubmitAll();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timerActive, timeLeft]);

  // Start timer when modal opens
  useEffect(() => {
    if (open && data?.time_limit_mins && !isLMSAdmin) {
      setTimeLeft(data.time_limit_mins * 60);
      setTimerActive(true);
    }
  }, [open, data, isLMSAdmin]);

  // Reset states when dialog closes
  useEffect(() => {
    if (!open) {
      setShowProgressOnly(false);
      setShowReviewOnly(false);
      setAllSubmitted(false);
      setShowInstructions(false);
      setCurrentQuestionIndex(0);
      setAnswers({});
      setSubmitted({});
    }
  }, [open]);

  useEffect(() => {
    // Don't make API call if qaId is not provided
    if (!qaId) {
      console.error('QuestionAnswerId or contentReference is required but not provided');
      setError("Question Answer ID is missing");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    
    // Use content access API to handle permissions properly
    fetch(`${LMS_API_BASE_URL}/api/method/novel_lms.novel_lms.api.content_access.get_content_with_permissions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        content_type: 'Question Answer',
        content_reference: qaId
      })
    })
      .then(res => res.json())
      .then(res => {
        console.log('Q&A API Response:', res);
        const responseData = res.message || res;
        console.log('Q&A ResponseData:', responseData);
        
        // Handle nested message structure from backend API
        const actualData = responseData.message || responseData;
        const success = actualData.success || responseData.success;
        const data = actualData.data || responseData.data;
        
        if (success && data) {
          console.log('Q&A Success - setting data:', data);
          setData(data);
        } else {
          console.error('Q&A API Error Response:', responseData);
          const errorMessage = typeof actualData.message === 'string' 
            ? actualData.message 
            : JSON.stringify(actualData.message) || 'Failed to load Q&A';
          throw new Error(errorMessage);
        }
        setLoading(false);
      })
      .catch(e => {
        console.error('Q&A loading error:', e);
        console.log('Trying fallback API...');
        // Try fallback API if content access fails
        fetch(`${LMS_API_BASE_URL}/api/resource/Question Answer/${qaId}`, {
          credentials: 'include',
        })
          .then(res => res.json())
          .then(res => {
            console.log('Q&A Fallback API Response:', res);
            if (res.data) {
              console.log('Q&A Fallback Success - setting data:', res.data);
              setData(res.data);
              setLoading(false);
            } else {
              throw new Error('Failed to load Q&A from fallback API');
            }
          })
          .catch(fallbackError => {
            console.error('Fallback API also failed:', fallbackError);
            setError("Failed to load Q&A. Please try refreshing the page.");
            setLoading(false);
          });
      });
  }, [qaId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (userLoading || loading) return (
    <div className="flex flex-col items-center justify-center p-8">
      <Lottie animationData={loadingAnimation} loop style={{ width: 120, height: 120 }} />
      <div className="mt-4 text-muted-foreground">Loading...</div>
    </div>
  );
  
  if (error) return (
    <div className="flex flex-col items-center justify-center p-8">
      <Lottie animationData={errorAnimation} loop style={{ width: 120, height: 120 }} />
      <div className="mt-4 text-red-500">{error}</div>
    </div>
  );
  
  // Show completed Q&A progress (score_added = 1)
  if (showProgressOnly && qaProgress) {
    const score = qaProgress?.score || 0;
    const maxScore = qaProgress?.max_score || data?.max_score || 0;
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

  // For admin preview: directly display Q&A questions and suggested answers
  if (isLMSAdmin && data && data.questions && data.questions.length > 0) {
    return (
      <div className="w-full space-y-6">
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">{data.title || "Question & Answer"}</h3>
          {data.description && (() => {
            // Strip HTML tags and check if there's actual content
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = data.description;
            const textContent = tempDiv.textContent || tempDiv.innerText || '';
            const hasContent = textContent.trim().length > 0;
            
            return hasContent ? (
              <p className="text-muted-foreground">{textContent.trim()}</p>
            ) : null;
          })()}
        </div>
        
        <div className="space-y-6">
          {data.questions.map((question: any, index: number) => (
            <motion.div
              key={question.name || index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-card border border-border rounded-lg p-6 space-y-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-semibold">
                  {index + 1}
                </div>
                <div className="flex-1 space-y-3">
                  <div className="prose prose-sm max-w-none">
                    <div dangerouslySetInnerHTML={{ __html: question.question || "" }} />
                  </div>
                  
                  <div className="bg-muted/50 rounded-lg p-4">
                    <h4 className="font-semibold text-sm text-muted-foreground mb-2">Suggested Answer:</h4>
                    {question.suggested_answer ? (
                      <div className="prose prose-sm max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: question.suggested_answer }} />
                      </div>
                    ) : (
                      <p className="text-muted-foreground italic">No suggested answer present</p>
                    )}
                  </div>
                  
                  {question.score && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Score:</span> {question.score} points
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <>
      <Button 
        onClick={() => setShowInstructions(true)} 
        disabled={checkingProgress || adding}
        className="flex items-center gap-2"
      >
        {checkingProgress || adding ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            {checkingProgress ? "Checking..." : "Starting..."}
          </>
        ) : (
          <>
            <Play className="h-4 w-4" />
            Start Q&A
          </>
        )}
      </Button>
      
      {/* Instruction Dialog */}
      <InstructionDialog
        open={showInstructions}
        onOpenChange={setShowInstructions}
        onStart={handleStartQA}
        type="qa"
        title={data?.title || "Question & Answer"}
        description={data?.description}
        timeLimit={data?.time_limit_mins}
        maxScore={data?.max_score}
        questionCount={data?.questions?.length}
        loading={checkingProgress || adding}
      />

      <Dialog.Root open={open} onOpenChange={(newOpen) => {
        // Prevent closing during API calls only
        if (!newOpen && (updating || adding)) {
          return;
        }
        setOpen(newOpen);
      }}>
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
              {/* <Dialog.Close asChild>
                <Button variant="ghost" size="sm" disabled={updating || adding}>✕</Button>
              </Dialog.Close> */}
            </div>
            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
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
                    <div className="bg-background max-w-md w-full mx-auto rounded-2xl shadow-2xl flex flex-col items-center justify-center p-8 gap-8 relative">
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
                    
                    {/* Question Navigation */}
                    <div className="mb-4 flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Question {currentQuestionIndex + 1} of {data?.questions?.length || 0}
                      </div>
                      <div className="flex items-center gap-2">
                        {currentQuestionIndex > 0 && (
                          <Button
                            onClick={handlePreviousQuestion}
                            variant="outline"
                            size="sm"
                          >
                            Back
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Current Question */}
                    {data?.questions?.[currentQuestionIndex] && (() => {
                      const q = data.questions[currentQuestionIndex];
                      return (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 hover:shadow-md transition-shadow duration-200">
                          <div className="flex items-center justify-between mb-6">
                            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold shadow-sm">
                              Q{currentQuestionIndex + 1}
                            </div>
                            <div className="text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                              {q.score} points
                            </div>
                          </div>
                          <div className="text-xl font-semibold text-gray-900 mb-6 leading-relaxed"
                          dangerouslySetInnerHTML={{ __html: q.question }}
                          />
                          {q.suggested_answer && isLMSAdmin && (
                            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                              <div className="text-sm font-medium text-blue-800 mb-2">Suggested Answer:</div>
                              <div className="prose prose-sm text-blue-700" dangerouslySetInnerHTML={{ __html: q.suggested_answer }} />
                            </div>
                          )}
                          <div className="mb-2">
                            {!isLMSAdmin && 
                            <RichEditor
                              key={`${q.question}-${currentQuestionIndex}`}
                              content={answers[q.question] || ""}
                              onChange={val => setAnswers(a => ({ ...a, [q.question]: val }))}
                              disabled={(data?.time_limit_mins > 0 && !timerActive) || allSubmitted}
                            />
                          }
                          </div>
                          <div className="flex items-center justify-between">
                            {submitted[q.question] && !allSubmitted && <span className="text-green-600 flex items-center gap-1"><CheckCircle className="h-4 w-4" />Answer saved!</span>}
                            {!isLMSAdmin && !allSubmitted && (
                              <div className="flex gap-2">
                                {currentQuestionIndex < (data?.questions?.length || 0) - 1 ? (
                                  <Button
                                    onClick={handleNextQuestion}
                                    disabled={updating || !answers[q.question]?.trim()}
                                    variant="outline"
                                    size="sm"
                                  >
                                    {updating ? "Saving..." : "Next"}
                                  </Button>
                                ) : (
                                  <Button
                                    onClick={handleSubmitAll}
                                    disabled={updating}
                                    variant="default"
                                    size="sm"
                                  >
                                    {updating ? "Submitting..." : "Submit All Answers"}
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </>
                )
              )}
            </div>
            {/* Footer */}
            {!allSubmitted && (
              <div className="p-4 border-t flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {data?.questions?.filter((q: any) => submitted[q.question]).length || 0} of {data?.questions?.length || 0} questions saved
                </div>
                {/* {!isLMSAdmin && (
                  <Button onClick={() => setOpen(false)} disabled={updating || adding}>Close</Button>
                )} */}
              </div>
            )}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
    </>
  );
};

export default QuestionAnswer; 