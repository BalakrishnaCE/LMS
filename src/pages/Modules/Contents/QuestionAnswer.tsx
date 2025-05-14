import React, { useState, useEffect } from "react";
import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '@/components/ui/button';
import RichEditor from '@/components/RichEditor';

interface QuestionAnswerProps {
  questionAnswerId: string;
}

const QuestionAnswer: React.FC<QuestionAnswerProps> = ({ questionAnswerId }) => {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<Record<string, boolean>>({});
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [timerActive, setTimerActive] = useState(false);

  // Timer effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timerActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setTimerActive(false);
            // Auto-submit all unanswered questions when time runs out
            const unansweredQuestions = data?.questions?.filter((q: any) => !submitted[q.id]) || [];
            unansweredQuestions.forEach((q: any) => {
              setSubmitted(s => ({ ...s, [q.id]: true }));
            });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [timerActive, timeLeft, data, submitted]);

  // Start timer when modal opens
  useEffect(() => {
    if (open && data?.time_limit_mins) {
      setTimeLeft(data.time_limit_mins * 60);
      setTimerActive(true);
    }
  }, [open, data]);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    fetch(`http://10.80.4.72/api/resource/Question Answer/${questionAnswerId}`, {
      credentials: 'include',
    })
      .then(res => res.json())
      .then(res => {
        setData(res.data);
        console.log(res.data);
        setLoading(false);
      })
      .catch(e => {
        setError("Failed to load Q&A");
        setLoading(false);
      });
  }, [open, questionAnswerId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmitAll = () => {
    // Submit all questions that have answers
    const questionsToSubmit = data?.questions?.filter((q: any) => 
      answers[q.id] && answers[q.id].trim() && !submitted[q.id]
    ) || [];
    
    questionsToSubmit.forEach((q: any) => {
      setSubmitted(s => ({ ...s, [q.id]: true }));
    });
  };

  const hasUnsubmittedAnswers = data?.questions?.some((q: any) => 
    answers[q.id] && answers[q.id].trim() && !submitted[q.id]
  );

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <Button variant="outline">View Q&amp;A</Button>
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
              {data?.time_limit_mins && (
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
              {data && (
                <>
                  <div className="mb-2 text-sm text-muted-foreground">Max Score: {data.max_score}</div>
                  <div className="mb-4 prose prose-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: data.description }} />
                  <div className="space-y-6">
                    {data.questions?.map((q: any, idx: number) => (
                      <div key={q.id} className="border rounded-lg p-4 bg-muted/50">
                        <div className="font-semibold mb-2">Q{idx + 1}: {q.question}</div>
                        <div className="mb-2 text-xs text-muted-foreground">Score: {q.score}</div>
                        <div className="prose prose-sm bg-background p-2 rounded mb-2" dangerouslySetInnerHTML={{ __html: q.suggested_answer }} />
                        <div className="mb-2">
                          <RichEditor
                            content={answers[q.id] || ""}
                            onChange={val => setAnswers(a => ({ ...a, [q.id]: val }))}
                            disabled={submitted[q.id] || !timerActive}
                          />
                        </div>
                        {submitted[q.id] && <span className="text-green-600">Answer submitted!</span>}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            {/* Footer */}
            <div className="p-4 border-t flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {data?.questions?.filter((q: any) => submitted[q.id]).length || 0} of {data?.questions?.length || 0} questions submitted
              </div>
              <div className="space-x-2">
                <Button 
                  onClick={handleSubmitAll}
                  disabled={!hasUnsubmittedAnswers || !timerActive}
                  variant="default"
                >
                  Submit All Answers
                </Button>
                <Button onClick={() => setOpen(false)}>Close</Button>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default QuestionAnswer; 