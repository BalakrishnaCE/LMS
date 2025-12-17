import MainSection from "./MainSection";

import type { Module } from "./types";

export default function ContentStructureEditor({
  module,
  addContentToChapter,
  setModule,
  moduleId,
  loading,
  activeLessonId,
  activeChapterId,
  onLessonAdded
}: {
  module: Module;
  addContentToChapter: (contentType: string, lessonId: string, chapterId: string) => void;
  setModule: any;
  moduleId?: string;
  loading?: boolean;
  activeLessonId?: string | null;
  activeChapterId?: string | null;
  onLessonAdded?: () => void;
}) {
  if (!module || !Array.isArray(module.lessons)) {
    return null;
  }
  return (
    <div className="flex-1 min-h-0 flex w-full bg-background overflow-y-auto">
      {/* Sidebar and other UI can go here */}
      <MainSection
        hasLessons={module.lessons.length > 0}
        lessons={module.lessons}
        addContentToChapter={addContentToChapter}
        setModule={setModule}
        moduleId={moduleId}
        loading={loading}
        activeLessonId={activeLessonId}
        activeChapterId={activeChapterId}
        onLessonAdded={onLessonAdded}
      />
    </div>
  );
} 