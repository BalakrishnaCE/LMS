import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {  FileText, Image as ImageIcon, Video, File, GripVertical, Pencil, ExternalLink, Trash2 } from "lucide-react";
import RichEditor from "@/components/RichEditor";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { useDraggable, useDroppable } from "@dnd-kit/core";
// import { motion } from "framer-motion";
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  // DialogTrigger,
} from "@/components/ui/dialog";
import { contentsList as rawContentsList } from '@/pages/ModuleEditor/contents';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
// import ChecklistContent from './ChecklistContent';
// import StepsContent from './StepsContent';
import AccordionContent, { AccordionPreview } from '@/pages/ModuleEditor/edit/content-structure/AccordionContent';
import { useFrappeCreateDoc, useFrappeUpdateDoc, useFrappeDeleteDoc } from "frappe-react-sdk";
import { toast } from "sonner";
import Lottie from 'lottie-react';
import loadingAnimation from '@/assets/Loading.json';
import TextContentEditor from '@/pages/ModuleEditor/edit/content-structure/TextContentEditor';
import ImageContentEditor from '@/pages/ModuleEditor/edit/content-structure/ImageContentEditor';
import VideoContentEditor from '@/pages/ModuleEditor/edit/content-structure/VideoContentEditor';
import FileAttachContentEditor from '@/pages/ModuleEditor/edit/content-structure/FileAttachContentEditor';
import CheckListContentEditor from '@/pages/ModuleEditor/edit/content-structure/ChecklistContent';
import StepsTableContentEditor from '@/pages/ModuleEditor/edit/content-structure/StepsContent';
import AccordionContentEditor from '@/pages/ModuleEditor/edit/content-structure/AccordionContent';
import { Checkbox } from "@/components/ui/checkbox";
import { StepsPreview } from './StepsContent';
import QuizContentEditor from '@/pages/ModuleEditor/edit/content-structure/QuizContentEditor';
import QuestionAnswerContentEditor from '@/pages/ModuleEditor/edit/content-structure/QuestionAnswerContentEditor';
import SlideContentEditor from '@/pages/ModuleEditor/edit/content-structure/SlideContentEditor';
import IframeContentEditor from '@/pages/ModuleEditor/edit/content-structure/IframeContentEditor';
import { SlidePreview } from '@/pages/ModuleEditor/contents/slide';
import { LMS_API_BASE_URL } from "@/config/routes";

const contentStyles = `
    .prose ul {
        list-style-type: disc;
        padding-left: 1.5em;
        margin: 1em 0;
    }
    .prose > div >ul li {
        margin-bottom: 0.5em;
    }
    .prose ol {
        list-style-type: decimal;
        padding-left: 1.5em;
        margin: 1em 0;
    }
    .prose > div > ol li {
        margin-bottom: 0.5em;
    }
    .prose table {
        border-collapse: collapse;
        width: 100%;
        margin: 1em 0;
        overflow-x: auto;
        display: block;
    }
    .prose table th,
    .prose table td {
        border: 1px solid #e2e8f0;
        padding: 0.5em;
        word-break: break-word;
        white-space: normal;
        max-width: 300px;
    }
    .prose table th {
        background-color: #f8fafc;
        font-weight: 600;
    }
    .prose {
        max-width: 100%;
    }
    .prose img {
        max-width: 100%;
        height: auto;
    }
    .prose h1 {
        font-size: 2em;
        font-weight: 600;
        margin-top: 0.5em;
        margin-bottom: 0.5em;
    }
    .prose h2 {
        font-size: 1.5em;
        font-weight: 500;
        margin-top: 0.5em;
        margin-bottom: 0.5em;
    }
    .prose h3 {
        font-size: 1.25em;
        font-weight: 400;
        margin-top: 0.5em;
        margin-bottom: 0.5em;
    }
    
`;

// Define the always-visible content types outside the component
const alwaysVisibleContentTypes = [
  { id: 'text', name: 'Text', icon: FileText },
  { id: 'image', name: 'Image', icon: ImageIcon },
  { id: 'video', name: 'Video', icon: Video },
  { id: 'file', name: 'File', icon: File },
];

// Utility for file type accept
const fileAccept = {
  image: 'image/*',
  video: 'video/*',
  file: '*',
};

// Add a type guard for Preview
function hasPreview(content: any): content is { Preview: React.ComponentType<any> } {
  return content && typeof content === 'object' && 'Preview' in content;
}

// Type for content with Preview
interface ContentWithPreview {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
  Preview: React.ComponentType<any>;
}

// Type for content without Preview
interface ContentWithoutPreview {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  description: string;
}

type ContentType = ContentWithPreview | ContentWithoutPreview;

const contentsList: ContentType[] = rawContentsList as ContentType[];

interface Chapter {
  id: string;
  title: string;
  contents?: any[];
}

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

// Sortable content blocks wrapper
function SortableContentBlocks({ contents, chapter, reorderContentBlocks, setModule }: { contents: any[]; chapter: any; reorderContentBlocks: any; setModule: any }) {
  return (
    <SortableContext items={contents.map((c, idx) => c.id || `content-${idx}`)} strategy={verticalListSortingStrategy}>
      <div className="mt-8 w-full flex flex-col gap-6">
        {contents.map((content, idx) => (
          <SortableContentBlock
            key={content.id || `content-${idx}`}
            id={content.id || `content-${idx}`}
            index={idx}
            content={content}
            chapter={chapter}
            reorderContentBlocks={reorderContentBlocks}
            setModule={setModule}
          />
        ))}
      </div>
    </SortableContext>
  );
}

