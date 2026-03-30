import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, HelpCircle } from 'lucide-react';
import RichEditor from '@/components/RichEditor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import QuizQuestionItem, { QuizQuestion, QuizOption } from './QuizQuestionItem';
import { v4 as uuidv4 } from 'uuid';

interface QuizContentEditorProps {
  content: {
    title: string;
    description: string;
    total_score: number;
    randomize_questions: boolean;
    time_limit_mins: number;
    questions: QuizQuestion[];
    is_active: boolean;
  };
  onSave: (data: any) => void;
  onCancel?: () => void;
}

export default function QuizContentEditor({ content, onSave, onCancel }: QuizContentEditorProps) {
  const safeContent = content || {
    title: '',
    description: '',
    total_score: 0,
    randomize_questions: false,
    time_limit_mins: 0,
    questions: [],
    is_active: true
  };

  const [title, setTitle] = useState(safeContent.title);
  const [description, setDescription] = useState(safeContent.description);
  const [totalScore, setTotalScore] = useState(safeContent.total_score);
  const [randomizeQuestions, setRandomizeQuestions] = useState(safeContent.randomize_questions);
  const [timeLimitMins, setTimeLimitMins] = useState(safeContent.time_limit_mins);
  const [isActive, setIsActive] = useState(safeContent.is_active);
  // Default to opening settings if no questions
  const [activeItemId, setActiveItemId] = useState<string | undefined>('settings');

  // Initialize questions with local IDs if missing
  const initializeQuestions = (qs: QuizQuestion[]) => {
    return (Array.isArray(qs) ? qs : []).map(q => ({
      ...q,
      _localId: q._localId || uuidv4(),
      options: (q.options || []).map(opt => ({
        ...opt,
        correct: !!(opt.correct || (opt as any).is_correct)
      }))
    }));
  };

  const [questions, setQuestions] = useState<QuizQuestion[]>(
    initializeQuestions(safeContent.questions)
  );

  useEffect(() => {
    setTitle(safeContent.title);
    setDescription(safeContent.description);
    setTotalScore(safeContent.total_score);
    setRandomizeQuestions(safeContent.randomize_questions);
    setTimeLimitMins(safeContent.time_limit_mins);
    setIsActive(safeContent.is_active);
    setQuestions(initializeQuestions(safeContent.questions));
  }, [safeContent]);

  const addQuestion = () => {
    const id = uuidv4();
    const newQuestion: QuizQuestion = {
      question_text: '',
      question_type: 'Multiple Choice',
      score: 1,
      options: [
        { option_text: '', correct: false, quiz_question: '' },
        { option_text: '', correct: false, quiz_question: '' }
      ],
      quiz_child: '',
      _localId: id
    };
    setQuestions(prev => [...prev, newQuestion]);
    // Automatically Expand the new question
    setActiveItemId(id);
  };

  const updateQuestion = useCallback((id: string, field: keyof QuizQuestion, value: any) => {
    setQuestions(prev => prev.map(q =>
      q._localId === id ? { ...q, [field]: value } : q
    ));
  }, []);

  const deleteQuestion = useCallback((id: string) => {
    setQuestions(prev => prev.filter(q => q._localId !== id));
    if (activeItemId === id) {
      setActiveItemId(undefined);
    }
  }, [activeItemId]);

  const addOption = useCallback((questionId: string) => {
    setQuestions(prev => prev.map(q => {
      if (q._localId !== questionId) return q;
      return {
        ...q,
        options: [...q.options, {
          option_text: '',
          correct: false,
          quiz_question: ''
        }]
      };
    }));
  }, []);

  const updateOption = useCallback((questionId: string, optionIndex: number, field: keyof QuizOption, value: any) => {
    setQuestions(prev => prev.map(q => {
      if (q._localId !== questionId) return q;
      const newOptions = [...q.options];
      newOptions[optionIndex] = { ...newOptions[optionIndex], [field]: value };
      return { ...q, options: newOptions };
    }));
  }, []);

  const deleteOption = useCallback((questionId: string, optionIndex: number) => {
    setQuestions(prev => prev.map(q => {
      if (q._localId !== questionId) return q;
      return {
        ...q,
        options: q.options.filter((_, i) => i !== optionIndex)
      };
    }));
  }, []);

  const handleSave = () => {
    const payload = {
      title,
      description,
      total_score: totalScore,
      randomize_questions: randomizeQuestions ?? false,
      time_limit_mins: timeLimitMins,
      is_active: isActive ?? true,
      questions: questions.map((question) => {
        // Create a clean copy without _localId
        const { _localId, ...cleanQuestion } = question; // eslint-disable-line @typescript-eslint/no-unused-vars
        return {
          question_text: cleanQuestion.question_text,
          question_type: cleanQuestion.question_type,
          score: cleanQuestion.score,
          options: cleanQuestion.options.map(option => ({
            option_text: option.option_text,
            correct: option.correct
          }))
        };
      })
    };
    // Debug log
    console.log('[QuizContentEditor] handleSave cleaned payload:', payload);
    if (typeof onSave === 'function') {
      console.log('[QuizContentEditor] Calling onSave with cleaned payload');
    }
    onSave(payload);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Quiz Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          <Accordion
            type="single"
            collapsible
            value={activeItemId}
            onValueChange={setActiveItemId}
            className="w-full space-y-2"
          >
            {/* General Settings Accordion Item */}
            <AccordionItem value="settings" className="border rounded-md px-4 bg-card mb-4">
              <AccordionTrigger className="hover:no-underline py-3">
                <span className="font-semibold text-lg">General Settings</span>
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pt-2 pb-4">
                <div>
                  <Label htmlFor="title" className='mb-3 block'>Quiz Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter quiz title"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className='mb-3 block'>Description</Label>
                  {/* Conditional Rendering: Only render heavy editor if settings is open */}
                  {activeItemId === 'settings' ? (
                    <RichEditor
                      content={description}
                      onChange={setDescription}
                    />
                  ) : (
                    <div className="h-24 bg-muted/20 rounded-md animate-pulse flex items-center justify-center text-muted-foreground text-sm">
                      Editor hidden
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="totalScore" className='mb-3 block'>Total Score</Label>
                    <Input
                      id="totalScore"
                      type="number"
                      value={totalScore}
                      onChange={(e) => setTotalScore(Number(e.target.value))}
                      placeholder="Total score"
                      min={1}
                    />
                  </div>
                  <div>
                    <Label htmlFor="timeLimit" className='mb-3 block'>Time Limit (minutes)</Label>
                    <Input
                      id="timeLimit"
                      type="number"
                      value={timeLimitMins}
                      onChange={(e) => setTimeLimitMins(Number(e.target.value))}
                      placeholder="Time limit in minutes (0 = no limit)"
                      min={0}
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="randomize"
                      checked={randomizeQuestions}
                      onCheckedChange={(checked) => setRandomizeQuestions(checked === true)}
                      className='border-border border-2 border-gray-300'
                    />
                    <Label htmlFor="randomize">Randomize Questions</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="active"
                      checked={isActive}
                      onCheckedChange={(checked) => setIsActive(checked === true)}
                      className='border-border border-2 border-gray-300'
                    />
                    <Label htmlFor="active">Active</Label>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            {/* Questions Header */}
            <div className="flex items-center justify-between py-2 mt-4">
              <h3 className="text-lg font-semibold">Questions ({questions.length})</h3>
            </div>

            {/* Questions List */}
            {questions.map((question, index) => (
              <QuizQuestionItem
                key={question._localId}
                index={index}
                question={question}
                isActive={question._localId === activeItemId}
                onUpdate={updateQuestion}
                onDelete={deleteQuestion}
                onAddOption={addOption}
                onUpdateOption={updateOption}
                onDeleteOption={deleteOption}
              />
            ))}
          </Accordion>

          <Button onClick={addQuestion} size="sm" className="mt-2">
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} disabled={!title || questions.length === 0}>
              Save Quiz
            </Button>
            {onCancel && (
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
