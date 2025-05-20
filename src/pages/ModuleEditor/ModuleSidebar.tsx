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
  onSave: () => void;
  isSaving?: boolean;
  hasUnsavedChanges?: boolean;
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
      className={`flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'bg-primary text-primary-foreground font-medium shadow-sm' 
          : 'hover:bg-primary/10 text-muted-foreground hover:text-foreground'
      }`}
      onClick={onSelect}
    >
      <BookOpen className={`w-4 h-4 ${isSelected ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
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
          <div className="bg-primary/5 rounded-lg p-2 border border-primary/20">
            <button
              className="w-full text-left px-3 py-2 rounded-md font-medium text-primary hover:bg-primary/10 transition-colors"
              onClick={onSelect}
            >
              {lessonDetails[lesson.lesson]?.lesson_name || `Lesson ${idx + 1}`}
            </button>
            <ul className="pl-4 mt-2 space-y-1">
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
            className="w-full text-left px-3 py-2 rounded-md font-medium text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors"
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
  onReorderLessons,
  onSave,
  isSaving = false,
  hasUnsavedChanges = false
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
    <aside className="w-80 border-r p-6 pt-16 overflow-y-auto bg-card/50 backdrop-blur-sm flex flex-col h-full">
      <div className="space-y-6 flex-1">
        <div>
          <Label className="text-sm font-medium text-muted-foreground">Module Name</Label>
          <Input
            value={moduleName}
            onChange={(e) => onModuleFieldChange("name1", e.target.value)}
            className="mt-2"
          />
        </div>

        <div>
          <Label className="text-sm font-medium text-muted-foreground">Description</Label>
          <div className="mt-2">
            <Button variant="outline" className="w-full hover:bg-primary/5 hover:text-primary" onClick={onEditDescription}>
              Edit Description
            </Button>
          </div>
        </div>

        <div>
          <Label className="text-sm font-medium text-muted-foreground">Lessons</Label>
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
            <Button 
              variant="outline" 
              className="w-full hover:bg-primary/5 hover:text-primary" 
              onClick={() => setShowLessonModal(true)}
            >
              + Add Lesson
            </Button>
          </div>
        </div>
      </div>

      {/* Save Button Section */}
      <div className="pt-6 border-t mt-6">
        <Button 
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          onClick={onSave}
          disabled={isSaving || !hasUnsavedChanges}
        >
          {isSaving ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              Saving...
            </div>
          ) : (
            'Save Changes'
          )}
        </Button>
        {hasUnsavedChanges && !isSaving && (
          <p className="text-sm text-muted-foreground mt-2 text-center">
            You have unsaved changes
          </p>
        )}
      </div>
    </aside>
  );
};

export default ModuleSidebar; 