import React from "react";
import MainSection from "./MainSection";

import type { Module, Lesson } from "./types";

export default function ContentStructureEditor({
  isMobile,
  module,
  addLesson,
  addContentToChapter,
  setModule,
  moduleName,
  loading,
  activeLessonId,
  activeChapterId
}: {
  isMobile: boolean;
  module: Module;
  addLesson: (lesson: { title: string; description: string; chapter: { title: string } }) => void;
  addContentToChapter: (contentType: string, lessonId: string, chapterId: string) => void;
  setModule: any;
  moduleName: string;
  loading?: boolean;
  activeLessonId?: string | null;
  activeChapterId?: string | null;
}) {
  if (!module || !Array.isArray(module.lessons)) {
    return null;
  }
  return (
    <div className="flex-1 min-h-0 flex w-full bg-background overflow-y-auto">
      {/* Sidebar and other UI can go here */}
      <MainSection
        hasLessons={module.lessons.length > 0}
        onAddLesson={addLesson}
        isMobile={isMobile}
        lessons={module.lessons}
        addContentToChapter={addContentToChapter}
        setModule={setModule}
        moduleName={moduleName}
        loading={loading}
        activeLessonId={activeLessonId}
        activeChapterId={activeChapterId}
      />
    </div>
  );
} 