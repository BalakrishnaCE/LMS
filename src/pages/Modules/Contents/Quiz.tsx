import { useState, useEffect, useCallback } from 'react';
import { useFrappeAuth, useFrappePostCall } from 'frappe-react-sdk';
import Lottie from 'lottie-react';
import errorAnimation from '@/assets/Error.json';
import loadingAnimation from '@/assets/Loading.json';
import { LMS_API_BASE_URL } from '@/config/routes';
import { useUser } from '@/hooks/use-user';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import InstructionDialog from '@/components/InstructionDialog';

// Cache validation helper function
const isValidQuizCache = (attemptData: any, currentUser: string) => {
  return attemptData.userEmail === currentUser && 
         attemptData.timestamp && 
         new Date(attemptData.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours max
};

interface QuizProps {
  quizReference?: string;
  content?: any;
  contentReference?: string;
  contentData?: any; // Pre-fetched content data from parent
  moduleId?: string;
  onComplete?: () => void;
  isCompleted?: boolean;
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
    question_text: string;
    score: number;
    options: {
      option_text: string;
      correct: boolean;
    }[];
  }[];
}

// Admin Quiz Preview Component - Shows questions with correct answers in dialog
function AdminQuizPreview({ 
  quiz, 
  onClose 
}: { 
  quiz: Quiz; 
  onClose: () => void; 
}) {
  // Use quiz data directly - no need for additional API calls
  const questions = quiz.questions || [];
  
  console.log('🔍 Admin Preview - Quiz data:', quiz);
  console.log('🔍 Admin Preview - Questions:', questions);

  if (!questions || questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="text-destructive text-lg font-semibold mb-2">No questions available</div>
        <div className="text-muted-foreground text-center mb-4">
          This quiz doesn't have any questions configured.
        </div>
        <Button onClick={onClose} className="mt-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Close
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold mb-1">{quiz.title}</h2>
        <div className="text-muted-foreground text-sm mb-2" dangerouslySetInnerHTML={{ __html: quiz.description }} />
      </div>
      {questions.map((question, idx) => (
        <div key={question.name} className="mb-6 p-4 bg-muted/50 rounded-lg border">
          <span>Q{idx + 1}</span>
          <div className="font-semibold mb-2"
            dangerouslySetInnerHTML={{ __html: question.question_text }}
          />
          <div className="space-y-2 ml-4">
            {question.options?.map((opt: { option_text: string; correct: boolean }, oidx: number) => (
              <div key={oidx} className="flex items-center gap-2">
                <span className="inline-block w-4 h-4 rounded-full border border-muted-foreground bg-background" />
                <Label className="text-base text-muted-foreground cursor-default">{opt.option_text}</Label>
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

// Quiz Dialog Component for learners
function QuizDialog({ 
  quiz, 
  onClose, 
  onComplete,
  moduleId,
  quizReference
}: { 
  quiz: Quiz; 
  onClose: () => void; 
  onComplete: () => void;
  moduleId?: string;
  quizReference?: string;
}) {
  // Ensure quiz has a name - use quizReference if missing
  if (!quiz.name && quizReference) {
    quiz.name = quizReference;
    console.log('✅ Added missing name field in QuizDialog:', quizReference);
  }
  const { currentUser } = useFrappeAuth();
  const [answers, setAnswers] = useState<{ [key: string]: string }>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [maxScore, setMaxScore] = useState(0);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Check for existing quiz progress in DocType using direct fetch (like completion screen)
  const [existingProgress, setExistingProgress] = useState<any[]>([]);

  useEffect(() => {
    const fetchQuizProgress = async () => {
      if (!currentUser || !quiz?.name) return;
      
      try {
        const userEmail = typeof currentUser === 'string' ? currentUser : (currentUser as any)?.name || '';
        const quizRes = await fetch(
          `${LMS_API_BASE_URL}/api/resource/Quiz Progress?filters=[[\"user\",\"=\",\"${userEmail}\"]]&fields=[\"score\",\"max_score\",\"name\",\"quiz_id\"]`, 
          { credentials: 'include' }
        );
        const data = await quizRes.json();
        setExistingProgress(data?.data || []);
      } catch (error) {
        console.error('Error fetching quiz progress:', error);
        setExistingProgress([]);
      }
    };

    fetchQuizProgress();
  }, [currentUser, quiz?.name]);

  // Create quiz progress
  const { call: updateQuizProgress } = useFrappePostCall('novel_lms.novel_lms.api.quiz_qa_progress.update_quiz_progress');

  const handleAnswerChange = (questionId: string, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };
  // REMOVED: Auto-submit on navigation
  // Users should only submit via the Submit button
  // This prevents empty saves that block real attempts
  // If admins need to reset, they can do it manually in the backend

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculate score using question scores (matching backend)
    let calculatedScore = 0.0;
    let calculatedMaxScore = 0.0;
    let correctAnswers = 0; // For display purposes
    let totalQuestions = 0;
    
    if (quiz?.questions) {
      totalQuestions = quiz.questions.length;
      quiz.questions.forEach(question => {
        const questionScore = question.score || 1.0; // Use question's score
        calculatedMaxScore += questionScore; // Always add to max_score
        
        const userAnswer = answers[question.name];
        if (userAnswer && question.options) {
          const selectedOption = question.options.find(opt => opt.option_text === userAnswer);
          if (selectedOption?.correct) {
            calculatedScore += questionScore; // Add question's score if correct
            correctAnswers += 1; // Count for display
          }
        }
      });
    }
    
    // Calculate percentage
    const percentage = calculatedMaxScore > 0 ? Math.round((calculatedScore / calculatedMaxScore) * 100) : 0;
    
    // Store actual score and max_score in state
    setScore(calculatedScore);
    setMaxScore(calculatedMaxScore);
    setSubmitted(true);
    setHasAttempted(true);
    
    // Save attempt data to localStorage
    const attemptData = {
      score: calculatedScore,           // Actual score (e.g., 19)
      max_score: calculatedMaxScore,     // Max score (e.g., 25)
      percentage: percentage,            // Calculated percentage (e.g., 76)
      correctAnswers: correctAnswers,
      totalQuestions: totalQuestions,
      timestamp: new Date().toISOString(),
      quizName: quiz?.name,
      userEmail: currentUser
    };
    localStorage.setItem(`quiz_attempt_${currentUser}_${quiz?.name}`, JSON.stringify(attemptData));
    
    // Now save to DocType after completion
    try {
      setIsSaving(true);
      
      // Format answers for the API
      const formattedAnswers: { [key: string]: { marked_ans: string; correct_ans: string } } = {};
      
      console.log('Quiz questions:', quiz?.questions);
      console.log('User answers:', answers);
      
      if (quiz?.questions) {
        quiz.questions.forEach(question => {
          console.log('Processing question:', question.name, 'User answer:', answers[question.name]);
          const userAnswer = answers[question.name];
          if (userAnswer && question.options) {
            const selectedOption = question.options.find(opt => opt.option_text === userAnswer);
            const correctOption = question.options.find(opt => opt.correct);
            
            console.log('Selected option:', selectedOption);
            console.log('Correct option:', correctOption);
            
            formattedAnswers[question.name] = {
              marked_ans: userAnswer,
              correct_ans: correctOption?.option_text || ''
            };
          }
        });
      }
      
      console.log('Formatted answers for API:', formattedAnswers);
      console.log('Quiz object:', quiz);
      console.log('Quiz object keys:', quiz ? Object.keys(quiz) : 'quiz is null');
      console.log('Quiz name/id:', quiz?.name);
      console.log('Quiz ID alternatives:', {
        name: quiz?.name,
        id: (quiz as any)?.id,
        quiz_id: (quiz as any)?.quiz_id,
        _name: (quiz as any)?._name
      });
      
      // Get quiz_id - try multiple possible property names
      const quizId = quiz?.name || (quiz as any)?.id || (quiz as any)?.quiz_id || (quiz as any)?._name;
      
      // Validate quiz_id before sending
      if (!quizId) {
        console.error('Quiz ID is missing! Quiz object:', quiz);
        console.error('Available quiz properties:', quiz ? Object.keys(quiz) : 'null');
        throw new Error('Quiz ID is required but was not found in quiz object');
      }
      
      // Call the correct API
      const apiPayload = {
        quiz_id: quizId,
        answers: formattedAnswers,
        module: moduleId
      };
      
      console.log('Calling API with payload:', { 
        quiz_id: apiPayload.quiz_id, 
        answers_count: Object.keys(apiPayload.answers).length,
        module: apiPayload.module 
      });
      
      await updateQuizProgress(apiPayload);
      
      console.log('Quiz progress saved to DocType successfully');
    } catch (error) {
      console.error('Failed to save quiz progress to DocType:', error);
      // Still show the score even if saving fails
    } finally {
      setIsSaving(false);
    }
  };

  const handleComplete = () => {
    onComplete();
    onClose();
  };

  // Debug logging
  console.log('QuizDialog - Quiz data:', quiz);
  console.log('QuizDialog - Questions:', quiz?.questions);

  // Check if quiz has already been attempted - DocType first, then localStorage
  useEffect(() => {
    if (existingProgress && existingProgress.length > 0 && !hasAttempted) {
      // Filter by quiz name in frontend since we can't filter by quiz field in query
      const progressForThisQuiz = existingProgress.find((progress: any) => 
        progress.quiz_id === quiz?.name
      );
      
      if (progressForThisQuiz) {
        // Found in DocType - show previous score
        const backendScore = progressForThisQuiz.score || 0;
        const backendMaxScore = progressForThisQuiz.max_score || 0;
        
        // Store actual score and max_score (not percentage)
        setScore(backendScore);
        setMaxScore(backendMaxScore);
        setSubmitted(true);
        setHasAttempted(true);
        return;
      }
    }
    
    // Check localStorage only if no DocType record exists for this quiz
    if (!hasAttempted) {
      const quizAttemptKey = `quiz_attempt_${currentUser}_${quiz?.name}`;
      const savedAttempt = localStorage.getItem(quizAttemptKey);
      
      if (savedAttempt) {
        const attemptData = JSON.parse(savedAttempt);
        // Verify this data belongs to current user and is valid
        if (isValidQuizCache(attemptData, currentUser || '')) {
          setScore(attemptData.score || 0);
          setMaxScore(attemptData.max_score || 0);
          setSubmitted(true);
          setHasAttempted(true);
        } else {
          // Clear invalid cache
          localStorage.removeItem(quizAttemptKey);
        }
      }
    }
  }, [existingProgress, hasAttempted, quiz?.questions, quiz?.name]);

  // Safety checks
  if (!quiz || !quiz.questions || quiz.questions.length === 0) {
    console.log('QuizDialog - No questions available');
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h2 className="text-xl font-bold text-center mb-4">Quiz Error</h2>
          <p className="text-center text-gray-600 mb-4">
            No questions available for this quiz.
          </p>
          <div className="flex justify-center">
            <Button onClick={onClose} className="px-6">
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    // Get score and max_score - prioritize localStorage, then state, then backend
    let displayScore = score;
    let displayMaxScore = maxScore;
    let correctAnswers = 0;
    let totalQuestions = 0;
    
    // Check localStorage first (most reliable for current attempt)
    const savedAttempt = localStorage.getItem(`quiz_attempt_${currentUser}_${quiz?.name}`);
    if (savedAttempt) {
      const attemptData = JSON.parse(savedAttempt);
      displayScore = attemptData.score || score;
      displayMaxScore = attemptData.max_score || maxScore;
      correctAnswers = attemptData.correctAnswers || 0;
      totalQuestions = attemptData.totalQuestions || quiz?.questions?.length || 0;
    } else if (existingProgress && existingProgress.length > 0) {
      // Fallback to backend data
      const progressForThisQuiz = existingProgress.find((progress: any) => 
        progress.quiz_id === quiz?.name
      );
      if (progressForThisQuiz) {
        displayScore = progressForThisQuiz.score || score;
        displayMaxScore = progressForThisQuiz.max_score || maxScore;
        // Calculate correctAnswers from quiz if needed
        if (quiz?.questions) {
          totalQuestions = quiz.questions.length;
        }
      }
    } else {
      // Fallback calculation from current state
      if (quiz?.questions) {
        totalQuestions = quiz.questions.length;
        quiz.questions.forEach(question => {
          const userAnswer = answers[question.name];
          if (userAnswer && question.options) {
            const selectedOption = question.options.find(opt => opt.option_text === userAnswer);
            if (selectedOption?.correct) {
              correctAnswers += 1;
            }
          }
        });
      }
    }
    
    // Calculate percentage from score and max_score
    const percent = displayMaxScore > 0 ? Math.round((displayScore / displayMaxScore) * 100) : 0;
    const scoreColor = percent >= 70 ? '#10b981' : percent >= 50 ? '#f59e0b' : '#ef4444';
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-center mb-6">Quiz Completed!</h2>
          
          {/* Score Circle */}
          <div className="flex justify-center mb-6">
            <div className="relative flex items-center justify-center" style={{ width: 140, height: 140 }}>
              <svg width="140" height="140" viewBox="0 0 140 140">
                <circle cx="70" cy="70" r="60" stroke="#e5e7eb" strokeWidth="14" fill="none" />
                <circle
                  cx="70" cy="70" r="60"
                  stroke={scoreColor}
                  strokeWidth="14"
                  fill="none"
                  strokeDasharray={2 * Math.PI * 60}
                  strokeDashoffset={2 * Math.PI * 60 * (1 - percent / 100)}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-extrabold" style={{ color: scoreColor }}>{percent}%</span>
                <span className="text-xs text-gray-500 mt-1">Score</span>
              </div>
            </div>
          </div>
          
          <div className="text-center mb-6">
            <p className="text-lg">You scored {displayScore} out of {displayMaxScore} points</p>
            {correctAnswers > 0 && totalQuestions > 0 && (
              <p className="text-sm text-gray-500 mt-1">({correctAnswers} out of {totalQuestions} questions correct)</p>
            )}
            <p className="text-sm text-gray-600 mt-2">
              {percent >= 70 ? 'Congratulations! You passed!' : percent >= 50 ? 'Good effort! Try again to improve.' : 'Better luck next time!'}
            </p>
            {existingProgress && existingProgress.length > 0 && existingProgress.find((progress: any) => progress.quiz_id === quiz?.name) && (
              <p className="text-xs text-blue-600 mt-2 font-medium">
                
              </p>
            )}
            {isSaving && (
              <p className="text-xs text-orange-600 mt-2 font-medium">
                Saving your progress...
              </p>
            )}
          </div>
          
          <div className="flex justify-center">
            <Button onClick={handleComplete} className="px-6">
              Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white w-full h-full max-w-4xl mx-auto rounded-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-xl font-semibold">{quiz.title || 'Untitled Quiz'}</h2>
          {quiz.time_limit_mins > 0 && (
            <span className="text-base text-gray-600">
              Time Limit: {quiz.time_limit_mins} minutes
            </span>
          )}
          {/* Close button removed - quiz must be completed */}
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {/* Quiz Description */}
          {quiz.description && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-sm" dangerouslySetInnerHTML={{ __html: quiz.description }} />
            </div>
          )}
          
          {/* Quiz Questions */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {quiz.questions.map((question, index) => (
              <div key={question.name} className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold">
                  Question {index + 1}: 
                  <span 
                    className="ml-2 font-normal" 
                    dangerouslySetInnerHTML={{ 
                      __html: question.question_text?.replace(/<[^>]+>/g, '') || 'No question text available' 
                    }} 
                  />
                </h3>
                
                <div className="space-y-2">
                  {question.options && question.options.length > 0 ? (
                    question.options.map((option, optionIndex) => (
                      <label key={optionIndex} className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-gray-50 rounded">
                        <input
                          type="radio"
                          name={`question-${question.name}`}
                          value={option.option_text}
                          checked={answers[question.name] === option.option_text}
                          onChange={(e) => handleAnswerChange(question.name, e.target.value)}
                          className="w-4 h-4"
                        />
                        <span className="flex-1">{option.option_text}</span>
                      </label>
                    ))
                  ) : (
                    <p className="text-gray-500 italic">No options available for this question.</p>
                  )}
                </div>
                
                <div className="text-xs text-gray-500">
                  Score: {question.score || 0} points
                </div>
              </div>
            ))}
            
            <div className="flex justify-end pt-4">
              <Button 
                type="submit"
                disabled={Object.keys(answers).length !== quiz.questions.length || isSaving}
                className="px-8 py-2"
              >
                {isSaving ? 'Saving...' : 'Submit Quiz'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function Quiz({ 
  quizReference, 
  content, 
  contentReference,
  contentData, 
  moduleId: _moduleId,
  onComplete,
  isCompleted: _isCompleted
}: QuizProps) {
  const { isLoading: userLoading } = useFrappeAuth();
  const { isLMSAdmin, isLoading: permissionsLoading } = useUser();
  

  // Fetch the main quiz document using content access API
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [quizError, setQuizError] = useState<any>(null);
  const [quizLoading, setQuizLoading] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);

  // Function to fetch quiz questions with full data
  const fetchQuizQuestions = async (quizData: any) => {
    try {
      // Ensure quizData has a name - use reference if missing
      const quizId = quizData.name || contentReference || quizReference;
      if (!quizId) {
        console.error('Cannot fetch quiz questions: no quiz ID available');
        return;
      }
      
      // If quizData doesn't have name, set it now
      if (!quizData.name && quizId) {
        quizData.name = quizId;
      }
      
      console.log('Fetching quiz questions for:', quizId);
      const response = await fetch(`${LMS_API_BASE_URL}/api/method/novel_lms.novel_lms.api.content_access.get_content_with_permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content_type: 'Quiz',
          content_reference: quizId
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch quiz questions: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Quiz questions API response:', data);
      
      let questionsData = null;
      
      // Handle different response structures
      if (data.message?.success && data.message?.data) {
        questionsData = data.message.data;
      } else if (data.data && data.data.name) {
        questionsData = data.data;
      } else if (data.message?.message?.success && data.message?.message?.data) {
        questionsData = data.message.message.data;
      } else if (data.success && data.data) {
        questionsData = data.data;
      }
      
      console.log('Processed questions data:', questionsData);
      
      if (questionsData && questionsData.questions) {
        // Ensure name field exists
        if (!questionsData.name && quizData.name) {
          questionsData.name = quizData.name;
        }
        console.log('Setting quiz with full questions data');
        setQuiz(questionsData);
      } else {
        console.log('No questions data found, using original data');
        setQuiz(quizData); // Fallback to original data
      }
    } catch (error) {
      console.error('Error fetching quiz questions:', error);
      setQuiz(quizData); // Fallback to original data
    }
  };

  useEffect(() => {
    // CRITICAL FIX: If contentData is provided, use it without making API calls
    if (contentData !== undefined) {
      console.log('✅ Using pre-fetched contentData from parent');
      if (contentData === null) {
        console.log('⚠️ Content not found in backend, hiding component');
        setQuizLoading(false);
        return;
      }
      
      // Ensure name field exists - use contentReference or quizReference if name is missing
      const quizId = contentReference || quizReference;
      if (!contentData.name && quizId) {
        contentData.name = quizId;
        console.log('✅ Added missing name field to contentData:', quizId);
      }
      
      console.log('Content questions structure:', contentData.questions?.[0]);
      console.log('Has quiz_question field:', !!contentData.questions?.[0]?.quiz_question);
      console.log('Has question_text field:', !!contentData.questions?.[0]?.question_text);
      
      // Check if content has complete question data
      if (contentData.questions && contentData.questions.length > 0 && contentData.questions[0].quiz_question && !contentData.questions[0].question_text) {
        console.log('Content has incomplete questions, fetching full data');
        fetchQuizQuestions(contentData);
      } else {
        console.log('Content has complete questions, using directly');
        setQuiz(contentData);
      }
      setQuizLoading(false);
      return;
    }

    // If content is provided directly, use it instead of fetching
    if (content) {
      // Ensure name field exists
      const quizId = contentReference || quizReference;
      if (!content.name && quizId) {
        content.name = quizId;
        console.log('✅ Added missing name field to content:', quizId);
      }
      
      if (!content.name) {
        console.error('Content provided but no name field and no reference available');
        setQuizError(new Error('Quiz name is required but not found'));
        setQuizLoading(false);
        return;
      }
      
      console.log('Content provided directly:', content);
      console.log('Content questions structure:', content.questions?.[0]);
      console.log('Has quiz_question field:', !!content.questions?.[0]?.quiz_question);
      console.log('Has question_text field:', !!contentData.questions?.[0]?.question_text);
      
      // Check if content has complete question data
      if (content.questions && content.questions.length > 0 && content.questions[0].quiz_question && !content.questions[0].question_text) {
        console.log('Content has incomplete questions, fetching full data');
        fetchQuizQuestions(content);
      } else {
        console.log('Content has complete questions, using directly');
        setQuiz(content);
      }
      setQuizLoading(false);
      return;
    }

    const fetchQuiz = async () => {
      const ref = contentReference || quizReference;
      if (!ref) return;
      
      setQuizLoading(true);
      setQuizError(null);
      
      try {
        const response = await fetch(`${LMS_API_BASE_URL}/api/method/novel_lms.novel_lms.api.content_access.get_content_with_permissions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content_type: 'Quiz',
            content_reference: ref
          })
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch quiz: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Enhanced logging to diagnose response structure
        console.log('🔍 RAW API RESPONSE:', JSON.stringify(data, null, 2));
        console.log('🔍 Response keys:', Object.keys(data));
        console.log('🔍 Has message:', !!data.message);
        console.log('🔍 Message keys:', data.message ? Object.keys(data.message) : []);
        
        // Handle different response structures
        let quizData = null;
        
        // Check if it's the custom API response structure
        if (data.message?.success && data.message?.data) {
          quizData = data.message.data;
          console.log('✅ Matched structure: data.message.success && data.message.data');
        }
        // Check if it's a direct Frappe resource API response
        else if (data.data && data.data.name) {
          quizData = data.data;
          console.log('✅ Matched structure: data.data with name');
        }
        // Check if it's a nested message structure
        else if (data.message?.message?.success && data.message?.message?.data) {
          quizData = data.message.message.data;
          console.log('✅ Matched structure: nested message.message.data');
        }
        // Fallback to direct data
        else if (data.success && data.data) {
          quizData = data.data;
          console.log('✅ Matched structure: data.success && data.data');
        }
        // NEW: Check for direct message.data (admin API structure)
        else if (data.message && data.message.name && data.message.questions) {
          quizData = data.message;
          console.log('✅ Matched structure: direct message with name and questions');
        }
        // NEW: Check for wrapped message structure
        else if (data.message?.data?.name && data.message?.data?.questions) {
          quizData = data.message.data;
          console.log('✅ Matched structure: message.data with name and questions');
        }
        // NEW: Fallback to message itself if it has quiz properties
        else if (data.message && typeof data.message === 'object' && data.message.name) {
          quizData = data.message;
          console.log('✅ Matched structure: message as object with name');
        }
        
        if (quizData) {
          console.log('Quiz data received:', quizData);
          console.log('First question structure:', quizData.questions?.[0]);
          console.log('Has quiz_question field:', !!quizData.questions?.[0]?.quiz_question);
          console.log('Has question_text field:', !!quizData.questions?.[0]?.question_text);
          
          // Ensure name field exists from reference
          if (!quizData.name) {
            quizData.name = ref;
            console.log('✅ Added missing name field to quizData:', ref);
          }
          
          // If questions don't have full data (only quiz_question references), fetch them separately
          if (quizData.questions && quizData.questions.length > 0 && quizData.questions[0].quiz_question && !quizData.questions[0].question_text) {
            console.log('Quiz questions need to be fetched separately - only references found');
            await fetchQuizQuestions(quizData);
          } else {
            console.log('Quiz data is complete, setting directly');
            setQuiz(quizData);
          }
        } else {
          console.error('❌ Quiz data validation failed. API response:', data);
          console.error('❌ None of the expected response structures matched');
          // Set error immediately instead of checking loading state
          throw new Error('Invalid response structure or no quiz data found');
        }
      } catch (error) {
        console.error('Error fetching quiz:', error);
        setQuizError(error);
      } finally {
        setQuizLoading(false);
      }
    };

    fetchQuiz();
  }, [content?.name, contentReference, quizReference, contentData]);

  // Handle showing instructions
  const handleShowInstructions = useCallback(() => {
    setShowInstructions(true);
  }, []);

  // Handle starting quiz after instructions
  const handleStartQuiz = useCallback(() => {
    setShowInstructions(false);
    setShowQuiz(true);
  }, []);

  // Handle quiz completion
  const handleQuizComplete = useCallback(() => {
    setShowQuiz(false);
    onComplete?.();
  }, [onComplete]);


  if (userLoading || quizLoading || permissionsLoading) return (
    <div className="flex flex-col items-center justify-center p-8">
      <Lottie animationData={loadingAnimation} loop style={{ width: 120, height: 120 }} />
      <div className="mt-4 text-muted-foreground">Loading...</div>
    </div>
  );
  
  if (quizError || !quiz) {
    const isPermissionError = quizError?.message?.includes('403') || 
                             quizError?.message?.includes('FORBIDDEN') ||
                             quizError?.message?.includes('Permission');
    
    if (isPermissionError) {
      return (
        <div className="flex flex-col items-center justify-center p-8">
          <Lottie animationData={errorAnimation} loop style={{ width: 120, height: 120 }} />
          <div className="text-red-500 text-lg font-semibold mb-2">Access Denied</div>
          <div className="text-muted-foreground text-center mb-4">
            You don't have permission to access this quiz. Please contact your administrator.
          </div>
        </div>
      );
    }
    
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Lottie animationData={errorAnimation} loop style={{ width: 120, height: 120 }} />
        <div className="text-red-500 text-lg font-semibold mb-2">Error loading quiz</div>
        <div className="text-muted-foreground text-center mb-4">
          {quizError?.message || 'Quiz not found'}
        </div>
      </div>
    );
  }

  // For admins: directly display the quiz questions inline (no Start/Instructions UI)
  // Admins can view inactive quizzes for preview purposes
  if (isLMSAdmin) {
    return (
      <div className="w-full">
        <AdminQuizPreview quiz={quiz} onClose={() => {}} />
      </div>
    );
  }

  // Only check is_active for non-admin users (learners)
  // Default to true if is_active is not provided (for backward compatibility)
  if (quiz.is_active === false) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Lottie animationData={errorAnimation} loop style={{ width: 120, height: 120 }} />
        <div className="text-red-500 text-lg font-semibold mb-2">Quiz Inactive</div>
        <div className="text-muted-foreground text-center mb-4">
          This quiz is currently not active. Please contact your administrator.
        </div>
      </div>
    );
  }

  // For learners: show Start/Instructions flow
  return (
    <>
      <div className="flex flex-col items-center justify-center p-8">
        <Button variant="outline" onClick={handleShowInstructions}>
          Start Quiz
        </Button>
      </div>
      
      {/* Instruction Dialog */}
      <InstructionDialog
        open={showInstructions}
        onOpenChange={setShowInstructions}
        onStart={handleStartQuiz}
        type="quiz"
        title={quiz?.title || 'Quiz'}
        questionCount={quiz?.questions?.length || 0}
        timeLimit={quiz?.time_limit_mins || 0}
        description={quiz?.description || ''}
      />
      
      {/* Quiz Dialog */}
      {showQuiz && quiz && (
        <QuizDialog
          quiz={quiz}
          onClose={() => setShowQuiz(false)}
          onComplete={handleQuizComplete}
          moduleId={_moduleId}
          quizReference={contentReference || quizReference}
        />
      )}
    </>
  );
}