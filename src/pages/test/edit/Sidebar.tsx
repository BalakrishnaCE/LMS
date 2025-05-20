import React, { useState, useEffect } from "react";
import RichEditor from "@/components/RichEditor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import type { ModuleInfo } from "./testModuleEdit";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { ArrowLeftIcon } from "lucide-react";
import { useFrappeUpdateDoc, useFrappeGetDocList, useFrappeCreateDoc, useFrappeDeleteDoc } from "frappe-react-sdk";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { BookIcon, FileTextIcon, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

interface Lesson {
  id: string;
  title: string;
  description?: string;
  chapters: { id: string; title: string; scoring?: number; contents?: any[] }[];
}

interface ModuleSidebarProps {
  isOpen: boolean;
  fullScreen: boolean;
  moduleInfo?: ModuleInfo | null;
  module?: { lessons?: Lesson[] };
  onFinishSetup?: (info: ModuleInfo) => void;
  isMobile?: boolean;
  onLessonAdded?: () => void;
  activeLessonId?: string | null;
  setActiveLessonId?: (id: string) => void;
  activeChapterId?: string | null;
  setActiveChapterId?: (id: string) => void;
}

function SortableChapter({ chapter, index, activeChapterId, setActiveChapterId, setActiveLessonId, lessonId, onDelete }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: chapter.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
    background: chapter.id === activeChapterId ? "var(--color-primary-20)" : undefined,
  };
  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`rounded px-2 py-1 transition-all cursor-pointer group/chapter flex items-center ${chapter.id === activeChapterId ? "bg-primary/20 text-primary font-semibold" : "text-muted-foreground hover:bg-accent"}`}
      onClick={e => {
        e.stopPropagation();
        setActiveChapterId && setActiveChapterId(chapter.id);
        setActiveLessonId && setActiveLessonId(lessonId);
      }}
    >
      <span {...attributes} {...listeners} className="cursor-grab p-1 mr-2 text-muted-foreground group-hover/chapter:text-foreground flex items-center">
        <GripVertical className="w-4 h-4" />
      </span>
      <div className="flex items-center justify-between w-full min-w-0">
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <FileTextIcon className="w-3 h-3" />
          <span className="truncate flex-1 min-w-0">{chapter.title}</span>
            </div>
            <Button
          variant="ghost"
          size="sm"
          className="opacity-0 group-hover/chapter:opacity-100 hover:bg-destructive/10 hover:text-destructive"
          onClick={e => { e.stopPropagation(); onDelete(); }}
        >
          <Trash2 className="w-3 h-3" />
            </Button>
          </div>
    </li>
  );
}

