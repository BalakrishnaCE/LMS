import { useParams, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { useFrappeGetDoc, useFrappeUpdateDoc } from "frappe-react-sdk";
import type { Module, Lesson, Chapter, ModuleSidebarProps, ModuleMainEditorProps, ChapterEditorProps, ModuleModalsProps } from "./types";
import ModuleSidebar from "./ModuleSidebar";
import ModuleMainEditor from "./ModuleMainEditor";
import ChapterEditor from "./ChapterEditor";
import ModuleModals from "./ModuleModals";

export default function ModuleEdit() {
    const params = useParams();
    const [, setLocation] = useLocation();
    const moduleName = params.moduleName;

    // --- EDIT EXISTING MODULE LOGIC ---
    if (moduleName) {
        const { data: moduleData, error, isValidating } = useFrappeGetDoc<Module>(
            "LMS Module",
            moduleName,
            { fields: ["name", "name1", "description", "is_published", "image", "lessons"] }
        );
        const { updateDoc, loading: updating, error: updateError } = useFrappeUpdateDoc();
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
        const [sidebarLessons, setSidebarLessons] = useState<Lesson[]>([]);
        const [sidebarChapters, setSidebarChapters] = useState<Record<string, Chapter[]>>({});

        // Sync lessons from moduleData
        useEffect(() => {
            if (moduleData?.lessons) setSidebarLessons(moduleData.lessons);
        }, [moduleData]);

        // Fetch chapters for selected lesson if not already in state
        const selectedLesson = sidebarLessons[selectedLessonIdx];
        useEffect(() => {
            if (!selectedLesson) return;
            if (sidebarChapters[selectedLesson.lesson]) return;
            fetch(`http://10.80.4.72/api/resource/Lesson/${selectedLesson.lesson}`, { credentials: 'include' })
                .then(res => res.json())
                .then(data => {
                    setSidebarChapters(prev => ({
                        ...prev,
                        [selectedLesson.lesson]: data.data.chapters || []
                    }));
                });
        }, [selectedLesson, sidebarChapters]);

        // Get selected chapter from sidebarChapters
        const selectedChapter = sidebarChapters[selectedLesson?.lesson]?.[selectedChapterIdx ?? 0];

        // Only use SDK for the currently active lesson and chapter if editing
        const { data: activeLessonData } = useFrappeGetDoc('Lesson', selectedLesson?.lesson, { enabled: !!selectedLesson });
        const { data: activeChapterData } = useFrappeGetDoc('Chapter', selectedChapter?.chapter, { enabled: !!selectedChapter });

        // Update local state after lesson/chapter edit
        const handleLessonUpdate = (updatedLesson: Lesson) => {
            setSidebarLessons(lessons =>
                lessons.map(l => l.lesson === updatedLesson.lesson ? updatedLesson : l)
            );
            setUnsaved(true);
        };

        const handleChapterUpdate = (lessonId: string, updatedChapter: Chapter) => {
            setSidebarChapters(chapters =>
                ({
                    ...chapters,
                    [lessonId]: chapters[lessonId].map(c => c.chapter === updatedChapter.chapter ? updatedChapter : c)
                })
            );
            setUnsaved(true);
        };

        // Sync fetched data to local state
        useEffect(() => {
            if (moduleData) setEditModule(JSON.parse(JSON.stringify(moduleData)));
        }, [moduleData]);

        // Fetch lesson details when lessons change, but only fetch missing lessons
        useEffect(() => {
            const fetchMissingLessons = async () => {
                const missing = sidebarLessons.filter(l => !lessonDetails[l.lesson]);
                if (missing.length === 0) return;
                const details: Record<string, any> = {};
                for (const lesson of missing) {
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
                if (Object.keys(details).length > 0) {
                    setLessonDetails(prev => ({ ...prev, ...details }));
                }
            };
            if (sidebarLessons.length > 0) {
                fetchMissingLessons();
            }
        }, [sidebarLessons]);

        // Fetch chapter details for the selected lesson, but only fetch missing chapters
        useEffect(() => {
            let isCurrent = true;
            if (!selectedLesson || !selectedLesson.lesson) {
                setChapterDetailsSidebar({});
                setActiveChapterId(null);
                return;
            }
            const chapters = lessonDetails[selectedLesson.lesson]?.chapters;
            if (!chapters) {
                setChapterDetailsSidebar({});
                setActiveChapterId(null);
                return;
            }
            const fetchMissingChapters = async () => {
                const missing = chapters.filter((c: any) => !chapterDetailsSidebar[c.chapter]);
                if (missing.length === 0) return;
                const details: Record<string, any> = {};
                for (const chapter of missing) {
                    try {
                        const response = await fetch(`http://10.80.4.72/api/resource/Chapter/${chapter.chapter}`, {
                            credentials: 'include'
                        });
                        const data = await response.json();
                        if (!isCurrent) return;
                        details[chapter.chapter] = data.data;
                    } catch (error) {}
                }
                if (isCurrent && Object.keys(details).length > 0) {
                    setChapterDetailsSidebar(prev => ({ ...prev, ...details }));
                }
            };
            fetchMissingChapters();
            return () => { isCurrent = false; };
        }, [selectedLesson, lessonDetails[selectedLesson?.lesson]?.chapters]);

        // Auto-select first chapter when lessonDetails for selected lesson is loaded
        useEffect(() => {
            if (selectedLesson && lessonDetails[selectedLesson.lesson]?.chapters?.length > 0) {
                const firstChapter = lessonDetails[selectedLesson.lesson].chapters[0];
                setActiveChapter(firstChapter.chapter, 0);
            }
        }, [selectedLesson, lessonDetails]);

        // Handlers for inline editing
        const handleModuleField = (field: string, value: any) => {
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

            } catch (error) {
                console.error('Error reordering chapters:', error);
            }
        };

        const handleSave = async () => {
            if (!editModule) return;
            setSaving(true);
            try {
                await updateDoc("LMS Module", editModule.name, {
                    name1: editModule.name1,
                    description: editModule.description,
                    lessons: editModule.lessons
                });
                setUnsaved(false);
            } catch (error) {
                console.error('Error saving module:', error);
            } finally {
                setSaving(false);
            }
        };

        const handleDelete = () => {
            if (!deleteTarget) return;
            // Handle deletion logic
        };

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

        const setActiveChapter = (chapterId: string, cidx: number | null = null) => {
            setActiveChapterId(chapterId);
            if (cidx !== null) setSelectedChapterIdx(cidx);
        };

        const handleChapterClick = (chapterId: string, cidx: number) => {
            setActiveChapter(chapterId, cidx);
        };

        if (error) return <div>Error loading module: {error.message}</div>;
        if (isValidating) return <div>Loading...</div>;
        if (!moduleData) return <div>Module not found</div>;

        const sidebarProps: ModuleSidebarProps = {
            moduleName: editModule?.name1 || '',
            moduleDescription: editModule?.description || '',
            moduleImage: editModule?.image || '',
            modulePublished: editModule?.is_published === 1,
            onModuleFieldChange: handleModuleField,
            onEditDescription: () => setShowDescModal(true),
            lessons: sidebarLessons,
            lessonDetails,
            selectedLessonIdx,
            setSelectedLessonIdx,
            selectedChapterIdx,
            setSelectedChapterIdx,
            chapterDetailsSidebar,
            handleChapterClick,
            setShowLessonModal,
            onReorderLessons: handleReorderLessons,
            onSave: handleSave,
            isSaving: saving,
            hasUnsavedChanges: unsaved
        };

        const mainEditorProps: ModuleMainEditorProps = {
            activeChapterId,
            chapterDetailsSidebar,
            activeLessonName: selectedLesson?.lesson || null,
            lessonDetails,
            onChapterSelect: setActiveChapterId,
            onLessonUpdate: () => handleLessonUpdate(selectedLesson),
            onChapterUpdate: () => selectedLesson && selectedChapter && handleChapterUpdate(selectedLesson.lesson, selectedChapter)
        };

        const chapterEditorProps: ChapterEditorProps | null = selectedChapter ? {
            chapter: selectedChapter,
            onChapterUpdate: () => selectedLesson && handleChapterUpdate(selectedLesson.lesson, selectedChapter)
        } : null;

        const modalProps: ModuleModalsProps = {
            showDescModal,
            setShowDescModal,
            descContent: editModule?.description || '',
            setDescContent: (val: string) => handleModuleField('description', val),
            showLessonModal,
            setShowLessonModal,
            showChapterModal,
            setShowChapterModal,
            showContentModal,
            setShowContentModal,
            showBackConfirm,
            setShowBackConfirm,
            confirmBack,
            deleteTarget,
            handleDelete,
            setDeleteTarget
        };

        return (
            <div className="flex h-screen w-full">
                <ModuleSidebar {...sidebarProps} />
                <div className="flex-1 overflow-auto w-full py-4 px-4">
                    <ModuleMainEditor {...mainEditorProps} />
                    {chapterEditorProps && <ChapterEditor {...chapterEditorProps} />}
                </div>
                <ModuleModals {...modalProps} />
            </div>
        );
    }

    // --- CREATE NEW MODULE LOGIC ---
    const [editModule, setEditModule] = useState<Module>({
        name: '',
        name1: '',
        description: '',
        is_published: 0,
        image: '',
        lessons: []
    });
    const [sidebarLessons, setSidebarLessons] = useState<Lesson[]>([]);
    const [sidebarChapters, setSidebarChapters] = useState<Record<string, Chapter[]>>({});
    const [selectedLessonIdx, setSelectedLessonIdx] = useState(0);
    const [selectedChapterIdx, setSelectedChapterIdx] = useState<number | null>(null);
    const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
    const [showLessonModal, setShowLessonModal] = useState(false);
    const [showChapterModal, setShowChapterModal] = useState(false);
    const [showContentModal, setShowContentModal] = useState(false);
    const [showDescModal, setShowDescModal] = useState(false);
    const [showBackConfirm, setShowBackConfirm] = useState(false);
    const [unsaved, setUnsaved] = useState(false);
    const [saving, setSaving] = useState(false);
    const [lessonDetails, setLessonDetails] = useState<Record<string, any>>({});
    const [chapterDetailsSidebar, setChapterDetailsSidebar] = useState<Record<string, any>>({});
    const [deleteTarget, setDeleteTarget] = useState<{ type: string; idx: number } | null>(null);

    // Handlers for new module creation (no fetches)
    const handleModuleField = (field: string, value: any) => {
        setEditModule({ ...editModule, [field]: value });
        setUnsaved(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Handle saving logic for new module
        } catch (error) {
            console.error('Error saving module:', error);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = () => {
        if (!deleteTarget) return;
        // Handle deletion logic
    };

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

    const setActiveChapter = (chapterId: string, cidx: number | null = null) => {
        setActiveChapterId(chapterId);
        if (cidx !== null) setSelectedChapterIdx(cidx);
    };

    const handleChapterClick = (chapterId: string, cidx: number) => {
        setActiveChapter(chapterId, cidx);
    };

    // Prepare props and render for new module
    const selectedChapter = null;
    const sidebarProps: ModuleSidebarProps = {
        moduleName: editModule.name1,
        moduleDescription: editModule.description,
        moduleImage: editModule.image,
        modulePublished: editModule.is_published === 1,
        onModuleFieldChange: handleModuleField,
        onEditDescription: () => setShowDescModal(true),
        lessons: sidebarLessons,
        lessonDetails,
        selectedLessonIdx,
        setSelectedLessonIdx,
        selectedChapterIdx,
        setSelectedChapterIdx,
        chapterDetailsSidebar,
        handleChapterClick,
        setShowLessonModal,
        onReorderLessons: (fromIdx, toIdx) => {
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
        },
        onSave: handleSave,
        isSaving: saving,
        hasUnsavedChanges: unsaved
    };

    const mainEditorProps: ModuleMainEditorProps = {
        activeChapterId,
        chapterDetailsSidebar,
        activeLessonName: null,
        lessonDetails,
        onChapterSelect: setActiveChapterId,
        onLessonUpdate: () => {
            // Handle lesson update for new module
        },
        onChapterUpdate: () => {
            // Handle chapter update for new module
        }
    };

    const chapterEditorProps: ChapterEditorProps | null = selectedChapter ? {
        chapter: selectedChapter,
        onChapterUpdate: () => {
            // Handle chapter update for new module
        }
    } : null;

    const modalProps: ModuleModalsProps = {
        showDescModal,
        setShowDescModal,
        descContent: editModule.description,
        setDescContent: (val: string) => handleModuleField('description', val),
        showLessonModal,
        setShowLessonModal,
        showChapterModal,
        setShowChapterModal,
        showContentModal,
        setShowContentModal,
        showBackConfirm,
        setShowBackConfirm,
        confirmBack,
        deleteTarget,
        handleDelete,
        setDeleteTarget
    };

    return (
        <div className="flex h-screen w-full">
            <ModuleSidebar {...sidebarProps} />
            <div className="flex-1 overflow-auto w-full py-4 px-4">
                <ModuleMainEditor {...mainEditorProps} />
                {chapterEditorProps && <ChapterEditor {...chapterEditorProps} />}
            </div>
            <ModuleModals {...modalProps} />
        </div>
    );
} 