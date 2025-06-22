import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, Plus, MessageSquare } from 'lucide-react';
import RichEditor from '@/components/RichEditor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';

interface Question {
  question: string;
  score: number;
  suggested_answer: string;
}

interface QuestionAnswerContentEditorProps {
  content: { 
    title: string; 
    description: string;
    max_score: number;
    time_limit_mins: number;
    questions: Question[];
  };
  onSave: (data: any) => void;
  onCancel?: () => void;
}

export default function QuestionAnswerContentEditor({ content, onSave, onCancel }: QuestionAnswerContentEditorProps) {
  const safeContent = content || { 
    title: '', 
    description: '', 
    max_score: 0, 
    time_limit_mins: 0, 
    questions: []
  };

  const [title, setTitle] = useState(safeContent.title);
  const [description, setDescription] = useState(safeContent.description);
  const [maxScore, setMaxScore] = useState(safeContent.max_score);
  const [timeLimitMins, setTimeLimitMins] = useState(safeContent.time_limit_mins);
  const [questions, setQuestions] = useState<Question[]>(
    Array.isArray(safeContent.questions) ? safeContent.questions : []
  );

  useEffect(() => {
    setTitle(safeContent.title);
    setDescription(safeContent.description);
    setMaxScore(safeContent.max_score);
    setTimeLimitMins(safeContent.time_limit_mins);
    setQuestions(Array.isArray(safeContent.questions) ? safeContent.questions : []);
  }, [safeContent]);

  const addQuestion = () => {
    const newQuestion: Question = {
      question: '',
      score: 1,
      suggested_answer: ''
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, field: keyof Question, value: any) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setQuestions(updatedQuestions);
  };

  const deleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const payload = {
      title,
      description,
      max_score: maxScore,
      time_limit_mins: timeLimitMins,
      questions: questions
    };
    onSave(payload);
  };

  return (
    <div className="space-y-6">
      {/* Q&A Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Question & Answer Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title" className='mb-3'>Q&A Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter Q&A session title"
            />
          </div>
          
          <div>
            <Label htmlFor="description" className='mb-3'>Description</Label>
            <RichEditor 
              content={description} 
              onChange={setDescription}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="maxScore" className='mb-3'>Maximum Score</Label>
              <Input
                id="maxScore"
                type="number"
                value={maxScore}
                onChange={(e) => setMaxScore(Number(e.target.value))}
                placeholder="Maximum possible score"
                min={0}
              />
            </div>
            
            <div>
              <Label htmlFor="timeLimit" className='mb-3'>Time Limit (minutes)</Label>
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


      {/* Questions */}
      <div className="space-y-4">
        

        {questions.map((question, questionIndex) => (
          <Card key={questionIndex}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Question {questionIndex + 1}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteQuestion(questionIndex)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className='mb-3'>Question</Label>
                <Textarea
                  value={question.question}
                  onChange={(e) => updateQuestion(questionIndex, 'question', e.target.value)}
                  placeholder="Enter question"
                  className="w-full"
                />
              </div>

              <div>
                <Label className='mb-3'>Score</Label>
                <Input
                  type="number"
                  value={question.score}
                  onChange={(e) => updateQuestion(questionIndex, 'score', Number(e.target.value))}
                  placeholder="Points for this question"
                  className="w-32"
                  min={0}
                />
                <p className="text-muted-foreground text-sm">
                  Points for this question
                </p>
              </div>

              <div>
                <Label className='mb-3'>Suggested Answer</Label>
                <Textarea
                  value={question.suggested_answer}
                  onChange={(e) => updateQuestion(questionIndex, 'suggested_answer', e.target.value)}
                  placeholder="Enter suggested answer (optional)"
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>
        ))}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Questions ({questions.length})</h3>
          <Button onClick={addQuestion} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4">
        <Button onClick={handleSave} disabled={!title || questions.length === 0}>
          Save Q&A
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