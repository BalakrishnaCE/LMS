import { useState } from "react";
import { Module, Lesson, Chapter } from "./types";
import { v4 as uuidv4 } from "uuid";

export function useModuleState(initialModule?: any) {
  const [module, setModule] = useState<Module>(initialModule || {
    id: uuidv4(),
    name: "",
    description: "",
    duration: "",
    lessons: [],
  });

  function addLesson(lesson: { title: string; description: string; chapter: { title: string } }) {
    const newLesson: Lesson = {
      id: uuidv4(),
      title: lesson.title,
      description: lesson.description,
      chapters: [
        {
          id: uuidv4(),
          title: lesson.chapter.title,
          contents: [],
          scoring: 0,
        },
      ],
    };
    setModule((prev) => ({
      ...prev,
      lessons: [newLesson, ...prev.lessons],
    }));
  }

  function addContentToChapter(contentType: string, lessonId: string, chapterId: string) {
    const typeMap: { [key: string]: string } = {
      text: "Text Content",
      image: "Image Content",
      video: "Video Content",
      file: "File Attach",
      pdf: "PDF",
      checklist: "Check List",
      steps: "Steps",
      accordion: "Accordion",
      slide: "Slide Content",
      quiz: "Quiz",
      question_answer: "Question Answer",
      // add more as needed
    };

    setModule((prev) => {
      const lessonIndex = prev.lessons.findIndex(l => l.id === lessonId);
      if (lessonIndex === -1) return prev;
      const lesson = prev.lessons[lessonIndex];
      const chapterIndex = lesson.chapters.findIndex(c => c.id === chapterId);
      if (chapterIndex === -1) return prev;
      const chapter = lesson.chapters[chapterIndex];

      let type, data;
      switch (contentType) {
        case "text": {
          type = typeMap[contentType];
          const firstWord = chapter.title?.split(" ")[0] || "Chapter";
          data = { title: `${firstWord}-text`, body: "" };
          break;
        }
        case "image":
        case "video":
        case "file":
        case "pdf":
        case "checklist":
        case "steps":
        case "accordion":
        case "slide":
        case "quiz":
        case "question_answer":
          type = typeMap[contentType];
          data = { title: "" };
          break;
        default:
          type = typeMap[contentType] || contentType;
          data = {};
      }

      const newContent = {
        id: uuidv4(),
        type,
        data,
        ...data,
        isNew: true,
      };

      const updatedChapter = {
        ...chapter,
        contents: [...chapter.contents, newContent],
      };
      const updatedChapters = [
        ...lesson.chapters.slice(0, chapterIndex),
        updatedChapter,
        ...lesson.chapters.slice(chapterIndex + 1),
      ];
      const updatedLesson = {
        ...lesson,
        chapters: updatedChapters,
      };
      const updatedLessons = [
        ...prev.lessons.slice(0, lessonIndex),
        updatedLesson,
        ...prev.lessons.slice(lessonIndex + 1),
      ];
      return {
        ...prev,
        lessons: updatedLessons,
      };
    });
  }

  // More handlers (addChapter, addContent, etc.) can be added here

  return {
    module,
    setModule,
    addLesson,
    addContentToChapter,
  };
} 