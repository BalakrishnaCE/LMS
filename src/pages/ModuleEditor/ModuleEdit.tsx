import { useParams, useLocation } from "wouter";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFrappeGetDoc, useFrappeUpdateDoc } from "frappe-react-sdk";
import type { Module, Lesson, Chapter, ContentBlock } from "./types";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import RichEditor from "@/components/RichEditor";
import { ArrowLeft, BookOpen } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ModuleSidebar from "./ModuleSidebar";
import ModuleMainEditor from "./ModuleMainEditor";
import ChapterEditor from "./ChapterEditor";
import ModuleModals from "./ModuleModals";

// Scaffold for the full module editor UI
export default function ModuleEdit() {
    const params = useParams();
    const [, setLocation] = useLocation();
    const moduleName = params.moduleName;

    // Fetch module data
    const { data: moduleData, error, isValidating, mutate } = useFrappeGetDoc<Module>("LMS Module", moduleName, {
        fields: [
            "name", "name1", "description", "is_published", "image", "lessons"
        ]
    });

    const { updateDoc, loading: updating, error: updateError } = useFrappeUpdateDoc();

    // Local state for editing
    const [editModule, setEditModule] = useState<Module | null>(null);
    const [selectedLessonIdx, setSelectedLessonIdx] = useState(0);
    const [showLessonModal, setShowLessonModal] = useState(false);
    const [showChapterModal, setShowChapterModal] = useState(false);
    const [showContentModal, setShowContentModal] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<{ type: string; idx: number } | null>(null);
    const [saving, setSaving] = useState(false);
    const [showBackConfirm, setShowBackConfirm] = useState(false);
    const [unsaved, setUnsaved] = useState(false);
    const [showDescModal, setShowDescModal] = useState(false);
    const [lessonDetails, setLessonDetails] = useState<Record<string, any>>({});
    const [chapterDetailsSidebar, setChapterDetailsSidebar] = useState<Record<string, any>>({});
    const [selectedChapterIdx, setSelectedChapterIdx] = useState<number | null>(null);
    const [activeChapterId, setActiveChapterId] = useState<string | null>(null);

    // Sync fetched data to local state
    useEffect(() => {
        if (moduleData) setEditModule(JSON.parse(JSON.stringify(moduleData)));
    }, [moduleData]);

    // Memoized lessons for sidebar
    const lessons = useMemo(() => editModule?.lessons || [], [editModule]);
    const selectedLesson = lessons[selectedLessonIdx];

    // Fetch lesson details using useFrappeGetDoc
    const lessonName = selectedLesson?.lesson;
    const { data: lessonDetailsData, isLoading: lessonLoading, error: lessonError } = useFrappeGetDoc('Lesson', lessonName);
    const chapters = lessonDetailsData?.chapters || [];

    // Fetch chapter details for the first chapter as an example
    const firstChapterName = chapters[0]?.chapter;
    const { data: chapterDetails, isLoading: chapterLoading, error: chapterError } = useFrappeGetDoc('Chapter', firstChapterName);
    const contents = chapterDetails?.contents || [];

    // Fetch lesson details when lessons change
    useEffect(() => {
        const fetchLessonDetails = async () => {
            const details: Record<string, any> = {};
            for (const lesson of lessons) {
                try {
                    const response = await fetch(`http://10.80.4.72/api/resource/Lesson/${lesson.lesson}`, {
                        credentials: 'include'
                    });
                    const data = await response.json();
                    details[lesson.lesson] = data.data;
                } catch (error) {
                    // Optionally handle error
                }
            }
            setLessonDetails(details);
        };
        if (lessons.length > 0) {
            fetchLessonDetails();
        }
    }, [lessons]);

    // Fetch chapter details for the selected lesson
    useEffect(() => {
        let isCurrent = true;
        if (!selectedLesson || !selectedLesson.lesson) {
            setChapterDetailsSidebar({});
            setActiveChapterId(null);
            return;
        }
        const fetchChapterDetails = async () => {
            const chapters = lessonDetails[selectedLesson.lesson]?.chapters;
            if (!chapters) {
                setChapterDetailsSidebar({});
                setActiveChapterId(null);
                return;
            }
            const details: Record<string, any> = {};
            for (const chapter of chapters) {
                try {
                    const response = await fetch(`http://10.80.4.72/api/resource/Chapter/${chapter.chapter}`, {
                        credentials: 'include'
                    });
                    const data = await response.json();
                    if (!isCurrent) return;
                    details[chapter.chapter] = data.data;
                } catch (error) {}
            }
            if (isCurrent) setChapterDetailsSidebar(details);
        };
        fetchChapterDetails();
        return () => { isCurrent = false; };
    }, [selectedLesson, lessonDetails]);

    // Auto-select first chapter when lessonDetails for selected lesson is loaded
    useEffect(() => {
        if (selectedLesson && lessonDetails[selectedLesson.lesson]?.chapters?.length > 0) {
            const firstChapter = lessonDetails[selectedLesson.lesson].chapters[0];
            setActiveChapter(firstChapter.chapter, 0);
        }
    }, [selectedLesson, lessonDetails]);

    // Handlers for inline editing
    const handleModuleField = (field: keyof Module, value: any) => {
        if (!editModule) return;
        setEditModule({ ...editModule, [field]: value });
        setUnsaved(true);
    };

    // Handle lesson reordering
    const handleReorderLessons = (fromIdx: number, toIdx: number) => {
        if (!editModule) return;
        const newLessons = [...editModule.lessons];
        const [movedLesson] = newLessons.splice(fromIdx, 1);
        newLessons.splice(toIdx, 0, movedLesson);
        
        // Update order numbers
        const updatedLessons = newLessons.map((lesson, idx) => ({
            ...lesson,
            order: idx + 1
        }));

        setEditModule({ ...editModule, lessons: updatedLessons });
        setUnsaved(true);
    };

    // Handle chapter reordering
    const handleReorderChapters = async (lessonId: string, fromIdx: number, toIdx: number) => {
        if (!editModule) return;
        
        try {
            // Get the current lesson details from state
            const currentLessonDetails = lessonDetails[lessonId];
            if (!currentLessonDetails) return;

            // Create a new array of chapters and reorder
            const chapters = [...currentLessonDetails.chapters];
            const [movedChapter] = chapters.splice(fromIdx, 1);
            chapters.splice(toIdx, 0, movedChapter);

            // Update order numbers
            const updatedChapters = chapters.map((chapter: any, idx: number) => ({
                ...chapter,
                order: idx + 1
            }));

            // Update the lesson with new chapter order
            await updateDoc("Lesson", lessonId, {
                chapters: updatedChapters
            });

            // Update local state immediately for better UX
            const updatedLessonDetails = {
                ...currentLessonDetails,
                chapters: updatedChapters
            };

            setLessonDetails(prev => ({
                ...prev,
                [lessonId]: updatedLessonDetails
            }));

            // Update chapter details in sidebar
            const updatedChapterDetails = { ...chapterDetailsSidebar };
            for (const chapter of updatedChapters) {
                if (updatedChapterDetails[chapter.chapter]) {
                    updatedChapterDetails[chapter.chapter] = {
                        ...updatedChapterDetails[chapter.chapter],
                        order: chapter.order
                    };
                }
            }
            setChapterDetailsSidebar(updatedChapterDetails);

            // If the moved chapter was the active one, update its index
            if (activeChapterId === movedChapter.chapter) {
                setSelectedChapterIdx(toIdx);
            }

            // Refresh lesson details from server to ensure consistency
            const serverLessonDetails = await fetch(`http://10.80.4.72/api/resource/Lesson/${lessonId}`, {
                credentials: 'include'
            }).then(res => res.json());
            
            if (serverLessonDetails.data) {
                setLessonDetails(prev => ({
                    ...prev,
                    [lessonId]: serverLessonDetails.data
                }));
            }

            setUnsaved(true);
        } catch (error) {
            console.error('Error updating chapter order:', error);
            // Optionally show an error toast here
        }
    };

    // Save handler using frappe-react-sdk
    const handleSave = async () => {
        if (!editModule) return;
        setSaving(true);
        try {
            await updateDoc("LMS Module", editModule.name, {
                name1: editModule.name1,
                description: editModule.description,
                is_published: editModule.is_published,
                image: editModule.image,
                lessons: editModule.lessons
            });
            setUnsaved(false);
        } catch (e) {
            // handle error (could show a toast)
        } finally {
            setSaving(false);
        }
    };

    // Delete confirmation
    const handleDelete = () => {
        // TODO: Implement delete logic
        setDeleteTarget(null);
    };

    // Back button handler
    const handleBack = () => {
        if (unsaved) {
            setShowBackConfirm(true);
        } else {
            setLocation("/modules");
        }
    };

    const confirmBack = () => {
        setShowBackConfirm(false);
        setLocation("/modules");
    };

    // Helper to set both active chapter and selected chapter index
    const setActiveChapter = (chapterId: string, cidx: number | null = null) => {
        setActiveChapterId(chapterId);
        if (cidx !== null) setSelectedChapterIdx(cidx);
    };

    // Sidebar chapter click handler
    const handleChapterClick = (chapterId: string, cidx: number) => {
        setActiveChapter(chapterId, cidx);
    };

    if (error) return <div className="p-8">Error loading module</div>;
    if (isValidating || !editModule) return <div className="p-8">Loading...</div>;

    return (
        <div className="flex h-screen w-full">
            {/* Animated Back Button - fixed at top left, outside sidebar */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="fixed top-4 left-4 z-30">
                <Button variant="ghost" size="sm" onClick={handleBack} className="gap-2 hover:bg-primary/10">
                    <ArrowLeft className="h-4 w-4" />
                    Back to Modules
                </Button>
            </motion.div>
            {/* Sidebar */}
            <ModuleSidebar
                moduleName={editModule.name1}
                moduleDescription={editModule.description}
                moduleImage={editModule.image}
                modulePublished={editModule.is_published === 1}
                onModuleFieldChange={(field, value) => handleModuleField(field as keyof typeof editModule, value)}
                onEditDescription={() => setShowDescModal(true)}
                lessons={lessons}
                lessonDetails={lessonDetails}
                selectedLessonIdx={selectedLessonIdx}
                setSelectedLessonIdx={setSelectedLessonIdx}
                selectedChapterIdx={selectedChapterIdx}
                setSelectedChapterIdx={setSelectedChapterIdx}
                chapterDetailsSidebar={chapterDetailsSidebar}
                handleChapterClick={handleChapterClick}
                setShowLessonModal={setShowLessonModal}
                onReorderLessons={handleReorderLessons}
            />
            {/* Main Content: Chapter Editor */}
            <main className="flex-1 p-8 overflow-y-auto">
                <ModuleMainEditor
                    activeChapterId={activeChapterId}
                    chapterDetailsSidebar={chapterDetailsSidebar}
                    activeLessonName={selectedLesson?.lesson || null}
                    lessonDetails={lessonDetails}
                    onChapterSelect={setActiveChapterId}
                />
                {/* Modals and Delete Confirmation */}
                <ModuleModals
                    showDescModal={showDescModal}
                    setShowDescModal={setShowDescModal}
                    descContent={editModule.description}
                    setDescContent={val => setEditModule({ ...editModule, description: val })}
                    showLessonModal={showLessonModal}
                    setShowLessonModal={setShowLessonModal}
                    showChapterModal={showChapterModal}
                    setShowChapterModal={setShowChapterModal}
                    showContentModal={showContentModal}
                    setShowContentModal={setShowContentModal}
                    showBackConfirm={showBackConfirm}
                    setShowBackConfirm={setShowBackConfirm}
                    confirmBack={confirmBack}
                    deleteTarget={deleteTarget}
                    handleDelete={handleDelete}
                    setDeleteTarget={setDeleteTarget}
                />
            </main>
        </div>
    );
} 