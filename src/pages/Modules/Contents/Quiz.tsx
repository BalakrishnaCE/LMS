import { useState, useEffect } from 'react';
import { useFrappeGetDoc } from 'frappe-react-sdk';
import { Button } from '@/components/ui/button';
// import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import * as Dialog from '@radix-ui/react-dialog';

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
  const [selectedAnswers, setSelectedAnswers] = useState<{ [key: string]: string }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timerInterval, setTimerInterval] = useState<number | null>(null);

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

  const handleSubmit = () => {
    let totalScore = 0;
    questions.forEach(question => {
      const selectedAnswer = selectedAnswers[question.name];
      const correctOption = question.options.find(opt => opt.correct);
      if (selectedAnswer && correctOption && selectedAnswer === correctOption.option_text) {
        totalScore += question.score;
      }
    });
    setScore(totalScore);
    setIsSubmitted(true);
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

  if (quizLoading) return <div>Loading quiz...</div>;
  if (quizError) return <div>Error loading quiz</div>;
  if (!quiz) return null;

  if (!quiz.is_active) {
    return <div>This quiz is not currently active.</div>;
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
              <div className="space-y-2">
                <div className="text-sm" dangerouslySetInnerHTML={{ __html: quiz.description || "" }} />
              </div>
              <div className="space-y-6 mt-4">
                {isSubmitted ? (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Quiz Complete!</h3>
                    <p>Your score: {score} out of {quiz.total_score}</p>
                  </div>
                ) : (
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    handleSubmit();
                  }} className="space-y-8">
                    {questions.map((question, index) => (
                      <div key={question.name} className="space-y-4">
                        <h3 className="text-lg font-semibold">
                          Question {index + 1}: {question.question_text}
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