export interface Module {
  name: string;
  name1: string;
  description: string;
  is_published: number;
  image: string;
  lessons: Lesson[];
}

export interface Lesson {
  lesson: string;
  order: number;
  lessonDetails?: {
    lesson_name: string;
    description: string;
    chapters: Chapter[];
  };
}

export interface Chapter {
  chapter: string;
  order: number;
  chapterDetails?: {
    title: string;
    description: string;
    contents: ContentBlock[];
  };
}

export type ContentBlock =
  | TextContentBlock
  | ImageContentBlock
  | VideoContentBlock
  | QuizContentBlock;

export interface TextContentBlock {
  type: "text";
  content: string;
  order: number;
}

export interface ImageContentBlock {
  type: "image";
  url: string;
  caption?: string;
  order: number;
}

export interface VideoContentBlock {
  type: "video";
  url: string;
  caption?: string;
  order: number;
}

export interface QuizContentBlock {
  type: "quiz";
  questions: QuizQuestion[];
  order: number;
}

export type QuizQuestion =
  | SingleChoiceQuestion
  | TrueFalseQuestion
  | QAQuestion;

export interface SingleChoiceQuestion {
  kind: "single-choice";
  question: string;
  options: string[];
  answer: number; // index of correct option
  score: number;
}

export interface TrueFalseQuestion {
  kind: "true-false";
  question: string;
  answer: boolean;
  score: number;
}

export interface QAQuestion {
  kind: "qa";
  question: string;
  answer: string;
  score: number;
} 