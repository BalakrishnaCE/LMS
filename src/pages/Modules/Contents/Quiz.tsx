import { useState, useEffect } from 'react';
import { useFrappeGetDoc, useFrappePostCall, useFrappePutCall } from 'frappe-react-sdk';
import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import * as Dialog from '@radix-ui/react-dialog';
import { useUser } from "@/hooks/use-user";
import { useFrappeGetCall } from 'frappe-react-sdk';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Clock, XCircle } from 'lucide-react';
import Lottie from 'lottie-react';
import emptyAnimation from '@/assets/Empty.json';
import errorAnimation from '@/assets/Error.json';
import loadingAnimation from '@/assets/Loading.json';

interface QuizProps {
  quizReference: string;
}

interface QuizQuestion {
  name: string;
  question_text: string;
  question_type: string;
  score: number;
  options: {
    option_text: string;
    correct: boolean;
  }[];
}

interface Quiz {
  name: string;
  title: string;
  description: string;
  total_score: number;
  randomize_questions: boolean;
  time_limit_mins: number;
  is_active: boolean;
  questions: {
    name: string;
    quiz_question: string;
  }[];
}

export default function Quiz({ quizReference }: QuizProps) {
  const { user, isLoading: userLoading, isLMSAdmin } = useUser();
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timerInterval, setTimerInterval] = useState<number | null>(null);
  const [progressAdded, setProgressAdded] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [quizProgress, setQuizProgress] = useState<any>(null);
  const [progressLoading, setProgressLoading] = useState(false);
  const [showProgressOnly, setShowProgressOnly] = useState(false);
  const [quizProgressId, setQuizProgressId] = useState<string | null>(null);
  const { data: progressDoc, isValidating: progressDocLoading, error: progressDocError } = useFrappeGetDoc('Quiz Progress', quizProgressId || '', { enabled: !!quizProgressId });

  // Add these hooks for API calls
  const { call: addQuizProgress, loading: adding, error: addError } = useFrappePostCall("addQuizProgress");
  const { call: updateQuizProgress, loading: updating, error: updateError } = useFrappePutCall("updateQuizProgress");

  // Fetch the main quiz document
  const { data: quiz, error: quizError, isValidating: quizLoading } = useFrappeGetDoc<Quiz>(
    'Quiz', 
    quizReference
  );

  // Fetch all questions
  const questionReferences = quiz?.questions?.map(q => q.quiz_question) || [];
  const questionResults = questionReferences.map(ref => 
    useFrappeGetDoc<QuizQuestion>('Quiz Question', ref)
  );

  const questions = questionResults
    .map(result => result.data)
    .filter(Boolean) as QuizQuestion[];

  const handleAnswerSelect = (questionId: string, optionText: string) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionText
    }));
  };

  // On dialog open, check/add progress
  useEffect(() => {
    if (isOpen && user && quiz) {
      setProgressLoading(true);
      addQuizProgress({
        user: user.name,
        quiz_id: quiz.name,
      })
        .then((res: any) => {
          setProgressLoading(false);
          if (res && res.message === 'Quiz progress already exists' && res.progress_id) {
            setQuizProgressId(res.progress_id);
            setShowProgressOnly(true);
          } else {
            setQuizProgressId(null);
            setShowProgressOnly(false);
          }
        })
        .catch((err: any) => {
          setProgressLoading(false);
          setQuizProgressId(null);
          setShowProgressOnly(false);
          setApiError('Could not start quiz progress: ' + (err?.message || err));
        });
    } else if (!isOpen) {
      setQuizProgressId(null);
      setShowProgressOnly(false);
    }
  }, [isOpen, user, quiz]);

  const handleSubmit = () => {
    let totalScore = 0;
    const answersObj = questions.reduce((acc, question) => {
      const selectedAnswer = selectedAnswers[question.name];
      const correctOption = question.options.find((opt) => opt.correct);
      if (selectedAnswer && correctOption && selectedAnswer === correctOption.option_text) {
        totalScore += question.score;
      }
      acc[question.name] = {
        question_id: question.name,
        marked_ans: selectedAnswer || "",
        correct_ans: correctOption ? correctOption.option_text : "",
      };
      return acc;
    }, {} as Record<string, { question_id: string; marked_ans: string; correct_ans: string }>);
    setScore(totalScore);
    setIsSubmitted(true);
    if (user && quiz) {
      updateQuizProgress({
        quiz_id: quiz.name,
        answers: answersObj,
      }).then((res: any) => {
        if (res && res.message === 'Quiz progress updated') {
          setQuizProgress(res);
        }
      }).catch((err) => setApiError("Could not update quiz progress: " + err.message));
    }
  };

  useEffect(() => {
    if (isOpen && quiz?.time_limit_mins && !isSubmitted) {
      const totalSeconds = quiz.time_limit_mins * 60;
      setTimeLeft(totalSeconds);

      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev === null || prev <= 0) {
            clearInterval(interval);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setTimerInterval(Number(interval));

      return () => {
        clearInterval(interval);
      };
    }
  }, [isOpen, quiz?.time_limit_mins, isSubmitted]);

  useEffect(() => {
    if (isSubmitted && timerInterval) {
      clearInterval(timerInterval);
    }
  }, [isSubmitted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (userLoading) return (
    <div className="flex flex-col items-center justify-center p-8">
      <Lottie animationData={loadingAnimation} loop style={{ width: 120, height: 120 }} />
      <div className="mt-4 text-muted-foreground">Loading user...</div>
    </div>
  );
  if (quizLoading) return (
    <div className="flex flex-col items-center justify-center p-8">
      <Lottie animationData={loadingAnimation} loop style={{ width: 120, height: 120 }} />
      <div className="mt-4 text-muted-foreground">Loading quiz...</div>
    </div>
  );
  if (quizError) return (
    <div className="flex flex-col items-center justify-center p-8">
      <Lottie animationData={errorAnimation} loop style={{ width: 120, height: 120 }} />
      <div className="mt-4 text-red-500">Error loading quiz</div>
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
      <Lottie animationData={errorAnimation} loop style={{ width: 120, height: 120 }} />
      <div className="mt-4 text-red-500">Error: {updateError.message}</div>
    </div>
  );
  if (!quiz) return null;
  if (progressLoading || progressDocLoading) return (
    <div className="flex flex-col items-center justify-center p-8">
      <Lottie animationData={loadingAnimation} loop style={{ width: 120, height: 120 }} />
      <div className="mt-4 text-muted-foreground">Loading progress...</div>
    </div>
  );

  if (showProgressOnly && progressDoc) {
    // Animated progress display
    const score = progressDoc.score || 0;
    const maxScore = progressDoc.max_score || quiz?.total_score || 0;
    const percent = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    const timeSpent = Math.floor(progressDoc.time_spent || 0);
    const mins = Math.floor(timeSpent / 60);
    const secs = timeSpent % 60;
    // Color for score
    let scoreColor = '#22c55e'; // green
    if (percent < 40) scoreColor = '#ef4444'; // red
    else if (percent < 70) scoreColor = '#eab308'; // yellow

    return (
      <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
        <Dialog.Trigger asChild>
          <Button variant="outline">View Quiz Progress</Button>
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
              {/* Close Button */}
              <Dialog.Close asChild>
                <Button variant="ghost" size="sm" className="absolute top-4 right-4 z-10">✕</Button>
              </Dialog.Close>
              {/* Quiz Completed Label */}
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex flex-col items-center gap-2"
              >
                <CheckCircle className="h-10 w-10 text-green-500 mb-1" />
                <div className="text-2xl font-bold text-center">Quiz Completed!</div>
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
              {/* Time Spent */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex flex-col items-center gap-1"
              >
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Clock className="h-5 w-5 text-blue-500" />
                  <span>Time Spent</span>
                </div>
                <div className="text-2xl font-bold">{mins}:{secs.toString().padStart(2, '0')} min</div>
              </motion.div>
            </motion.div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  if (!quiz.is_active) {
    return <div>This quiz is not currently active.</div>;
  }

  // --- ADMIN PREVIEW MODE ---
  if (isLMSAdmin) {
    if (quizLoading) return <div>Loading quiz...</div>;
    if (quizError) return <div>Error loading quiz</div>;
    if (!quiz) return null;
    return (
      <div className="space-y-6">
        <div className="mb-4">
          <h2 className="text-xl font-bold mb-1">{quiz.title}</h2>
          <div className="text-muted-foreground text-sm mb-2" dangerouslySetInnerHTML={{ __html: quiz.description }} />
        </div>
        {questions.map((question, idx) => (
          <div key={question.name} className="mb-6 p-4 bg-muted/50 rounded-lg border">
            <div className="font-semibold mb-2">Q{idx + 1}. {question.question_text?.replace(/<[^>]+>/g, '')}</div>
            <div className="space-y-2 ml-4">
              {question.options.map((opt, oidx) => (
                <div key={oidx} className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 rounded-full border border-muted-foreground bg-background" />
                  <Label className="text-base text-muted-foreground cursor-default">{opt.option_text}</Label>

                  {/* {opt.correct && (
                    <span className="ml-2 text-green-600 text-xs font-semibold">(Correct)</span>
                  )} */}

                  {opt.correct ? (
                    <span className="ml-2 text-green-600 text-xs font-semibold">(Correct)</span>
                  ) : (
                    <span className="ml-2 text-red-600 text-xs font-semibold"></span>
                  )}

                </div>
              ))}
            </div>
            <div className="mt-2 text-xs text-muted-foreground">Score: {question.score}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <Button variant="outline">Start Quiz</Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50" />
        <Dialog.Content
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ outline: 'none' }}
        >
          <div className="bg-background w-full h-full max-w-3xl mx-auto rounded-lg shadow-2xl flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b">
              <Dialog.Title className="text-xl font-semibold">{quiz.title}</Dialog.Title>
              {quiz.time_limit_mins > 0 && !isSubmitted && (
                <span className={
                  "ml-4 text-base font-mono " + (timeLeft !== null && timeLeft <= 10 ? "text-red-500 font-bold" : "text-muted-foreground")
                }>
                  {timeLeft !== null ? formatTime(timeLeft) : formatTime(quiz.time_limit_mins * 60)}
                </span>
              )}
              <Dialog.Close asChild>
                <Button variant="ghost" size="sm">✕</Button>
              </Dialog.Close>
            </div>
            {/* Content */}
            <div className="flex-1 overflow-auto p-4">
              {apiError && <div className="mb-2 text-destructive">{apiError}</div>}
              <div className="space-y-2">
                <div className="text-sm" dangerouslySetInnerHTML={{ __html: quiz.description || "" }} />
              </div>
              <div className="space-y-6 mt-4">
                {isSubmitted && quizProgress ? (
                  <AnimatePresence>
                    {(() => {
                      const score = quizProgress.score || 0;
                      const maxScore = quizProgress.max_score || quiz?.total_score || 0;
                      const percent = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
                      const timeSpent = Math.floor(quizProgress.time_spent || 0);
                      const mins = Math.floor(timeSpent / 60);
                      const secs = timeSpent % 60;
                      let scoreColor = '#22c55e'; // green
                      if (percent < 40) scoreColor = '#ef4444'; // red
                      else if (percent < 70) scoreColor = '#eab308'; // yellow
                      return (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.4 }}
                          className="flex flex-col items-center justify-center min-h-[60vh] w-full px-2"
                        >
                          <div className="bg-background max-w-md w-full mx-auto rounded-2xl shadow-2xl flex flex-col items-center justify-center p-8 gap-8 relative">
                            {/* Close Button */}
                            {/* <Dialog.Close asChild>
                              <Button variant="ghost" size="sm" className="absolute top-4 right-4 z-10">✕</Button>
                            </Dialog.Close> */}
                            {/* Quiz Completed Label */}
                            <motion.div
                              initial={{ opacity: 0, y: -20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.2 }}
                              className="flex flex-col items-center gap-2"
                            >
                              <CheckCircle className="h-10 w-10 text-green-500 mb-1" />
                              <div className="text-2xl font-bold text-center">Quiz Complete!</div>
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
                            {/* Time Spent */}
                            <motion.div
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.5 }}
                              className="flex flex-col items-center gap-1"
                            >
                              <div className="flex items-center gap-2 text-lg font-semibold">
                                <Clock className="h-5 w-5 text-blue-500" />
                                <span>Time Spent</span>
                              </div>
                              <div className="text-2xl font-bold">{mins}:{secs.toString().padStart(2, '0')} min</div>
                            </motion.div>
                            {/* Correct Answers */}
                            <motion.div
                              initial={{ opacity: 0, y: 30 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.7 }}
                              className="w-full max-w-2xl mt-8"
                            >
                              <div className="text-lg font-semibold mb-2">Correct Answers</div>
                              <ul className="space-y-3">
                                {questions.map((question, idx) => {
                                  const correctOption = question.options.find(opt => opt.correct);
                                  const userAnswer = selectedAnswers[question.name];
                                  const isCorrect = userAnswer === correctOption?.option_text;
                                  return (
                                    <li key={question.name} className="rounded-lg p-3 bg-muted/40">
                                      <div className="font-semibold mb-1">Q{idx + 1}: {question.question_text?.replace(/<[^>]+>/g, '')}</div>
                                      <div className="flex flex-col gap-1 ml-2">
                                        <span className="text-green-600">Correct: {correctOption?.option_text}</span>
                                        <span className={
                                          isCorrect
                                            ? 'text-blue-600'
                                            : 'text-red-600 flex items-center gap-1'
                                        }>
                                          Your Answer: {userAnswer}
                                          {!isCorrect && <XCircle className="inline h-4 w-4 text-red-400 ml-1" />}
                                        </span>
                                      </div>
                                    </li>
                                  );
                                })}
                              </ul>
                            </motion.div>
                  </div>
                        </motion.div>
                      );
                    })()}
                  </AnimatePresence>
                ) : (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                  }} className="space-y-8">
                    {questions.map((question, index) => (
                      <div key={question.name} className="space-y-4">
                        <h3 className="text-lg font-semibold">
                          Question {index + 1}: {question.question_text?.replace(/<[^>]+>/g, '')}
                        </h3>
                        <RadioGroup
                          value={selectedAnswers[question.name] || ''}
                          onValueChange={(value) => handleAnswerSelect(question.name, value)}
                          className="space-y-2"
                        >
                          {question.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex items-center space-x-2">
                              <RadioGroupItem value={option.option_text} id={`${question.name}-option-${optionIndex}`} className="border-primary-background" />
                              <Label htmlFor={`${question.name}-option-${optionIndex}`}>{option.option_text}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    ))}
                    <div className="flex justify-end">
                      <Button 
                        type="submit"
                        disabled={Object.keys(selectedAnswers).length !== questions.length}
                      >
                        Submit Quiz
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
} 