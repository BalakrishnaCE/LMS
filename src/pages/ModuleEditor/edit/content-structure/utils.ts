import { arrayMove } from "@dnd-kit/sortable";

// Helper to reorder content blocks in the correct chapter
export function reorderContentBlocks(
  lessonId: string,
  chapterId: string,
  oldIndex: number,
  newIndex: number,
  setModule: (updater: (prev: any) => any) => void,
  updateDoc: (doctype: string, docname: string, data: any) => Promise<any>
) {
  setModule((prev: any) => {
    const lessonIndex = prev.lessons.findIndex((l: any) => l.id === lessonId);
    if (lessonIndex === -1) return prev;
    const lesson = prev.lessons[lessonIndex];
    const chapterIndex = lesson.chapters.findIndex((c: any) => c.id === chapterId);
    if (chapterIndex === -1) return prev;
    const chapter = lesson.chapters[chapterIndex];
    const newContents = arrayMove(chapter.contents, oldIndex, newIndex);
    // Persist to backend
    if (chapter.id && typeof updateDoc === 'function') {
      const backendContents = newContents.map((c: any, idx: number) => ({
        content_type: c.type || c.content_type,
        content_reference: c.docname || c.content_reference,
        order: idx + 1
      }));
      updateDoc("Chapter", chapter.id, { contents: backendContents });
    }
    const updatedChapter = { ...chapter, contents: newContents };
    const updatedChapters = [
      ...lesson.chapters.slice(0, chapterIndex),
      updatedChapter,
      ...lesson.chapters.slice(chapterIndex + 1),
    ];
    const updatedLesson = { ...lesson, chapters: updatedChapters };
    const updatedLessons = [
      ...prev.lessons.slice(0, lessonIndex),
      updatedLesson,
      ...prev.lessons.slice(lessonIndex + 1),
    ];
    return { ...prev, lessons: updatedLessons };
  });
}
