import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";

interface ModuleSidebarProps {
  moduleName: string;
  moduleDescription: string;
  moduleImage: string;
  modulePublished: boolean;
  onModuleFieldChange: (field: string, value: any) => void;
  onEditDescription: () => void;
  lessons: any[];
  lessonDetails: Record<string, any>;
  selectedLessonIdx: number;
  setSelectedLessonIdx: (idx: number) => void;
  selectedChapterIdx: number | null;
  setSelectedChapterIdx: (idx: number | null) => void;
  chapterDetailsSidebar: Record<string, any>;
  handleChapterClick: (chapterId: string, cidx: number) => void;
  setShowLessonModal: (show: boolean) => void;
}

const ModuleSidebar: React.FC<ModuleSidebarProps> = ({
  moduleName,
  moduleDescription,
  moduleImage,
  modulePublished,
  onModuleFieldChange,
  onEditDescription,
  lessons,
  lessonDetails,
  selectedLessonIdx,
  setSelectedLessonIdx,
  selectedChapterIdx,
  setSelectedChapterIdx,
  chapterDetailsSidebar,
  handleChapterClick,
  setShowLessonModal,
}) => (
  <aside className="w-[400px] border-r bg-card/50 p-8 pt-16">
    <div className="mb-6">
      <Label>Module Name</Label>
      <Input
        value={moduleName}
        onChange={e => onModuleFieldChange("name1", e.target.value)}
        className="font-bold text-lg"
      />
    </div>
    <div className="mb-6">
      <Label>Description</Label>
      <Button variant="outline" className="w-full" onClick={onEditDescription}>
        Edit Description
      </Button>
      <div className="prose prose-sm mt-2 text-muted-foreground line-clamp-3" dangerouslySetInnerHTML={{ __html: moduleDescription || "" }} />
    </div>
    <div className="mb-6">
      <Label>Image URL</Label>
      <Input
        value={moduleImage}
        onChange={e => onModuleFieldChange("image", e.target.value)}
      />
    </div>
    <div className="mb-6 flex items-center gap-2">
      <Label>Published</Label>
      <Input
        type="checkbox"
        checked={modulePublished}
        onChange={e => onModuleFieldChange("is_published", e.target.checked ? 1 : 0)}
        className="w-4 h-4"
      />
    </div>
    <div>
      <Label>Lessons</Label>
      <div className="space-y-2 mt-2">
        {lessons.map((lesson, idx) => (
          lesson && lesson.lesson ? (
            idx === selectedLessonIdx ? (
              <div key={lesson.lesson} className="bg-primary rounded-lg p-1">
                <button
                  className="w-full text-left px-3 py-2 rounded font-medium text-primary-foreground"
                  onClick={() => { setSelectedLessonIdx(idx); setSelectedChapterIdx(null); }}
                >
                  {lessonDetails[lesson.lesson]?.lesson_name || `Lesson ${idx + 1}`}
                </button>
                <ul className="pl-4 mt-1 space-y-1">
                  {lessonDetails[lesson.lesson]?.chapters?.map((chapter: any, cidx: number) => (
                    chapter && chapter.chapter ? (
                      <li
                        key={chapter.chapter}
                        className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition ${
                          selectedChapterIdx === cidx ? 'bg-accent font-semibold' : 'hover:bg-muted'
                        }`}
                        onClick={() => handleChapterClick(chapter.chapter, cidx)}
                      >
                        <BookOpen className="w-4 h-4" />
                        {chapterDetailsSidebar[chapter.chapter]?.title || `Chapter ${cidx + 1}`}
                      </li>
                    ) : null
                  ))}
                </ul>
              </div>
            ) : (
              <button
                key={lesson.lesson}
                className="w-full text-left px-3 py-2 rounded font-medium transition hover:bg-muted"
                onClick={() => { setSelectedLessonIdx(idx); setSelectedChapterIdx(null); }}
              >
                {lessonDetails[lesson.lesson]?.lesson_name || `Lesson ${idx + 1}`}
              </button>
            )
          ) : null
        ))}
        <Button variant="outline" className="w-full" onClick={() => setShowLessonModal(true)}>+ Add Lesson</Button>
      </div>
    </div>
  </aside>
);

export default ModuleSidebar; 