function DroppableContentDropArea({ setDrawerOpen, addContentToChapter, activeLessonId, activeChapterId }: { setDrawerOpen: (open: boolean) => void, addContentToChapter: (type: string, lessonId: string, chapterId: string) => void, activeLessonId: string, activeChapterId: string }) {
  const { setNodeRef, isOver } = useDroppable({ id: 'content-drop-area' });
  return (
    <div
      ref={setNodeRef}
      className={`border-2 border-dashed border-border rounded-lg bg-muted p-8 flex flex-col items-center justify-center min-h-[180px] transition-colors ${isOver ? 'bg-accent' : ''}`}
    >
      <div className="text-foreground mb-4 text-lg font-medium">Drag & drop a content type here</div>
      <span
        className="text-primary font-semibold cursor-pointer hover:underline"
        onClick={() => setDrawerOpen(true)}
      >
        Or select from content types
      </span>
    </div>
  );
}

// Floating draggable bar with framer-motion label animation
function FloatingDraggableBar() {
  const [hovered, setHovered] = useState<string | null>(null);
  const [barHovered, setBarHovered] = useState(false);
  return (
    <div
      className="fixed right-6 top-1/3 z-40 flex flex-col gap-4 items-center bg-transparent"
      onMouseEnter={() => setBarHovered(true)}
      onMouseLeave={() => { setBarHovered(false); setHovered(null); }}
    >
      {alwaysVisibleContentTypes.map((content) => (
        <DraggableContentIcon
          key={content.id}
          content={content}
          showLabel={barHovered || hovered === content.id}
          onHover={() => setHovered(content.id)}
          onUnhover={() => setHovered(null)}
        />
      ))}
    </div>
  );
}