export default function Sidebar({ isOpen, fullScreen, moduleInfo, module, onFinishSetup, isMobile, onLessonAdded, activeLessonId, setActiveLessonId, activeChapterId, setActiveChapterId }: ModuleSidebarProps) {
  const [, setLocation] = useLocation();
  const { updateDoc, loading: saving } = useFrappeUpdateDoc();
  const [editState, setEditState] = useState<ModuleInfo | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [addingLesson, setAddingLesson] = useState(false);
  const [lessonTitle, setLessonTitle] = useState("");
  const [lessonDesc, setLessonDesc] = useState("");
  const [chapterTitle, setChapterTitle] = useState("");
  const [addingLessonLoading, setAddingLessonLoading] = useState(false);
  const { createDoc } = useFrappeCreateDoc();
  const { deleteDoc } = useFrappeDeleteDoc();
  const [showDeleteLessonDialog, setShowDeleteLessonDialog] = useState(false);
  const [showDeleteChapterDialog, setShowDeleteChapterDialog] = useState(false);
  const [lessonToDelete, setLessonToDelete] = useState<string | null>(null);
  const [chapterToDelete, setChapterToDelete] = useState<{ lessonId: string; chapterId: string } | null>(null);
  const [dragLessonId, setDragLessonId] = useState<string | null>(null);
  const [dragChapters, setDragChapters] = useState<any[]>([]);

  // Fetch departments for the department selector
  const { data: departments } = useFrappeGetDocList("Department", {
    fields: ["name", "department"],
  });

  // Initialize edit state when moduleInfo changes
  useEffect(() => {
    if (moduleInfo) {
      setEditState({ ...moduleInfo });
      setHasChanges(false);
    }
  }, [moduleInfo]);

  // Check for changes in module info and content structure
  useEffect(() => {
    if (!moduleInfo || !editState) return setHasChanges(false);
    
    // Check module info changes
    const moduleFields = ["name1", "description", "duration", "status", "assignment_based", "department"];
    const moduleChanged = moduleFields.some(f => (editState as any)[f] !== (moduleInfo as any)[f]);
    
    // Check content structure changes (lessons, chapters, contents)
    const contentChanged = JSON.stringify(module?.lessons) !== JSON.stringify(moduleInfo.lessons);
    
    setHasChanges(moduleChanged || contentChanged);
  }, [editState, moduleInfo, module]);

  const handleSave = async () => {
    if (!editState || !moduleInfo) return;
    
    try {
      // Prepare the update data
      const updateData = {
        name1: editState.name1,
        description: editState.description,
        duration: editState.duration,
        status: editState.status,
        assignment_based: editState.assignment_based,
        department: editState.department,
      };

      // Only include lessons if they exist in the current module state
      if (module?.lessons) {
        // Map the lessons to the format expected by Frappe
        const formattedLessons = module.lessons.map((lesson, index) => ({
          lesson: lesson.id,
          order: index + 1
        }));
        (updateData as any).lessons = formattedLessons;
      }

      // Update module info
      await updateDoc("LMS Module", moduleInfo.id, updateData);

      toast.success("Module saved successfully");
      setHasChanges(false);
      setIsEditing(false);
      onFinishSetup?.(editState);
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save module");
    }
  };

  const handleFieldChange = (field: keyof ModuleInfo, value: any) => {
    if (!editState) return;
    setEditState(prev => prev ? { ...prev, [field]: value } : null);
  };


  // Add lesson handler
  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingLessonLoading(true);
    try {
      if (!moduleInfo) throw new Error("Module info not loaded");
      // 1. Create the Lesson
      const lessonResponse = await createDoc("Lesson", {
        lesson_name: lessonTitle,
        description: lessonDesc
      });
      if (!lessonResponse?.name) throw new Error("Failed to create lesson");
      // 2. Create the Chapter
      const chapterResponse = await createDoc("Chapter", {
        title: chapterTitle,
        scoring: 0
      });
      if (!chapterResponse?.name) throw new Error("Failed to create chapter");
      // 3. Fetch current lessons from the module (from state)
      const currentLessons = module?.lessons && Array.isArray(module.lessons)
        ? module.lessons.map((l, idx) => ({ lesson: l.id, order: idx + 1 }))
        : [];
      // Add the new lesson to the end
      const updatedLessons = [
        ...currentLessons,
        { lesson: lessonResponse.name, order: currentLessons.length + 1 }
      ];
      // 4. Update the Module with the new lessons array
      await updateDoc("LMS Module", moduleInfo.id, {
        lessons: updatedLessons
      });
      // 5. Update the Lesson with the new chapter
      await updateDoc("Lesson", lessonResponse.name, {
        chapters: [
          {
            chapter: chapterResponse.name,
            order: 1
          }
        ]
      });
      toast.success("Lesson and chapter created successfully");
      setLessonTitle("");
      setLessonDesc("");
      setChapterTitle("");
      setAddingLesson(false);
      onLessonAdded?.();
    } catch (error) {
      console.error("Error creating lesson and chapter:", error);
      toast.error("Failed to create lesson and chapter");
    } finally {
      setAddingLessonLoading(false);
    }
  };

  // Delete lesson handler
  const handleDeleteLesson = async () => {
    if (!lessonToDelete || !moduleInfo || !module) return;
    try {
      // 1. Remove the lesson from the module's lessons array
      const updatedLessons = (module.lessons || []).filter(l => l.id !== lessonToDelete);
      await updateDoc("LMS Module", moduleInfo.id, {
        lessons: updatedLessons.map((l, idx) => ({ lesson: l.id, order: idx + 1 }))
      });
      // 2. Delete the lesson doc
      await deleteDoc("Lesson", lessonToDelete);
      toast.success("Lesson deleted successfully");
      onLessonAdded?.();
    } catch (err) {
      toast.error("Failed to delete lesson");
    } finally {
      setShowDeleteLessonDialog(false);
      setLessonToDelete(null);
    }
  };

  // Delete chapter handler
  const handleDeleteChapter = async () => {
    if (!chapterToDelete || !moduleInfo || !module) return;
    try {
      // 1. Remove the chapter from the parent lesson's chapters array
      const lesson = (module.lessons || []).find(l => l.id === chapterToDelete.lessonId);
      if (!lesson) throw new Error("Lesson not found");
      const updatedChapters = (lesson.chapters || []).filter(c => c.id !== chapterToDelete.chapterId);
      await updateDoc("Lesson", lesson.id, {
        chapters: updatedChapters.map((c, idx) => ({ chapter: c.id, order: idx + 1 }))
      });
      // 2. Delete the chapter doc
      await deleteDoc("Chapter", chapterToDelete.chapterId);
      toast.success("Chapter deleted successfully");
      onLessonAdded?.();
    } catch (err) {
      toast.error("Failed to delete chapter");
    } finally {
      setShowDeleteChapterDialog(false);
      setChapterToDelete(null);
    }
  };

  // Handler for drag start
  const handleChapterDragStart = (lessonId: string, chapters: any[]) => {
    setDragLessonId(lessonId);
    setDragChapters(chapters);
  };

  // Handler for drag end
  const handleChapterDragEnd = async (event: any, lesson: any) => {
    setDragLessonId(null);
    setDragChapters([]);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = lesson.chapters.findIndex((c: any) => c.id === active.id);
    const newIndex = lesson.chapters.findIndex((c: any) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const newChapters = arrayMove(lesson.chapters, oldIndex, newIndex);
    // Update backend order
    try {
      await updateDoc("Lesson", lesson.id, {
        chapters: newChapters.map((c: any, idx: number) => ({ chapter: c.id, order: idx + 1 }))
      });
      toast.success("Chapters reordered");
      onLessonAdded?.(); // Refresh
    } catch (err) {
      toast.error("Failed to reorder chapters");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          key="sidebar"
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: isOpen ? 300 : 0, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          className={`transition-all duration-300 bg-background border-r border-gray-200 h-full overflow-hidden`}
          style={{ minWidth: 0 }}
        >
          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto p-4">
              {/* Back Button */}
              <Button
                variant="outline"
                size="sm"
                className="mb-4 w-full hover:bg-accent hover:text-secondary"
                onClick={() => setLocation('/modules')}
              >
                <ArrowLeftIcon className="w-4 h-4" /> Back to Modules
              </Button>

            <AnimatePresence mode="wait">
              {moduleInfo && (
                <motion.div
                  key={`module-info-${moduleInfo.id}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.25 }}
                  className="space-y-4"
                >
                  {/* Save Button */}
                  <Button
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                    onClick={handleSave}
                    disabled={!hasChanges || saving}
                  >
                    {saving ? "Saving..." : "Save"}
                  </Button>

                  <div className="space-y-2">
                    {isEditing ? (
                      <Input
                        value={editState?.name1 || ""}
                        onChange={(e) => handleFieldChange("name1", e.target.value)}
                        placeholder="Module Name"
                        className="text-lg font-bold"
                      />
                    ) : (
                      <div className="font-bold text-lg truncate" title={moduleInfo.name}>
                        {moduleInfo.name}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground">ID: {moduleInfo.id}</div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Status:</span>
                      {isEditing ? (
                        <Select
                          value={editState?.status || "Draft"}
                          onValueChange={(value) => handleFieldChange("status", value)}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Draft">Draft</SelectItem>
                            <SelectItem value="Published">Published</SelectItem>
                            <SelectItem value="Archived">Archived</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="font-medium">{moduleInfo.status}</span>
                      )}
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Duration:</span>
                      {isEditing ? (
                        <Input
                          type="number"
                          value={editState?.duration || ""}
                          onChange={(e) => handleFieldChange("duration", e.target.value)}
                          className="w-[100px]"
                        />
                      ) : (
                        <span className="font-medium">{moduleInfo.duration} days</span>
                      )}
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Assignment:</span>
                      {isEditing ? (
                        <Select
                          value={editState?.assignment_based || "Everyone"}
                          onValueChange={(value) => handleFieldChange("assignment_based", value)}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Department">Department</SelectItem>
                            <SelectItem value="Everyone">Everyone</SelectItem>
                            <SelectItem value="Manual">Manual</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <span className="font-medium">{moduleInfo.assignment_based}</span>
                      )}
                    </div>

                    {moduleInfo.assignment_based === "Department" && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Department:</span>
                        {isEditing ? (
                          <Select
                            value={editState?.department || ""}
                            onValueChange={(value) => handleFieldChange("department", value)}
                          >
                            <SelectTrigger className="w-[120px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {departments?.map((dept, deptIndex) => (
                                <SelectItem key={dept.name || `dept-${deptIndex}`} value={dept.name}>
                                  {dept.department}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <span className="font-medium">{moduleInfo.department}</span>
                        )}
                      </div>
                    )}

                    {moduleInfo.created_by && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Created by:</span>
                        <span className="font-medium">{moduleInfo.created_by}</span>
                      </div>
                    )}

                    {moduleInfo.creation && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Created on:</span>
                        <span className="font-medium">
                          {format(new Date(moduleInfo.creation), 'MMM d, yyyy')}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium">Description</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditing(!isEditing)}
                      >
                        {isEditing ? "Done" : "Edit"}
                      </Button>
                    </div>
                    {isEditing ? (
                      <RichEditor
                        content={editState?.description || ""}
                        onChange={(content) => handleFieldChange("description", content)}
                      />
                    ) : (
                      <div 
                        className="prose prose-sm text-muted-foreground"
                        dangerouslySetInnerHTML={{ __html: moduleInfo.description || "" }}
                      />
                    )}
                  </div>

                  {/* Lessons/Chapters Hierarchy */}
                  {module?.lessons && module.lessons.length > 0 && (
                    <div className="mt-6">
                      <h4 className="text-sm font-semibold mb-2">Lessons</h4>
                      <ul className="space-y-2">
                        {module.lessons.map((lesson, lessonIndex) => {
                          const isActiveLesson = lesson.id === activeLessonId;
                          return (
                            <motion.li
                              key={lesson.id || `lesson-${lessonIndex}`}
                              layout
                              className={`relative rounded-lg px-3 py-2 transition-all cursor-pointer group
                                ${isActiveLesson ? "bg-primary/10 border-l-4 border-primary shadow-md" : "hover:bg-muted"}
                              `}
                              onClick={() => {
                                setActiveLessonId && setActiveLessonId(lesson.id);
                                if (lesson.chapters?.length && setActiveChapterId) {
                                  setActiveChapterId(lesson.chapters[0].id);
                                }
                              }}
                            >
                              <div className={`flex items-center justify-between gap-2 min-w-0 ${isActiveLesson ? "text-primary font-bold" : "text-foreground"}`}>
                                <div className="flex items-center gap-2 min-w-0 flex-1">
                                  <BookIcon className="w-4 h-4" />
                                  <span className="truncate flex-1 min-w-0">{lesson.title}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
                                  onClick={e => { e.stopPropagation(); setLessonToDelete(lesson.id); setShowDeleteLessonDialog(true); }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                              {lesson.chapters && lesson.chapters.length > 0 && (
                                <DndContext
                                  collisionDetection={closestCenter}
                                  onDragStart={() => handleChapterDragStart(lesson.id, lesson.chapters)}
                                  onDragEnd={event => handleChapterDragEnd(event, lesson)}
                                >
                                  <SortableContext
                                    items={lesson.chapters.map((c: any) => c.id)}
                                    strategy={verticalListSortingStrategy}
                                  >
                                    <ul className="ml-6 mt-1 space-y-1">
                                      {lesson.chapters.map((chapter, chapterIndex) => (
                                        <SortableChapter
                                          key={chapter.id || `chapter-${lesson.id}-${chapterIndex}`}
                                          chapter={chapter}
                                          index={chapterIndex}
                                          activeChapterId={activeChapterId}
                                          setActiveChapterId={setActiveChapterId}
                                          setActiveLessonId={setActiveLessonId}
                                          lessonId={lesson.id}
                                          onDelete={() => { setChapterToDelete({ lessonId: lesson.id, chapterId: chapter.id }); setShowDeleteChapterDialog(true); }}
                                        />
                                      ))}
                                    </ul>
                                  </SortableContext>
                                </DndContext>
                              )}
                            </motion.li>
                          );
                        })}
                      </ul>
                      {/* Add Lesson Button and Dialog */}
                      <Dialog open={addingLesson} onOpenChange={setAddingLesson}>
                        <div className="flex justify-center mt-6">
                          <Button
                            size={isMobile ? "default" : "lg"}
                            className={`rounded-full ${isMobile ? 'w-full max-w-xs mx-auto px-4 py-3 text-base' : 'px-8 py-4 text-lg'} shadow-lg`}
                            onClick={() => setAddingLesson(true)}
                          >
                            + Add Lesson
                          </Button>
                        </div>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add Lesson & Chapter</DialogTitle>
                          </DialogHeader>
                          <form className="space-y-4" onSubmit={handleAddLesson}>
                            <div>
                              <Label htmlFor="sidebar-lesson-title" className="text-sm font-semibold mb-1 block">Lesson Title</Label>
                              <Input
                                id="sidebar-lesson-title"
                                value={lessonTitle}
                                onChange={e => setLessonTitle(e.target.value)}
                                placeholder="Enter lesson title"
                                className="w-full text-sm"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="sidebar-lesson-desc" className="text-sm font-semibold mb-1 block">Lesson Description</Label>
                              <RichEditor
                                content={lessonDesc}
                                onChange={setLessonDesc}
                              />
                            </div>
                            <div>
                              <Label htmlFor="sidebar-chapter-title" className="text-sm font-semibold mb-1 block">Chapter Title</Label>
                              <Input
                                id="sidebar-chapter-title"
                                value={chapterTitle}
                                onChange={e => setChapterTitle(e.target.value)}
                                placeholder="Enter chapter title"
                                className="w-full text-sm"
                                required
                              />
                            </div>
                            <div className="flex gap-2 mt-2">
                              <Button type="submit" className="w-full" disabled={addingLessonLoading}>{addingLessonLoading ? "Adding..." : "Create Lesson & Chapter"}</Button>
                              <DialogClose asChild>
                                <Button type="button" variant="outline" onClick={() => { setAddingLesson(false); setLessonTitle(""); setLessonDesc(""); setChapterTitle(""); }}>Cancel</Button>
                              </DialogClose>
                            </div>
                          </form>
                        </DialogContent>
                      </Dialog>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          </div>
        </motion.aside>
      )}
      {/* Delete Lesson Dialog */}
      <AlertDialog open={showDeleteLessonDialog} onOpenChange={setShowDeleteLessonDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lesson</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this lesson? This action cannot be undone and will also delete all chapters within this lesson.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteLesson} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Delete Chapter Dialog */}
      <AlertDialog open={showDeleteChapterDialog} onOpenChange={setShowDeleteChapterDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chapter</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chapter? This action cannot be undone and will also delete all content within this chapter.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteChapter} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AnimatePresence>
  );
} 