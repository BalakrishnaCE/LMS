import React, { memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Plus } from 'lucide-react';
import RichEditor from '@/components/RichEditor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

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
    _localId?: string; // Internal ID for React keys
}

interface QuizQuestionItemProps {
    question: QuizQuestion;
    index: number;
    isActive: boolean; // Control rendering of heavy components
    onUpdate: (id: string, field: keyof QuizQuestion, value: any) => void;
    onDelete: (id: string) => void;
    onAddOption: (id: string) => void;
    onUpdateOption: (questionId: string, optionIndex: number, field: keyof QuizOption, value: any) => void;
    onDeleteOption: (questionId: string, optionIndex: number) => void;
}

const QuizQuestionItem = memo(({
    question,
    index,
    isActive,
    onUpdate,
    onDelete,
    onAddOption,
    onUpdateOption,
    onDeleteOption
}: QuizQuestionItemProps) => {
    const localId = question._localId!;


    // Stable handlers for this specific question
    const handleQuestionTextChange = useCallback((value: string) => {
        onUpdate(localId, 'question_text', value);
    }, [localId, onUpdate]);

    const handleTypeChange = useCallback((value: string) => {
        onUpdate(localId, 'question_type', value);
    }, [localId, onUpdate]);

    const handleScoreChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdate(localId, 'score', Number(e.target.value));
    }, [localId, onUpdate]);

    const handleDelete = useCallback((e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent accordion toggle
        onDelete(localId);
    }, [localId, onDelete]);

    const handleAddOption = useCallback(() => {
        onAddOption(localId);
    }, [localId, onAddOption]);

    return (
        <AccordionItem value={localId} className="border rounded-md px-4 bg-card">
            <AccordionTrigger className="hover:no-underline py-3">
                <div className="flex items-center justify-between w-full pr-4">
                    <span className="font-semibold text-base">Question {index + 1}</span>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDelete}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive transition-colors"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-4 pt-2 pb-4">
                {/* Only render RichEditor if active to save performance */}
                {isActive ? (
                    <div>
                        <Label className='mb-3 block text-sm font-medium'>Question Text</Label>
                        <RichEditor
                            content={question.question_text}
                            onChange={handleQuestionTextChange}
                            minimal={true}
                        />
                    </div>
                ) : (
                    <div className="h-24 bg-muted/20 rounded-md animate-pulse flex items-center justify-center text-muted-foreground text-sm">
                        Loading editor...
                    </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className='mb-3 block text-sm font-medium'>Question Type</Label>
                        <Select
                            value={question.question_type}
                            onValueChange={handleTypeChange}
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
                        <Label className='mb-3 block text-sm font-medium'>Score</Label>
                        <Input
                            type="number"
                            value={question.score}
                            onChange={handleScoreChange}
                            placeholder="Points for this question"
                            min={1}
                        />
                    </div>
                </div>

                {/* Options */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium">Options</Label>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAddOption}
                            className="h-8"
                        >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Option
                        </Button>
                    </div>

                    {(question.options || []).map((option, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
                            <Checkbox
                                checked={option.correct}
                                onCheckedChange={(checked) => onUpdateOption(localId, oIdx, 'correct', checked === true)}
                                className="border-border border-2"
                            />
                            <Input
                                value={option.option_text}
                                onChange={(e) => onUpdateOption(localId, oIdx, 'option_text', e.target.value)}
                                placeholder={`Option ${oIdx + 1}`}
                                className="flex-1 h-9"
                            />
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDeleteOption(localId, oIdx)}
                                className="h-8 w-8 p-0"
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        </div>
                    ))}
                </div>
            </AccordionContent>
        </AccordionItem>
    );
});

QuizQuestionItem.displayName = 'QuizQuestionItem';

export default QuizQuestionItem;
export type { QuizQuestion, QuizOption };