export default function MainSection({ 
  hasLessons, 
  onAddLesson, 
  isMobile, 
  lessons, 
  addContentToChapter, 
  setModule,
  moduleName,
  loading,
  activeLessonId,
  activeChapterId
}: {
  hasLessons: boolean;
  onAddLesson: (lesson: { title: string; description: string; chapter: { title: string} }) => void;
  isMobile: boolean;
  lessons: any[];
  addContentToChapter: (contentType: string, lessonId: string, chapterId: string) => void;
  setModule: any;
  moduleName: string;
  loading?: boolean;
  activeLessonId?: string | null;
  activeChapterId?: string | null;
}) {
  const [adding, setAdding] = useState(false);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDesc, setLessonDesc] = useState("");
  const [chapterTitle, setChapterTitle] = useState("");
  const [showAddContent, setShowAddContent] = useState(false);
  const [showContentTypes, setShowContentTypes] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hoveredType, setHoveredType] = useState<string | null>(null);
  const [showAddChapter, setShowAddChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const { createDoc } = useFrappeCreateDoc();
  const { updateDoc } = useFrappeUpdateDoc();
  const { deleteDoc } = useFrappeDeleteDoc();
  const [minLoading, setMinLoading] = useState(true);
  const [editingLessonName, setEditingLessonName] = useState(false);
  const [editingLessonDesc, setEditingLessonDesc] = useState(false);
  const [editingChapterName, setEditingChapterName] = useState(false);
  const [lessonNameValue, setLessonNameValue] = useState("");
  const [lessonDescValue, setLessonDescValue] = useState("");
  const [chapterNameValue, setChapterNameValue] = useState("");

  // Get active lesson and chapter
  const activeLesson = lessons?.find(l => l.id === activeLessonId) || null;
  const activeChapter = activeLesson?.chapters?.find((c: Chapter) => c.id === activeChapterId) || null;

  // Preview function
  const handlePreviewModule = () => {
    const previewUrl = `/modules/learner/${moduleName}`;
    window.open(previewUrl, '_blank', 'noopener,noreferrer');
  };

  useEffect(() => {
    const timer = setTimeout(() => setMinLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (activeLesson) {
      setLessonNameValue(activeLesson.title);
      setLessonDescValue(activeLesson.description);
    }
    if (activeChapter) {
      setChapterNameValue(activeChapter.title);
    }
  }, [activeLesson, activeChapter]);

  const handleCreateLessonAndChapter = async (lessonData: { lesson_name: string; description: string; chapter: { title: string } }) => {
    try {
      // 1. Create the Lesson
      const lessonResponse = await createDoc("Lesson", {
        lesson_name: lessonData.lesson_name,
        description: lessonData.description
      });

      if (!lessonResponse?.name) {
        throw new Error("Failed to create lesson");
      }

      // 2. Create the Chapter
      const chapterResponse = await createDoc("Chapter", {
        title: lessonData.chapter.title,
        scoring: 0 // Adding default scoring as per doctype
      });

      if (!chapterResponse?.name) {
        throw new Error("Failed to create chapter");
      }

      // 3. Fetch current lessons from the module (from state)
      const currentLessons = lessons && Array.isArray(lessons)
        ? lessons.map((l, idx) => ({ lesson: l.id, order: idx + 1 }))
        : [];
      // Add the new lesson to the end
      const updatedLessons = [
        ...currentLessons,
        { lesson: lessonResponse.name, order: currentLessons.length + 1 }
      ];

      // 4. Update the Module with the new lessons array
      const moduleUpdateResponse = await updateDoc("LMS Module", moduleName, {
        lessons: updatedLessons
      });

      if (!moduleUpdateResponse?.name) {
        throw new Error("Failed to update module");
      }

      // 5. Update the Lesson with the new chapter
      const lessonUpdateResponse = await updateDoc("Lesson", lessonResponse.name, {
        chapters: [
          {
            chapter: chapterResponse.name,
            order: 1
          }
        ]
      });

      if (!lessonUpdateResponse?.name) {
        throw new Error("Failed to update lesson with chapter");
      }

      toast.success("Lesson and chapter created successfully");
      onAddLesson({
        title: lessonData.lesson_name, // Map lesson_name to title for UI
        description: lessonData.description,
        chapter: { title: lessonData.chapter.title }
      });
      setLessonTitle("");
      setLessonDesc("");
      setChapterTitle("");
      setAdding(false);

    } catch (error) {
      console.error("Error creating lesson and chapter:", error);
      toast.error("Failed to create lesson and chapter");
    }
  };

  const handleLessonNameSave = async () => {
    if (!activeLesson) return;
    try {
      await updateDoc("Lesson", activeLesson.id, {
        lesson_name: lessonNameValue
      });
      setModule((prev: any) => {
        const updatedLessons = prev.lessons.map((lesson: any) => {
          if (lesson.id === activeLesson.id) {
            return { ...lesson, title: lessonNameValue };
          }
          return lesson;
        });
        return { ...prev, lessons: updatedLessons };
      });
      setEditingLessonName(false);
      toast.success("Lesson name updated");
    } catch (error) {
      console.error("Error updating lesson name:", error);
      toast.error("Failed to update lesson name");
    }
  };

  const handleLessonDescSave = async () => {
    if (!activeLesson) return;
    try {
      await updateDoc("Lesson", activeLesson.id, {
        description: lessonDescValue
      });
      setModule((prev: any) => {
        const updatedLessons = prev.lessons.map((lesson: any) => {
          if (lesson.id === activeLesson.id) {
            return { ...lesson, description: lessonDescValue };
          }
          return lesson;
        });
        return { ...prev, lessons: updatedLessons };
      });
      setEditingLessonDesc(false);
      toast.success("Lesson description updated");
    } catch (error) {
      console.error("Error updating lesson description:", error);
      toast.error("Failed to update lesson description");
    }
  };

  const handleChapterNameSave = async () => {
    if (!activeChapter) return;
    try {
      await updateDoc("Chapter", activeChapter.id, {
        title: chapterNameValue
      });
      setModule((prev: any) => {
        const updatedLessons = prev.lessons.map((lesson: any) => {
          if (lesson.id === activeLessonId) {
            const updatedChapters = lesson.chapters.map((chapter: any) => {
              if (chapter.id === activeChapter.id) {
                return { ...chapter, title: chapterNameValue };
              }
              return chapter;
            });
            return { ...lesson, chapters: updatedChapters };
          }
          return lesson;
        });
        return { ...prev, lessons: updatedLessons };
      });
      setEditingChapterName(false);
      toast.success("Chapter name updated");
    } catch (error) {
      console.error("Error updating chapter name:", error);
      toast.error("Failed to update chapter name");
    }
  };

  if (loading || minLoading) {
    return (
      <div className="flex flex-1 items-center justify-center h-full">
        <Lottie animationData={loadingAnimation} loop style={{ width: 120, height: 120 }} />
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <style>{contentStyles}</style>
      <div className="flex-1 h-full flex flex-col items-center justify-start bg-background pt-8 px-10 text-center">
        {!activeLesson && !hasLessons && (
          <div className="w-full max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Create Your First Lesson</h2>
            <p className="text-muted-foreground mb-8">Start by creating your first lesson and chapter</p>
            <Button
              onClick={() => setAdding(true)}
              className="rounded-full px-8 py-3 text-lg shadow-lg"
            >
              + Create First Lesson
            </Button>
          </div>
        )}

        {/* Lesson Creation Dialog */}
        <Dialog open={adding} onOpenChange={setAdding}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Lesson</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="lessonTitle">Lesson Title</Label>
                <Input
                  id="lessonTitle"
                  value={lessonTitle}
                  onChange={(e) => setLessonTitle(e.target.value)}
                  placeholder="Enter lesson title"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="lessonDesc">Lesson Description</Label>
                <RichEditor
                  content={lessonDesc}
                  onChange={setLessonDesc}
                />
              </div>
              <div>
                <Label htmlFor="chapterTitle">First Chapter Title</Label>
                <Input
                  id="chapterTitle"
                  value={chapterTitle}
                  onChange={(e) => setChapterTitle(e.target.value)}
                  placeholder="Enter chapter title"
                  className="mt-1"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setAdding(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (lessonTitle && chapterTitle) {
                    handleCreateLessonAndChapter({
                      lesson_name: lessonTitle,
                      description: lessonDesc,
                      chapter: { title: chapterTitle }
                    });
                  } else {
                    toast.error("Please fill in all required fields");
                  }
                }}
                disabled={!lessonTitle || !chapterTitle}
              >
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {activeLesson && (
          <div className="w-full px-2 md:px-0">
            {/* Lesson Name with Edit and Preview Button */}
            <div className="flex items-center justify-center gap-2 mb-2">
              {editingLessonName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={lessonNameValue}
                    onChange={(e) => setLessonNameValue(e.target.value)}
                    className="text-2xl font-bold text-center"
                  />
                  <Button size="sm" onClick={handleLessonNameSave}>Save</Button>
                  <Button size="sm" variant="outline" onClick={() => setEditingLessonName(false)}>Cancel</Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl font-bold">Lesson: {activeLesson.title}</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingLessonName(true)}
                    className="p-1"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviewModule}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Preview Module
                  </Button>
                </div>
              )}
            </div>

            {/* Lesson Description with Edit */}
            <div className="mb-4">
              {editingLessonDesc ? (
                <div className="flex flex-col items-center gap-2">
                  <RichEditor
                    content={lessonDescValue}
                    onChange={setLessonDescValue}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleLessonDescSave}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingLessonDesc(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <div className="block" dangerouslySetInnerHTML={{ __html: activeLesson.description }} />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditingLessonDesc(true)}
                    className="p-1"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            <hr className="my-6 border-border" />
            
            {activeChapter && (
              <>
                {/* Chapter Name with Edit */}
                <div className="mb-4">
                  {editingChapterName ? (
                    <div className="flex items-center justify-center gap-2">
                      <Input
                        value={chapterNameValue}
                        onChange={(e) => setChapterNameValue(e.target.value)}
                        className="text-lg font-semibold text-center"
                      />
                      <Button size="sm" onClick={handleChapterNameSave}>Save</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingChapterName(false)}>Cancel</Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span className="block text-lg font-semibold text-foreground">
                        Chapter: {activeChapter.title}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingChapterName(true)}
                        className="p-1"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                <hr className="my-6 border-border" />
                
                {/* Render content blocks */}
                {activeChapter.contents && activeChapter.contents.length > 0 && (
                  <SortableContentBlocks
                    contents={activeChapter.contents}
                    chapter={activeChapter}
                    reorderContentBlocks={reorderContentBlocks}
                    setModule={setModule}
                  />
                )}
                {/* Clickable Add Content Section (now at the end) */}
                <div className="mt-8 text-center">
                  <DroppableContentDropArea
                    setDrawerOpen={setDrawerOpen}
                    addContentToChapter={(type) => {
                      if (activeLessonId && activeChapterId) {
                        addContentToChapter(type, activeLessonId, activeChapterId);
                      }
                    }}
                    activeLessonId={activeLessonId || ''}
                    activeChapterId={activeChapterId || ''}
                  />
                </div>
                {/* Create Next Chapter Button (at the end of lesson/chapter details) */}
                <div className="flex justify-center mt-12">
                  <Button
                    onClick={() => setShowAddChapter(true)}
                    className="rounded-full px-8 py-3 text-lg shadow-lg"
                  >
                    + Create Next Chapter
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
        {/* Modal for creating next chapter */}
        <Dialog open={showAddChapter} onOpenChange={setShowAddChapter}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Next Chapter</DialogTitle>
            </DialogHeader>
            <Input
              value={newChapterTitle}
              onChange={e => setNewChapterTitle(e.target.value)}
              placeholder="Chapter Title"
              className="mb-2"
            />
            <div className="flex gap-2 mt-4 justify-end">
              <DialogClose asChild>
                <Button variant="outline" onClick={() => setShowAddChapter(false)}>Cancel</Button>
              </DialogClose>
              <Button
                onClick={async () => {
                  // 1. Create the chapter in Frappe and get its docname
                  const chapterResponse = await createDoc("Chapter", {
                    title: newChapterTitle,
                    scoring: 0
                  });
                  if (!chapterResponse?.name) {
                    toast.error("Failed to create chapter");
                    return;
                  }
                  const newChapterId = chapterResponse.name;
                  // 2. Update local state: add the new chapter to the end of the active lesson's chapters
                  setModule((prev: any) => {
                    if (!prev.lessons || prev.lessons.length === 0) return prev;
                    const updatedLessons = prev.lessons.map((lesson: any) => {
                      if (lesson.id === (activeLessonId || prev.lessons[0].id)) {
                        return {
                          ...lesson,
                          chapters: [
                            ...lesson.chapters,
                            {
                              id: newChapterId,
                              title: newChapterTitle,
                              contents: []
                            }
                          ]
                        };
                      }
                      return lesson;
                    });
                    return { ...prev, lessons: updatedLessons };
                  });
                  // 3. Update the lesson in Frappe
                  const lesson = lessons.find((l: any) => l.id === (activeLessonId || lessons[0].id));
                  if (lesson) {
                    const updatedChapters = [
                      ...lesson.chapters,
                      {
                        id: newChapterId,
                        title: newChapterTitle,
                        contents: []
                      }
                    ];
                    if (lesson.id) {
                      await updateDoc("Lesson", lesson.id, {
                        chapters: updatedChapters.map((ch, idx) => ({
                          chapter: ch.id, // use Frappe docname
                          order: idx + 1
                        }))
                      });
                    }
                  }
                  setShowAddChapter(false);
                  setNewChapterTitle('');
                }}
                disabled={!newChapterTitle}
              >
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        {/*  Drawer for Content Types using shadcn/ui Drawer */}
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} direction="right">
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Select Content Type</DrawerTitle>
            </DrawerHeader>
            <div className="relative flex w-full max-w-md mx-auto pb-6 px-4">
              <div className="grid grid-cols-2 gap-4 flex-1">
                {contentsList.map((content) => {
                  const LucideIcon = content.icon;
                  const showPreview = ["checklist", "steps", "accordion", "quiz", "question_answer", "slide", "iframe"].includes(content.id);
                  return (
                    <TooltipProvider key={content.id} delayDuration={200}>
                      <Tooltip>
                        {true && (
                          <TooltipTrigger asChild>
                            <Button
                              className="flex flex-col items-center justify-center gap-2 py-6 min-h-[96px] min-w-[120px] rounded-lg border border-border bg-muted text-foreground hover:bg-accent hover:text-primary transition-colors text-base font-medium shadow-sm"
                              variant="outline"
                              style={{ background: 'var(--color-card, var(--color-background))' }}
                              onClick={() => {
                                if (activeLessonId && activeChapterId) {
                                  addContentToChapter(content.id, activeLessonId, activeChapterId);
                                  setDrawerOpen(false);
                                }
                              }}
                              onMouseEnter={() => setHoveredType(showPreview ? content.id : null)}
                              onMouseLeave={() => setHoveredType(null)}
                            >
                              <LucideIcon className="w-7 h-7 mb-1" />
                              <span>{content.name}</span>
                            </Button>
                          </TooltipTrigger>
                        )}
                        {!showPreview && (
                          <TooltipContent side="right" className="max-w-xs text-sm">
                            {content.description}
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
              {/* Preview panel for supported types */}
              {hoveredType && (() => {
                const content = contentsList.find(c => c.id === hoveredType);
                if (!content || !hasPreview(content)) return null;
                const Preview = content.Preview;
                let previewProps: any = {};
                if (content.id === 'checklist') previewProps = { items: [{ item: 'Checklist item 1' }, { item: 'Checklist item 2' }] };
                if (content.id === 'steps') previewProps = { steps: [{ item_name: 'Step 1', item_content: 'Do this' }, { item_name: 'Step 2', item_content: 'Do that' }] };
                if (content.id === 'accordion') previewProps = { items: [{ header_title: 'Accordion 1', body_content: 'Accordion body 1' }, { header_title: 'Accordion 2', body_content: 'Accordion body 2' }] };
                if (content.id === 'quiz') previewProps = { questions: [{ question: 'Sample question?', options: ['A', 'B', 'C'], answer: 'A' }] };
                if (content.id === 'question_answer') previewProps = { question: 'Sample Q?', answer: 'Sample A' };
                if (content.id === 'slide') previewProps = { 
                  title: 'Sample Presentation',
                  description: 'Interactive slideshow with multiple slides',
                  slide_show_items: [
                    { option_text: 'Introduction', slide_content: '<p>Welcome to our presentation</p>' },
                    { option_text: 'Main Content', slide_content: '<p>Key points and information</p>' },
                    { option_text: 'Conclusion', slide_content: '<p>Summary and next steps</p>' }
                  ]
                };
                if (content.id === 'iframe') previewProps = { url: 'https://example.com' };
                return (
                  <div className="absolute left-full top-0 ml-6 w-72 bg-card border border-border rounded-lg shadow-lg p-4 z-50 flex flex-col items-start min-h-[120px]">
                    <div className="font-semibold mb-2 text-primary text-base">{content.name} Preview</div>
                    <Preview {...previewProps} />
                  </div>
                );
              })()}
            </div>
            <DrawerClose asChild>
              <div className="flex justify-center">
                <Button variant="destructive" className="w-1/2">Close</Button>
              </div>
            </DrawerClose>
          </DrawerContent>
        </Drawer>
        {/* Floating draggable bar with framer-motion label animation */}
        <FloatingDraggableBar />
      </div>
    </div>
  );
}

function DraggableContentIcon({ content, showLabel, onHover, onUnhover }: { content: { id: string; name: string; icon: React.ElementType }; showLabel: boolean; onHover: () => void; onUnhover: () => void }) {
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({ id: content.id });
  const LucideIcon = content.icon;
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-2 px-2 py-2 rounded-lg border border-input bg-background text-foreground cursor-grab transition-colors ${isDragging ? 'opacity-50' : 'hover:bg-accent'}`}
    >
      <LucideIcon className="w-7 h-7 mb-1" />
      <span>{content.name}</span>
    </div>
  );
}

// Content block editor/preview
function ContentBlockEditor({ content, onSaveContent, onCancelContent, isNew }: { content: any, onSaveContent: (data: any) => void, onCancelContent: () => void, isNew?: boolean }) {
  const [editing, setEditing] = useState(isNew === true);
  const [localContent, setLocalContent] = useState(content);

  useEffect(() => {
    setLocalContent(content);
    setEditing(isNew || false);
  }, [content, isNew]);

  const handleSave = async (data: any) => {
    // For text content, set title as 'chapter name-1st word of content'
    let saveData = { ...content, ...data };
    if (
      (content.type === 'text' || content.type === 'Text Content') &&
      content.chapterTitle
    ) {
      // Get first word of content body (strip HTML tags)
      const tmp = document.createElement('div');
      tmp.innerHTML = data.body || '';
      const text = tmp.textContent || tmp.innerText || '';
      const firstWord = text.trim().split(/\s+/)[0] || '';
      saveData.title = `${content.chapterTitle}-${firstWord}`;
    }
    await onSaveContent(saveData);
    setEditing(false);
  };

  const handleCancel = () => {
    setEditing(false);
    onCancelContent && onCancelContent();
  };

  if (editing) {
    switch (content.type) {
      case 'text':
      case 'Text Content':
        return <TextContentEditor content={{ ...localContent, title: undefined }} onSave={handleSave} onCancel={handleCancel} />;
      case 'image':
      case 'Image Content':
        return <ImageContentEditor content={localContent} onSave={handleSave} onCancel={handleCancel} />;
      case 'video':
      case 'Video Content':
        return <VideoContentEditor content={localContent} onSave={handleSave} onCancel={handleCancel} />;
      case 'file':
      case 'File Attach':
        return <FileAttachContentEditor content={localContent} onSave={handleSave} onCancel={handleCancel} />;
      case 'Check List':
        return <CheckListContentEditor content={localContent} onSave={handleSave} onCancel={handleCancel} />;
      case 'Steps':
        return <StepsTableContentEditor content={localContent} onSave={handleSave} onCancel={handleCancel} />;
      case 'Accordion Content':
        return <AccordionContentEditor content={localContent} onSave={handleSave} onCancel={handleCancel} />;
      case 'Slide Content':
        return <SlideContentEditor content={localContent} onSave={handleSave} onCancel={handleCancel} />;
      case 'Quiz':
        return <QuizContentEditor content={localContent} onSave={handleSave} onCancel={handleCancel} />;
      case 'Question Answer':
        return <QuestionAnswerContentEditor content={localContent} onSave={handleSave} onCancel={handleCancel} />;
      case 'Iframe Content':
        return <IframeContentEditor content={localContent} onSave={handleSave} onCancel={handleCancel} />;
      default:
        return <div className="border rounded p-2">Unsupported content type: {content.type}</div>;
    }
  }

  // View mode for saved content  
  switch (content.type) {
    case 'Text Content':
      return (
        <div className="bg-background border border-border rounded-lg p-4 w-full mx-auto">
          {/* <div className="font-bold mb-2">{content.title}</div> */}
          <div className="prose prose-sm dark:prose-invert" dangerouslySetInnerHTML={{ __html: content.body }} />
          <Button size="sm" variant="outline" className="mt-2" onClick={() => setEditing(true)}>Edit</Button>
        </div>
      );
    case 'Image Content':
      return (
        <div className="bg-background border border-border rounded-lg p-4 w-full mx-auto text-center">
          {content.attach && <img src={LMS_API_BASE_URL + content.attach} alt={content.title} className="max-h-48 mx-auto rounded" />}
          <Button size="sm" variant="outline" className="mt-2" onClick={() => setEditing(true)}>Edit</Button>
        </div>
      );
    case 'Video Content':
      return (
        <div className="bg-background border border-border rounded-lg p-4 w-full mx-auto text-center">
          {content.video && <video src={LMS_API_BASE_URL + content.video} controls className="max-h-48 mx-auto rounded" />}
          <Button size="sm" variant="outline" className="mt-2" onClick={() => setEditing(true)}>Edit</Button>
        </div>
      );
    case 'File Attach':
      return (
        <div className="bg-background border border-border rounded-lg p-4 w-full mx-auto text-center">
          <div className="font-bold mb-2">{content.title}</div>
          {content.attachment && <div className="mt-2"><a href={content.attachment} target="_blank" rel="noopener noreferrer" className="text-primary underline">Download File</a></div>}
          <Button size="sm" variant="outline" className="mt-2" onClick={() => setEditing(true)}>Edit</Button>
        </div>
      );
    case 'Check List':
      return (
        <div className="bg-background border border-border rounded-lg p-4 w-full mx-auto">
          <div className="font-bold mb-2">{content.title}</div>
          <div className="flex flex-col gap-2">
            {content.check_list_item?.map((item: any) => (
              <div key={item.name} className="border rounded-md p-3 bg-background">
                <div className="flex items-center gap-2 font-semibold">
                  <Checkbox checked={false} disabled />
                  <span>{item.item}</span>
                </div>
                {item.content && (
                  <div className="pl-8 prose prose-sm dark:prose-invert border-l-2 border-muted mt-2" dangerouslySetInnerHTML={{ __html: item.content }} />
                )}
              </div>
            ))}
          </div>
          <Button size="sm" variant="outline" className="mt-2" onClick={() => setEditing(true)}>Edit</Button>
        </div>
      );
    case 'Steps':
      return (
        <div className="bg-background border border-border rounded-lg p-4 w-full mx-auto">
          <StepsPreview title={content.title} steps_item={content.steps_item || []} />
          <Button size="sm" variant="outline" className="mt-4" onClick={() => setEditing(true)}>Edit</Button>
        </div>
      );
    case 'Accordion Content':
      return (
        <div className="bg-background border border-border rounded-lg p-4 w-full mx-auto">
          <AccordionPreview 
            title={content.title} 
            description={content.description} 
            accordion_items={content.accordion_items || []} 
          />
          <Button size="sm" variant="outline" className="mt-4" onClick={() => setEditing(true)}>Edit</Button>
        </div>
      );
    case 'Slide Content':
      return (
        <div className="bg-background border border-border rounded-lg p-4 w-full mx-auto">
          <SlidePreview 
            title={content.title} 
            description={content.description}
            slide_show_items={content.slide_show_items || []} 
          />
          <Button size="sm" variant="outline" className="mt-4" onClick={() => setEditing(true)}>Edit</Button>
        </div>
      );
    case 'Quiz':
      return (
        <div className="bg-background border border-border rounded-lg p-4 w-full mx-auto">
          <div className="font-bold mb-2">{content.title}</div>
          <Button size="sm" variant="outline" className="mt-4" onClick={() => setEditing(true)}>Edit</Button>
        </div>
      );
    case 'Question Answer':
      return (
        <div className="bg-background border border-border rounded-lg p-4 w-full mx-auto">
          <div className="font-bold mb-2">{content.title}</div>
          <Button size="sm" variant="outline" className="mt-4" onClick={() => setEditing(true)}>Edit</Button>
        </div>
      );
    case 'Iframe Content':
      return (
        <div className="bg-background border border-border rounded-lg p-4 w-full mx-auto text-center">
          <div className="font-bold mb-2">{content.title}</div>
          <div className="border rounded-lg overflow-hidden bg-muted/30">
            <div className="p-3 bg-muted/50 border-b">
              <div className="flex items-center gap-2 text-sm">
                <iframe src={content.url} className="w-full h-full" title={content.title || 'Embedded Content'} sandbox="allow-scripts allow-same-origin" />
              </div>
            </div>
          </div>
          <Button size="sm" variant="outline" className="mt-4" onClick={() => setEditing(true)}>Edit</Button>
        </div>
      );
    default:
      return <div className="border rounded p-2">Unsupported content type: {content.type}</div>;
  }
}

function SortableContentBlock({ id, index, content, chapter, reorderContentBlocks, setModule }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };

  const { createDoc } = useFrappeCreateDoc();
  const { updateDoc } = useFrappeUpdateDoc();
  const { deleteDoc } = useFrappeDeleteDoc();

  const handleSaveContent = async (data: any) => {
    try {
      // Debug logs
      console.log('[MainSection] handleSaveContent data:', data);

      // Map type to doctype and fields
      let doctype = null;
      let fields = {};
      switch (data.type) {
        case 'text':
        case 'Text Content':
          doctype = 'Text Content';
          fields = { title: data.title, body: data.body };
          break;
        case 'image':
        case 'Image Content':
          doctype = 'Image Content';
          fields = { title: data.title, attach: data.attach };
          break;
        case 'video':
        case 'Video Content':
          doctype = 'Video Content';
          fields = { title: data.title, video: data.video };
          break;
        case 'file':
        case 'File Attach':
          doctype = 'File Attach';
          fields = { title: data.title, attachment: data.attachment };
          break;
        case 'Check List':
          doctype = 'Check List';
          fields = { 
            title: data.title,
            check_list_item: (Array.isArray(data.check_list_item) ? data.check_list_item : []).map((item: any) => ({
              item: item.item,
              content: item.content
            }))
          };
          break;
        case 'Steps':
          doctype = 'Steps';
          fields = { 
            title: data.title,
            steps_item: (Array.isArray(data.steps_item) ? data.steps_item : []).map((item: any) => ({
              name: item.name || item.id,
              item_name: item.item_name,
              item_content: item.item_content || ''
            }))
          };
          break;
        case 'Accordion Content':
          doctype = 'Accordion Content';
          fields = { 
            title: data.title,
            description: data.description,
            accordion_items: data.accordion_items.map((item: any) => ({
              name: item.name,
              header_title: item.header_title,
              body_content: item.body_content,
              image: item.image,
              doctype: 'Accordion Item Child',
              parentfield: 'accordion_items',
              parenttype: 'Accordion Content',
              docstatus: 0
            }))
          };
          break;
        case 'Quiz': {
          doctype = 'Quiz';
          // For each question, create or update a Quiz Question doc
          const createdQuestions = await Promise.all(
            (Array.isArray(data.questions) ? data.questions : []).map(async (question: any) => {
              if (question.name) {
                // Update existing Quiz Question
                await updateDoc('Quiz Question', question.name, {
                  question_text: question.question_text,
                  question_type: question.question_type,
                  score: question.score,
                  options: (Array.isArray(question.options) ? question.options : []).map((option: any) => ({
                    option_text: option.option_text,
                    correct: option.correct
                  }))
                });
                console.log('[Quiz] Updated Quiz Question:', question.name);
                return question.name;
              } else {
                // Create new Quiz Question
                const quizQuestionDoc = await createDoc('Quiz Question', {
                  question_text: question.question_text,
                  question_type: question.question_type,
                  score: question.score,
                  options: (Array.isArray(question.options) ? question.options : []).map((option: any) => ({
                    option_text: option.option_text,
                    correct: option.correct
                  }))
                });
                console.log('[Quiz] Created Quiz Question:', quizQuestionDoc?.name);
                return quizQuestionDoc?.name;
              }
            })
          );
          // Build the Quiz's questions child table as references
          fields = {
            title: data.title,
            description: data.description,
            total_score: data.total_score,
            randomize_questions: data.randomize_questions,
            time_limit_mins: data.time_limit_mins,
            is_active: data.is_active,
            questions: createdQuestions.map((quizQuestionName: string) => ({
              quiz_question: quizQuestionName
            }))
          };
          console.log('[Quiz] Prepared Quiz fields:', fields);
          break;
        }
        case 'Question Answer':
          doctype = 'Question Answer';
          fields = { 
            title: data.title,
            description: data.description,
            max_score: data.max_score,
            time_limit_mins: data.time_limit_mins,
            questions: (Array.isArray(data.questions) ? data.questions : []).map((question: any) => ({
              question: question.question,
              score: question.score,
              suggested_answer: question.suggested_answer
            }))
          };
          break;
        case 'Slide Content':
          doctype = 'Slide Content';
          fields = { 
            title: data.title,
            description: data.description,
            progress_enabled: data.progress_enabled,
            is_active: data.is_active,
            slide_show_items: (Array.isArray(data.slide_show_items) ? data.slide_show_items : []).map((slide: any) => ({
              heading: slide.heading,
              description: slide.description,
              image: slide.image,
              url: slide.url
            }))
          };
          break;
        case 'Iframe Content':
          doctype = 'Iframe Content';
          fields = { 
            title: data.title,
            url: data.url
          };
          break;
        default:
          toast.error('Unsupported content type');
          return;
      }
      // Create or update the content doc
      let docname = data.docname;
      if (data.id && data.docname) {
        // Update
        await updateDoc(doctype, data.docname, fields);
      } else {
        // Create
        const contentDoc = await createDoc(doctype, fields);
        docname = contentDoc?.name;
        // --- Link to chapter in backend ---
        // Get current chapter contents (from local state)
        const chapterInState = chapter;
        const currentContents = Array.isArray(chapterInState.contents) ? chapterInState.contents.slice() : [];
        // Filter out any unsaved placeholders
        const savedContents = currentContents.filter((c: any) => c.docname || c.content_reference);
        // Prepare new Chapter Content row
        const newChapterContentRow = {
          content_type: doctype,
          content_reference: docname,
          order: savedContents.length + 1
        };
        // Prepare updated contents array for backend
        const updatedContentsForBackend = [
          ...savedContents.map((c: any, idx: number) => ({
            content_type: c.type || c.content_type,
            content_reference: c.docname || c.content_reference,
            order: idx + 1
          })),
          newChapterContentRow
        ];
        // Update the Chapter doc in Frappe
        await updateDoc("Chapter", chapter.id, { contents: updatedContentsForBackend });
      }
      // Update the chapter's contents array in local state
      setModule((prev: any) => {
        const lessons = prev.lessons.map((lesson: any) => {
          if (!lesson.chapters) return lesson;
          return {
            ...lesson,
            chapters: lesson.chapters.map((ch: any) => {
              if (ch.id !== chapter.id) return ch;
              // Filter out any unsaved placeholders and get only saved content
              let updatedContents = (ch.contents || []).filter((c: any) => c.docname || c.content_reference);
              // Now, add or update the saved content
              const idx = updatedContents.findIndex((c: any) => c.docname === docname || c.content_reference === docname);
              const newContent = { 
                id: docname, // Use docname as the ID for consistency
                type: doctype, 
                docname, 
                content_type: doctype,
                content_reference: docname,
                ...fields 
              };
              if (idx > -1) {
                updatedContents[idx] = newContent;
              } else {
                updatedContents.push(newContent);
              }
              return { ...ch, contents: updatedContents };
            })
          };
        });
        return { ...prev, lessons };
      });
      toast.success('Content saved');
    } catch (err) {
      console.error('Error saving content', err);
      toast.error('Failed to save content');
    }
  };

  const handleCancelContent = () => {
    // Optionally reset state or remove new content block if not saved
  };

  // Delete content block handler
  const handleDeleteContent = async () => {
    if (!content || (!content.docname && !content.content_reference)) {
      toast.error("Content reference missing");
      return;
    }
    const docname = content.docname || content.content_reference;
    const doctype = content.type || content.content_type;
    try {
      // 1. Remove from chapter's contents in backend (child table update)
      const updatedContents = (chapter.contents || [])
        .filter((c: any) => (c.docname || c.content_reference) !== docname)
        .map((c: any, idx: number) => ({
          content_type: c.type || c.content_type,
          content_reference: c.docname || c.content_reference,
          order: idx + 1
        }));
      await updateDoc("Chapter", chapter.id, { contents: updatedContents });
      // 2. Remove from local state
      setModule((prev: any) => {
        const lessons = prev.lessons.map((lesson: any) => {
          if (!lesson.chapters) return lesson;
          return {
            ...lesson,
            chapters: lesson.chapters.map((ch: any) => {
              if (ch.id !== chapter.id) return ch;
              return {
                ...ch,
                contents: (ch.contents || []).filter((c: any) => (c.docname || c.content_reference) !== docname)
              };
            })
          };
        });
        return { ...prev, lessons };
      });
      // 3. Delete the content doc
      await deleteDoc(doctype, docname);
      toast.success("Content deleted");
    } catch (err) {
      console.error("Error deleting content", err);
      toast.error("Failed to delete content");
    }
  };

  return (
    <div ref={setNodeRef} style={style} className="relative flex items-center group">
      <span
        {...attributes}
        {...listeners}
        className="cursor-grab p-2 mr-2 text-muted-foreground group-hover:text-foreground"
        style={{ touchAction: 'none', display: 'flex', alignItems: 'center' }}
      >
        <GripVertical className="w-5 h-5" />
      </span>
      <div className="flex-1">
        <ContentBlockEditor
          content={content}
          onSaveContent={handleSaveContent}
          onCancelContent={handleCancelContent}
          isNew={content.isNew}
        />
      </div>
      {/* Delete button, visible on hover */}
      {content && (content.docname || content.content_reference) ? (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-2 top-1 opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
          onClick={handleDeleteContent}
          title="Delete Content"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      ) : (
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-2 top-1 opacity-0 group-hover:opacity-100"
          disabled
          title="Save this content before deleting."
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}