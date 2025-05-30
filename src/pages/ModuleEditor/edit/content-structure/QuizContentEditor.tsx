import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus, HelpCircle } from 'lucide-react';
import RichEditor from '@/components/RichEditor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface QuizOption {
  option_text: string;
  correct: boolean;
  quiz_question: string;
}

interface QuizQuestion {
  question_text: string;
  question_type: string;
  score: number;
  options: QuizOption[];
  quiz_child: string;
}

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
  const [questions, setQuestions] = useState<QuizQuestion[]>(
    Array.isArray(safeContent.questions) ? safeContent.questions : []
  );

  useEffect(() => {
    setTitle(safeContent.title);
    setDescription(safeContent.description);
    setTotalScore(safeContent.total_score);
    setRandomizeQuestions(safeContent.randomize_questions);
    setTimeLimitMins(safeContent.time_limit_mins);
    setIsActive(safeContent.is_active);
    setQuestions(Array.isArray(safeContent.questions) ? safeContent.questions : []);
  }, [safeContent]);

  const addQuestion = () => {
    const newQuestion: QuizQuestion = {
      question_text: '',
      question_type: 'Multiple Choice',
      score: 1,
      options: [
        { option_text: '', correct: false, quiz_question: '' },
        { option_text: '', correct: false, quiz_question: '' }
      ],
      quiz_child: ''
    };
    setQuestions([...questions, newQuestion]);
  };

  const updateQuestion = (index: number, field: keyof QuizQuestion, value: any) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setQuestions(updatedQuestions);
  };

  const deleteQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const addOption = (questionIndex: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options.push({
      option_text: '',
      correct: false,
      quiz_question: ''
    });
    setQuestions(updatedQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, field: keyof QuizOption, value: any) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex] = {
      ...updatedQuestions[questionIndex].options[optionIndex],
      [field]: value
    };
    setQuestions(updatedQuestions);
  };

  const deleteOption = (questionIndex: number, optionIndex: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options = updatedQuestions[questionIndex].options.filter((_, i) => i !== optionIndex);
    setQuestions(updatedQuestions);
  };

  const handleSave = () => {
    const payload = {
      title,
      description,
      total_score: totalScore,
      randomize_questions: randomizeQuestions,
      time_limit_mins: timeLimitMins,
      is_active: isActive,
      questions: questions.map((question, idx) => ({
        ...question,
        quiz_child: question.quiz_child || `question_${idx + 1}`,
        options: question.options.map(option => ({
          ...option,
          quiz_question: question.quiz_child || `question_${idx + 1}`
        }))
      }))
    };
    onSave(payload);
  };

  return (
    <div className="space-y-6">
      {/* Quiz Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Quiz Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Quiz Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter quiz title"
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <RichEditor 
              content={description} 
              onChange={setDescription}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="totalScore">Total Score</Label>
              <Input
                id="totalScore"
                type="number"
                value={totalScore}
                onChange={(e) => setTotalScore(Number(e.target.value))}
                placeholder="Total score"
              />
            </div>
            
            <div>
              <Label htmlFor="timeLimit">Time Limit (minutes)</Label>
              <Input
                id="timeLimit"
                type="number"
                value={timeLimitMins}
                onChange={(e) => setTimeLimitMins(Number(e.target.value))}
                placeholder="Time limit in minutes (0 = no limit)"
              />
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="randomize"
                checked={randomizeQuestions}
                onCheckedChange={(checked) => setRandomizeQuestions(checked === true)}
              />
              <Label htmlFor="randomize">Randomize Questions</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="active"
                checked={isActive}
                onCheckedChange={(checked) => setIsActive(checked === true)}
              />
              <Label htmlFor="active">Active</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Questions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Questions ({questions.length})</h3>
          <Button onClick={addQuestion} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>

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
                <Label>Question Text</Label>
                <RichEditor
                  content={question.question_text}
                  onChange={(value) => updateQuestion(questionIndex, 'question_text', value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Question Type</Label>
                  <Select
                    value={question.question_type}
                    onValueChange={(value) => updateQuestion(questionIndex, 'question_type', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Multiple Choice">Multiple Choice</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Score</Label>
                  <Input
                    type="number"
                    value={question.score}
                    onChange={(e) => updateQuestion(questionIndex, 'score', Number(e.target.value))}
                    placeholder="Points for this question"
                  />
                </div>
              </div>

              {/* Options */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Options</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addOption(questionIndex)}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add Option
                  </Button>
                </div>
                
                {question.options.map((option, optionIndex) => (
                  <div key={optionIndex} className="flex items-center gap-2 p-2 border rounded">
                    <Checkbox
                      checked={option.correct}
                      onCheckedChange={(checked) => updateOption(questionIndex, optionIndex, 'correct', checked)}
                    />
                    <Input
                      value={option.option_text}
                      onChange={(e) => updateOption(questionIndex, optionIndex, 'option_text', e.target.value)}
                      placeholder={`Option ${optionIndex + 1}`}
                      className="flex-1"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteOption(questionIndex, optionIndex)}
                      disabled={question.options.length <= 2}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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
    </div>
  );
} 