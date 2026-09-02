import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import RichEditor from "@/components/RichEditor";

import { useFrappeGetDocList } from "frappe-react-sdk";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { LMS_API_BASE_URL, LMS_FILE_BASE_URL } from "@/config/routes";
import { X, Upload, CheckCircle2, FileText, Image as ImageIcon, Video, Music, Table, Sparkles, Settings, Check, RefreshCw, BookOpen, PlayCircle, ClipboardList, Send, Paperclip, Presentation, Plus, Trash2, ChevronUp, ChevronDown, Code2, Eye, Loader2, RotateCcw } from "lucide-react";
import { uploadFileToFrappe } from "@/lib/uploadFileToFrappe";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { PresentationPreviewEditor } from "./PresentationPreviewEditor";


type Step = 1 | 2 | 3 | 4;

// Global promise to prevent duplicate API submissions on React StrictMode remounts
let activeJobPromise: Promise<string> | null = null;
let activeDraftPromise: Promise<string> | null = null;
let activeBlueprintPromise: Promise<string> | null = null;

interface UploadedFile {
  file: File;
  id: string;
}

// ─── Accepted File Types ──────────────────────────────────────────────────────

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
  "video/mp4",
  "video/quicktime",
  "video/x-matroska",
  "video/webm",
  "audio/mpeg",
  "audio/wav",
  "audio/x-wav",
  "audio/ogg",
  "audio/mp4",
  "audio/x-m4a",
];

const ACCEPTED_EXT = ".pdf,.xls,.xlsx,.png,.jpg,.jpeg,.webp,.gif,.mp4,.mov,.mkv,.webm,.mp3,.wav,.ogg,.m4a";

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  const steps = [
    { num: 1, label: "Upload Sources" },
    { num: 2, label: "Curriculum Blueprint" },
    { num: 3, label: "Curriculum Plan" },
    { num: 4, label: "Creating Assets" },
  ];

  return (
    <div className="flex items-center select-none">
      {steps.map((s, idx) => {
        const done = current > s.num;
        const active = current === s.num;
        return (
          <div key={s.num} className="flex items-center">
            <div
              className={`
                flex items-center gap-2 px-5 py-2 text-sm font-semibold transition-all duration-300
                ${done || active
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
                }
                ${idx === 0 ? "rounded-l-full pl-5 pr-7" : ""}
                ${idx === steps.length - 1 ? "rounded-r-full pl-7 pr-5" : ""}
                ${idx > 0 && idx < steps.length - 1 ? "px-7" : ""}
              `}
              style={{
                clipPath:
                  idx === 0
                    ? "polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%)"
                    : idx === steps.length - 1
                      ? "polygon(14px 0, 100% 0, 100% 100%, 14px 100%, 0 50%)"
                      : "polygon(14px 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 14px 100%, 0 50%)",
              }}
            >
              {done ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <span className={`
                  w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold border-2 shrink-0
                  ${active
                    ? "border-primary-foreground/80 text-primary-foreground"
                    : "border-muted-foreground/60 text-muted-foreground"}
                `}>
                  {s.num}
                </span>
              )}
              <span className="whitespace-nowrap">{s.label}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── File Type Badge ──────────────────────────────────────────────────────────

function FileTypeBadge({ type }: { type: string }) {
  const lowerType = type.toLowerCase();
  if (lowerType.includes("pdf"))
    return (
      <div className="flex flex-col items-center justify-center w-10 h-12 bg-red-50 border border-red-200 rounded-md text-red-600 text-[9px] font-bold gap-0.5 shadow-sm shrink-0">
        <FileText className="w-5 h-5" />
        <span>PDF</span>
      </div>
    );
  if (lowerType.includes("excel") || lowerType.includes("spreadsheet") || lowerType.includes("xlsx") || lowerType.includes("xls") || lowerType.includes("sheet"))
    return (
      <div className="flex flex-col items-center justify-center w-10 h-12 bg-green-50 border border-green-200 rounded-md text-green-600 text-[9px] font-bold gap-0.5 shadow-sm shrink-0">
        <Table className="w-5 h-5" />
        <span>EXCEL</span>
      </div>
    );
  if (lowerType.includes("video") || lowerType.includes("mp4") || lowerType.includes("quicktime") || lowerType.includes("mkv") || lowerType.includes("webm") || lowerType.includes("avi"))
    return (
      <div className="flex flex-col items-center justify-center w-10 h-12 bg-purple-50 border border-purple-200 rounded-md text-purple-600 text-[9px] font-bold gap-0.5 shadow-sm shrink-0">
        <Video className="w-5 h-5" />
        <span>VIDEO</span>
      </div>
    );
  if (lowerType.includes("audio") || lowerType.includes("mpeg") || lowerType.includes("wav") || lowerType.includes("ogg") || lowerType.includes("mp3") || lowerType.includes("m4a"))
    return (
      <div className="flex flex-col items-center justify-center w-10 h-12 bg-pink-50 border border-pink-200 rounded-md text-pink-600 text-[9px] font-bold gap-0.5 shadow-sm shrink-0">
        <Music className="w-5 h-5" />
        <span>AUDIO</span>
      </div>
    );
  return (
    <div className="flex flex-col items-center justify-center w-10 h-12 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-600 text-[9px] font-bold gap-0.5 shadow-sm shrink-0">
      <ImageIcon className="w-5 h-5" />
      <span>IMG</span>
    </div>
  );
}

// ─── Animated Progress Bar ────────────────────────────────────────────────────

function AnimatedProgressBar({ label }: { label: string }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 95) return prev;
        return Math.min(prev + Math.random() * 8 + 2, 95);
      });
    }, 280);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-xs space-y-2">
      <p className="text-sm text-muted-foreground text-center font-medium transition-all duration-300">{label}</p>
      <div className="h-2.5 w-full bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ─── Step 1: Upload Sources ───────────────────────────────────────────────────

