export type ContentBlock = {
  id: string;
  type: string; // e.g. "text", "image", etc.
  data: any;    // type-specific data
};

export type Chapter = {
  id: string;
  title: string;
  scoring: number;
  contents: ContentBlock[];
};

export type Lesson = {
  id: string;
  title: string; // This is mapped from lesson_name in the UI
  description: string;
  chapters: Chapter[];
};

export type Module = {
  id: string;
  name: string;
  description: string;
  duration: string;
  lessons: Lesson[];
}; 