import { useState, useEffect } from "react";
import { useParams } from "wouter";
import Sidebar from "./Sidebar";
import SidebarToggle from "./SidebarToggle";
import ContentStructureEditor from "./content-structure";
import { useIsMobile } from "@/hooks/use-mobile";
import { DndContext } from "@dnd-kit/core";
import { useModuleState } from "./content-structure/useModuleState";
import { reorderContentBlocks } from "./content-structure/utils";
import { useFrappeGetCall, useFrappeUpdateDoc } from "frappe-react-sdk";
import { toast } from "sonner";
import Lottie from 'lottie-react';
import errorAnimation from '@/assets/Error.json';
import loadingAnimation from '@/assets/Loading.json';
import { NavigationProvider } from "@/contexts/NavigationContext";

interface Lesson {
  id: string;
  title: string;
  description?: string;
  chapters: { id: string; title: string; scoring?: number; contents?: any[] }[];
}

export interface ModuleInfo {
  id: string;
  name: string;
  name1: string;
  description: string;
  duration: string;
  status: string;
  assignment_based: string;
  department?: string;
  created_by?: string;
  creation?: string;
  lessons?: Lesson[];
  image?: string;
  learners?: { user: string }[];
  order?: number;
}

export default function ModuleEdit() {
  const params = useParams();
  const moduleId = params?.moduleId;
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [moduleInfo, setModuleInfo] = useState<ModuleInfo | null>(null);
  const isMobile = useIsMobile();
  const { module, addContentToChapter, setModule } = useModuleState();
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const { updateDoc } = useFrappeUpdateDoc();

  // Use the get_module_with_details endpoint
  const { data: moduleData, error, isLoading, mutate } = useFrappeGetCall(
    'novel_lms.novel_lms.api.module_management.get_module_with_details', 
    { module_id: moduleId },
    { enabled: !!moduleId }
  );

  // Normalize chapter contents after module data load
  useEffect(() => {
    function normalizeModule(moduleDataObj: any) {
      if (!moduleDataObj) {
        console.warn('ModuleEdit - normalizeModule: moduleDataObj is null or undefined');
        return null;
      }
      
      // Handle case where lessons might be empty array or undefined
      if (!moduleDataObj.lessons || !Array.isArray(moduleDataObj.lessons)) {
        console.warn('ModuleEdit - normalizeModule: lessons is missing or not an array, using empty array');
        return {
          ...moduleDataObj,
          lessons: []
        };
      }
      const normalizedModule = {
        ...moduleDataObj,
        lessons: moduleDataObj.lessons.map((lesson: any) => ({
          ...lesson,
          id: lesson.name, // Use lesson.name as id (actual document name)
          title: lesson.lesson_name, // Map lesson_name to title for UI consistency
          chapters: lesson.chapters?.map((chapter: any) => ({
            ...chapter,
            id: chapter.name, // Use chapter.name as id (actual document name)
            contents: chapter.contents?.map((block: any) => {
              let normalizedBlock = {
                id: block.content_reference, // Use content_reference as id (actual document name)
                type: block.content_type, // Use content_type directly
                docname: block.content_reference, // Use content_reference
                content_type: block.content_type,
                content_reference: block.content_reference,
                ...block.data,
              };
              // Special normalization for Question Answer content
              if (
                block.content_type === 'Question Answer' &&
                Array.isArray(block.data?.questions)
              ) {
                normalizedBlock.questions = block.data.questions.map((q: any) => ({
                  question: q.question,
                  score: q.score,
                  suggested_answer: typeof q.suggested_answer === 'string' ? q.suggested_answer : ''
                }));
              }
              return normalizedBlock;
            }) || [],
          })) || [],
        })),
      };
      return normalizedModule;
    }

    if (moduleData) {
      // Handle different response structures from frappe-react-sdk
      // The API returns data in frappe.response["data"], which frappe-react-sdk wraps
      let actualData = null;
      
      if (moduleData.message) {
        actualData = moduleData.message;
      } else if (moduleData.data) {
        actualData = moduleData.data;
      } else if (moduleData.lessons) {
        // Direct response format
        actualData = moduleData;
      } else {
        // Try to find the data in the response
        actualData = moduleData;
      }
      
      if (actualData) {
        const normalized = normalizeModule(actualData);
        setModule(normalized);
        setModuleInfo(normalized);
      } else {
        console.error('ModuleEdit - Could not extract module data from response:', moduleData);
      }
    }
  }, [moduleData, setModule]);

  useEffect(() => {
    if (
      module &&
      module.lessons &&
      module.lessons.length > 0 &&
      !activeLessonId // Only set if not already set
    ) {
      setActiveLessonId(module.lessons[0].id);
      if (module.lessons[0].chapters && module.lessons[0].chapters.length > 0 && !activeChapterId) {
        setActiveChapterId(module.lessons[0].chapters[0].id);
      }
    }
    // If the current activeLessonId is no longer present, reset to first
    if (
      module &&
      module.lessons &&
      module.lessons.length > 0 &&
      activeLessonId &&
      !module.lessons.some(l => l.id === activeLessonId)
    ) {
      setActiveLessonId(module.lessons[0].id);
      if (module.lessons[0].chapters && module.lessons[0].chapters.length > 0) {
        setActiveChapterId(module.lessons[0].chapters[0].id);
      }
    }
  }, [module, activeLessonId, activeChapterId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Lottie animationData={loadingAnimation} loop style={{ width: 120, height: 120 }} />
        <div className="mt-4 text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error) {
    console.error('ModuleEdit - Error loading module:', error);
    const errorMessage = error instanceof Error ? error.message : 
                         typeof error === 'object' && error !== null ? JSON.stringify(error) : 
                         'Unknown error';
    toast.error(`Failed to load module: ${errorMessage}`);
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Lottie animationData={errorAnimation} loop style={{ width: 120, height: 120 }} />
        <div className="mt-4 text-red-500">Error loading module</div>
        <div className="mt-2 text-sm text-muted-foreground">
          {errorMessage}
        </div>
        {moduleId && (
          <div className="mt-2 text-xs text-muted-foreground">
            Module ID: {moduleId}
          </div>
        )}
      </div>
    );
  }

  if (!moduleId) {
    return <div>Module ID is required</div>;
  }

  return (
    <NavigationProvider>
      <div className="flex h-screen w-full bg-background">
        <Sidebar
          isOpen={sidebarOpen}
          fullScreen={false}
          moduleInfo={moduleInfo}
          module={module}
          isMobile={isMobile}
          onLessonAdded={mutate}
          activeLessonId={activeLessonId}
          setActiveLessonId={setActiveLessonId}
          activeChapterId={activeChapterId}
          setActiveChapterId={setActiveChapterId}
        />
            <SidebarToggle isOpen={sidebarOpen} onClick={() => setSidebarOpen((v) => !v)} />
            <DndContext onDragEnd={({ active, over }) => {
              if (!over) return;
          if (!activeLessonId || !activeChapterId) return;
          const lesson = module.lessons.find(l => l.id === activeLessonId);
              if (!lesson || !lesson.chapters || lesson.chapters.length === 0) return;
          const chapter = lesson.chapters.find(c => c.id === activeChapterId);
          if (!chapter) return;
              const isExistingBlock = chapter.contents.some((c: any) => c.id === active.id);
              if (over.id === 'content-drop-area') {
                if (!isExistingBlock) {
              addContentToChapter(String(active.id), activeLessonId, activeChapterId);
                }
              } else {
                // Reorder content blocks
                if (active.id !== over.id) {
                  const oldIndex = chapter.contents.findIndex((c: any) => c.id === active.id);
                  const newIndex = chapter.contents.findIndex((c: any) => c.id === over.id);
                  if (oldIndex !== -1 && newIndex !== -1) {
                reorderContentBlocks(activeLessonId, activeChapterId, oldIndex, newIndex, setModule, updateDoc);
                  }
                }
              }
            }}>
              <ContentStructureEditor
                module={module}
                addContentToChapter={addContentToChapter}
                setModule={setModule}
                moduleId={moduleId}
                loading={isLoading}
                activeLessonId={activeLessonId}
                activeChapterId={activeChapterId}
                onLessonAdded={mutate}
              />
            </DndContext>
      </div>
    </NavigationProvider>
  );
} 