function StepUpload({
  files,
  onFilesChange,
  onNext,
  onCancel,
  department,
  setDepartment,
  assignmentBased,
  setAssignmentBased,
  departmentOptions,
  instructions,
  setInstructions,
}: {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  onNext: () => void;
  onCancel: () => void;
  department: string;
  setDepartment: (val: string) => void;
  assignmentBased: string;
  setAssignmentBased: (val: string) => void;
  departmentOptions: Array<{ value: string; label: string }>;
  instructions: string;
  setInstructions: (val: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const isStep1Valid = !!department && (files.length > 0 || instructions.trim().length > 0);

  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      const accepted: UploadedFile[] = [];
      Array.from(newFiles).forEach(f => {
        const ext = "." + f.name.split('.').pop()?.toLowerCase();
        const isVideo = f.type.startsWith('video/') || /\.(mp4|mov|mkv|webm|avi|flv|wmv)$/i.test(f.name);

        if (isVideo && f.size > 35 * 1024 * 1024) {
          toast.error(`"${f.name}" exceeds the 35 MB video file size limit.`);
          return;
        }

        const isAudio = f.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac|wma)$/i.test(f.name);
        if (isAudio && f.size > 20 * 1024 * 1024) {
          toast.error(`"${f.name}" exceeds the 20 MB audio file size limit.`);
          return;
        }

        if (ACCEPTED_TYPES.includes(f.type) || ACCEPTED_EXT.split(',').includes(ext)) {
          accepted.push({ file: f, id: `${f.name}-${Date.now()}-${Math.random()}` });
        } else {
          toast.error(`"${f.name}" is not a supported file type.`);
        }
      });
      if (accepted.length > 0) onFilesChange([...files, ...accepted]);
    },
    [files, onFilesChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      addFiles(e.dataTransfer.files);
    },
    [addFiles]
  );

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Drop zone */}
      {files.length === 0 ? (
        <div
          className={`
            border-2 border-dashed rounded-xl p-6 flex flex-col items-center gap-3
            transition-all duration-200 cursor-pointer flex-1 min-h-[170px] justify-center
            ${dragging
              ? "border-primary bg-primary/10 scale-[1.01]"
              : "border-primary/40 bg-primary/5 hover:border-primary/60 hover:bg-primary/[0.07]"
            }
          `}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <div className={`
            w-12 h-12 rounded-full flex items-center justify-center transition-all
            ${dragging ? "bg-primary text-primary-foreground scale-110" : "bg-primary/15 text-primary"}
          `}>
            <Upload className="w-6 h-6" />
          </div>

          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              Drag &amp; Drop or{" "}
              <span className="text-primary underline underline-offset-2">Browse Files</span>
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Supported: PDF, EXCEL, IMG, Video, Audio</p>
          </div>

          {/* File type icons row */}
          <div className="flex items-center gap-2.5 mt-1">
            <div className="flex flex-col items-center justify-center w-10 h-12 bg-red-50 border border-red-200 rounded-md text-red-600 text-[9px] font-bold gap-0.5 shadow-sm">
              <FileText className="w-5 h-5" /><span>PDF</span>
            </div>
            <div className="flex flex-col items-center justify-center w-10 h-12 bg-green-50 border border-green-200 rounded-md text-green-600 text-[9px] font-bold gap-0.5 shadow-sm">
              <Table className="w-5 h-5" /><span>EXCEL</span>
            </div>
            <div className="flex flex-col items-center justify-center w-10 h-12 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-600 text-[9px] font-bold gap-0.5 shadow-sm">
              <ImageIcon className="w-5 h-5" /><span>IMG</span>
            </div>
            <div className="flex flex-col items-center justify-center w-10 h-12 bg-purple-50 border border-purple-200 rounded-md text-purple-600 text-[9px] font-bold gap-0.5 shadow-sm">
              <Video className="w-5 h-5" /><span>VIDEO</span>
            </div>
            <div className="flex flex-col items-center justify-center w-10 h-12 bg-pink-50 border border-pink-200 rounded-md text-pink-600 text-[9px] font-bold gap-0.5 shadow-sm">
              <Music className="w-5 h-5" /><span>AUDIO</span>
            </div>
          </div>
        </div>
      ) : (
        <div
          className="border-2 border-dashed rounded-xl px-5 py-3 flex items-center justify-between gap-3 cursor-pointer bg-primary/[0.02] border-primary/20 hover:border-primary/40 hover:bg-primary/[0.05] transition-all duration-200 shrink-0"
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Upload className="w-4 h-4" />
            </div>
            <div className="text-left">
              <p className="text-xs font-semibold text-foreground">
                Drag &amp; drop more files or{" "}
                <span className="text-primary underline">Browse Files</span>
              </p>
              <p className="text-[10px] text-muted-foreground">Supported: PDF, EXCEL, IMG, Video, Audio</p>
            </div>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPTED_EXT}
        className="hidden"
        onChange={e => { if (e.target.files) addFiles(e.target.files); }}
        onClick={e => e.stopPropagation()}
      />

      {/* Uploaded files */}
      {files.length > 0 && (
        <div className="flex flex-col gap-1.5 shrink-0 select-none">
          <p className="text-xs font-semibold text-muted-foreground">Uploaded Files ({files.length})</p>
          <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto py-1">
            {files.map(f => (
              <div
                key={f.id}
                className="flex items-center gap-2.5 bg-muted/60 border border-border rounded-xl px-3 py-2 transition-all hover:bg-muted/80 shadow-sm"
              >
                <FileTypeBadge type={f.file.type || f.file.name} />
                <span className="max-w-[150px] truncate text-xs font-medium text-foreground">{f.file.name}</span>
                <button
                  className="text-muted-foreground hover:text-destructive transition-colors p-1 hover:bg-destructive/10 rounded-full"
                  onClick={e => { e.stopPropagation(); onFilesChange(files.filter(x => x.id !== f.id)); }}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Prompt Section */}
      <div className="space-y-2 text-left flex-1 flex flex-col min-h-[90px] mt-1 mb-2">
        <Label htmlFor="aiPrompt" className="text-xs font-bold text-foreground">
          AI Module Prompt
        </Label>
        <Textarea
          id="aiPrompt"
          placeholder="Describe the module topic (e.g., 'Create a module with sound pollution. Make it concise and precise.')"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          className="flex-1 min-h-[60px] resize-none text-sm"
        />
        <p className="text-[10px] text-muted-foreground">
          Guide the AI on how to process your files, or create a module/lessons purely from a prompt.
        </p>
      </div>

      {/* Fields */}
      <div className="grid grid-cols-2 gap-4 border-t pt-4 mt-1 shrink-0">
        <div className="space-y-2 text-left">
          <Label htmlFor="department" className="text-xs font-bold text-foreground">
            Department <span className="text-destructive">*</span>
          </Label>
          <Select value={department} onValueChange={setDepartment}>
            <SelectTrigger id="department" className="w-full">
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              {departmentOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2 text-left">
          <Label htmlFor="assignmentBased" className="text-xs font-bold text-foreground">
            Assignment Based
          </Label>
          <Select value={assignmentBased} onValueChange={setAssignmentBased}>
            <SelectTrigger id="assignmentBased" className="w-full">
              <SelectValue placeholder="Select assignment type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Department">Department</SelectItem>
              <SelectItem value="Everyone">Everyone</SelectItem>
              <SelectItem value="Manual">Manual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-1">
        <Button variant="ghost" onClick={onCancel} className="text-muted-foreground">
          Cancel
        </Button>
        {!!department && (
          <Button
            onClick={onNext}
            disabled={!isStep1Valid}
            className="px-8 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
}


// ─── Content Type Config for Blueprint ──────────────────────────────────────────

const CONTENT_TYPE_CONFIG: Record<string, { icon: any; color: string; bgColor: string; borderColor: string; label: string }> = {
  "Text Content": { icon: BookOpen, color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200", label: "Text" },
  "Video Content": { icon: PlayCircle, color: "text-purple-600", bgColor: "bg-purple-50", borderColor: "border-purple-200", label: "Video" },
  "Slide Content": { icon: Presentation, color: "text-teal-600", bgColor: "bg-teal-50", borderColor: "border-teal-200", label: "Slides" },
  "Quiz": { icon: ClipboardList, color: "text-orange-600", bgColor: "bg-orange-50", borderColor: "border-orange-200", label: "Quiz" },
  "Question Answer": { icon: Send, color: "text-indigo-600", bgColor: "bg-indigo-50", borderColor: "border-indigo-200", label: "Q&A" },
  "Check List": { icon: CheckCircle2, color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200", label: "Checklist" },
  "Steps": { icon: ClipboardList, color: "text-cyan-600", bgColor: "bg-cyan-50", borderColor: "border-cyan-200", label: "Steps" },
  "Accordion Content": { icon: ChevronDown, color: "text-amber-600", bgColor: "bg-amber-50", borderColor: "border-amber-200", label: "Accordion" },
  "Iframe Content": { icon: Code2, color: "text-gray-600", bgColor: "bg-gray-50", borderColor: "border-gray-200", label: "Iframe" },
};

const ALL_CONTENT_TYPES = Object.keys(CONTENT_TYPE_CONFIG);

// ─── Blueprint Interfaces ───────────────────────────────────────────────────────

interface BlueprintChapter {
  title: string;
  content_type: string;
  summary: string;
  estimated_duration?: string;
}

interface BlueprintLesson {
  lesson_name: string;
  description: string;
  chapters: BlueprintChapter[];
}

interface CreativeDesignPreview {
  slide_design?: {
    color_palette?: string;
    animation_style?: string;
    slide_layout_theme?: string;
    icon_style?: string;
    illustration_style?: string;
    transition_effect?: string;
  };
  video_design?: {
    background_style?: string;
    narration_voice?: string;
    narration_tone?: string;
    speaking_speed?: string;
    background_music?: string;
    animation_style?: string;
  };
  audio_design?: {
    voice_selection?: string;
    tone?: string;
    speed?: string;
    accent?: string;
    background_music?: string;
  };
  template?: string;
}

interface BlueprintJSON {
  module_name: string;
  description: string;
  lessons: BlueprintLesson[];
  creative_design_preview?: CreativeDesignPreview;
  source_job_id?: string;
  user_instructions?: string;
}

// ─── Step 2: Blueprint Preview & Approve ──────────────────────────────────────

function StepBlueprintPreview({
  files,
  instructions,
  department,
  targetAudience,
  learningGoal,
  blueprint,
  setBlueprint,
  onApprove,
  onBack,
  onCancelProcess,
}: {
  files: UploadedFile[];
  instructions: string;
  department: string;
  targetAudience: string;
  learningGoal: string;
  blueprint: BlueprintJSON | null;
  setBlueprint: (b: BlueprintJSON | null) => void;
  onApprove: () => void;
  onBack: () => void;
  onCancelProcess?: () => void;
}) {
  const [, setLocation] = useLocation();
  const [isDrafting, setIsDrafting] = useState(() => !blueprint);
  const [draftProgress, setDraftProgress] = useState("Uploading file attachments...");
  const [jobId, setJobId] = useState<string | null>(null);
  const [refinePrompt, setRefinePrompt] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [refineProgress, setRefineProgress] = useState("Refining blueprint...");
  const [activeDesignTab, setActiveDesignTab] = useState<"slide" | "audio">("slide");

  // Fetch slide design dropdown options from DocTypes
  const [designOptions, setDesignOptions] = useState<{ palettes: string[]; layouts: string[]; animations: string[] }>({ palettes: [], layouts: [], animations: [] });
  useEffect(() => {
    const cleanBaseUrl = LMS_API_BASE_URL ? LMS_API_BASE_URL.replace(/\/$/, '') : '';
    fetch(`${cleanBaseUrl}/api/method/novel_lms.lms_ai_module_creation.api.generator.get_slide_design_options`, { credentials: "include" })
      .then(r => r.json())
      .then(res => {
        const d = res.message || res;
        if (d && d.success) setDesignOptions({ palettes: d.palettes || [], layouts: d.layouts || [], animations: d.animations || [] });
      })
      .catch(() => {});
  }, []);

  // Run blueprint generation on mount if no blueprint exists
  useEffect(() => {
    let isMounted = true;
    let pollInterval: any = null;

    if (blueprint) return;

    const runBlueprintGeneration = async () => {
      try {
        setIsDrafting(true);
        const cleanBaseUrl = LMS_API_BASE_URL ? LMS_API_BASE_URL.replace(/\/$/, '') : '';

        const activeJobId = localStorage.getItem("active_ai_job_id");
        const activeJobType = localStorage.getItem("active_ai_job_type");
        const activeJobProgress = localStorage.getItem("active_ai_job_progress");

        let currentJobId = "";

        if (activeJobId && activeJobType === "blueprint") {
          currentJobId = activeJobId;
          if (isMounted) {
            setJobId(currentJobId);
            if (activeJobProgress) setDraftProgress(activeJobProgress);
          }
        } else {
          // Upload files first
          setDraftProgress("Uploading file attachments...");
          const fileUrls: string[] = [];
          for (let i = 0; i < files.length; i++) {
            const ufile = files[i];
            setDraftProgress(`Uploading file ${i + 1} of ${files.length}: ${ufile.file.name}...`);
            const fileUrl = await uploadFileToFrappe(ufile.file);
            fileUrls.push(fileUrl);
          }

          setDraftProgress("Starting blueprint generation...");
          const generateUrl = `${cleanBaseUrl}/api/method/novel_lms.lms_ai_module_creation.api.generator.generate_blueprint`;

          if (!activeBlueprintPromise) {
            activeBlueprintPromise = (async () => {
              const response = await fetch(generateUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify({
                  file_urls: fileUrls,
                  instructions: instructions,
                  department: department,
                  target_audience: targetAudience,
                  learning_goal: learningGoal,
                }),
                credentials: "include"
              });

              if (!response.ok) throw new Error("Failed to start blueprint generation");
              const genResult = await response.json();
              const job = genResult.message;
              if (!job || !job.success || !job.job_id) throw new Error(job?.error || "Job start failed.");
              return job.job_id;
            })();
          }

          try {
            currentJobId = await activeBlueprintPromise;
          } catch (err) {
            activeBlueprintPromise = null;
            throw err;
          }

          if (isMounted) setJobId(currentJobId);
          localStorage.setItem("active_ai_job_id", currentJobId);
          localStorage.setItem("active_ai_job_type", "blueprint");
          localStorage.setItem("active_ai_job_progress", "Starting blueprint generation...");
        }

        // Poll for completion
        const pollUrl = `${cleanBaseUrl}/api/method/novel_lms.lms_ai_module_creation.api.generator.get_blueprint_status?ai_job_id=${currentJobId}`;
        let notFoundCount = 0;
        const NOT_FOUND_LIMIT = 5;

        pollInterval = setInterval(async () => {
          try {
            const statusResponse = await fetch(pollUrl, { credentials: "include" });
            if (!statusResponse.ok) return;

            const statusResult = await statusResponse.json();
            const statusData = statusResult.message;
            if (!isMounted) return;

            if (!statusData || statusData.status === "not_found") {
              notFoundCount++;
              if (notFoundCount >= NOT_FOUND_LIMIT) {
                clearInterval(pollInterval);
                activeBlueprintPromise = null;
                setIsDrafting(false);
                localStorage.removeItem("active_ai_job_id");
                localStorage.removeItem("active_ai_job_type");
                localStorage.removeItem("active_ai_job_progress");
                toast.error("Blueprint worker crashed or job expired. Please try again.");
                onBack();
              }
              return;
            }

            notFoundCount = 0;

            if (statusData.status === "finished") {
              clearInterval(pollInterval);
              activeBlueprintPromise = null;
              setIsDrafting(false);
              setBlueprint(statusData.blueprint);
              localStorage.removeItem("active_ai_job_id");
              localStorage.removeItem("active_ai_job_type");
              localStorage.removeItem("active_ai_job_progress");
            } else if (statusData.status === "failed") {
              clearInterval(pollInterval);
              activeBlueprintPromise = null;
              setIsDrafting(false);
              localStorage.removeItem("active_ai_job_id");
              localStorage.removeItem("active_ai_job_type");
              localStorage.removeItem("active_ai_job_progress");
              toast.error(statusData.error || "Failed to generate blueprint.");
              onBack();
            } else if (statusData.progress) {
              setDraftProgress(statusData.progress);
              localStorage.setItem("active_ai_job_progress", statusData.progress);
            }
          } catch (pollErr) {
            console.error("Blueprint polling error", pollErr);
          }
        }, 2000);

      } catch (err: any) {
        console.error("Blueprint error", err);
        activeBlueprintPromise = null;
        if (isMounted) {
          localStorage.removeItem("active_ai_job_id");
          localStorage.removeItem("active_ai_job_type");
          localStorage.removeItem("active_ai_job_progress");
          toast.error(err.message || "An error occurred.");
          setIsDrafting(false);
          onBack();
        }
      }
    };

    runBlueprintGeneration();

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [blueprint]);

  // Refine blueprint via Lumi AI
  const handleRefinePlan = async () => {
    if (!refinePrompt.trim()) return;
    try {
      setIsRefining(true);
      setRefineProgress("Enqueuing blueprint refinement...");
      const cleanBaseUrl = LMS_API_BASE_URL ? LMS_API_BASE_URL.replace(/\/$/, '') : '';
      const refineUrl = `${cleanBaseUrl}/api/method/novel_lms.lms_ai_module_creation.api.generator.refine_blueprint`;

      const response = await fetch(refineUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blueprint_json: blueprint,
          instructions: refinePrompt,
        }),
        credentials: "include"
      });

      if (!response.ok) throw new Error("Blueprint refinement failed to start");
      const resData = await response.json();
      const job = resData.message;
      if (!job || !job.success || !job.job_id) {
        throw new Error(job?.error || "Failed to start refinement job.");
      }

      const pollJobId = job.job_id;
      localStorage.setItem("active_ai_job_id", pollJobId);
      localStorage.setItem("active_ai_job_type", "blueprint");
      localStorage.setItem("active_ai_job_progress", "Enqueuing blueprint refinement...");
      const pollUrl = `${cleanBaseUrl}/api/method/novel_lms.lms_ai_module_creation.api.generator.get_blueprint_status?ai_job_id=${pollJobId}`;
      let notFoundCount = 0;

      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(pollUrl, { credentials: "include" });
          if (!statusResponse.ok) return;

          const statusResult = await statusResponse.json();
          const statusData = statusResult.message;

          if (!statusData || statusData.status === "not_found") {
            notFoundCount++;
            if (notFoundCount >= 5) {
              clearInterval(pollInterval);
              setIsRefining(false);
              localStorage.removeItem("active_ai_job_id");
              localStorage.removeItem("active_ai_job_type");
              localStorage.removeItem("active_ai_job_progress");
              toast.error("Refinement worker crashed. Please try again.");
            }
            return;
          }

          notFoundCount = 0;

          if (statusData.status === "finished") {
            clearInterval(pollInterval);
            setBlueprint(statusData.blueprint);
            setRefinePrompt("");
            setIsRefining(false);
            localStorage.removeItem("active_ai_job_id");
            localStorage.removeItem("active_ai_job_type");
            localStorage.removeItem("active_ai_job_progress");
            toast.success("Blueprint updated successfully!");
          } else if (statusData.status === "failed") {
            clearInterval(pollInterval);
            setIsRefining(false);
            localStorage.removeItem("active_ai_job_id");
            localStorage.removeItem("active_ai_job_type");
            localStorage.removeItem("active_ai_job_progress");
            toast.error(statusData.error || "Failed to refine blueprint.");
          } else if (statusData.progress) {
            setRefineProgress(statusData.progress);
            localStorage.setItem("active_ai_job_progress", statusData.progress);
          }
        } catch (pollErr) {
          console.error("Blueprint refinement polling error", pollErr);
        }
      }, 2000);

    } catch (err: any) {
      localStorage.removeItem("active_ai_job_id");
      localStorage.removeItem("active_ai_job_type");
      localStorage.removeItem("active_ai_job_progress");
      toast.error(err.message || "An error occurred during refinement.");
      setIsRefining(false);
    }
  };

  // Update chapter content type
  const handleChangeContentType = (lessonIdx: number, chapterIdx: number, newType: string) => {
    if (!blueprint) return;
    const updated = JSON.parse(JSON.stringify(blueprint));
    updated.lessons[lessonIdx].chapters[chapterIdx].content_type = newType;
    setBlueprint(updated);
  };

  // Delete chapter
  const handleDeleteChapter = (lessonIdx: number, chapterIdx: number) => {
    if (!blueprint) return;
    const updated = JSON.parse(JSON.stringify(blueprint));
    updated.lessons[lessonIdx].chapters.splice(chapterIdx, 1);
    setBlueprint(updated);
    toast.success("Chapter removed from blueprint");
  };

  // Delete lesson
  const handleDeleteLesson = (lessonIdx: number) => {
    if (!blueprint) return;
    const updated = JSON.parse(JSON.stringify(blueprint));
    updated.lessons.splice(lessonIdx, 1);
    setBlueprint(updated);
    toast.success("Lesson removed from blueprint");
  };

  // Update creative design settings
  const updateDesignSetting = (category: "slide_design" | "video_design" | "audio_design", key: string, value: string) => {
    if (!blueprint) return;
    const updated = JSON.parse(JSON.stringify(blueprint));
    if (!updated.creative_design_preview) updated.creative_design_preview = {};
    if (!updated.creative_design_preview[category]) updated.creative_design_preview[category] = {};
    updated.creative_design_preview[category][key] = value;
    setBlueprint(updated);
  };

  // ── Drafting Loading State ──
  if (isDrafting) {
    return (
      <div className="flex flex-col items-center justify-center gap-8 h-full py-10">
        <style>{`
          @keyframes blueprint-pulse {
            0%, 100% { transform: scale(1); opacity: 0.9; }
            50% { transform: scale(1.06); opacity: 1; }
          }
          @keyframes blueprint-line {
            0% { width: 0; }
            100% { width: 100%; }
          }
        `}</style>

        <div className="relative flex items-center justify-center w-48 h-48">
          <div
            className="relative z-10 flex items-center justify-center w-24 h-24 rounded-2xl bg-primary/10 border-2 border-primary/20 shadow-lg"
            style={{ animation: "blueprint-pulse 2.5s ease-in-out infinite" }}
          >
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-40 h-40 rounded-full border-2 border-dashed border-primary/15 animate-spin" style={{ animationDuration: "12s" }} />
          </div>
        </div>

        <div className="text-center space-y-3 max-w-md px-4">
          <h3 className="text-base font-bold text-foreground tracking-tight">Generating Curriculum Blueprint</h3>
          <p className="text-xs text-muted-foreground leading-relaxed h-8">{draftProgress}</p>

          <div className="flex items-center justify-center gap-3 mt-6">
            {jobId && (
              <Button
                variant="outline"
                className="font-semibold border-primary/30 hover:border-primary text-primary hover:bg-primary/5 transition-all duration-300 shadow-sm"
                onClick={() => setLocation("/")}
              >
                Run in Background
              </Button>
            )}
            {onCancelProcess && (
              <Button
                variant="outline"
                className="font-semibold border-red-200 hover:border-red-400 text-red-600 hover:bg-red-50 transition-all duration-300 shadow-sm gap-1.5"
                onClick={onCancelProcess}
              >
                <X className="w-4 h-4" />
                Cancel Process
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!blueprint) return null;

  const cdp = blueprint.creative_design_preview || {};
  const slideDesign = cdp.slide_design || {};
  const videoDesign = cdp.video_design || {};
  const audioDesign = cdp.audio_design || {};

  const effectiveColorPalette = slideDesign.color_palette || (designOptions.palettes.length > 0 ? designOptions.palettes[0] : "Ocean Blue");
  const effectiveLayoutTheme = slideDesign.slide_layout_theme || "Modern Minimalist";
  const effectiveAnimationStyle = slideDesign.animation_style || "Subtle Fade";

  const effectiveVoiceSelection = audioDesign.voice_selection || "Male - Deep";
  const effectiveTone = audioDesign.tone || "Professional";
  const effectiveSpeed = audioDesign.speed || "Normal";
  const effectiveAccent = audioDesign.accent || "Neutral American";

  // Count content types for summary bar
  const typeCounts: Record<string, number> = {};
  blueprint.lessons.forEach(l => l.chapters.forEach(c => {
    typeCounts[c.content_type] = (typeCounts[c.content_type] || 0) + 1;
  }));
  const totalChapters = Object.values(typeCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col gap-4 text-left w-full">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {blueprint.module_name}
          </h2>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-2xl">{blueprint.description}</p>
        </div>
        {onCancelProcess && (
          <Button
            variant="outline"
            size="sm"
            onClick={onCancelProcess}
            className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 gap-1.5 font-semibold text-xs shrink-0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Clear & Start Over</span>
          </Button>
        )}
      </div>

      {/* Content Type Summary Bar */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/30 border border-border rounded-xl">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-1">Blueprint Summary:</span>
        <Badge variant="outline" className="text-[10px] font-bold">
          {blueprint.lessons.length} Lessons · {totalChapters} Chapters
        </Badge>
        {Object.entries(typeCounts).map(([type, count]) => {
          const cfg = CONTENT_TYPE_CONFIG[type];
          if (!cfg) return null;
          const Icon = cfg.icon;
          return (
            <Badge key={type} variant="secondary" className={`text-[9px] font-bold gap-1 ${cfg.color} ${cfg.bgColor} border ${cfg.borderColor}`}>
              <Icon className="w-3 h-3" />
              {cfg.label} ({count})
            </Badge>
          );
        })}
      </div>

      {/* Main Content: Skeleton Tree + Design Preview Side Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full items-start">
        {/* Left: Skeleton Tree */}
        <div className="lg:col-span-2 space-y-3">
          <Accordion type="multiple" defaultValue={blueprint.lessons.map((_, i) => `bp-lesson-${i}`)} className="space-y-3">
            {blueprint.lessons.map((lesson, lIdx) => (
              <AccordionItem
                key={lIdx}
                value={`bp-lesson-${lIdx}`}
                className="border border-border rounded-xl px-4 bg-muted/20 hover:bg-muted/30 transition-all duration-200"
              >
                <div className="flex items-center justify-between w-full gap-2">
                  <AccordionTrigger className="hover:no-underline py-3 flex-1">
                    <div className="flex flex-col items-start text-left gap-0.5">
                      <span className="text-sm font-bold text-foreground flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
                          {lIdx + 1}
                        </span>
                        {lesson.lesson_name}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{lesson.description}</span>
                    </div>
                  </AccordionTrigger>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 w-7 p-0 ml-2 text-rose-600 border-rose-200 hover:bg-rose-50 shrink-0 flex items-center justify-center"
                    title="Delete Lesson"
                    onClick={(e) => { e.stopPropagation(); handleDeleteLesson(lIdx); }}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <AccordionContent className="pt-1 pb-4 space-y-2">
                  {lesson.chapters.map((chapter, cIdx) => {
                    const cfg = CONTENT_TYPE_CONFIG[chapter.content_type] || CONTENT_TYPE_CONFIG["Text Content"];
                    const Icon = cfg.icon;
                    return (
                      <div key={cIdx} className="bg-background border rounded-lg p-3 space-y-2 shadow-sm hover:border-muted-foreground/30 transition-all duration-200">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex gap-2.5 items-start flex-1 min-w-0">
                            <div className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${cfg.bgColor} ${cfg.color}`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="space-y-0.5 min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-xs font-bold text-foreground">{chapter.title}</span>
                                {chapter.estimated_duration && (
                                  <span className="text-[9px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">{chapter.estimated_duration}</span>
                                )}
                              </div>
                              <p className="text-[11px] text-muted-foreground leading-normal line-clamp-2">{chapter.summary}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {/* Content Type Selector */}
                            <Select
                              value={chapter.content_type}
                              onValueChange={(val) => handleChangeContentType(lIdx, cIdx, val)}
                            >
                              <SelectTrigger className={`h-7 w-auto min-w-[100px] text-[10px] font-bold gap-1 px-2 border ${cfg.borderColor} ${cfg.bgColor} ${cfg.color}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {ALL_CONTENT_TYPES.map((ct) => {
                                  const ctCfg = CONTENT_TYPE_CONFIG[ct];
                                  const CtIcon = ctCfg.icon;
                                  return (
                                    <SelectItem key={ct} value={ct} className="text-[11px]">
                                      <div className="flex items-center gap-1.5">
                                        <CtIcon className={`w-3 h-3 ${ctCfg.color}`} />
                                        <span>{ct}</span>
                                      </div>
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>

                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 p-0 text-rose-500 border-rose-200 hover:bg-rose-50 shrink-0 flex items-center justify-center"
                              title="Remove Chapter"
                              onClick={() => handleDeleteChapter(lIdx, cIdx)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Right: AI Design Preview + Refine Panel */}
        <div className="lg:col-span-1 lg:sticky lg:top-6 space-y-4 h-fit">
          {/* AI Design Preview Card */}
          <div className="bg-card border border-border rounded-2xl p-4 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b pb-2">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary" />
                <h3 className="text-xs font-bold text-foreground">AI Design Preview</h3>
              </div>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full border border-primary/20">
                <Sparkles className="w-3 h-3" /> Agent Suggested
              </span>
            </div>

            {/* Agent Selections Summary Card */}
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-2.5 space-y-1.5 text-[11px]">
              <div className="font-bold text-foreground text-[10px] uppercase tracking-wider flex items-center justify-between">
                <span>Agent Selection (Based on Prompt)</span>
                <span className="text-primary font-normal text-[9px] lowercase">editable below</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                <div className="bg-background/80 p-1.5 rounded border border-border/40">
                  <span className="text-muted-foreground block text-[9px]">Palette</span>
                  <span className="font-bold text-foreground truncate block">{effectiveColorPalette}</span>
                </div>
                <div className="bg-background/80 p-1.5 rounded border border-border/40">
                  <span className="text-muted-foreground block text-[9px]">Layout</span>
                  <span className="font-bold text-foreground truncate block">{effectiveLayoutTheme}</span>
                </div>
                <div className="bg-background/80 p-1.5 rounded border border-border/40">
                  <span className="text-muted-foreground block text-[9px]">Animation</span>
                  <span className="font-bold text-foreground truncate block">{effectiveAnimationStyle}</span>
                </div>
                <div className="bg-background/80 p-1.5 rounded border border-border/40">
                  <span className="text-muted-foreground block text-[9px]">Audio Voice</span>
                  <span className="font-bold text-primary truncate block">{effectiveVoiceSelection}</span>
                </div>
              </div>
            </div>

            {/* Design Tab Switcher */}
            <div className="flex gap-1 bg-muted/40 p-1 rounded-lg">
              {(["slide", "audio"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveDesignTab(tab)}
                  className={`flex-1 px-2 py-1.5 rounded-md text-[10px] font-bold transition-all capitalize
                    ${activeDesignTab === tab
                      ? "bg-background text-foreground shadow-sm border border-border"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {tab === "slide" ? "🎨 Slides" : "🎧 Audio"}
                </button>
              ))}
            </div>

            {/* Slide Design Settings */}
            {activeDesignTab === "slide" && (
              <div className="space-y-3">
                {[
                  { label: "Color Palette", key: "color_palette", value: slideDesign.color_palette || effectiveColorPalette,
                    options: designOptions.palettes.length > 0 ? designOptions.palettes : undefined },
                  { label: "Layout Theme", key: "slide_layout_theme", value: slideDesign.slide_layout_theme || effectiveLayoutTheme,
                    options: designOptions.layouts.length > 0 ? designOptions.layouts : ["Modern Minimalist", "Corporate Professional", "Creative Bold", "Academic Clean", "Tech Dark", "Nature Organic"] },
                  { label: "Animation Style", key: "animation_style", value: slideDesign.animation_style || effectiveAnimationStyle,
                    options: designOptions.animations.length > 0 ? designOptions.animations : ["Subtle Fade", "Smooth Slide", "Dynamic Pop", "Elegant Zoom", "Professional Wipe", "Minimal"] },
                ].map(field => (
                  <div key={field.key} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{field.label}</Label>
                      <span className="text-[9px] text-primary font-medium flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" /> Agent Choice
                      </span>
                    </div>
                    {field.options ? (
                      <Select value={field.value} onValueChange={(val) => updateDesignSetting("slide_design", field.key, val)}>
                        <SelectTrigger className="h-8 text-[11px]">
                          <SelectValue placeholder={`Select ${field.label}`} />
                        </SelectTrigger>
                        <SelectContent>
                          {field.options.map(opt => (
                            <SelectItem key={opt} value={opt} className="text-[11px]">{opt}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={field.value}
                        onChange={(e) => updateDesignSetting("slide_design", field.key, e.target.value)}
                        className="h-8 text-[11px]"
                        placeholder={`Enter ${field.label}`}
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Audio Design Settings */}
            {activeDesignTab === "audio" && (
              <div className="space-y-3">
                {[
                  { label: "Voice Selection", key: "voice_selection", value: audioDesign.voice_selection || effectiveVoiceSelection,
                    options: ["Female - Warm", "Female - Clear", "Male - Deep", "Male - Warm", "Female - Energetic", "Male - Energetic"] },
                  { label: "Tone", key: "tone", value: audioDesign.tone || effectiveTone,
                    options: ["Professional", "Conversational", "Academic", "Storytelling", "Motivational"] },
                  { label: "Speed", key: "speed", value: audioDesign.speed || effectiveSpeed,
                    options: ["Slow", "Normal", "Fast"] },
                  { label: "Accent", key: "accent", value: audioDesign.accent || effectiveAccent,
                    options: ["Neutral American", "British", "Australian", "Indian", "Neutral International"] },
                ].map(field => (
                  <div key={field.key} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{field.label}</Label>
                      <span className="text-[9px] text-primary font-medium flex items-center gap-0.5">
                        <Sparkles className="w-2.5 h-2.5" /> Agent Choice
                      </span>
                    </div>
                    <Select value={field.value} onValueChange={(val) => updateDesignSetting("audio_design", field.key, val)}>
                      <SelectTrigger className="h-8 text-[11px]">
                        <SelectValue placeholder={`Select ${field.label}`} />
                      </SelectTrigger>
                      <SelectContent>
                        {field.options.map(opt => (
                          <SelectItem key={opt} value={opt} className="text-[11px]">{opt}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Lumi AI Refinement Panel */}
          <div className="bg-muted/20 border border-border rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 border-b pb-2">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <h3 className="text-xs font-bold text-foreground">Refine with Lumi AI</h3>
            </div>

            {/* Prompt Input */}
            <div className="flex gap-2">
              <Textarea
                placeholder="E.g., 'Add a quiz after every lesson', 'Use more video content', 'Change the narration voice to male'"
                value={refinePrompt}
                onChange={(e) => setRefinePrompt(e.target.value)}
                className="text-xs min-h-[60px] resize-none flex-1"
                disabled={isRefining}
              />
            </div>
            <Button
              size="sm"
              onClick={handleRefinePlan}
              disabled={isRefining || !refinePrompt.trim()}
              className="w-full gap-1.5 h-8 text-xs"
            >
              {isRefining ? (
                <><RefreshCw className="w-3 h-3 animate-spin" /><span>{refineProgress}</span></>
              ) : (
                <><Send className="w-3 h-3" /><span>Refine Blueprint</span></>
              )}
            </Button>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { label: "Add Quiz", text: "Add a quiz chapter at the end of every lesson.", icon: ClipboardList, cls: "text-orange-600" },
                { label: "More Videos", text: "Convert more chapters to Video Content for visual learners.", icon: PlayCircle, cls: "text-purple-600" },
                { label: "Add Checklist", text: "Add a checklist summary chapter at the end of the module.", icon: CheckCircle2, cls: "text-green-600" },
                { label: "Add Steps", text: "Add step-by-step how-to chapters where applicable.", icon: ClipboardList, cls: "text-cyan-600" },
              ].map((action, idx) => {
                const AIcon = action.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => setRefinePrompt(action.text)}
                    className="flex items-center gap-1.5 p-2 rounded-lg border hover:border-primary/20 bg-background text-left transition-all text-[10px] font-semibold hover:bg-muted/40"
                  >
                    <AIcon className={`w-3 h-3 shrink-0 ${action.cls}`} />
                    <span className="text-foreground">{action.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t pt-4 mt-2">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onApprove} className="px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center gap-1.5">
          <Check className="w-4 h-4" />
          <span>Approve Blueprint & Continue</span>
        </Button>
      </div>
    </div>
  );
}


// ─── Step 3: Curriculum Plan Preview & Refine ──────────────────────────────────

interface SlideData {
  title: string;
  bullets: string[];
  narration?: string;
  layout_type?: string;
  animation?: any;
}

interface VideoDetails {
  script: string;
  template: string;
  color_palette: string;
  voice_tone: string;
  volume: "Low" | "Medium" | "High";
  slide_count: string;
  slides: SlideData[];
}

interface QuizOption {
  option_text: string;
  correct: number;
}

interface QuizQuestion {
  question_text: string;
  question_type: "Single Choice" | "Multiple Choice";
  score: number;
  options: QuizOption[];
}

interface QuizDetails {
  title?: string;
  description?: string;
  questions: QuizQuestion[];
}

interface PlanChapter {
  title: string;
  content_type: "Text Content" | "Video Content" | "Slide Content" | "Quiz";
  summary: string;
  body?: string;
  quiz_details?: QuizDetails;
  video_details?: VideoDetails;
}

interface PlanLesson {
  lesson_name: string;
  description: string;
  chapters: PlanChapter[];
}

interface PlanJSON {
  module_name: string;
  description: string;
  lessons: PlanLesson[];
  creative_design_preview?: CreativeDesignPreview;
}

const fixPreviewImages = (htmlContent: string) => {
  if (!htmlContent) return "";
  const baseUrl = LMS_API_BASE_URL || LMS_FILE_BASE_URL || '';
  const cleanBaseUrl = baseUrl.replace(/\/$/, '');

  // Capture the quote character and reuse it to avoid quote mismatches (e.g. src="...')
  let fixedHtml = htmlContent.replace(/src=(["'])\/files\//g, `src=$1${cleanBaseUrl}/files/`);
  fixedHtml = fixedHtml.replace(/src=(["'])files\//g, `src=$1${cleanBaseUrl}/files/`);
  fixedHtml = fixedHtml.replace(/src=(["'])\/private\/files\//g, `src=$1${cleanBaseUrl}/private/files/`);
  fixedHtml = fixedHtml.replace(/src=(["'])private\/files\//g, `src=$1${cleanBaseUrl}/private/files/`);
  return fixedHtml;
};

const fixPlanImages = (currentPlan: PlanJSON, files: any[]): PlanJSON => {
  if (!currentPlan || !files || files.length === 0) return currentPlan;

  const newPlan = JSON.parse(JSON.stringify(currentPlan));

  // 1. Separate and sort embedded figures (extracted_..._p*_i*)
  const embeddedFiles = files
    .filter((f: any) => f.file_name.startsWith("extracted_"))
    .sort((a: any, b: any) => {
      const matchA = a.file_name.match(/_p(\d+)_i(\d+)/);
      const matchB = b.file_name.match(/_p(\d+)_i(\d+)/);
      if (matchA && matchB) {
        const pA = parseInt(matchA[1], 10);
        const pB = parseInt(matchB[1], 10);
        if (pA !== pB) return pA - pB;
        return parseInt(matchA[2], 10) - parseInt(matchB[2], 10);
      }
      return a.file_name.localeCompare(b.file_name);
    });

  // 2. Separate and sort full page scans (page_..._p*)
  const pageFiles = files
    .filter((f: any) => f.file_name.startsWith("page_"))
    .sort((a: any, b: any) => {
      const matchA = a.file_name.match(/_p(\d+)/);
      const matchB = b.file_name.match(/_p(\d+)/);
      if (matchA && matchB) {
        return parseInt(matchA[1], 10) - parseInt(matchB[1], 10);
      }
      return a.file_name.localeCompare(b.file_name);
    });

  let imgIndex = 0;

  newPlan.lessons.forEach((lesson: any) => {
    lesson.chapters.forEach((chapter: any) => {
      if (chapter.content_type === "Text Content" && chapter.body) {
        let body = chapter.body;

        // Find all img tags and replace src attribute inside the tag if needed
        body = body.replace(/<img([^>]+)>/gi, (imgTag: string) => {
          const srcMatch = imgTag.match(/src=["']([^"']+)["']/i);
          if (srcMatch) {
            const src = srcMatch[1];
            if (!src.startsWith("/files") && !src.startsWith("files") && !src.startsWith("http") && !src.startsWith("/")) {
              // Fallback strategy: use embedded sub-figures first; then fall back to full page screenshots
              let fileUrl = "";
              if (imgIndex < embeddedFiles.length) {
                fileUrl = embeddedFiles[imgIndex].file_url;
              } else {
                const pageIdx = imgIndex - embeddedFiles.length;
                if (pageIdx < pageFiles.length) {
                  fileUrl = pageFiles[pageIdx].file_url;
                }
              }

              if (fileUrl) {
                imgIndex++;
                return imgTag.replace(/src=["']([^"']+)["']/i, `src="${fileUrl}"`);
              }
            }
          }
          return imgTag;
        });

        chapter.body = body;
      }
    });
  });

  return newPlan;
};

function StepPlanPreview({
  files,
  instructions,
  department,
  assignmentBased,
  slideTheme,
  slideTransition,
  elementEntrance,
  narrationTone,
  targetAudience,
  learningGoal,
  slideCount,
  plan,
  setPlan,
  onNext,
  onBack,
  resumedDraftJobId,
  setIsEditingChapter,
  onCancelProcess,
  blueprintJson,
}: {
  files: UploadedFile[];
  instructions: string;
  department: string;
  assignmentBased: string;
  slideTheme: string;
  slideTransition: string;
  elementEntrance: string;
  narrationTone: string;
  targetAudience: string;
  learningGoal: string;
  slideCount: string;
  plan: PlanJSON | null;
  setPlan: (p: PlanJSON | null) => void;
  onNext: () => void;
  onBack: () => void;
  resumedDraftJobId: string | null;
  setIsEditingChapter?: (val: boolean) => void;
  onCancelProcess?: () => void;
  blueprintJson?: BlueprintJSON | null;
}) {
  const [, setLocation] = useLocation();
  const [draftProgress, setDraftProgress] = useState(() => {
    if (resumedDraftJobId) {
      return localStorage.getItem("active_ai_job_progress") || "Resuming background task...";
    }
    return "Uploading file attachments...";
  });
  const [isDrafting, setIsDrafting] = useState(() => !!resumedDraftJobId || !plan);
  const [jobId, setJobId] = useState<string | null>(resumedDraftJobId || null);
  const [refinePrompt, setRefinePrompt] = useState("");
  const [isRefining, setIsRefining] = useState(false);
  const [refineProgress, setRefineProgress] = useState("Lumi is rewriting the curriculum plan...");
  const [refineFiles, setRefineFiles] = useState<{ name: string; url: string; isUploading: boolean }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleRefineFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const selectedFiles = Array.from(e.target.files);

    const validFiles = selectedFiles.filter(f => {
      const isVideo = f.type.startsWith('video/') || /\.(mp4|mov|mkv|webm|avi|flv|wmv)$/i.test(f.name);
      if (isVideo && f.size > 35 * 1024 * 1024) {
        toast.error(`"${f.name}" exceeds the 35 MB video file size limit.`);
        return false;
      }

      const isAudio = f.type.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac|wma)$/i.test(f.name);
      if (isAudio && f.size > 20 * 1024 * 1024) {
        toast.error(`"${f.name}" exceeds the 20 MB audio file size limit.`);
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    const newFiles = validFiles.map(f => ({ name: f.name, url: "", isUploading: true }));
    setRefineFiles(prev => [...prev, ...newFiles]);

    for (let i = 0; i < validFiles.length; i++) {
      const file = validFiles[i];
      try {
        const fileUrl = await uploadFileToFrappe(file);
        setRefineFiles(prev => prev.map(pf => pf.name === file.name ? { name: file.name, url: fileUrl, isUploading: false } : pf));
      } catch (err: any) {
        const errMsg = err?.message || `Failed to upload ${file.name}`;
        toast.error(errMsg);
        setRefineFiles(prev => prev.filter(pf => pf.name !== file.name));
      }
    }
  };

  // Custom video editing states
  const [predefinedAssets, setPredefinedAssets] = useState<{ templates: any[]; palettes: any[] }>({ templates: [], palettes: [] });
  const [editingChapterPath, setEditingChapterPath] = useState<{ lessonIdx: number; chapterIdx: number } | null>(null);
  const [editingChapter, setEditingChapter] = useState<PlanChapter | null>(null);
  const [previewModalChapter, setPreviewModalChapter] = useState<{ chapter: PlanChapter; lessonIdx: number; chapterIdx: number } | null>(null);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [lunaPrompt, setLunaPrompt] = useState("");
  const [isLunaLoading, setIsLunaLoading] = useState(false);
  const [lunaUpdateTrigger, setLunaUpdateTrigger] = useState(0);

  // Delete confirmation modal state
  const [deleteConfirmState, setDeleteConfirmState] = useState<{
    type: "lesson" | "chapter";
    lessonIdx: number;
    chapterIdx?: number;
    title: string;
    details: string;
  } | null>(null);



  // Fetch extracted files/images from the background generation job
  const effectiveJobId = jobId || (plan as any)?.source_job_id;

  const { data: extractedFiles, isValidating: loadingFiles, mutate: mutateFiles } = useFrappeGetDocList("File", {
    fields: ["name", "file_name", "file_url"],
    filters: effectiveJobId ? [
      ["file_name", "like", `%${effectiveJobId}%`]
    ] : [["name", "=", "NONE"]],
    limit: 100
  });

  // Automatically resolve broken inline image URLs when extracted files are loaded
  useEffect(() => {
    if (!plan || !extractedFiles || extractedFiles.length === 0) return;

    let needsFix = false;
    plan.lessons.forEach((lesson) => {
      lesson.chapters.forEach((chapter) => {
        if (chapter.content_type === "Text Content" && chapter.body) {
          const imgMatches = chapter.body.match(/<img[^>]+>/gi);
          if (imgMatches) {
            imgMatches.forEach(imgTag => {
              const srcMatch = imgTag.match(/src\s*=\s*\\?["']([^\\"'<>]+)\\?["']/i);
              if (srcMatch) {
                const src = srcMatch[1];
                if (!src.startsWith("/files") && !src.startsWith("files") && !src.startsWith("http") && !src.startsWith("/")) {
                  needsFix = true;
                }
              }
            });
          }
        }
      });
    });

    if (needsFix) {
      const fixed = fixPlanImages(plan, extractedFiles);
      setPlan(fixed);
    }
  }, [extractedFiles, plan, setPlan]);

  const [activePreviewImage, setActivePreviewImage] = useState<{ url: string; context: string } | null>(null);


  const getAbsoluteUrl = (url: string) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    const baseUrl = LMS_API_BASE_URL || LMS_FILE_BASE_URL || '';
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    return `${cleanBaseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const getFileContext = (filename: string) => {
    if (!filename) return "Extracted Asset";
    // Match page: page_{jobId}_p{page}.jpg
    const pageMatch = filename.match(/page_.*_p(\d+)/i);
    if (pageMatch) {
      return `Full PDF Page ${pageMatch[1]}`;
    }
    // Match extracted: extracted_{jobId}_p{page}_i{imgIndex}
    const extMatch = filename.match(/extracted_.*_p(\d+)_i(\d+)/i);
    if (extMatch) {
      return `Embedded Figure ${extMatch[2]} (Page ${extMatch[1]})`;
    }
    return filename;
  };

  const copyToClipboard = (text: string, type: "html" | "url" | "filename") => {
    const showSuccessToast = (t: typeof type) => {
      if (t === "html") {
        toast.success("HTML tag copied to clipboard!");
      } else if (t === "url") {
        toast.success("Image URL copied to clipboard!");
      } else {
        toast.success("Filename copied to clipboard!");
      }
    };

    const fallbackCopy = (txt: string, t: typeof type) => {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = txt;
        textArea.style.position = "fixed";
        textArea.style.top = "0";
        textArea.style.left = "0";
        textArea.style.width = "2em";
        textArea.style.height = "2em";
        textArea.style.padding = "0";
        textArea.style.border = "none";
        textArea.style.outline = "none";
        textArea.style.boxShadow = "none";
        textArea.style.background = "transparent";

        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);

        if (successful) {
          showSuccessToast(t);
        } else {
          toast.error("Failed to copy. Please copy manually.");
        }
      } catch (err) {
        toast.error("Failed to copy. Please copy manually.");
      }
    };

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text)
        .then(() => {
          showSuccessToast(type);
        })
        .catch(() => {
          fallbackCopy(text, type);
        });
    } else {
      fallbackCopy(text, type);
    }
  };

  const renderExtractedImagesCard = () => {
    if (loadingFiles) {
      return (
        <div className="bg-muted/20 border border-border rounded-2xl p-4 flex flex-col items-center justify-center min-h-[150px]">
          <RefreshCw className="w-5 h-5 animate-spin text-primary mb-2" />
          <span className="text-xs text-muted-foreground">Loading extracted assets...</span>
        </div>
      );
    }
    if (!extractedFiles || extractedFiles.length === 0) return null;
    return (
      <div className="bg-muted/20 border border-border rounded-2xl p-4 flex flex-col min-h-0 max-h-[400px]">
        <div className="flex items-center justify-between border-b pb-2 shrink-0">
          <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <ImageIcon className="w-4 h-4 text-primary" />
            Extracted PDF Images
          </h3>
          <Badge variant="outline" className="text-[9px] uppercase font-bold text-primary border-primary/20 bg-primary/5 px-2 py-0.5">
            {extractedFiles.length} Assets
          </Badge>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 shrink-0">
          Click thumbnail to zoom. Copy HTML tag or click filename to copy.
        </p>

        <div className="flex-1 overflow-y-auto mt-3 pr-1 space-y-2 scrollbar-thin">
          {extractedFiles.map((file: any, fIdx: number) => {
            const context = getFileContext(file.file_name);
            const imgTag = `<img src="${file.file_url}" alt="${context}" style="max-width:100%; border-radius:8px; margin: 16px 0;" />`;

            return (
              <div key={fIdx} className="flex items-center gap-3 bg-background border border-border/85 rounded-xl p-2 hover:bg-muted/40 transition-all shadow-sm">
                <img
                  src={getAbsoluteUrl(file.file_url)}
                  alt={context}
                  onClick={() => setActivePreviewImage({ url: file.file_url, context })}
                  className="w-12 h-12 object-cover rounded-lg border border-border/60 cursor-zoom-in hover:scale-105 transition-transform shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[10.5px] font-bold text-foreground truncate" title={context}>{context}</div>
                  <div
                    className="text-[9px] text-muted-foreground truncate cursor-pointer hover:text-primary hover:underline select-all"
                    title="Click to copy filename"
                    onClick={() => copyToClipboard(file.file_name, "filename")}
                  >
                    {file.file_name}
                  </div>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                    title="Copy HTML Tag"
                    onClick={() => copyToClipboard(imgTag, "html")}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // Fetch predefined templates and color palettes from database
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const cleanBaseUrl = LMS_API_BASE_URL ? LMS_API_BASE_URL.replace(/\/$/, '') : '';
        const res = await fetch(`${cleanBaseUrl}/api/method/novel_lms.lms_ai_module_creation.api.generator.get_predefined_assets`, {
          credentials: "include"
        });
        if (res.ok) {
          const data = await res.json();
          if (data.message && data.message.success) {
            setPredefinedAssets({
              templates: data.message.templates || [],
              palettes: data.message.palettes || []
            });
          }
        }
      } catch (err) {
        console.error("Failed to load templates/palettes", err);
      }
    };
    fetchAssets();
  }, []);

  // Run initial plan drafting background job if plan is null
  useEffect(() => {
    let isMounted = true;
    let pollInterval: any = null;

    if (plan) return;

    const runPlanDrafting = async () => {
      try {
        setIsDrafting(true);
        let currentJobId = resumedDraftJobId || "";
        const cleanBaseUrl = LMS_API_BASE_URL ? LMS_API_BASE_URL.replace(/\/$/, '') : '';
        let notFoundCount = 0;
        const NOT_FOUND_LIMIT = 5;

        if (!currentJobId) {
          setDraftProgress("Uploading file attachments...");

          const fileUrls: string[] = [];
          for (let i = 0; i < files.length; i++) {
            const ufile = files[i];
            setDraftProgress(`Uploading file ${i + 1} of ${files.length}: ${ufile.file.name}...`);
            const fileUrl = await uploadFileToFrappe(ufile.file);
            fileUrls.push(fileUrl);
          }

          setDraftProgress("Starting curriculum plan generator...");
          const generateUrl = `${cleanBaseUrl}/api/method/novel_lms.lms_ai_module_creation.api.generator.generate_module_plan`;

          if (!activeDraftPromise) {
            activeDraftPromise = (async () => {
              const response = await fetch(generateUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Accept": "application/json" },
                body: JSON.stringify({
                  file_urls: fileUrls,
                  instructions: instructions || blueprintJson?.user_instructions || "Generate full curriculum plan from approved blueprint structure.",
                  department: department,
                  assignment_based: assignmentBased,
                  generate_slides: true,
                  slide_theme: slideTheme,
                  slide_transition: slideTransition,
                  element_entrance: elementEntrance,
                  narration_tone: narrationTone,
                  target_audience: targetAudience,
                  learning_goal: learningGoal,
                  slide_count: slideCount,
                  blueprint_json: blueprintJson || null,
                }),
                credentials: "include"
              });

              if (!response.ok) throw new Error("Failed to start plan drafting");
              const genResult = await response.json();
              const job = genResult.message;
              if (!job || !job.success || !job.job_id) throw new Error(job?.error || "Job start failed.");
              return job.job_id;
            })();
          }

          try {
            currentJobId = await activeDraftPromise;
          } catch (err) {
            activeDraftPromise = null;
            throw err;
          }

          if (isMounted) {
            setJobId(currentJobId);
            localStorage.setItem("active_ai_job_id", currentJobId);
            localStorage.setItem("active_ai_job_type", "draft");
            localStorage.setItem("active_ai_job_progress", "Waiting in queue...");
          }
        }

        const pollUrl = `${cleanBaseUrl}/api/method/novel_lms.lms_ai_module_creation.api.generator.get_status?ai_job_id=${currentJobId}`;

        const checkStatus = async () => {
          try {
            const statusResponse = await fetch(pollUrl, { credentials: "include" });
            if (!statusResponse.ok) return false;

            const statusResult = await statusResponse.json();
            const statusData = statusResult.message;
            if (!isMounted) return false;

            if (!statusData || statusData.status === "not_found") {
              notFoundCount++;
              if (notFoundCount >= NOT_FOUND_LIMIT) {
                setIsDrafting(false);
                localStorage.removeItem("active_ai_job_id");
                localStorage.removeItem("active_ai_job_type");
                localStorage.removeItem("active_ai_job_progress");
                localStorage.removeItem("completed_ai_draft_job_id");
                toast.error("The background worker crashed or the job expired. Please try again.");
                activeDraftPromise = null;
                onBack();
                return true;
              }
              return false;
            }

            notFoundCount = 0;

            if (statusData.status === "finished") {
              setIsDrafting(false);
              setPlan(statusData.plan);
              mutateFiles?.(); // Force refresh extracted PDF images list
              localStorage.removeItem("active_ai_job_id");
              localStorage.removeItem("active_ai_job_type");
              localStorage.removeItem("active_ai_job_progress");
              localStorage.removeItem("completed_ai_draft_job_id");
              activeDraftPromise = null;
              return true;
            } else if (statusData.status === "failed") {
              setIsDrafting(false);
              localStorage.removeItem("active_ai_job_id");
              localStorage.removeItem("active_ai_job_type");
              localStorage.removeItem("active_ai_job_progress");
              localStorage.removeItem("completed_ai_draft_job_id");
              toast.error(statusData.error || "Failed to generate plan.");
              activeDraftPromise = null;
              onBack();
              return true;
            } else if (statusData.status === "cancelled" || statusData.status === "stopped") {
              setIsDrafting(false);
              localStorage.removeItem("active_ai_job_id");
              localStorage.removeItem("active_ai_job_type");
              localStorage.removeItem("active_ai_job_progress");
              localStorage.removeItem("completed_ai_draft_job_id");
              toast.info(statusData.progress || "Process was cancelled.");
              activeDraftPromise = null;
              onBack();
              return true;
            } else if (statusData.progress) {
              setDraftProgress(statusData.progress);
              localStorage.setItem("active_ai_job_progress", statusData.progress);
            }
          } catch (pollErr) {
            console.error("Polling error", pollErr);
          }
          return false;
        };

        // Run immediately first to support instant load of completed jobs
        const isDone = await checkStatus();
        if (isDone) return;

        pollInterval = setInterval(checkStatus, 2000);

      } catch (err: any) {
        console.error("Draft error", err);
        activeDraftPromise = null;
        if (isMounted) {
          toast.error(err.message || "An error occurred.");
          setIsDrafting(false);
          localStorage.removeItem("active_ai_job_id");
          localStorage.removeItem("active_ai_job_type");
          localStorage.removeItem("active_ai_job_progress");
          onBack();
        }
      }
    };

    runPlanDrafting();

    return () => {
      isMounted = false;
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [plan, resumedDraftJobId]);

  const handleRefinePlan = async () => {
    if (!refinePrompt.trim() && refineFiles.length === 0) return;
    try {
      setIsRefining(true);
      setRefineProgress("Enqueuing plan refinement...");
      const cleanBaseUrl = LMS_API_BASE_URL ? LMS_API_BASE_URL.replace(/\/$/, '') : '';
      const refineUrl = `${cleanBaseUrl}/api/method/novel_lms.lms_ai_module_creation.api.generator.refine_curriculum_plan`;

      const response = await fetch(refineUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan_json: plan,
          instructions: refinePrompt,
          file_urls: refineFiles.filter(f => !f.isUploading).map(f => f.url)
        }),
        credentials: "include"
      });

      if (!response.ok) throw new Error("Plan refinement failed to start");
      const resData = await response.json();
      const job = resData.message;
      if (!job || !job.success || !job.job_id) {
        throw new Error(job?.error || "Failed to start refinement job.");
      }

      const jobId = job.job_id;
      const pollUrl = `${cleanBaseUrl}/api/method/novel_lms.lms_ai_module_creation.api.generator.get_status?ai_job_id=${jobId}`;
      let notFoundCount = 0;
      const NOT_FOUND_LIMIT = 5;

      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await fetch(pollUrl, { credentials: "include" });
          if (!statusResponse.ok) return;

          const statusResult = await statusResponse.json();
          const statusData = statusResult.message;

          if (!statusData || statusData.status === "not_found") {
            notFoundCount++;
            if (notFoundCount >= NOT_FOUND_LIMIT) {
              clearInterval(pollInterval);
              setIsRefining(false);
              toast.error("The background worker crashed or the job expired. Please try again.");
            }
            return;
          }

          notFoundCount = 0;

          if (statusData.status === "finished") {
            clearInterval(pollInterval);
            setPlan(statusData.plan);
            mutateFiles?.(); // Force refresh extracted PDF images list
            setRefinePrompt("");
            setRefineFiles([]);
            setIsRefining(false);
            toast.success("Plan updated successfully!");
          } else if (statusData.status === "failed") {
            clearInterval(pollInterval);
            setIsRefining(false);
            toast.error(statusData.error || "Failed to refine plan.");
          } else if (statusData.progress) {
            setRefineProgress(statusData.progress);
          }
        } catch (pollErr) {
          console.error("Polling refinement error", pollErr);
        }
      }, 2000);

    } catch (err: any) {
      toast.error(err.message || "An error occurred during refinement.");
      setIsRefining(false);
    }
  };

  const handleOpenEditChapter = (lessonIdx: number, chapterIdx: number) => {
    const ch = plan!.lessons[lessonIdx].chapters[chapterIdx];
    setEditingChapterPath({ lessonIdx, chapterIdx });
    setEditingChapter(JSON.parse(JSON.stringify(ch))); // deep copy
    setActiveSlideIdx(0);
    setLunaUpdateTrigger(0);
    setIsEditingChapter?.(true);
  };

  const handleSaveChapterDetails = () => {
    if (!editingChapterPath || !editingChapter) return;
    const { lessonIdx, chapterIdx } = editingChapterPath;

    const updatedPlan = JSON.parse(JSON.stringify(plan));
    updatedPlan.lessons[lessonIdx].chapters[chapterIdx] = editingChapter;

    setPlan(updatedPlan);
    setEditingChapterPath(null);
    setEditingChapter(null);
    setIsEditingChapter?.(false);
    toast.success("Chapter details updated!");
  };

  const handleDeleteLesson = (lessonIdx: number) => {
    if (!plan) return;
    const lessonName = plan.lessons[lessonIdx]?.lesson_name || `Lesson ${lessonIdx + 1}`;
    setDeleteConfirmState({
      type: "lesson",
      lessonIdx,
      title: lessonName,
      details: `Are you sure you want to delete "${lessonName}" and all of its chapters? This action cannot be undone.`,
    });
  };

  const handleDeleteChapter = (lessonIdx: number, chapterIdx: number) => {
    if (!plan) return;
    const chapterName = plan.lessons[lessonIdx]?.chapters[chapterIdx]?.title || `Chapter ${chapterIdx + 1}`;
    setDeleteConfirmState({
      type: "chapter",
      lessonIdx,
      chapterIdx,
      title: chapterName,
      details: `Are you sure you want to delete chapter "${chapterName}"?`,
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmState || !plan) return;

    if (deleteConfirmState.type === "lesson") {
      const updatedLessons = plan.lessons.filter((_, idx) => idx !== deleteConfirmState.lessonIdx);
      setPlan({
        ...plan,
        lessons: updatedLessons,
      });
      toast.success(`Deleted "${deleteConfirmState.title}"`);
    } else if (deleteConfirmState.type === "chapter" && deleteConfirmState.chapterIdx !== undefined) {
      const { lessonIdx, chapterIdx } = deleteConfirmState;
      const updatedLessons = [...plan.lessons];
      const updatedChapters = updatedLessons[lessonIdx].chapters.filter((_, idx) => idx !== chapterIdx);
      updatedLessons[lessonIdx] = {
        ...updatedLessons[lessonIdx],
        chapters: updatedChapters,
      };
      setPlan({
        ...plan,
        lessons: updatedLessons,
      });
      toast.success(`Deleted chapter "${deleteConfirmState.title}"`);
    }

    setDeleteConfirmState(null);
  };

  const handleLunaRefine = async () => {
    if (!lunaPrompt.trim() || !editingChapter) return;
    setIsLunaLoading(true);
    const toastId = toast.loading("Lumi AI is refining this chapter...");
    try {
      const cleanBaseUrl = LMS_API_BASE_URL ? LMS_API_BASE_URL.replace(/\/$/, '') : '';
      const response = await fetch(
        `${cleanBaseUrl}/api/method/novel_lms.lms_ai_module_creation.api.generator.refine_chapter_directly`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            chapter_json: JSON.stringify(editingChapter),
            instruction: lunaPrompt
          }),
          credentials: "include"
        }
      );

      if (!response.ok) {
        throw new Error(`Server returned status: ${response.status}`);
      }

      const resData = await response.json();
      if (resData.exc) {
        throw new Error(resData.exc);
      }

      const message = resData.message;
      if (!message || !message.success || !message.chapter) {
        throw new Error(message?.error || "Failed to refine chapter.");
      }

      setEditingChapter(message.chapter);
      setLunaPrompt("");
      setLunaUpdateTrigger(prev => prev + 1);
      toast.success("Chapter refined successfully!", { id: toastId });
    } catch (err: any) {
      toast.error(`Error asking Lumi: ${err.message || err}`, { id: toastId });
    } finally {
      setIsLunaLoading(false);
    }
  };

  if (isDrafting) {
    return (
      <div className="flex flex-col items-center justify-center gap-8 h-full py-10">
        <style>{`
          @keyframes pulse-core {
            0%, 100% { transform: scale(1); opacity: 0.9; box-shadow: 0 0 25px 4px rgba(var(--primary-rgb), 0.25); }
            50% { transform: scale(1.08); opacity: 1; box-shadow: 0 0 45px 10px rgba(var(--primary-rgb), 0.45); }
          }
          @keyframes float-node-1 {
            0% { transform: translate(0, 0) scale(0.85); opacity: 0; }
            15% { opacity: 1; }
            85% { opacity: 1; }
            100% { transform: translate(-65px, -45px) scale(1); opacity: 0.15; }
          }
          @keyframes float-node-2 {
            0% { transform: translate(0, 0) scale(0.85); opacity: 0; }
            15% { opacity: 1; }
            85% { opacity: 1; }
            100% { transform: translate(65px, -25px) scale(1); opacity: 0.15; }
          }
          @keyframes float-node-3 {
            0% { transform: translate(0, 0) scale(0.85); opacity: 0; }
            15% { opacity: 1; }
            85% { opacity: 1; }
            100% { transform: translate(-45px, 45px) scale(1); opacity: 0.15; }
          }
          @keyframes float-node-4 {
            0% { transform: translate(0, 0) scale(0.85); opacity: 0; }
            15% { opacity: 1; }
            85% { opacity: 1; }
            100% { transform: translate(55px, 55px) scale(1); opacity: 0.15; }
          }
          @keyframes draw-line {
            0% { stroke-dashoffset: 100; }
            100% { stroke-dashoffset: 0; }
          }
          @keyframes rotate-ring {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes pulse-ring-draft {
            0% { transform: scale(0.95); opacity: 0.8; }
            50% { transform: scale(1.05); opacity: 0.2; }
            100% { transform: scale(0.95); opacity: 0.8; }
          }
        `}</style>

        <div className="relative flex items-center justify-center w-64 h-64">
          {/* Pulsing Ambient Background Ring */}
          <div
            className="absolute rounded-full border-2 border-primary/20"
            style={{
              width: "200px",
              height: "200px",
              animation: "pulse-ring-draft 3s ease-in-out infinite",
            }}
          />

          {/* Network Connection Lines */}
          <svg className="absolute w-full h-full text-primary/30" viewBox="0 0 200 200">
            <line x1="100" y1="100" x2="35" y2="55" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" style={{ animation: "draw-line 3s linear infinite" }} />
            <line x1="100" y1="100" x2="165" y2="75" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" style={{ animation: "draw-line 3.5s linear infinite" }} />
            <line x1="100" y1="100" x2="55" y2="145" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" style={{ animation: "draw-line 2.5s linear infinite" }} />
            <line x1="100" y1="100" x2="155" y2="155" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" style={{ animation: "draw-line 4s linear infinite" }} />
          </svg>

          {/* Pulsing Central AI Core */}
          <div
            className="relative z-10 flex items-center justify-center w-24 h-24 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md shadow-lg"
            style={{ animation: "pulse-core 3s ease-in-out infinite" }}
          >
            <Sparkles className="w-10 h-10 text-primary animate-pulse" />

            {/* Dashed outer orbit */}
            <div className="absolute -inset-4 rounded-full border border-dashed border-primary/20" style={{ animation: "rotate-ring 15s linear infinite" }} />
          </div>

          {/* Floating Course Node Metaphors */}
          <div
            className="absolute flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-xl shadow-md z-20 text-[10px] font-semibold text-foreground animate-fade-in"
            style={{ animation: "float-node-1 4.5s ease-in-out infinite" }}
          >
            <FileText className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span className="truncate max-w-[110px]">Analyzing Sources</span>
          </div>

          <div
            className="absolute flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-xl shadow-md z-20 text-[10px] font-semibold text-foreground animate-fade-in"
            style={{ animation: "float-node-2 5s ease-in-out infinite", animationDelay: "1s" }}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-500 shrink-0" />
            <span className="truncate max-w-[110px]">Extracting Knowledge</span>
          </div>

          <div
            className="absolute flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-xl shadow-md z-20 text-[10px] font-semibold text-foreground animate-fade-in"
            style={{ animation: "float-node-3 4.2s ease-in-out infinite", animationDelay: "2s" }}
          >
            <ClipboardList className="w-3.5 h-3.5 text-orange-500 shrink-0" />
            <span className="truncate max-w-[110px]">Synthesizing Structure</span>
          </div>

          <div
            className="absolute flex items-center gap-2 px-3 py-2 bg-background border border-border rounded-xl shadow-md z-20 text-[10px] font-semibold text-foreground animate-fade-in"
            style={{ animation: "float-node-4 5.5s ease-in-out infinite", animationDelay: "0.5s" }}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span className="truncate max-w-[110px]">Enhancing Curriculum</span>
          </div>
        </div>

        <div className="text-center space-y-3 max-w-md px-4">
          <h3 className="text-base font-bold text-foreground tracking-tight">Drafting Curriculum Plan</h3>
          <p className="text-xs text-muted-foreground leading-relaxed h-8">{draftProgress}</p>

          <div className="flex items-center justify-center gap-3 mt-6">
            {jobId && (
              <Button
                variant="outline"
                className="font-semibold border-primary/30 hover:border-primary text-primary hover:bg-primary/5 transition-all duration-300 shadow-sm"
                onClick={() => setLocation("/")}
              >
                Run in Background
              </Button>
            )}
            {onCancelProcess && (
              <Button
                variant="outline"
                className="font-semibold border-red-200 hover:border-red-400 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/50 transition-all duration-300 shadow-sm gap-1.5"
                onClick={onCancelProcess}
              >
                <X className="w-4 h-4" />
                Cancel Process
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!plan) return null;

  if (editingChapter) {
    return (
      <div className="flex flex-col h-full w-full bg-background select-none text-left min-h-0">
        {/* Header bar */}
        <div className="shrink-0 flex items-center justify-between pb-1.5 border-b">
          <h2 className="text-sm font-bold text-foreground tracking-tight">
            Edit Chapter: {editingChapter.title}
          </h2>
          <Badge variant="secondary" className="text-[10px] uppercase font-bold bg-primary/10 text-primary border-primary/20">
            {editingChapter.content_type}
          </Badge>
        </div>

        {/* Lumi AI Refinement Box (Fixed at top & Compact) */}
        <div className="shrink-0 pt-2 pb-1.5 border-b space-y-1.5">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-2 space-y-1.5">
            <div className="flex items-center gap-1.5 text-primary text-xs font-bold">
              <Sparkles className="w-3 h-3 text-primary animate-pulse" />
              <span>Lumi AI Assistant</span>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Refine this chapter (e.g. 'summarise this', 'make it simpler', 'add section')"
                value={lunaPrompt}
                onChange={(e) => setLunaPrompt(e.target.value)}
                disabled={isLunaLoading}
                className="text-xs h-8 bg-background flex-1"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !isLunaLoading) {
                    e.preventDefault();
                    handleLunaRefine();
                  }
                }}
              />
              <Button
                size="sm"
                onClick={handleLunaRefine}
                disabled={isLunaLoading || !lunaPrompt.trim()}
                className="h-8 shrink-0 gap-1 text-xs"
              >
                {isLunaLoading ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Asking...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" />
                    <span>Ask Lumi</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto py-4 pr-1 space-y-4 scrollbar-thin text-left min-h-0">
          {/* Text Content & General Body Content Editor (Steps, Check List, Accordion Content, Question Answer, Iframe Content, Text Content) */}
          {editingChapter.content_type !== "Quiz" &&
           editingChapter.content_type !== "Video Content" &&
           editingChapter.content_type !== "Slide Content" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-bold">Chapter Title</Label>
                <Input
                  value={editingChapter.title}
                  onChange={(e) => setEditingChapter(prev => prev ? { ...prev, title: e.target.value } : null)}
                  className="text-sm h-10"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-bold">Chapter Summary</Label>
                <Textarea
                  value={editingChapter.summary}
                  onChange={(e) => setEditingChapter(prev => prev ? { ...prev, summary: e.target.value } : null)}
                  className="text-sm min-h-[60px] h-20 scrollbar-thin resize-none"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-bold">Content</Label>
                <div className="border rounded-lg bg-background p-1 min-h-[220px]">
                  <RichEditor
                    key={`${editingChapterPath?.lessonIdx}-${editingChapterPath?.chapterIdx}-${lunaUpdateTrigger}`}
                    content={editingChapter.body || ""}
                    onChange={(val) => setEditingChapter(prev => prev ? { ...prev, body: val } : null)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Type 2: Quiz Editor */}
          {editingChapter.content_type === "Quiz" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Chapter Title</Label>
                  <Input
                    value={editingChapter.title}
                    onChange={(e) => setEditingChapter(prev => prev ? { ...prev, title: e.target.value } : null)}
                    className="text-xs h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Chapter Summary</Label>
                  <Input
                    value={editingChapter.summary}
                    onChange={(e) => setEditingChapter(prev => prev ? { ...prev, summary: e.target.value } : null)}
                    className="text-xs h-9"
                  />
                </div>
              </div>

              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold">Quiz Questions ({editingChapter.quiz_details?.questions?.length || 0})</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-[10px] font-semibold border-primary/20 text-primary hover:bg-primary/5 px-2.5 py-1 rounded-md"
                    onClick={() => {
                      const updated = JSON.parse(JSON.stringify(editingChapter));
                      if (!updated.quiz_details) updated.quiz_details = { questions: [] };
                      if (!updated.quiz_details.questions) updated.quiz_details.questions = [];
                      updated.quiz_details.questions.push({
                        question_text: "New Multiple Choice Question",
                        question_type: "Single Choice",
                        score: 1,
                        options: [
                          { option_text: "Option A", correct: 1 },
                          { option_text: "Option B", correct: 0 },
                          { option_text: "Option C", correct: 0 }
                        ]
                      });
                      setEditingChapter(updated);
                    }}
                  >
                    + Add Question
                  </Button>
                </div>

                <div className="space-y-3 max-h-[350px] overflow-y-auto border p-3 rounded-lg bg-muted/10 scrollbar-thin">
                  {(!editingChapter.quiz_details?.questions || editingChapter.quiz_details.questions.length === 0) ? (
                    <div className="text-center py-6 text-xs text-muted-foreground">No questions generated yet. Click "+ Add Question" to get started.</div>
                  ) : (
                    editingChapter.quiz_details.questions.map((q, qIdx) => (
                      <div key={qIdx} className="bg-background border rounded-lg p-3 space-y-3 shadow-sm relative">
                        <button
                          type="button"
                          className="absolute top-2 right-2 text-muted-foreground hover:text-destructive text-[10px]"
                          onClick={() => {
                            const updated = JSON.parse(JSON.stringify(editingChapter));
                            updated.quiz_details.questions.splice(qIdx, 1);
                            setEditingChapter(updated);
                          }}
                        >
                          Delete
                        </button>

                        <div className="grid grid-cols-4 gap-3 items-end pr-10">
                          <div className="col-span-3 space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground">Question {qIdx + 1}:</span>
                            <Input
                              value={q.question_text}
                              onChange={(e) => {
                                const updated = JSON.parse(JSON.stringify(editingChapter));
                                updated.quiz_details.questions[qIdx].question_text = e.target.value;
                                setEditingChapter(updated);
                              }}
                              className="h-8 text-xs py-1"
                            />
                          </div>
                          <div className="col-span-1 space-y-1">
                            <span className="text-[10px] font-bold text-muted-foreground">Score:</span>
                            <Input
                              type="number"
                              value={q.score}
                              onChange={(e) => {
                                const updated = JSON.parse(JSON.stringify(editingChapter));
                                updated.quiz_details.questions[qIdx].score = parseInt(e.target.value) || 1;
                                setEditingChapter(updated);
                              }}
                              className="h-8 text-xs py-1"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-muted-foreground">Options (check correct):</span>
                            <button
                              type="button"
                              className="text-[9px] text-primary hover:underline font-semibold"
                              onClick={() => {
                                const updated = JSON.parse(JSON.stringify(editingChapter));
                                if (!updated.quiz_details.questions[qIdx].options) {
                                  updated.quiz_details.questions[qIdx].options = [];
                                }
                                updated.quiz_details.questions[qIdx].options.push({ option_text: "New Option", correct: 0 });
                                setEditingChapter(updated);
                              }}
                            >
                              + Add Option
                            </button>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {(q.options || []).map((opt, optIdx) => (
                              <div key={optIdx} className="flex items-center gap-2 border p-1.5 rounded bg-background/50">
                                <input
                                  type="checkbox"
                                  checked={!!opt.correct}
                                  onChange={(e) => {
                                    const updated = JSON.parse(JSON.stringify(editingChapter));
                                    if (q.question_type === "Single Choice") {
                                      updated.quiz_details.questions[qIdx].options.forEach((o: any, idx: number) => {
                                        o.correct = idx === optIdx ? (e.target.checked ? 1 : 0) : 0;
                                      });
                                    } else {
                                      updated.quiz_details.questions[qIdx].options[optIdx].correct = e.target.checked ? 1 : 0;
                                    }
                                    setEditingChapter(updated);
                                  }}
                                  className="h-3.5 w-3.5 rounded text-primary border-border focus:ring-primary shrink-0"
                                />
                                <Input
                                  value={opt.option_text}
                                  onChange={(e) => {
                                    const updated = JSON.parse(JSON.stringify(editingChapter));
                                    updated.quiz_details.questions[qIdx].options[optIdx].option_text = e.target.value;
                                    setEditingChapter(updated);
                                  }}
                                  className="h-7 text-xs py-0.5 border-0 focus-visible:ring-1"
                                />
                                <button
                                  type="button"
                                  className="text-muted-foreground hover:text-destructive text-[10px] pr-1"
                                  onClick={() => {
                                    const updated = JSON.parse(JSON.stringify(editingChapter));
                                    updated.quiz_details.questions[qIdx].options.splice(optIdx, 1);
                                    setEditingChapter(updated);
                                  }}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Type 3: Video Content Editor */}
          {editingChapter.content_type === "Video Content" && editingChapter.video_details && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Template Selection */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold">Video Style Template</Label>
                  <Select
                    value={editingChapter.video_details.template}
                    onValueChange={(val) => {
                      const updated = JSON.parse(JSON.stringify(editingChapter));
                      updated.video_details.template = val;
                      setEditingChapter(updated);
                    }}
                  >
                    <SelectTrigger className="w-full text-xs">
                      <SelectValue placeholder="Select style template" />
                    </SelectTrigger>
                    <SelectContent>
                      {predefinedAssets.templates.map((tpl) => (
                        <SelectItem key={tpl.name} value={tpl.name} className="text-xs">
                          {tpl.name} ({tpl.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {editingChapter.video_details.template && (() => {
                    const tpl = predefinedAssets.templates.find(t => t.name === editingChapter.video_details!.template);
                    if (!tpl) return null;
                    return (
                      <div className="bg-muted/40 p-2.5 rounded-lg text-[10px] space-y-1.5 border leading-relaxed">
                        <p><span className="font-bold text-muted-foreground">Tone:</span> {tpl.subject_description}</p>
                        <p><span className="font-bold text-muted-foreground">Background:</span> {tpl.environment_description}</p>
                        <p><span className="font-bold text-muted-foreground">Movement:</span> {tpl.camera_movement} • {tpl.lighting_style}</p>
                      </div>
                    );
                  })()}
                </div>

                {/* Color Palette Grid Swatches */}
                <div className="space-y-2">
                  <Label className="text-xs font-bold">Slide Color Palette</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-[175px] overflow-y-auto border p-2 rounded-lg scrollbar-thin bg-background">
                    {predefinedAssets.palettes.map((pal) => {
                      const isSelected = editingChapter.video_details!.color_palette === pal.name;
                      return (
                        <div
                          key={pal.name}
                          onClick={() => {
                            const updated = JSON.parse(JSON.stringify(editingChapter));
                            updated.video_details.color_palette = pal.name;
                            setEditingChapter(updated);
                          }}
                          className={`cursor-pointer p-2 border rounded-lg transition-all flex items-center justify-between text-[11px] ${isSelected ? "border-primary bg-primary/5 font-semibold" : "border-border hover:bg-muted/50 text-muted-foreground"
                            }`}
                        >
                          <span className="truncate pr-1">{pal.name}</span>
                          <div className="flex gap-0.5 shrink-0">
                            <div className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: pal.primary_color }} />
                            <div className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: pal.secondary_color }} />
                            <div className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: pal.background_color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Speech script edit box */}
              <div className="space-y-2">
                <Label htmlFor="speechScript" className="text-xs font-bold">Narration Speech Script</Label>
                <Textarea
                  id="speechScript"
                  value={editingChapter.video_details.script}
                  onChange={(e) => {
                    const updated = JSON.parse(JSON.stringify(editingChapter));
                    updated.video_details.script = e.target.value;
                    setEditingChapter(updated);
                  }}
                  className="min-h-[75px] text-xs scrollbar-thin"
                />
              </div>

              {/* Slide Detail List Edit - Sidebar + Content Panel */}
              <div className="space-y-2.5">
                <div className="flex border rounded-lg overflow-hidden bg-background" style={{ minHeight: 340 }}>
                  {/* Left Sidebar - Slides Outline */}
                  <div className="w-[180px] shrink-0 border-r bg-muted/20 flex flex-col">
                    <div className="flex items-center justify-between px-3 py-2 border-b">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Slides Outline</span>
                      <button
                        type="button"
                        className="text-[10px] font-semibold text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors"
                        onClick={() => {
                          const updated = JSON.parse(JSON.stringify(editingChapter));
                          updated.video_details.slides.push({ title: "New Slide", bullets: ["New bullet point"], narration: "Slide narration notes..." });
                          setEditingChapter(updated);
                          setActiveSlideIdx(updated.video_details.slides.length - 1);
                        }}
                      >
                        <Plus className="w-3 h-3" /> Add Slide
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto scrollbar-thin">
                      {editingChapter.video_details.slides.map((slide, sIdx) => (
                        <div
                          key={sIdx}
                          onClick={() => setActiveSlideIdx(sIdx)}
                          className={`group flex items-center gap-2 px-3 py-2.5 cursor-pointer border-b border-border/50 transition-colors ${(activeSlideIdx === sIdx) ? "bg-primary/10 border-l-2 border-l-primary" : "hover:bg-muted/40"
                            }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] text-muted-foreground font-medium">Slide {sIdx + 1}</div>
                            <div className="text-xs font-medium truncate text-foreground">{slide.title || "Untitled"}</div>
                          </div>
                          {editingChapter.video_details!.slides.length > 1 && (
                            <button
                              type="button"
                              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                const updated = JSON.parse(JSON.stringify(editingChapter));
                                updated.video_details.slides.splice(sIdx, 1);
                                setEditingChapter(updated);
                                if (activeSlideIdx >= updated.video_details.slides.length) {
                                  setActiveSlideIdx(Math.max(0, updated.video_details.slides.length - 1));
                                }
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {/* Reorder buttons */}
                    <div className="flex items-center justify-center gap-1 px-3 py-1.5 border-t bg-muted/10">
                      <button
                        type="button"
                        disabled={activeSlideIdx <= 0}
                        className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move slide up"
                        onClick={() => {
                          if (activeSlideIdx <= 0) return;
                          const updated = JSON.parse(JSON.stringify(editingChapter));
                          const slides = updated.video_details.slides;
                          [slides[activeSlideIdx - 1], slides[activeSlideIdx]] = [slides[activeSlideIdx], slides[activeSlideIdx - 1]];
                          setEditingChapter(updated);
                          setActiveSlideIdx(activeSlideIdx - 1);
                        }}
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={activeSlideIdx >= editingChapter.video_details.slides.length - 1}
                        className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move slide down"
                        onClick={() => {
                          if (activeSlideIdx >= editingChapter.video_details!.slides.length - 1) return;
                          const updated = JSON.parse(JSON.stringify(editingChapter));
                          const slides = updated.video_details.slides;
                          [slides[activeSlideIdx], slides[activeSlideIdx + 1]] = [slides[activeSlideIdx + 1], slides[activeSlideIdx]];
                          setEditingChapter(updated);
                          setActiveSlideIdx(activeSlideIdx + 1);
                        }}
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Right Content Panel - Selected Slide Settings */}
                  <div className="flex-1 p-4 overflow-y-auto scrollbar-thin">
                    {editingChapter.video_details.slides.length > 0 && editingChapter.video_details.slides[activeSlideIdx] ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-foreground">Slide {activeSlideIdx + 1} Content Settings</h4>
                          <span className="text-[10px] text-muted-foreground">Duration: {editingChapter.video_details.slides[activeSlideIdx].narration ? `~${Math.max(5, Math.ceil(editingChapter.video_details.slides[activeSlideIdx].narration.split(/\s+/).length / 2.5))}s` : "--"}</span>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Slide Title</Label>
                          <Input
                            value={editingChapter.video_details.slides[activeSlideIdx].title}
                            onChange={(e) => {
                              const updated = JSON.parse(JSON.stringify(editingChapter));
                              updated.video_details.slides[activeSlideIdx].title = e.target.value;
                              setEditingChapter(updated);
                            }}
                            placeholder="Enter slide title..."
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Bullet Points (One per line)</Label>
                          <Textarea
                            value={editingChapter.video_details.slides[activeSlideIdx].bullets?.join("\n") || ""}
                            onChange={(e) => {
                              const updated = JSON.parse(JSON.stringify(editingChapter));
                              updated.video_details.slides[activeSlideIdx].bullets = e.target.value.split("\n").filter((b: string) => b.trim() !== "");
                              setEditingChapter(updated);
                            }}
                            placeholder="Enter bullet points, one per line..."
                            className="min-h-[100px] text-sm scrollbar-thin resize-y"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Narration Script / Speaker Notes</Label>
                          <Textarea
                            value={editingChapter.video_details.slides[activeSlideIdx].narration}
                            onChange={(e) => {
                              const updated = JSON.parse(JSON.stringify(editingChapter));
                              updated.video_details.slides[activeSlideIdx].narration = e.target.value;
                              setEditingChapter(updated);
                            }}
                            placeholder="Slide narration notes..."
                            className="min-h-[80px] text-sm scrollbar-thin resize-y"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        No slides yet. Click "+ Add Slide" to get started.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Type 4: Slide Content Editor */}
          {editingChapter.content_type === "Slide Content" && editingChapter.video_details && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Chapter Title</Label>
                  <Input
                    value={editingChapter.title}
                    onChange={(e) => setEditingChapter(prev => prev ? { ...prev, title: e.target.value } : null)}
                    className="text-xs h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold">Chapter Summary</Label>
                  <Textarea
                    value={editingChapter.summary}
                    onChange={(e) => setEditingChapter(prev => prev ? { ...prev, summary: e.target.value } : null)}
                    className="text-xs min-h-[50px] h-14 scrollbar-thin resize-none"
                  />
                </div>
              </div>

              {/* Slide Detail List Edit - Sidebar + Content Panel */}
              <div className="space-y-2.5">
                <div className="flex border rounded-lg overflow-hidden bg-background" style={{ minHeight: 340 }}>
                  {/* Left Sidebar - Slides Outline */}
                  <div className="w-[180px] shrink-0 border-r bg-muted/20 flex flex-col">
                    <div className="flex items-center justify-between px-3 py-2 border-b">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Slides Outline</span>
                      <button
                        type="button"
                        className="text-[10px] font-semibold text-primary hover:text-primary/80 flex items-center gap-0.5 transition-colors"
                        onClick={() => {
                          const updated = JSON.parse(JSON.stringify(editingChapter));
                          updated.video_details.slides.push({ title: "New Slide", bullets: ["New bullet point"], narration: "" });
                          setEditingChapter(updated);
                          setActiveSlideIdx(updated.video_details.slides.length - 1);
                        }}
                      >
                        <Plus className="w-3 h-3" /> Add Slide
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto scrollbar-thin">
                      {editingChapter.video_details.slides.map((slide, sIdx) => (
                        <div
                          key={sIdx}
                          onClick={() => setActiveSlideIdx(sIdx)}
                          className={`group flex items-center gap-2 px-3 py-2.5 cursor-pointer border-b border-border/50 transition-colors ${(activeSlideIdx === sIdx) ? "bg-primary/10 border-l-2 border-l-primary" : "hover:bg-muted/40"
                            }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] text-muted-foreground font-medium">Slide {sIdx + 1}</div>
                            <div className="text-xs font-medium truncate text-foreground">{slide.title || "Untitled"}</div>
                          </div>
                          {editingChapter.video_details!.slides.length > 1 && (
                            <button
                              type="button"
                              className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                const updated = JSON.parse(JSON.stringify(editingChapter));
                                updated.video_details.slides.splice(sIdx, 1);
                                setEditingChapter(updated);
                                if (activeSlideIdx >= updated.video_details.slides.length) {
                                  setActiveSlideIdx(Math.max(0, updated.video_details.slides.length - 1));
                                }
                              }}
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                    {/* Reorder buttons */}
                    <div className="flex items-center justify-center gap-1 px-3 py-1.5 border-t bg-muted/10">
                      <button
                        type="button"
                        disabled={activeSlideIdx <= 0}
                        className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move slide up"
                        onClick={() => {
                          if (activeSlideIdx <= 0) return;
                          const updated = JSON.parse(JSON.stringify(editingChapter));
                          const slides = updated.video_details.slides;
                          [slides[activeSlideIdx - 1], slides[activeSlideIdx]] = [slides[activeSlideIdx], slides[activeSlideIdx - 1]];
                          setEditingChapter(updated);
                          setActiveSlideIdx(activeSlideIdx - 1);
                        }}
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={activeSlideIdx >= editingChapter.video_details.slides.length - 1}
                        className="p-1 rounded hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        title="Move slide down"
                        onClick={() => {
                          if (activeSlideIdx >= editingChapter.video_details!.slides.length - 1) return;
                          const updated = JSON.parse(JSON.stringify(editingChapter));
                          const slides = updated.video_details.slides;
                          [slides[activeSlideIdx], slides[activeSlideIdx + 1]] = [slides[activeSlideIdx + 1], slides[activeSlideIdx]];
                          setEditingChapter(updated);
                          setActiveSlideIdx(activeSlideIdx + 1);
                        }}
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Right Content Panel - Selected Slide Settings */}
                  <div className="flex-1 p-4 overflow-y-auto scrollbar-thin">
                    {editingChapter.video_details.slides.length > 0 && editingChapter.video_details.slides[activeSlideIdx] ? (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-bold text-foreground">Slide {activeSlideIdx + 1} Content Settings</h4>
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Slide Title</Label>
                          <Input
                            value={editingChapter.video_details.slides[activeSlideIdx].title}
                            onChange={(e) => {
                              const updated = JSON.parse(JSON.stringify(editingChapter));
                              updated.video_details.slides[activeSlideIdx].title = e.target.value;
                              setEditingChapter(updated);
                            }}
                            placeholder="Enter slide title..."
                            className="text-sm"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs text-muted-foreground">Bullet Points (One per line)</Label>
                          <Textarea
                            value={editingChapter.video_details.slides[activeSlideIdx].bullets?.join("\n") || ""}
                            onChange={(e) => {
                              const updated = JSON.parse(JSON.stringify(editingChapter));
                              updated.video_details.slides[activeSlideIdx].bullets = e.target.value.split("\n").filter((b: string) => b.trim() !== "");
                              setEditingChapter(updated);
                            }}
                            placeholder="Enter bullet points, one per line..."
                            className="min-h-[100px] text-sm scrollbar-thin resize-y"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                        No slides yet. Click "+ Add Slide" to get started.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="shrink-0 flex items-center justify-end gap-3 border-t pt-4 mt-2">
          <Button variant="outline" onClick={() => {
            setEditingChapter(null);
            setEditingChapterPath(null);
            setIsEditingChapter?.(false);
          }}>
            Cancel
          </Button>
          <Button onClick={() => {
            handleSaveChapterDetails();
            setIsEditingChapter?.(false);
          }} className="bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-6">
            Save Chapter Details
          </Button>
        </div>
      </div>
    );
  }

  // Count content types for summary bar in plan
  const planTypeCounts: Record<string, number> = {};
  if (plan?.lessons) {
    plan.lessons.forEach(l => l.chapters?.forEach(c => {
      if (c?.content_type) {
        planTypeCounts[c.content_type] = (planTypeCounts[c.content_type] || 0) + 1;
      }
    }));
  }
  const totalPlanChapters = Object.values(planTypeCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="flex flex-col text-left animate-fade-in w-full">
      {/* Header Info */}
      <div className="shrink-0 pb-4 border-b flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <span>Review Curriculum Plan: {plan.module_name}</span>
            <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-300">
              ⚡ Auto-Saved
            </Badge>
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">{plan.description}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50 h-8 shrink-0"
            onClick={() => {
              setPlan(null);
              onBack();
            }}
          >
            Clear & Go To BluePrint
          </Button>
        </div>
      </div>

      {/* Content Type Summary Bar */}
      <div className="flex flex-wrap items-center gap-2 p-3 my-3 bg-muted/30 border border-border rounded-xl">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-1">Plan Summary:</span>
        <Badge variant="outline" className="text-[10px] font-bold">
          {plan.lessons?.length || 0} Lessons · {totalPlanChapters} Chapters
        </Badge>
        {Object.entries(planTypeCounts).map(([type, count]) => {
          const cfg = CONTENT_TYPE_CONFIG[type] || CONTENT_TYPE_CONFIG["Text Content"];
          const Icon = cfg.icon;
          return (
            <Badge key={type} variant="secondary" className={`text-[9px] font-bold gap-1 ${cfg.color} ${cfg.bgColor} border ${cfg.borderColor}`}>
              <Icon className="w-3 h-3" />
              {cfg.label || type} ({count})
            </Badge>
          );
        })}
      </div>

      {/* Main split view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 py-4 w-full">
        {/* Left/Center: Timeline of Lessons */}
        <div className="lg:col-span-2 space-y-4 w-full">
          {(!plan.lessons || plan.lessons.length === 0) ? (
            <div className="p-8 text-center border border-dashed rounded-xl bg-muted/10 space-y-2">
              <p className="text-sm font-semibold text-foreground">No lessons remaining in curriculum plan.</p>
              <p className="text-xs text-muted-foreground">Use Lumi AI on the right to refine or generate new lessons for this module.</p>
            </div>
          ) : (
            <Accordion type="multiple" defaultValue={["lesson-0"]} className="w-full space-y-3">
              {plan.lessons.map((lesson, lIdx) => (
                <AccordionItem
                  key={lIdx}
                  value={`lesson-${lIdx}`}
                  className="border border-border rounded-xl px-4 bg-muted/20 hover:bg-muted/30 transition-all duration-200"
                >
                  <div className="flex items-center justify-between w-full gap-2">
                    <AccordionTrigger className="hover:no-underline py-3 flex-1">
                      <div className="flex flex-col items-start text-left gap-1">
                        <span className="text-sm font-bold text-foreground flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center">
                            {lIdx + 1}
                          </span>
                          Lesson {lIdx + 1}: {lesson.lesson_name}
                        </span>
                        <span className="text-xs text-muted-foreground font-normal leading-normal">{lesson.description}</span>
                      </div>
                    </AccordionTrigger>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 w-8 p-0 ml-2 text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 shrink-0 flex items-center justify-center"
                      title="Delete Lesson"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLesson(lIdx);
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <AccordionContent className="pt-2 pb-4 space-y-3">
                    {(!lesson.chapters || lesson.chapters.length === 0) && (
                      <div className="text-xs text-muted-foreground italic py-3 text-center border border-dashed rounded-lg bg-background/50">
                        No chapters in this lesson.
                      </div>
                    )}
                    {lesson.chapters?.map((chapter, cIdx) => {
                      const cfg = CONTENT_TYPE_CONFIG[chapter.content_type] || CONTENT_TYPE_CONFIG["Text Content"];
                      const Icon = cfg.icon;
                      const isText = chapter.content_type === "Text Content";
                      const isVideo = chapter.content_type === "Video Content";
                      const isSlide = chapter.content_type === "Slide Content";
                      const isQuiz = chapter.content_type === "Quiz";

                      return (
                        <div
                          key={cIdx}
                          className="bg-background border rounded-lg p-3.5 space-y-3 shadow-sm hover:border-muted-foreground/30 transition-all duration-200"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex gap-3 items-start flex-1 min-w-0">
                              <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${cfg.bgColor} ${cfg.color}`}>
                                <Icon className="w-4 h-4" />
                              </div>
                              <div className="space-y-1 min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-xs font-bold text-foreground">{chapter.title}</span>
                                  <Badge variant="outline" className={`text-[10px] font-bold gap-1 px-2 py-0.5 border ${cfg.borderColor} ${cfg.bgColor} ${cfg.color} inline-flex items-center`}>
                                    <Icon className={`w-3 h-3 ${cfg.color}`} />
                                    <span>{chapter.content_type}</span>
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground leading-normal">{chapter.summary}</p>
                                { (isSlide || isVideo) && (
                                  <label className="flex items-center gap-2 mt-1.5 cursor-pointer group">
                                    <input
                                      type="checkbox"
                                      checked={(chapter as any).convert_to_mp4 !== undefined ? !!(chapter as any).convert_to_mp4 : isVideo}
                                      onChange={(e) => {
                                        const updatedPlan = JSON.parse(JSON.stringify(plan));
                                        updatedPlan.lessons[lIdx].chapters[cIdx].convert_to_mp4 = e.target.checked;
                                        setPlan(updatedPlan);
                                      }}
                                      className="rounded border-[#008b99] text-[#008b99] focus:ring-[#008b99] w-3.5 h-3.5"
                                    />
                                    <span className="text-[10px] font-semibold text-[#008b99] group-hover:text-[#006d78] transition-colors">
                                      Convert to MP4 video
                                    </span>
                                  </label>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {/* Edit / Preview Trigger */}
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 gap-1 hover:bg-primary/10 hover:text-primary transition-colors shrink-0 text-xs font-medium border-primary/20 text-primary"
                                onClick={() => {
                                  if (isVideo || isSlide) {
                                    setPreviewModalChapter({ chapter, lessonIdx: lIdx, chapterIdx: cIdx });
                                  } else {
                                    handleOpenEditChapter(lIdx, cIdx);
                                  }
                                }}
                              >
                                {isVideo || isSlide ? (
                                  <>
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Preview</span>
                                  </>
                                ) : (
                                  <>
                                    <Settings className="w-3.5 h-3.5" />
                                    <span>Edit</span>
                                  </>
                                )}
                              </Button>

                              {/* Delete Chapter Trigger */}
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 p-0 text-rose-600 border-rose-200 hover:bg-rose-50 hover:border-rose-300 hover:text-rose-700 shrink-0 flex items-center justify-center"
                                title="Delete Chapter"
                                onClick={() => handleDeleteChapter(lIdx, cIdx)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                        {/* Predefined text body preview */}
                        {isText && chapter.body && (
                          <div className="mt-2 text-[11px] leading-relaxed text-muted-foreground bg-muted/40 border p-3 rounded-lg">
                            <strong className="text-foreground block mb-0.5">Detailed Content Draft:</strong>
                            <style>{`
                              .curriculum-preview-body img {
                                max-height: 120px !important;
                                max-width: 240px !important;
                                width: auto !important;
                                height: auto !important;
                                object-fit: contain !important;
                                border-radius: 6px !important;
                                margin: 8px 0 !important;
                                display: inline-block !important;
                                border: 1px solid rgba(0,0,0,0.1);
                                background: #f8f9fa;
                                padding: 4px;
                                cursor: zoom-in !important;
                                transition: transform 0.2s ease;
                              }
                              .curriculum-preview-body img:hover {
                                transform: scale(1.02);
                                border-color: rgba(var(--primary-rgb), 0.4);
                              }
                            `}</style>
                            <div
                              dangerouslySetInnerHTML={{ __html: fixPreviewImages(chapter.body) }}
                              className="prose prose-sm max-w-none text-[11px] leading-relaxed curriculum-preview-body"
                              onClick={(e) => {
                                const target = e.target as HTMLElement;
                                if (target.tagName === "IMG") {
                                  const src = target.getAttribute("src");
                                  const alt = target.getAttribute("alt") || "Image Preview";
                                  if (src) {
                                    setActivePreviewImage({ url: src, context: alt });
                                  }
                                }
                              }}
                            />
                          </div>
                        )}

                        {/* Predefined quiz details preview */}
                        {isQuiz && chapter.quiz_details?.questions && (
                          <div className="mt-2 text-[11px] leading-relaxed text-muted-foreground bg-muted/40 border p-3 rounded-lg space-y-1.5 max-h-32 overflow-y-auto scrollbar-thin">
                            <strong className="text-foreground block mb-0.5">Quiz Questions ({chapter.quiz_details.questions.length}):</strong>
                            <ol className="list-decimal pl-4 space-y-1">
                              {chapter.quiz_details.questions.map((q, qIdx) => (
                                <li key={qIdx} className="text-[10px]">
                                  <span className="font-semibold text-foreground">{q.question_text}</span>
                                  <span className="text-muted-foreground ml-1">
                                    (Correct Option: <span className="text-emerald-600 font-semibold">{q.options?.filter(o => o.correct).map(o => o.option_text).join(", ") || "None"}</span>)
                                  </span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}

                        {/* Predefined video & slide specs preview without raw Speech Script Outline */}
                        {(isVideo || isSlide) && chapter.video_details && (
                          <div className="bg-muted/40 p-3 rounded-lg border text-xs space-y-2">
                            <div className="flex items-center gap-4 text-[10px] font-semibold text-muted-foreground flex-wrap">
                              <span>Style: <strong className="text-foreground">{chapter.video_details.template || "Interactive Motion"}</strong></span>
                              <span>Palette: <strong className="text-foreground">{chapter.video_details.color_palette || "Modern Professional"}</strong></span>
                              {chapter.video_details.supervisor_info?.supervised && (
                                <Badge variant="outline" className="text-[9px] bg-purple-50 text-purple-700 border-purple-200 font-bold">
                                  ✓ Multi-Agent Supervised
                                </Badge>
                              )}
                              <Badge variant="outline" className="text-[9px] bg-teal-50 text-teal-700 border-teal-200 font-bold">
                                Motion Graphics & Animations
                              </Badge>
                            </div>

                            {/* Planner learning objective if present */}
                            {chapter.video_details.planner_info?.learning_objective && (
                              <div className="text-[10px] text-muted-foreground bg-background/60 p-1.5 rounded border italic">
                                <span className="font-semibold not-italic text-foreground">Planner Objective: </span>
                                {chapter.video_details.planner_info.learning_objective}
                              </div>
                            )}

                            {/* Slides preview list */}
                            {chapter.video_details.slides && chapter.video_details.slides.length > 0 && (
                              <div className="pt-2 border-t mt-1 space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-[10px] font-bold text-foreground block">
                                    Animated Presentation Slides ({chapter.video_details.slides.length} slides):
                                  </span>
                                  <span
                                    className="text-[10px] text-primary font-bold cursor-pointer hover:underline flex items-center gap-1"
                                    onClick={() => setPreviewModalChapter({ chapter, lessonIdx: lIdx, chapterIdx: cIdx })}
                                  >
                                    {/* <Eye className="w-3 h-3" /> Click Preview to Edit & Animate */}
                                  </span>
                                </div>
                                <div className="flex gap-2.5 overflow-x-auto pb-1.5 scrollbar-thin">
                                  {chapter.video_details.slides.map((slide, sIdx) => (
                                    <div key={sIdx} className="bg-background border rounded-md p-2 w-48 shrink-0 text-[10px] space-y-1.5 shadow-sm hover:border-primary/40 transition-colors">
                                      <div className="flex items-center justify-between border-b pb-0.5">
                                        <span className="font-bold truncate text-foreground">Slide {sIdx + 1}: {slide.title}</span>
                                        <div className="flex items-center gap-1">
                                          {slide.critic_evaluation?.scorePercentage && (
                                            <Badge variant="outline" className="text-[7px] px-1 py-0 bg-emerald-50 text-emerald-700 border-emerald-200">
                                              {slide.critic_evaluation.scorePercentage}%
                                            </Badge>
                                          )}
                                          <Badge variant="secondary" className="text-[8px] px-1 py-0 uppercase">{slide.layout_type || "bullets"}</Badge>
                                        </div>
                                      </div>
                                      <ul className="list-disc pl-3 text-muted-foreground space-y-0.5 truncate">
                                        {slide.bullets?.map((b, bIdx) => (
                                          <li key={bIdx} className="truncate">{b}</li>
                                        ))}
                                      </ul>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                      </div>
                    );
                  })}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          )}
        </div>

        {/* Right column container */}
        <div className="lg:col-span-1 lg:sticky lg:top-6 space-y-5 h-fit flex flex-col min-h-0">

          {/* Right: AI Refinement Cockpit */}
          <div className="w-full bg-muted/20 border border-border rounded-2xl p-4.5 shadow-sm space-y-5 flex flex-col min-h-0">
            <style>{`
              .animate-spin-slow {
                animation: rotate-ring 8s linear infinite;
              }
            `}</style>
            <div className="space-y-5 flex flex-col min-h-0">
              {/* Header info */}
              <div className="flex items-center justify-between border-b pb-2 shrink-0">
                <h3 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                  Lumi Ai
                </h3>
                <Badge variant="outline" className="text-[9px] uppercase font-bold text-primary border-primary/20 bg-primary/5 px-2 py-0.5">
                  Refine
                </Badge>
              </div>

              {/* AI Prompter (Premium Chat interface) */}
              <div className="space-y-2 shrink-0">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">AI Instructions</span>
                <div className="relative border border-border focus-within:ring-1 focus-within:ring-primary focus-within:border-primary rounded-xl bg-background shadow-sm transition-all overflow-hidden">
                  <input
                    type="file"
                    ref={fileInputRef}
                    multiple
                    onChange={handleRefineFileUpload}
                    style={{ display: "none" }}
                    accept={ACCEPTED_EXT}
                  />

                  {refineFiles.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 px-3 py-2 bg-muted/20 border-b border-border/30">
                      {refineFiles.map((file, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-1.5 px-2 py-0.5 bg-background border border-border rounded-md text-[10px] text-foreground">
                          {file.isUploading ? (
                            <RefreshCw className="w-2.5 h-2.5 animate-spin text-muted-foreground" />
                          ) : (
                            <FileText className="w-2.5 h-2.5 text-primary shrink-0" />
                          )}
                          <span className="truncate max-w-[120px]" title={file.name}>{file.name}</span>
                          {!file.isUploading && (
                            <button
                              type="button"
                              onClick={() => setRefineFiles(prev => prev.filter((_, idx) => idx !== fIdx))}
                              className="text-muted-foreground hover:text-foreground text-[10px] pl-1 font-bold border-l pl-1 border-border ml-1"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <Textarea
                    id="refinePrompt"
                    value={refinePrompt}
                    onChange={(e) => setRefinePrompt(e.target.value)}
                    placeholder="Tell Lumi what to modify, add, or reorganize (e.g. Combine lesson 1 and 2, add quiz for chapter 1...)"
                    className="w-full min-h-[110px] text-xs resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 px-3.5 py-3 scrollbar-thin bg-transparent"
                    disabled={isRefining}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        if ((refinePrompt.trim() || refineFiles.length > 0) && !isRefining) handleRefinePlan();
                      }
                    }}
                  />
                  <div className="flex items-center justify-between px-3 pb-2 bg-muted/10 border-t border-border/30 pt-1.5">
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isRefining}
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                      </Button>
                      <span className="text-[10px] text-muted-foreground select-none">Attach references</span>
                    </div>
                    <Button
                      onClick={handleRefinePlan}
                      disabled={isRefining || (!refinePrompt.trim() && refineFiles.length === 0)}
                      size="sm"
                      className="h-8 gap-1.5 px-3 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-lg transition-all"
                    >
                      {isRefining ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      <span>{isRefining ? "Refining..." : "Send"}</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Active thinking banner */}
              {isRefining && (
                <div className="flex items-center gap-2 p-3 bg-primary/5 border border-primary/10 rounded-xl animate-pulse text-xs text-primary font-medium shrink-0">
                  <Sparkles className="w-4 h-4 animate-spin-slow shrink-0" />
                  <span>{refineProgress}</span>
                </div>
              )}

              {/* Preset prompt templates */}
              <div className="space-y-2 flex-1 overflow-y-auto scrollbar-none pb-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Suggested AI Commands</span>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Add Quiz", desc: "Test lesson understanding", text: "Add a quiz for the last lesson to test understanding.", icon: ClipboardList, color: "text-orange-600 bg-orange-50/50 hover:bg-orange-50 hover:border-orange-200 animate-fade-in" },
                    { label: "To Video Content", desc: "Convert text to video format", text: "Convert lesson 1 to Video Content.", icon: PlayCircle, color: "text-purple-600 bg-purple-50/50 hover:bg-purple-50 hover:border-purple-200 animate-fade-in" },
                    { label: "Concise Summaries", desc: "Make chapter details summary brief", text: "Make all chapter summaries more concise.", icon: Sparkles, color: "text-primary bg-teal-50/30 hover:bg-teal-50/70 hover:border-teal-200 animate-fade-in" },
                    { label: "Merge Lessons", desc: "Combine multiple lessons into one", text: "Combine the first two lessons into one.", icon: BookOpen, color: "text-blue-600 bg-blue-50/50 hover:bg-blue-50 hover:border-blue-200 animate-fade-in" }
                  ].map((p, idx) => {
                    const Icon = p.icon;
                    return (
                      <button
                        key={idx}
                        onClick={() => setRefinePrompt(p.text)}
                        className={`flex flex-col items-start text-left p-2.5 rounded-xl border hover:border-primary/20 transition-all duration-200 group bg-background ${p.color}`}
                      >
                        <div className="flex items-center gap-1.5">
                          <Icon className="w-3.5 h-3.5 shrink-0 group-hover:scale-110 transition-transform" />
                          <span className="text-[11px] font-bold text-foreground">{p.label}</span>
                        </div>
                        <span className="text-[9px] text-muted-foreground mt-0.5 line-clamp-1">{p.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Extracted PDF Images Card */}
          {renderExtractedImagesCard()}

        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between border-t pt-4 shrink-0 mt-6">
        <Button variant="outline" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onNext} className="px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold flex items-center gap-1.5">
          <Check className="w-4 h-4" />
          <span>Approve & Generate Module</span>
        </Button>
      </div>

      {/* Custom Delete Confirmation Modal */}
      <Dialog open={!!deleteConfirmState} onOpenChange={(open) => !open && setDeleteConfirmState(null)}>
        <DialogContent className="max-w-md bg-background rounded-2xl p-6 shadow-xl border border-border">
          <DialogHeader className="space-y-2">
            <DialogTitle className="text-base font-bold text-foreground flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                <Trash2 className="w-4 h-4" />
              </div>
              <span>Confirm Deletion</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1 leading-relaxed">
              {deleteConfirmState?.details}
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex items-center justify-end gap-2 pt-4 border-t border-border mt-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 text-xs font-medium"
              onClick={() => setDeleteConfirmState(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              className="h-8 text-xs font-medium bg-rose-600 hover:bg-rose-700 text-white gap-1.5 shadow-sm"
              onClick={handleConfirmDelete}
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete {deleteConfirmState?.type === "lesson" ? "Lesson" : "Chapter"}</span>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expanded Image Preview Dialog */}
      <Dialog open={!!activePreviewImage} onOpenChange={(open) => !open && setActivePreviewImage(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-6 overflow-hidden bg-background">
          <DialogHeader className="pb-2 border-b">
            <DialogTitle className="text-sm font-bold text-foreground">
              {activePreviewImage?.context}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Raw File URL: <code className="bg-muted px-1.5 py-0.5 rounded text-[10px] select-all">{activePreviewImage?.url}</code>
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 flex items-center justify-center overflow-hidden bg-muted/40 rounded-xl border p-4 my-4">
            {activePreviewImage && (
              <img
                src={getAbsoluteUrl(activePreviewImage.url)}
                alt={activePreviewImage.context}
                className="max-w-full max-h-[50vh] object-contain rounded-lg shadow-md"
              />
            )}
          </div>
          <DialogFooter className="flex sm:justify-between items-center gap-3 border-t pt-4">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs font-semibold"
                onClick={() => activePreviewImage && copyToClipboard(`<img src="${activePreviewImage.url}" alt="${activePreviewImage.context}" style="max-width:100%; border-radius:8px; margin: 16px 0;" />`, "html")}
              >
                <Code2 className="w-3.5 h-3.5 mr-1.5" />
                Copy HTML Tag
              </Button>
            </div>
            <Button
              variant="default"
              size="sm"
              className="h-8 text-xs font-semibold"
              onClick={() => setActivePreviewImage(null)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Presentation Preview & Animation Full-Screen Editor */}
      {previewModalChapter && (
        <PresentationPreviewEditor
          isOpen={!!previewModalChapter}
          onClose={() => setPreviewModalChapter(null)}
          chapter={previewModalChapter.chapter}
          onSaveAndApprove={(updatedChapter) => {
            const { lessonIdx, chapterIdx } = previewModalChapter;
            const updatedPlan = JSON.parse(JSON.stringify(plan));
            updatedPlan.lessons[lessonIdx].chapters[chapterIdx] = updatedChapter;
            setPlan(updatedPlan);
            setPreviewModalChapter(null);
            toast.success("Presentation slides updated & approved!");
          }}
        />
      )}


    </div>
  );
}


// ─── Step 4: AI Generation & Processing ────────────────────────────────────────

function StepProcessing({
  plan,
  onDone,
  onFailed,
  resumedJobId,
  department,
  assignmentBased,
  onCancelProcess,
}: {
  plan: PlanJSON | null;
  onDone: (moduleId: string) => void;
  onFailed: () => void;
  resumedJobId?: string | null;
  department: string;
  assignmentBased: string;
  onCancelProcess?: () => void;
}) {
  const [progressMsg, setProgressMsg] = useState(() => {
    if (resumedJobId) {
      return localStorage.getItem("active_ai_job_progress") || "Resuming background task...";
    }
    return "Initializing background worker...";
  });
  const [scanPos, setScanPos] = useState(0);
  const [jobId, setJobId] = useState<string | null>(resumedJobId || null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const scanTimer = setInterval(() => {
      setScanPos(prev => (prev >= 100 ? 0 : prev + 2));
    }, 30);

    let isMounted = true;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    let notFoundCount = 0;
    const NOT_FOUND_LIMIT = 5;
    const POLL_INTERVAL_MS = 2000;
    const QUEUE_TIMEOUT_MS = 2 * 60 * 1000;
    let queueStartTime: number | null = null;

    const failJob = (message: string) => {
      if (!isMounted) return;
      activeJobPromise = null;
      if (pollInterval) clearInterval(pollInterval);
      localStorage.removeItem("active_ai_job_id");
      localStorage.removeItem("active_ai_job_progress");
      toast.error(message);
      onFailed();
    };

    const runBackendWorker = async () => {
      try {
        let currentJobId: string = resumedJobId || "";

        if (!currentJobId) {
          if (!activeJobPromise) {
            activeJobPromise = (async () => {
              setProgressMsg("Enqueuing approved curriculum plan for compile...");
              const cleanBaseUrl = LMS_API_BASE_URL ? LMS_API_BASE_URL.replace(/\/$/, '') : '';
              const generateUrl = `${cleanBaseUrl}/api/method/novel_lms.lms_ai_module_creation.api.generator.execute_approved_plan`;

              const response = await fetch(generateUrl, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Accept": "application/json",
                },
                body: JSON.stringify({
                  plan_json: plan,
                  department: department,
                  assignment_based: assignmentBased,
                  voice_settings: plan?.creative_design_preview?.audio_design || null,
                }),
                credentials: "include",
              });

              if (!response.ok) throw new Error(`Failed to start execution: ${response.statusText}`);
              const genResult = await response.json();
              const job = genResult.message;
              if (!job || !job.success || !job.job_id) throw new Error(job?.error || "Failed to start AI generation job on server.");
              return job.job_id as string;
            })();
          }
          try {
            currentJobId = await activeJobPromise;
          } catch (apiErr) {
            activeJobPromise = null;
            throw apiErr;
          }

          if (isMounted) {
            setJobId(currentJobId);
            localStorage.setItem("active_ai_job_id", currentJobId);
            localStorage.setItem("active_ai_job_progress", "Waiting in task queue...");
          }
        }

        if (!resumedJobId) {
          if (!isMounted) return;
          setProgressMsg("Waiting in task queue...");
          queueStartTime = Date.now();
        }

        const cleanBaseUrl = LMS_API_BASE_URL ? LMS_API_BASE_URL.replace(/\/$/, '') : '';
        const pollUrl = `${cleanBaseUrl}/api/method/novel_lms.lms_ai_module_creation.api.generator.get_status?ai_job_id=${currentJobId}`;

        pollInterval = setInterval(async () => {
          try {
            const statusResponse = await fetch(pollUrl, {
              method: "GET",
              headers: { "Accept": "application/json" },
              credentials: "include",
            });

            if (!statusResponse.ok) return;

            const statusResult = await statusResponse.json();
            const statusData = statusResult.message;

            if (!isMounted) return;

            if (!statusData || statusData.status === "not_found") {
              notFoundCount++;
              if (notFoundCount >= NOT_FOUND_LIMIT) failJob("The background worker crashed before processing could begin. Please try again.");
              return;
            }

            notFoundCount = 0;

            if (statusData.status === "failed") {
              if (pollInterval) clearInterval(pollInterval);
              localStorage.removeItem("active_ai_job_id");
              localStorage.removeItem("active_ai_job_progress");
              activeJobPromise = null;
              throw new Error(statusData.error || statusData.progress || "Generation job failed on server.");
            }

            if (statusData.status === "cancelled" || statusData.status === "stopped") {
              if (pollInterval) clearInterval(pollInterval);
              localStorage.removeItem("active_ai_job_id");
              localStorage.removeItem("active_ai_job_progress");
              activeJobPromise = null;
              toast.info(statusData.progress || "Process was cancelled.");
              onFailed();
              return;
            }

            if (statusData.status === "finished") {
              if (pollInterval) clearInterval(pollInterval);
              localStorage.removeItem("active_ai_job_id");
              localStorage.removeItem("active_ai_job_progress");
              activeJobPromise = null;
              onDone(statusData.module_id);
              return;
            }

            if (statusData.status === "queued" && queueStartTime) {
              if (Date.now() - queueStartTime > QUEUE_TIMEOUT_MS) {
                failJob("The background worker did not pick up the job in time. It may have crashed. Please try again.");
                return;
              }
            }

            if (statusData.progress) {
              setProgressMsg(statusData.progress);
              localStorage.setItem("active_ai_job_progress", statusData.progress);
              if (statusData.status === "started") queueStartTime = null;
            }
          } catch (pollErr) {
            console.error("Polling error:", pollErr);
            activeJobPromise = null;
            if (pollInterval) clearInterval(pollInterval);
            toast.error(pollErr instanceof Error ? pollErr.message : "Generation failed.");
            localStorage.removeItem("active_ai_job_id");
            localStorage.removeItem("active_ai_job_progress");
            onFailed();
          }
        }, POLL_INTERVAL_MS);

      } catch (err) {
        console.error("AI Wizard Error:", err);
        activeJobPromise = null;
        if (isMounted) {
          toast.error(err instanceof Error ? err.message : "An unexpected error occurred.");
          localStorage.removeItem("active_ai_job_id");
          localStorage.removeItem("active_ai_job_progress");
          onFailed();
        }
      }
    };

    runBackendWorker();

    return () => {
      isMounted = false;
      clearInterval(scanTimer);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [plan, onDone, onFailed, resumedJobId]);

  return (
    <div className="flex flex-col items-center justify-center gap-10 h-full py-4">
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.7; }
          50% { transform: scale(1.08); opacity: 0.3; }
          100% { transform: scale(0.95); opacity: 0.7; }
        }
        @keyframes spin-gear {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes float-card {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes data-stream {
          0% { opacity: 0; transform: translateX(-12px); }
          30% { opacity: 1; }
          70% { opacity: 1; }
          100% { opacity: 0; transform: translateX(12px); }
        }
      `}</style>

      <div className="relative flex items-center justify-center">
        <div
          className="absolute rounded-3xl border-2 border-primary/30"
          style={{
            width: "180px",
            height: "220px",
            animation: "pulse-ring 2s ease-in-out infinite",
          }}
        />
        <div
          className="relative flex flex-col items-center justify-center gap-3 w-40 h-48 rounded-2xl border-2 shadow-xl overflow-hidden bg-primary/5 border-primary/20 text-primary"
          style={{ animation: "float-card 3s ease-in-out infinite" }}
        >
          <div
            className="absolute left-0 right-0 h-0.5 bg-primary/60 z-10"
            style={{
              top: `${scanPos}%`,
              boxShadow: "0 0 8px 2px rgba(0,137,123,0.4)",
              transition: "top 30ms linear",
            }}
          />
          <div className="w-full px-4 space-y-2 z-0">
            {[80, 65, 80, 50, 75, 60].map((w, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full bg-current opacity-15"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>

          <div className="absolute bottom-3 flex flex-col items-center gap-1 z-10">
            <FileText className="w-6 h-6 opacity-70" />
            <span className="text-[9px] font-bold tracking-widest uppercase opacity-60">
              GENERATING
            </span>
          </div>
        </div>

        <div
          className="absolute -bottom-3 -right-3 w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shadow"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5 text-primary"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            style={{ animation: "spin-gear 3s linear infinite" }}
          >
            <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
            <path d="M19.622 10.395l-1.097-2.65L20 6l-2-2-1.735 1.483-2.707-1.113L12.935 2h-1.954l-.632 2.401-2.645 1.115L6 4 4 6l1.453 1.789-1.08 2.657L2 11v2l2.401.655L5.516 16.3 4 18l2 2 1.791-1.46 2.606 1.072L11 22h2l.604-2.387 2.651-1.098C16.697 18.833 18 20 18 20l2-2-1.484-1.75 1.098-2.652 2.386-.62V11l-2.378-.605Z" />
          </svg>
        </div>

        <div className="absolute -left-8 top-1/2 -translate-y-1/2 flex flex-col gap-2">
          {[0, 0.3, 0.6].map((delay, i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-primary"
              style={{
                animation: `data-stream 1.4s ease-in-out ${delay}s infinite`,
              }}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 w-full max-w-md">
        <p className="text-sm font-medium text-foreground text-center animate-pulse">{progressMsg}</p>
        <div className="flex items-center justify-center gap-3 mt-6">
          {jobId && (
            <Button
              variant="outline"
              className="font-semibold border-primary/30 hover:border-primary text-primary hover:bg-primary/5 transition-all duration-300 shadow-sm"
              onClick={() => setLocation("/")}
            >
              Run in Background
            </Button>
          )}
          {onCancelProcess && (
            <Button
              variant="outline"
              className="font-semibold border-red-200 hover:border-red-400 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/50 transition-all duration-300 shadow-sm gap-1.5"
              onClick={onCancelProcess}
            >
              <X className="w-4 h-4" />
              Cancel Process
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export default function AiModuleWizard() {
  const [, setLocation] = useLocation();

  const [resumedJobId, setResumedJobId] = useState<string | null>(() => {
    return localStorage.getItem("active_ai_job_id") || localStorage.getItem("completed_ai_draft_job_id");
  });

  const [resumedJobType, setResumedJobType] = useState<string | null>(() => {
    if (localStorage.getItem("completed_ai_draft_job_id")) return "draft";
    return localStorage.getItem("active_ai_job_type");
  });

  const [plan, setPlanState] = useState<PlanJSON | null>(() => {
    const cached = localStorage.getItem("debug_cached_curriculum_plan");
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch (_) { }
    }
    return null;
  });

  const setPlan = (p: PlanJSON | null) => {
    setPlanState(p);
    if (p) {
      localStorage.setItem("debug_cached_curriculum_plan", JSON.stringify(p));
    } else {
      localStorage.removeItem("debug_cached_curriculum_plan");
    }
  };

  const [blueprint, setBlueprintState] = useState<BlueprintJSON | null>(() => {
    const cached = localStorage.getItem("debug_cached_blueprint");
    if (cached) {
      try { return JSON.parse(cached); } catch (_) { }
    }
    return null;
  });

  const setBlueprint = (b: BlueprintJSON | null) => {
    setBlueprintState(b);
    if (b) {
      localStorage.setItem("debug_cached_blueprint", JSON.stringify(b));
    } else {
      localStorage.removeItem("debug_cached_blueprint");
    }
  };

  const [step, setStep] = useState<Step>(() => {
    const id = localStorage.getItem("active_ai_job_id") || localStorage.getItem("completed_ai_draft_job_id");
    const type = localStorage.getItem("completed_ai_draft_job_id") ? "draft" : localStorage.getItem("active_ai_job_type");

    if (id) {
      if (type === "blueprint") return 2;
      if (type === "draft") return 3;
      return 4;
    }

    const cachedPlan = localStorage.getItem("debug_cached_curriculum_plan");
    if (cachedPlan) return 3;

    const cachedBlueprint = localStorage.getItem("debug_cached_blueprint");
    if (cachedBlueprint) return 2;

    return 1;
  });

  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [department, setDepartment] = useState("");
  const [assignmentBased, setAssignmentBased] = useState("Department");
  const [instructions, setInstructions] = useState("");
  const [isEditingChapter, setIsEditingChapter] = useState(false);

  const [slideTheme, setSlideTheme] = useState("Modern Slate");
  const [slideTransition, setSlideTransition] = useState("fade");
  const [elementEntrance, setElementEntrance] = useState("stagger");
  const [narrationTone, setNarrationTone] = useState("Conversational & Friendly");
  const [targetAudience, setTargetAudience] = useState("");
  const [learningGoal, setLearningGoal] = useState("");
  const [slideCount, setSlideCount] = useState("Standard");

  const { data: departments } = useFrappeGetDocList("Department", {
    fields: ["name", "department"],
    limit: 100,
  });

  const departmentOptions = (departments || []).map((dept) => ({
    value: dept.name,
    label: dept.department,
  }));

  const handleCancel = () => {
    localStorage.removeItem("active_ai_job_id");
    localStorage.removeItem("active_ai_job_type");
    localStorage.removeItem("active_ai_job_progress");
    setLocation("/");
  };

  const handleStep1Next = () => {
    setStep(2);
  };

  const handleBlueprintApprove = () => {
    setStep(3);
  };

  const handleStep3Next = () => {
    setStep(4);
  };

  const handleProcessingDone = (moduleId: string) => {
    setResumedJobId(null);
    setResumedJobType(null);
    localStorage.removeItem("active_ai_job_id");
    localStorage.removeItem("active_ai_job_type");
    localStorage.removeItem("active_ai_job_progress");
    setLocation(`/modules/${moduleId}`);
  };

  const handleProcessingFailed = () => {
    setResumedJobId(null);
    setResumedJobType(null);
    localStorage.removeItem("active_ai_job_id");
    localStorage.removeItem("active_ai_job_type");
    localStorage.removeItem("active_ai_job_progress");
    setPlan(null);
    setStep(1);
  };

  const handleCancelProcess = async () => {
    const activeJobId = localStorage.getItem("active_ai_job_id") || resumedJobId;
    if (activeJobId) {
      try {
        const cleanBaseUrl = LMS_API_BASE_URL ? LMS_API_BASE_URL.replace(/\/$/, '') : '';
        await fetch(`${cleanBaseUrl}/api/method/novel_lms.lms_ai_module_creation.api.generator.cancel_job`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify({ ai_job_id: activeJobId }),
          credentials: "include",
        });
      } catch (err) {
        console.error("Failed to trigger cancel API:", err);
      }
    }

    activeJobPromise = null;
    activeDraftPromise = null;
    activeBlueprintPromise = null;
    localStorage.removeItem("active_ai_job_id");
    localStorage.removeItem("active_ai_job_type");
    localStorage.removeItem("active_ai_job_progress");
    localStorage.removeItem("completed_ai_draft_job_id");
    localStorage.removeItem("debug_cached_curriculum_plan");
    localStorage.removeItem("debug_cached_blueprint");

    setResumedJobId(null);
    setResumedJobType(null);
    setPlan(null);
    setBlueprint(null);
    setFiles([]);
    setInstructions("");
    setTargetAudience("");
    setLearningGoal("");
    setDepartment("");
    setIsEditingChapter(false);
    setStep(1);
    toast.info("Cleared blueprint cache & reset to Upload Sources.");
  };

  const isFitToScreen = step === 4 || (step === 2 && !blueprint) || (step === 3 && !plan) || (step === 3 && isEditingChapter);
  const isJobActive = step === 4 || (step === 2 && !blueprint) || (step === 3 && !plan) || !!resumedJobId || !!localStorage.getItem("active_ai_job_id");

  return (
    <div className={isFitToScreen ? "h-screen bg-muted/30 flex flex-col overflow-hidden" : "min-h-screen bg-muted/30 flex flex-col"}>
      <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-background/90 backdrop-blur-sm shrink-0 z-10">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-bold text-foreground">AI Module Builder</span>
        </div>
        {isJobActive && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancelProcess}
            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-900/50 dark:hover:bg-red-950/50 gap-1.5 font-semibold text-xs transition-all shadow-sm"
          >
            <X className="w-4 h-4" />
            Cancel Process
          </Button>
        )}
      </header>

      {!isEditingChapter && (
        <div className="flex justify-center py-5 shrink-0">
          <StepIndicator current={step} />
        </div>
      )}

      <div className={isFitToScreen ? `flex-1 flex items-stretch overflow-hidden ${isEditingChapter ? "px-6 py-4" : "px-8 pb-6"}` : "flex-1 flex items-start px-8 pb-6"}>
        <div className="w-full flex flex-col h-full">
          <div className={isFitToScreen
            ? `flex-1 flex flex-col bg-background border border-border rounded-2xl shadow-sm overflow-hidden ${isEditingChapter ? "p-5" : "p-8"}`
            : "w-full flex flex-col bg-background border border-border rounded-2xl shadow-sm p-8"
          }>
            {step === 1 && (
              <StepUpload
                files={files}
                onFilesChange={setFiles}
                onNext={handleStep1Next}
                onCancel={handleCancel}
                department={department}
                setDepartment={setDepartment}
                assignmentBased={assignmentBased}
                setAssignmentBased={setAssignmentBased}
                departmentOptions={departmentOptions}
                instructions={instructions}
                setInstructions={setInstructions}
              />
            )}

            {step === 2 && (
              <StepBlueprintPreview
                files={files}
                instructions={instructions}
                department={department}
                targetAudience={targetAudience}
                learningGoal={learningGoal}
                blueprint={blueprint}
                setBlueprint={setBlueprint}
                onApprove={handleBlueprintApprove}
                onBack={() => {
                  setBlueprint(null);
                  localStorage.removeItem("debug_cached_blueprint");
                  setStep(1);
                }}
                onCancelProcess={handleCancelProcess}
              />
            )}

            {step === 3 && (
              <StepPlanPreview
                files={files}
                instructions={instructions}
                department={department}
                assignmentBased={assignmentBased}
                slideTheme={slideTheme}
                slideTransition={slideTransition}
                elementEntrance={elementEntrance}
                narrationTone={narrationTone}
                targetAudience={targetAudience}
                learningGoal={learningGoal}
                slideCount={slideCount}
                plan={plan}
                setPlan={setPlan}
                onNext={handleStep3Next}
                onBack={() => {
                  localStorage.removeItem("active_ai_job_id");
                  localStorage.removeItem("active_ai_job_type");
                  localStorage.removeItem("active_ai_job_progress");
                  setResumedJobId(null);
                  setResumedJobType(null);
                  setStep(2);
                }}
                resumedDraftJobId={resumedJobType === "draft" ? resumedJobId : null}
                setIsEditingChapter={setIsEditingChapter}
                onCancelProcess={handleCancelProcess}
                blueprintJson={blueprint}
              />
            )}

            {step === 4 && (
              <StepProcessing
                plan={plan}
                onDone={handleProcessingDone}
                onFailed={handleProcessingFailed}
                resumedJobId={resumedJobId}
                department={department}
                assignmentBased={assignmentBased}
                onCancelProcess={handleCancelProcess}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
