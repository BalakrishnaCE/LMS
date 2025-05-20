import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RichEditor from "@/components/RichEditor";
import ChapterEditor from "./ChapterEditor";
import { useFrappeUpdateDoc } from "frappe-react-sdk";

interface ModuleMainEditorProps {
    activeChapterId: string | null;
    chapterDetailsSidebar: Record<string, any>;
    activeLessonName: string | null;
    lessonDetails: Record<string, any>;
    onChapterSelect: (chapterId: string) => void;
    onLessonUpdate?: () => void;
    onChapterUpdate?: () => void;
}

export default function ModuleMainEditor({
    activeChapterId,
    chapterDetailsSidebar,
    activeLessonName,
    lessonDetails,
    onChapterSelect,
    onLessonUpdate,
    onChapterUpdate
}: ModuleMainEditorProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [lessonName, setLessonName] = useState("");
    const [lessonDescription, setLessonDescription] = useState("");
    const { updateDoc, loading: updating } = useFrappeUpdateDoc();

    const activeChapter = activeChapterId ? chapterDetailsSidebar[activeChapterId] : null;
    const activeLesson = activeLessonName ? lessonDetails[activeLessonName] : null;

    // Initialize form when lesson changes
    useEffect(() => {
        if (activeLesson) {
            setLessonName(activeLesson.lesson_name || "");
            setLessonDescription(activeLesson.description || "");
        }
    }, [activeLesson]);

    const handleSave = async () => {
        if (!activeLessonName) return;
        
        try {
            await updateDoc("Lesson", activeLessonName, {
                lesson_name: lessonName,
                description: lessonDescription
            });
            setIsEditing(false);
            onLessonUpdate?.();
        } catch (error) {
            console.error("Error updating lesson:", error);
        }
    };

    if (!activeLessonName || !activeLesson) {
        return (
            <Card className="p-6">
                <div className="text-center text-muted-foreground">
                    Loading lesson…
                </div>
            </Card>
        );
    }

    if (!activeLesson.lesson_name) {
        return (
            <Card className="p-6">
                <div className="text-center text-muted-foreground">
                    Loading lesson…
                </div>
            </Card>
        );
    }

    if (!activeChapterId || !activeChapter) {
        return (
            <Card className="p-6">
                <div className="text-center text-muted-foreground">
                    No chapters available in this lesson
                </div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            <Card className="p-6">
                {isEditing ? (
                    <div className="space-y-4">
                        <div>
                            <Label className="text-sm font-medium text-muted-foreground">Lesson Name</Label>
                            <Input
                                value={lessonName}
                                onChange={(e) => setLessonName(e.target.value)}
                                className="mt-2"
                            />
                        </div>
                        <div>
                            <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                            <div className="mt-2">
                                <RichEditor
                                    content={lessonDescription}
                                    onChange={setLessonDescription}
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2">
                            <Button 
                                variant="outline" 
                                onClick={() => {
                                    setIsEditing(false);
                                    setLessonName(activeLesson.lesson_name || "");
                                    setLessonDescription(activeLesson.description || "");
                                }}
                            >
                                Cancel
                            </Button>
                            <Button 
                                onClick={handleSave}
                                disabled={updating}
                            >
                                {updating ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div>
                        <div className="flex justify-between items-start mb-4">
                            <h2 className="text-2xl font-semibold">{activeLesson.lesson_name}</h2>
                            <Button 
                                variant="outline" 
                                onClick={() => setIsEditing(true)}
                            >
                                Edit Lesson
                            </Button>
                        </div>
                        <div 
                            className="prose prose-sm text-muted-foreground"
                            dangerouslySetInnerHTML={{ __html: activeLesson.description || "" }}
                        />
                    </div>
                )}
            </Card>

            {activeChapterId && activeChapter && (
                <ChapterEditor 
                    chapter={activeChapter} 
                    onChapterUpdate={onChapterUpdate}
                />
            )}
        </div>
    );
} 