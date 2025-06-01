import React, { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import Sidebar from "./Sidebar";
import SidebarToggle from "./SidebarToggle";
import ContentStructureEditor from "./content-structure";
import { useIsMobile } from "@/hooks/use-mobile";
import { DndContext } from "@dnd-kit/core";
import { useModuleState } from "./content-structure/useModuleState";
import { reorderContentBlocks } from "./content-structure/MainSection";
import { useFrappeGetCall, useFrappeGetDoc, useFrappeUpdateDoc } from "frappe-react-sdk";
import { toast } from "sonner";
import Lottie from 'lottie-react';
import errorAnimation from '@/assets/Error.json';
import loadingAnimation from '@/assets/Loading.json';

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
}

export default function ModuleEdit() {
  const params = useParams();
  const moduleId = params?.moduleId;
  const [, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarFullScreen, setSidebarFullScreen] = useState(false);
  const [moduleInfo, setModuleInfo] = useState<ModuleInfo | null>(null);
  const isMobile = useIsMobile();
  const { module, addLesson, addContentToChapter, setModule } = useModuleState();
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const { updateDoc } = useFrappeUpdateDoc();

  // Use the custom getModule endpoint
  const { data: moduleData, error, isLoading, mutate } = useFrappeGetCall('getModule', { module_id: moduleId });

  // Normalize chapter contents after module data load
  useEffect(() => {
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
    function normalizeModule(moduleDataObj: any) {
      if (!moduleDataObj || !moduleDataObj.lessons) return moduleDataObj;
      const normalizedModule = {
        ...moduleDataObj,
        lessons: moduleDataObj.lessons.map((lesson: any) => ({
          ...lesson,
          chapters: lesson.chapters?.map((chapter: any) => ({
            ...chapter,
            contents: chapter.contents?.map((block: any) => ({
              id: block.id,
              type: typeMap[String(block.type)] || block.type, // normalize type
              docname: block.reference,
              ...block.data,
            })) || [],
          })) || [],
        })),
      };
      return normalizedModule;
    }

    if (moduleData && moduleData.data) {
      const normalized = normalizeModule(moduleData.data);
      setModule(normalized);
      setModuleInfo(normalized);
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
    toast.error("Failed to load module");
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Lottie animationData={errorAnimation} loop style={{ width: 120, height: 120 }} />
        <div className="mt-4 text-red-500">Error loading module</div>
      </div>
    );
  }

  if (!moduleId) {
    return <div>Module ID is required</div>;
  }

  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar
        isOpen={sidebarOpen}
        fullScreen={sidebarFullScreen}
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
              isMobile={isMobile}
              module={module}
              addLesson={addLesson}
              addContentToChapter={addContentToChapter}
              setModule={setModule}
          moduleName={params.moduleId || ""}
          loading={isLoading}
          activeLessonId={activeLessonId}
          activeChapterId={activeChapterId}
            />
          </DndContext>
    </div>
  );
} 