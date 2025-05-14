import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { BookOpen, GripVertical } from "lucide-react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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
  onReorderLessons?: (fromIdx: number, toIdx: number) => void;
}

// Chapter item component
function ChapterItem({
  chapter,
  idx,
  isSelected,
  onSelect,
  chapterDetails
}: {
  chapter: any;
  idx: number;
  isSelected: boolean;
  onSelect: () => void;
  chapterDetails: any;
}) {
  return (
    <li
      className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer transition ${
        isSelected ? 'bg-accent font-semibold text-primary-foreground' : 'hover:bg-muted hover:text-black text-primary-foreground'
      }`}
      onClick={onSelect}
    >
      <BookOpen className="w-4 h-4" />
      <span>{chapterDetails?.title || `Chapter ${idx + 1}`}</span>
    </li>
  );
}

// Sortable lesson item component
function SortableLessonItem({ 
  lesson, 
  idx, 
  isSelected, 
  lessonDetails, 
  onSelect, 
  onChapterClick, 
  selectedChapterIdx, 
  chapterDetailsSidebar
}: { 
  lesson: any; 
  idx: number; 
  isSelected: boolean; 
  lessonDetails: Record<string, any>; 
  onSelect: () => void; 
  onChapterClick: (chapterId: string, cidx: number) => void;
  selectedChapterIdx: number | null;
  chapterDetailsSidebar: Record<string, any>;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lesson.lesson });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div ref={setNodeRef} style={style} className="relative">
      <div {...listeners} className="absolute left-0 top-1/2 -translate-y-1/2 cursor-grab p-2">
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      <div className="pl-8">
        {isSelected ? (
          <div className="bg-primary rounded-lg p-1">
            <button
              className="w-full text-left px-3 py-2 rounded font-medium text-primary-foreground"
              onClick={onSelect}
            >
              {lessonDetails[lesson.lesson]?.lesson_name || `Lesson ${idx + 1}`}
            </button>
            <ul className="pl-4 mt-1 space-y-1">
              {(lessonDetails[lesson.lesson]?.chapters || []).map((chapter: any, cidx: number) => (
                chapter && chapter.chapter ? (
                  <ChapterItem
                    key={chapter.chapter}
                    chapter={chapter}
                    idx={cidx}
                    isSelected={selectedChapterIdx === cidx}
                    onSelect={() => onChapterClick(chapter.chapter, cidx)}
                    chapterDetails={chapterDetailsSidebar[chapter.chapter]}
                  />
                ) : null
              ))}
            </ul>
          </div>
        ) : (
          <button
            className="w-full text-left px-3 py-2 rounded font-medium transition hover:bg-muted"
            onClick={onSelect}
          >
            {lessonDetails[lesson.lesson]?.lesson_name || `Lesson ${idx + 1}`}
          </button>
        )}
      </div>
    </div>
  );
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
  onReorderLessons
}) => {
  // DnD-kit setup
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id && onReorderLessons) {
      const oldIndex = lessons.findIndex(l => l.lesson === active.id);
      const newIndex = lessons.findIndex(l => l.lesson === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorderLessons(oldIndex, newIndex);
      }
    }
  };

  return (
    <aside className="w-80 border-r p-6 pt-16 overflow-y-auto">
      <div className="space-y-6">
        <div>
          <Label>Module Name</Label>
          <Input
            value={moduleName}
            onChange={(e) => onModuleFieldChange("name1", e.target.value)}
            className="mt-2"
          />
        </div>

        <div>
          <Label>Description</Label>
          <div className="mt-2">
            <Button variant="outline" className="w-full" onClick={onEditDescription}>
              Edit Description
            </Button>
          </div>
        </div>

        <div>
          <Label>Lessons</Label>
          <div className="space-y-2 mt-2">
            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={lessons.map(l => l.lesson)}
                strategy={verticalListSortingStrategy}
              >
                {lessons.map((lesson, idx) => (
                  lesson && lesson.lesson ? (
                    <SortableLessonItem
                      key={lesson.lesson}
                      lesson={lesson}
                      idx={idx}
                      isSelected={idx === selectedLessonIdx}
                      lessonDetails={lessonDetails}
                      onSelect={() => { setSelectedLessonIdx(idx); setSelectedChapterIdx(null); }}
                      onChapterClick={handleChapterClick}
                      selectedChapterIdx={selectedChapterIdx}
                      chapterDetailsSidebar={chapterDetailsSidebar}
                    />
                  ) : null
                ))}
              </SortableContext>
            </DndContext>
            <Button variant="outline" className="w-full" onClick={() => setShowLessonModal(true)}>+ Add Lesson</Button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default ModuleSidebar; 