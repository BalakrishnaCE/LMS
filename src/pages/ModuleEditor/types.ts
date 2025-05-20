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
  name: string;
  description: string;
  chapters: Chapter[];
}

export interface Chapter {
  chapter: string;
  order: number;
  name: string;
  description: string;
  contents: ContentBlock[];
}

export type ContentBlock =
  | { type: 'Text Content'; title: string; body: string; order: number }
  | { type: 'Image Content'; title: string; description?: string; attach: string; order: number }
  | { type: 'Video Content'; title: string; description?: string; video: string; order: number }
  | { type: 'File Attach'; title: string; attachment: string; order: number }
  | { type: 'PDF'; title: string; description?: string; pdf: string; order: number }
  | { type: 'Steps'; title: string; steps_table: { item_name: string; item_content: string }[]; order: number }
  | { type: 'Check List'; title: string; check_list_items: { item: string; content: string }[]; order: number };

export interface ModuleSidebarProps {
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

export interface ModuleMainEditorProps {
  activeChapterId: string | null;
  chapterDetailsSidebar: Record<string, any>;
  activeLessonName: string | null;
  lessonDetails: Record<string, any>;
  onChapterSelect: (chapterId: string) => void;
  onLessonUpdate?: () => void;
  onChapterUpdate?: () => void;
}

export interface ChapterEditorProps {
  chapter: Chapter;
  onChapterUpdate?: () => void;
}

export interface ModuleModalsProps {
  showDescModal: boolean;
  setShowDescModal: (open: boolean) => void;
  descContent: string;
  setDescContent: (val: string) => void;
  showLessonModal: boolean;
  setShowLessonModal: (open: boolean) => void;
  showChapterModal: boolean;
  setShowChapterModal: (open: boolean) => void;
  showContentModal: boolean;
  setShowContentModal: (open: boolean) => void;
  showBackConfirm: boolean;
  setShowBackConfirm: (open: boolean) => void;
  confirmBack: () => void;
  deleteTarget: { type: string; idx: number } | null;
  handleDelete: () => void;
  setDeleteTarget: (target: { type: string; idx: number } | null) => void;
} 