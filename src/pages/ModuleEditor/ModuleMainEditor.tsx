import { Card } from "@/components/ui/card";
import ChapterEditor from "./ChapterEditor";

interface ModuleMainEditorProps {
    activeChapterId: string | null;
    chapterDetailsSidebar: Record<string, any>;
    activeLessonName: string | null;
    lessonDetails: Record<string, any>;
    onChapterSelect: (chapterId: string) => void;
}

export default function ModuleMainEditor({
    activeChapterId,
    chapterDetailsSidebar,
    activeLessonName,
    lessonDetails,
    onChapterSelect,
}: ModuleMainEditorProps) {
    const activeChapter = activeChapterId ? chapterDetailsSidebar[activeChapterId] : null;
    const activeLesson = activeLessonName ? lessonDetails[activeLessonName] : null;

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
                <h2 className="text-2xl font-semibold mb-2">{activeLesson.lesson_name || "Lesson"}</h2>
                <div className="text-muted-foreground">
                    {activeLesson.description}
                </div>
            </Card>
            <ChapterEditor chapter={activeChapter} />
        </div>
    );
} 