import React, { useState, useEffect } from "react";
import RichEditor from "@/components/RichEditor";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import type { ModuleInfo } from "./ModuleEdit";
import { format } from "date-fns";
import { useLocation } from "wouter";
import { ArrowLeftIcon, Settings, X, Pencil } from "lucide-react";
import { useFrappeUpdateDoc, useFrappeGetDocList, useFrappeCreateDoc, useFrappeDeleteDoc, useFrappeGetDoc } from "frappe-react-sdk";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from "@/components/ui/sheet";
import { BookIcon, FileTextIcon, Trash2 } from "lucide-react";
import { DndContext, closestCenter } from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Info, Settings as SettingsIcon } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { uploadFileToFrappe } from "@/lib/uploadFileToFrappe";
import { LMS_API_BASE_URL } from "@/config/routes";
// @ts-ignore
import isEqual from 'lodash/isEqual';

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

interface LearnerRow {
  user: string;
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
      className={`rounded px-2 py-1 transition-all cursor-pointer group/chapter flex items-center ${chapter.id === activeChapterId ? "bg-primary/20 text-primary font-semibold" : "text-muted-foreground hover:bg-accent hover:text-secondary"}`}
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

function LearnerCombobox({ value, onChange, users }: { value: string; onChange: (val: string) => void; users: any[] }) {
  const [open, setOpen] = useState(false);
  const selectedUser = users.find((u) => u.name === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selectedUser
            ? `${selectedUser.full_name} (${selectedUser.email})`
            : "Select learner"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0">
        <Command>
          <CommandInput placeholder="Search learners..." />
          <CommandList>
            <CommandEmpty>No learner found.</CommandEmpty>
            <CommandGroup>
              {users.map((u) => (
                <CommandItem
                  key={u.name}
                  value={u.name}
                  onSelect={() => {
                    onChange(u.name);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === u.name ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {u.full_name} <span className="text-muted-foreground">({u.email})</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// Update SettingsDialog component
function SettingsDialog({ 
  open, 
  onOpenChange, 
  moduleInfo, 
  editState, 
  setEditState, 
  onSave,
  departments,
  handleFieldChange,
  uploadingImage,
  setUploadingImage
}: { 
  open: boolean;
  onOpenChange: (open: boolean) => void;
  moduleInfo: ModuleInfo;
  editState: ModuleInfo | null;
  setEditState: (state: ModuleInfo | null) => void;
  onSave: () => Promise<void>;
  departments: any[];
  handleFieldChange: (field: keyof ModuleInfo, value: any) => void;
  uploadingImage: boolean;
  setUploadingImage: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  // Fetch all users with LMS Student role
  const { data: lmsStudents, isLoading: loadingStudents } = useFrappeGetDocList("User", {
    fields: ["name", "full_name", "email", "enabled"],
    filters: [["enabled", "=", 1]],
    limit: 1000,
  });
  // Use all users from the data (no roles filter needed)
  const studentUsers = lmsStudents || [];

  // Local learners state for manual assignment
  const [learners, setLearners] = useState<LearnerRow[]>(() => {
    // Try to get from editState if present
    // @ts-ignore
    return (editState && (editState as any).learners) || [];
  });
  useEffect(() => {
    // Sync local learners state if module changes
    // @ts-ignore
    setLearners((editState && (editState as any).learners) || []);
  }, [editState]);

  const handleAddLearnerRow = () => {
    setLearners([...learners, { user: "" }]);
  };
  const handleRemoveLearnerRow = (idx: number) => {
    setLearners(learners.filter((_, i) => i !== idx));
  };
  const handleLearnerChange = (idx: number, user: string) => {
    setLearners(learners.map((l, i) => (i === idx ? { ...l, user } : l)));
  };

  // On save, sync learners to editState
  const handleSaveWithLearners = async () => {
    if (!hasChanges) return;
    if (!editState) return;
    // @ts-ignore
    setEditState({ ...editState, learners });
    await onSave();
  };

  const [search, setSearch] = useState("");

  // Assume originalModule and originalLearners are set when the sidebar opens
  const [originalModule, setOriginalModule] = useState(editState);
  const [originalLearners, setOriginalLearners] = useState(learners);

  useEffect(() => {
    if (open) {
      setOriginalModule(editState);
      setOriginalLearners(learners);
    }
  }, [open]);

  const hasChanges = !isEqual(editState, originalModule) || !isEqual(learners, originalLearners);

  return (
    <Sheet open={open} onOpenChange={(open) => {
      if (!open) {
        setEditState(moduleInfo);
      }
      onOpenChange(open);
    }}>
      <SheetContent side="right" className="w-full sm:max-w-full p-0 overflow-y-auto">
        <div className="h-full flex flex-col overflow-y-auto">
          <SheetHeader className="p-6 border-b">
            <SheetTitle>Module Settings</SheetTitle>
          </SheetHeader>
          <Tabs defaultValue="basic" className="flex-1 flex flex-col">
            <TabsList className="mx-auto mt-4 mb-6">
              <TabsTrigger value="basic">
                <Info className="mr-2 w-4 h-4" /> Basic Details
              </TabsTrigger>
              <TabsTrigger value="settings">
                <SettingsIcon className="mr-2 w-4 h-4" /> Settings
              </TabsTrigger>
            </TabsList>
            <div className="flex-1 overflow-y-auto px-6 pb-6 max-w-3xl mx-auto w-full">
              <TabsContent value="basic">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Module Name</Label>
                    <Input
                      value={editState?.name || ""}
                      onChange={(e) => handleFieldChange("name", e.target.value)}
                      placeholder="Module Name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Module Image</Label>
                    {editState?.image && (
                      <img
                        src={editState.image.startsWith('http') ? editState.image : `${LMS_API_BASE_URL}${editState.image}`}
                        alt="Module"
                        className="mb-2 max-h-32 rounded"
                      />
                    )}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        setUploadingImage(true);
                        try {
                          const url = await uploadFileToFrappe(file);
                          const fullUrl = url.startsWith('http') ? url : `${LMS_API_BASE_URL}${url}`;
                          handleFieldChange("image", fullUrl);
                          toast.success("Image uploaded successfully");
                        } catch (err) {
                          toast.error("Failed to upload image");
                        } finally {
                          setUploadingImage(false);
                        }
                      }}
                      disabled={uploadingImage}
                    />
                    {uploadingImage && <div className="text-sm text-muted-foreground">Uploading...</div>}
                  </div>
                  <Label>Description</Label>
                    <RichEditor
                      content={editState?.description || ""}
                      onChange={(content) => handleFieldChange("description", content)}
                    />
                </div>
              </TabsContent>
              <TabsContent value="settings">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={editState?.status || "Draft"}
                      onValueChange={(value) => handleFieldChange("status", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Draft">Draft</SelectItem>
                        <SelectItem value="Published">Published</SelectItem>
                        <SelectItem value="Archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Duration (days)</Label>
                    <Input
                      type="number"
                      value={editState?.duration || ""}
                      onChange={(e) => handleFieldChange("duration", e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Assignment</Label>
                    <Select
                      value={editState?.assignment_based || "Everyone"}
                      onValueChange={(value) => handleFieldChange("assignment_based", value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Department">Department</SelectItem>
                        <SelectItem value="Everyone">Everyone</SelectItem>
                        <SelectItem value="Manual">Manual</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {editState?.assignment_based === "Department" && (
                    <div className="space-y-2">
                      <Label>Department</Label>
                      <Select
                        value={editState?.department || ""}
                        onValueChange={(value) => handleFieldChange("department", value)}
                      >
                        <SelectTrigger>
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
                    </div>
                  )}
                  {editState?.assignment_based === "Manual" && (
                    <div className=" flex flex-col gap-2">
                      <div>
                        <Label>Learners</Label>
                        {/* Searchable user table with Add button */}
                        <Input
                          placeholder="Search learners..."
                          value={search}
                          onChange={e => setSearch(e.target.value)}
                          className="mb-2 w-full"
                        />
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {studentUsers
                              .filter(u =>
                                u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
                                u.email?.toLowerCase().includes(search.toLowerCase())
                              )
                              .map(u => {
                                const alreadyAdded = learners.some(l => l.user === u.name);
                                return (
                                  <TableRow key={u.name}>
                                    <TableCell>{u.full_name}</TableCell>
                                    <TableCell>{u.email}</TableCell>
                                    <TableCell>
                                      <Button
                                        size="sm"
                                        variant={alreadyAdded ? "secondary" : "outline"}
                                        disabled={alreadyAdded}
                                        onClick={() => {
                                          if (!alreadyAdded) setLearners([...learners, { user: u.name }]);
                                        }}
                                      >
                                        {alreadyAdded ? "Added" : "Add"}
                                      </Button>
                                    </TableCell>
                                  </TableRow>
                                );
                              })}
                          </TableBody>
                        </Table>
                      </div>
                      {/* Current module learners list */}
                      <div className="mt-4">
                        <Label>Current Learners</Label>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {learners.map((row, idx) => {
                              const user = studentUsers.find(u => u.name === row.user);
                              if (!user) return null;
                              return (
                                <TableRow key={row.user}>
                                  <TableCell>{user.full_name}</TableCell>
                                  <TableCell>{user.email}</TableCell>
                                  <TableCell>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => setLearners(learners.filter((l, i) => i !== idx))}
                                    >
                                      Remove
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>
          <div className="p-6 border-t flex justify-end gap-2 max-w-3xl mx-auto w-full">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSaveWithLearners} disabled={!hasChanges}>Save Changes</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Update the Add Lesson Dialog to use Sheet
function AddLessonDialog({
  open,
  onOpenChange,
  onSubmit,
  loading,
  lessonTitle,
  setLessonTitle,
  lessonDesc,
  setLessonDesc,
  chapterTitle,
  setChapterTitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  lessonTitle: string;
  setLessonTitle: (v: string) => void;
  lessonDesc: string;
  setLessonDesc: (v: string) => void;
  chapterTitle: string;
  setChapterTitle: (v: string) => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-full p-0 ">
        <div className="h-full flex flex-col">
          <SheetHeader className="p-6 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle>Add Lesson & Chapter</SheetTitle>
            </div>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-6">
            <form className="space-y-4 max-w-3xl mx-auto" onSubmit={onSubmit}>
              <div>
                <Label htmlFor="sidebar-lesson-title" className="text-sm font-semibold mb-1 block">Lesson Title</Label>
                <Input
                  id="sidebar-lesson-title"
                  value={lessonTitle}
                  onChange={e => setLessonTitle(e.target.value)}
                  placeholder="Enter lesson title"
                  className="w-full text-sm focus-visible:ring-0"
                  required
                />
              </div>
              <div>
                <Label htmlFor="sidebar-lesson-desc" className="text-sm font-semibold mb-1 block mb-2">Lesson Description</Label>
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
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Adding..." : "Create Lesson & Chapter"}
                </Button>
                <SheetClose asChild>
                  <Button type="button" variant="outline" onClick={() => { setLessonTitle(""); setLessonDesc(""); setChapterTitle(""); }}>
                    Cancel
                  </Button>
                </SheetClose>
              </div>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Update DeleteLessonDialog to use Sheet
function DeleteLessonDialog({
  open,
  onOpenChange,
  onConfirm
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-full p-0">
        <div className="h-full flex flex-col">
          <SheetHeader className="p-6 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle>Delete Lesson</SheetTitle>
              <SheetClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </SheetClose>
            </div>
          </SheetHeader>
          
          <div className="flex-1 p-6">
            <div className="max-w-3xl mx-auto space-y-4">
              <p className="text-muted-foreground">
                Are you sure you want to delete this lesson? This action cannot be undone and will also delete all chapters within this lesson.
              </p>
              <div className="flex justify-end gap-2">
                <SheetClose asChild>
                  <Button variant="outline">Cancel</Button>
                </SheetClose>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    onConfirm();
                    onOpenChange(false);
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Update DeleteChapterDialog to use Sheet
function DeleteChapterDialog({
  open,
  onOpenChange,
  onConfirm
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-full p-0">
        <div className="h-full flex flex-col">
          <SheetHeader className="p-6 border-b">
            <div className="flex items-center justify-between">
              <SheetTitle>Delete Chapter</SheetTitle>
              <SheetClose asChild>
                <Button variant="ghost" size="icon">
                  <X className="h-4 w-4" />
                </Button>
              </SheetClose>
            </div>
          </SheetHeader>
          
          <div className="flex-1 p-6">
            <div className="max-w-3xl mx-auto space-y-4">
              <p className="text-muted-foreground">
                Are you sure you want to delete this chapter? This action cannot be undone and will also delete all content within this chapter.
              </p>
              <div className="flex justify-end gap-2">
                <SheetClose asChild>
                  <Button variant="outline">Cancel</Button>
                </SheetClose>
                <Button 
                  variant="destructive" 
                  onClick={() => {
                    onConfirm();
                    onOpenChange(false);
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Add this new component for sortable lessons
function SortableLesson({ lesson, activeLessonId, setActiveLessonId, setActiveChapterId, onDelete, activeChapterId, setChapterToDelete, setShowDeleteChapterDialog, onChapterReorder }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: lesson.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
    background: lesson.id === activeLessonId ? "var(--color-primary-20)" : undefined,
  };
  const isActiveLesson = lesson.id === activeLessonId;
  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`relative rounded-lg px-3 py-2 transition-all cursor-pointer group flex flex-col ${isActiveLesson ? "bg-primary/10 border-l-4 border-primary shadow-md text-primary font-bold" : "hover:bg-muted text-foreground"}`}
      onClick={() => {
        setActiveLessonId && setActiveLessonId(lesson.id);
        if (lesson.chapters?.length && setActiveChapterId) {
          setActiveChapterId(lesson.chapters[0].id);
        }
      }}
    >
      <div className="flex items-center justify-between gap-2 min-w-0 flex-1 w-full">
        <span {...attributes} {...listeners} className="cursor-grab p-2 mr-2 text-muted-foreground group-hover:text-foreground flex items-center">
          <GripVertical className="w-5 h-5" />
        </span>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <BookIcon className="w-4 h-4" />
          <span className="truncate flex-1 min-w-0">{lesson.title}</span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
          onClick={e => { e.stopPropagation(); onDelete(); }}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
      {/* Render chapters if any */}
      {lesson.chapters && lesson.chapters.length > 0 && (
        <DndContext
          collisionDetection={closestCenter}
          onDragStart={() => {}}
          onDragEnd={event => onChapterReorder(event, lesson)}
        >
          <SortableContext
            items={lesson.chapters.map((c: any) => c.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul className="ml-6 mt-1 space-y-1">
              {lesson.chapters.map((chapter: any, chapterIndex: number) => (
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
    </li>
  );
}

export default function Sidebar({ isOpen, fullScreen, moduleInfo, module, onFinishSetup, isMobile, onLessonAdded, activeLessonId, setActiveLessonId, activeChapterId, setActiveChapterId }: ModuleSidebarProps) {
  const [, setLocation] = useLocation();
  const { updateDoc, loading: saving } = useFrappeUpdateDoc();
  const [editState, setEditState] = useState<ModuleInfo | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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
  const [dragLessonActiveId, setDragLessonActiveId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fetch departments for the department selector
  const { data: departments } = useFrappeGetDocList("Department", {
    fields: ["name", "department"],
  });

  // In Sidebar component, add a refetch function for moduleInfo
  type LMSModule = ModuleInfo; // or import the correct type if available
  const { data: freshModuleInfo, mutate: refetchModuleInfo } = useFrappeGetDoc<LMSModule>(
    "LMS Module",
    moduleInfo?.id || "",
    { swrConfig: { revalidateOnFocus: false } }
  );

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
    const moduleFields = ["name", "description", "duration", "status", "assignment_based", "department"];
    const moduleChanged = moduleFields.some(f => (editState as any)[f] !== (moduleInfo as any)[f]);
    
    // Check content structure changes (lessons, chapters, contents)
    const contentChanged = JSON.stringify(module?.lessons) !== JSON.stringify(moduleInfo.lessons);
    
    setHasChanges(moduleChanged || contentChanged);
  }, [editState, moduleInfo, module]);

  const handleSave = async () => {
    if (!editState || !moduleInfo) return;
    
    try {
      // Prepare the update data
      const updateData: any = {
        name: editState.name,
        description: editState.description,
        duration: editState.duration,
        status: editState.status,
        assignment_based: editState.assignment_based,
        department: editState.department,
        image: editState.image,
      };

      // Only include lessons if they exist in the current module state
      if (module?.lessons) {
        const formattedLessons = module.lessons.map((lesson, index) => ({
          lesson: lesson.id,
          order: index + 1
        }));
        updateData.lessons = formattedLessons;
      }

      // --- ADD: include learners if assignment_based is Manual ---
      if (editState.assignment_based === "Manual") {
        // learners should be an array of { user: userId }
        // @ts-ignore
        updateData.learners = (editState as any).learners || [];
      }

      // Update module info
      await updateDoc("LMS Module", moduleInfo.id, updateData);

      toast.success("Module saved successfully");
      setHasChanges(false);
      setShowSettings(false);
      // Refetch the latest module info from backend
      await refetchModuleInfo();
      if (freshModuleInfo) {
        setEditState({ ...freshModuleInfo });
      }
      onFinishSetup?.(editState);
    } catch (err) {
      console.error("Save error:", err);
      toast.error("Failed to save module");
    }
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

  // Handler for drag end (lessons)
  const handleLessonDragEnd = async (event: any) => {
    setDragLessonActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id || !module?.lessons || !moduleInfo) return;
    const oldIndex = module.lessons.findIndex((l: any) => l.id === active.id);
    const newIndex = module.lessons.findIndex((l: any) => l.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const newLessons = arrayMove(module.lessons, oldIndex, newIndex);
    // Update backend order
    try {
      await updateDoc("LMS Module", moduleInfo.id, {
        lessons: newLessons.map((l: any, idx: number) => ({ lesson: l.id, order: idx + 1 }))
      });
      toast.success("Lessons reordered");
      onLessonAdded?.(); // Refresh
    } catch (err) {
      toast.error("Failed to reorder lessons");
    }
  };

  // In Sidebar component, add the chapter drag end handler:
  const handleChapterDragEnd = async (event: any, lesson: any) => {
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

  const handleFieldChange = (field: keyof ModuleInfo, value: any) => {
    if (!editState) return;
    setEditState({ ...editState, [field]: value });
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
                className="mb-4 w-full hover:bg-accent hover:text-primary"
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
                    <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <div className="font-bold text-lg break-words whitespace-pre-wrap" title={moduleInfo.name}>
                          {moduleInfo.name}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowSettings(true)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Module Image</Label>
                      {moduleInfo?.image && (
                        <img
                          src={moduleInfo.image.startsWith('http') ? moduleInfo.image : `${LMS_API_BASE_URL}${moduleInfo.image}`}
                          alt="Module"
                          className="mb-2 max-h-32 rounded"
                        />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <div className="prose prose-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: moduleInfo.description || "" }} />
                    </div>

                    {/* Lessons/Chapters Hierarchy */}                    {module?.lessons && (
                      <div className="mt-6">
                        <h4 className="text-sm font-semibold mb-2">Lessons</h4>
                        {module.lessons.length > 0 && (
                          <DndContext
                            collisionDetection={closestCenter}
                            onDragStart={event => setDragLessonActiveId(String(event.active.id))}
                            onDragEnd={handleLessonDragEnd}
                          >
                            <SortableContext
                              items={(module.lessons ?? []).map((l: any) => l.id)}
                              strategy={verticalListSortingStrategy}
                            >
                              <ul className="space-y-2">
                                {module.lessons.map((lesson, lessonIndex) => (
                                  <SortableLesson
                                    key={lesson.id || `lesson-${lessonIndex}`}
                                    lesson={lesson}
                                    activeLessonId={activeLessonId}
                                    setActiveLessonId={setActiveLessonId}
                                    setActiveChapterId={setActiveChapterId}
                                    onDelete={() => { setLessonToDelete(lesson.id); setShowDeleteLessonDialog(true); }}
                                    activeChapterId={activeChapterId}
                                    setChapterToDelete={setChapterToDelete}
                                    setShowDeleteChapterDialog={setShowDeleteChapterDialog}
                                    onChapterReorder={handleChapterDragEnd}
                                  />
                                ))}
                              </ul>
                            </SortableContext>
                          </DndContext>
                        )}
                        {/* Add Lesson Button */}
                        <Button
                          className="w-full mt-4"
                          variant="default"
                          onClick={() => setAddingLesson(true)}
                        >
                          <span className="flex items-center justify-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                            Add Lesson
                          </span>
                        </Button>
                        {/* Add Lesson Dialog */}
                        <AddLessonDialog
                          open={addingLesson}
                          onOpenChange={setAddingLesson}
                          onSubmit={handleAddLesson}
                          loading={addingLessonLoading}
                          lessonTitle={lessonTitle}
                          setLessonTitle={setLessonTitle}
                          lessonDesc={lessonDesc}
                          setLessonDesc={setLessonDesc}
                          chapterTitle={chapterTitle}
                          setChapterTitle={setChapterTitle}
                        />
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.aside>
      )}

      {/* Settings Dialog */}
      <SettingsDialog
        open={showSettings}
        onOpenChange={setShowSettings}
        moduleInfo={moduleInfo!}
        editState={editState}
        setEditState={setEditState}
        onSave={handleSave}
        departments={departments || []}
        handleFieldChange={handleFieldChange}
        uploadingImage={uploadingImage}
        setUploadingImage={setUploadingImage}
      />

      {/* Delete Lesson Dialog */}
      <DeleteLessonDialog
        open={showDeleteLessonDialog}
        onOpenChange={setShowDeleteLessonDialog}
        onConfirm={handleDeleteLesson}
      />

      {/* Delete Chapter Dialog */}
      <DeleteChapterDialog
        open={showDeleteChapterDialog}
        onOpenChange={setShowDeleteChapterDialog}
        onConfirm={handleDeleteChapter}
      />
    </AnimatePresence>
  );
} 