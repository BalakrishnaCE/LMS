import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

import { LMS_API_BASE_URL } from "@/config/routes";
import { X, Upload, CheckCircle2, FileText, Image as ImageIcon } from "lucide-react";
import { uploadFileToFrappe } from "@/lib/uploadFileToFrappe";

type Step = 1 | 2;

interface UploadedFile {
  file: File;
  id: string;
}

// ─── Accepted File Types ──────────────────────────────────────────────────────

const ACCEPTED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
];

const ACCEPTED_EXT = ".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg,.webp,.gif";

// ─── Step Indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  const steps = [
    { num: 1, label: "Upload Sources" },
    { num: 2, label: "Configure" },
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
  if (type.includes("pdf"))
    return (
      <div className="flex flex-col items-center justify-center w-10 h-12 bg-red-50 border border-red-200 rounded-md text-red-600 text-[9px] font-bold gap-0.5 shadow-sm shrink-0">
        <FileText className="w-5 h-5" />
        <span>PDF</span>
      </div>
    );
  if (type.includes("word") || type.includes("docx") || type.includes("doc"))
    return (
      <div className="flex flex-col items-center justify-center w-10 h-12 bg-blue-50 border border-blue-200 rounded-md text-blue-600 text-[9px] font-bold gap-0.5 shadow-sm shrink-0">
        <FileText className="w-5 h-5" />
        <span>DOCX</span>
      </div>
    );
  if (type.includes("presentation") || type.includes("ppt"))
    return (
      <div className="flex flex-col items-center justify-center w-10 h-12 bg-orange-50 border border-orange-200 rounded-md text-orange-600 text-[9px] font-bold gap-0.5 shadow-sm shrink-0">
        <FileText className="w-5 h-5" />
        <span>PPTX</span>
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
        if (ACCEPTED_TYPES.includes(f.type)) {
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
            <p className="text-xs text-muted-foreground mt-0.5">Supported: PDF, DOCX, PPT, PNG, JPG</p>
          </div>

          {/* File type icons row */}
          <div className="flex items-center gap-2.5 mt-1">
            <div className="flex flex-col items-center justify-center w-10 h-12 bg-red-50 border border-red-200 rounded-md text-red-600 text-[9px] font-bold gap-0.5 shadow-sm">
              <FileText className="w-5 h-5" /><span>PDF</span>
            </div>
            <div className="flex flex-col items-center justify-center w-10 h-12 bg-blue-50 border border-blue-200 rounded-md text-blue-600 text-[9px] font-bold gap-0.5 shadow-sm">
              <FileText className="w-5 h-5" /><span>DOCX</span>
            </div>
            <div className="flex flex-col items-center justify-center w-10 h-12 bg-orange-50 border border-orange-200 rounded-md text-orange-600 text-[9px] font-bold gap-0.5 shadow-sm">
              <FileText className="w-5 h-5" /><span>PPTX</span>
            </div>
            <div className="flex flex-col items-center justify-center w-10 h-12 bg-emerald-50 border border-emerald-200 rounded-md text-emerald-600 text-[9px] font-bold gap-0.5 shadow-sm">
              <ImageIcon className="w-5 h-5" /><span>IMG</span>
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
              <p className="text-[10px] text-muted-foreground">Supported: PDF, DOCX, PPT, PNG, JPG</p>
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
                <FileTypeBadge type={f.file.type} />
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

// ─── Step 2: AI Processing ────────────────────────────────────────────────────

function StepProcessing({
  files,
  instructions,
  onDone,
  onFailed,
  resumedJobId,
  department,
  assignmentBased,
}: {
  files: UploadedFile[];
  instructions: string;
  onDone: (moduleId: string) => void;
  onFailed: () => void;
  resumedJobId?: string | null;
  department: string;
  assignmentBased: string;
}) {
  const [progressMsg, setProgressMsg] = useState(() => {
    if (resumedJobId) {
      return localStorage.getItem("active_ai_job_progress") || "Resuming background task...";
    }
    return files.length > 0 ? "Preparing file uploads..." : "Starting curriculum draft...";
  });
  const [scanPos, setScanPos] = useState(0);
  const [jobId, setJobId] = useState<string | null>(resumedJobId || null);
  const [, setLocation] = useLocation();

  useEffect(() => {
    // 1. Scanning line animation
    const scanTimer = setInterval(() => {
      setScanPos(prev => (prev >= 100 ? 0 : prev + 2));
    }, 30);

    let isMounted = true;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const runBackendWorker = async () => {
      try {
        let currentJobId: string = resumedJobId || "";

        if (!currentJobId) {
          const fileUrls: string[] = [];

          // Upload files sequentially
          for (let i = 0; i < files.length; i++) {
            if (!isMounted) return;
            const ufile = files[i];
            setProgressMsg(`Uploading file ${i + 1} of ${files.length}: ${ufile.file.name}...`);
            const fileUrl = await uploadFileToFrappe(ufile.file);
            fileUrls.push(fileUrl);
          }

          if (!isMounted) return;
          setProgressMsg(files.length > 0 ? "Extracting contents and starting curriculum draft..." : "Starting curriculum draft...");

          // Trigger generation API
          const cleanBaseUrl = LMS_API_BASE_URL ? LMS_API_BASE_URL.replace(/\/$/, '') : '';
          const generateUrl = `${cleanBaseUrl}/api/method/novel_lms.lms_ai_module_creation.api.generator.generate_module`;
          
          const response = await fetch(generateUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
            },
            body: JSON.stringify({
              file_urls: fileUrls,
              instructions: instructions,
              department: department,
              assignment_based: assignmentBased,
            }),
            credentials: "include",
          });

          if (!response.ok) {
            throw new Error(`Failed to start generation: ${response.statusText}`);
          }

          const genResult = await response.json();
          const job = genResult.message;
          if (!job || !job.success || !job.job_id) {
            throw new Error(job?.error || "Failed to start AI generation job on server.");
          }

          const responseJobId = job.job_id as string;
          currentJobId = responseJobId;
          if (isMounted) {
            setJobId(responseJobId);
            localStorage.setItem("active_ai_job_id", responseJobId);
            localStorage.setItem("active_ai_job_progress", "Waiting in task queue...");
          }
        }

        if (!resumedJobId) {
          if (!isMounted) return;
          setProgressMsg("Waiting in task queue...");
        }

        // Poll status
        const cleanBaseUrl = LMS_API_BASE_URL ? LMS_API_BASE_URL.replace(/\/$/, '') : '';
        const pollUrl = `${cleanBaseUrl}/api/method/novel_lms.lms_ai_module_creation.api.generator.get_status?ai_job_id=${currentJobId}`;
        
        pollInterval = setInterval(async () => {
          try {
            const statusResponse = await fetch(pollUrl, {
              method: "GET",
              headers: {
                "Accept": "application/json",
              },
              credentials: "include",
            });

            if (!statusResponse.ok) {
              // Ignore single query failure to be resilient
              return;
            }

            const statusResult = await statusResponse.json();
            const statusData = statusResult.message;

            if (!statusData || !isMounted) return;

            if (statusData.status === "finished") {
              if (pollInterval) clearInterval(pollInterval);
              localStorage.removeItem("active_ai_job_id");
              localStorage.removeItem("active_ai_job_progress");
              onDone(statusData.module_id);
            } else if (statusData.status === "failed") {
              if (pollInterval) clearInterval(pollInterval);
              localStorage.removeItem("active_ai_job_id");
              localStorage.removeItem("active_ai_job_progress");
              throw new Error(statusData.error || statusData.progress || "Generation job failed on server.");
            } else {
              // Update progress message from server
              if (statusData.progress) {
                setProgressMsg(statusData.progress);
                localStorage.setItem("active_ai_job_progress", statusData.progress);
              }
            }
          } catch (pollErr) {
            console.error("Polling error:", pollErr);
            if (pollInterval) clearInterval(pollInterval);
            toast.error(pollErr instanceof Error ? pollErr.message : "Generation failed.");
            localStorage.removeItem("active_ai_job_id");
            localStorage.removeItem("active_ai_job_progress");
            onFailed();
          }
        }, 2000);

      } catch (err) {
        console.error("AI Wizard Error:", err);
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
  }, [files, instructions, onDone, onFailed, resumedJobId]);

  // Pick a file icon colour based on the first file type
  const firstType = files[0]?.file.type ?? "";
  const iconBg = firstType.includes("pdf")
    ? "bg-red-50 border-red-200 text-red-500"
    : firstType.includes("word") || firstType.includes("doc")
      ? "bg-blue-50 border-blue-200 text-blue-500"
      : firstType.includes("ppt")
        ? "bg-orange-50 border-orange-200 text-orange-500"
        : "bg-primary/5 border-primary/20 text-primary";

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

      {/* Document extraction card */}
      <div className="relative flex items-center justify-center">
        {/* Outer pulse ring */}
        <div
          className="absolute rounded-3xl border-2 border-primary/30"
          style={{
            width: "180px",
            height: "220px",
            animation: "pulse-ring 2s ease-in-out infinite",
          }}
        />
        {/* Main document card */}
        <div
          className={`relative flex flex-col items-center justify-center gap-3 w-40 h-48 rounded-2xl border-2 shadow-xl overflow-hidden ${iconBg}`}
          style={{ animation: "float-card 3s ease-in-out infinite" }}
        >
          {/* Scanning line */}
          <div
            className="absolute left-0 right-0 h-0.5 bg-primary/60 z-10"
            style={{
              top: `${scanPos}%`,
              boxShadow: "0 0 8px 2px rgba(0,137,123,0.4)",
              transition: "top 30ms linear",
            }}
          />
          {/* Lines of fake text to scan */}
          <div className="w-full px-4 space-y-2 z-0">
            {[80, 65, 80, 50, 75, 60].map((w, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full bg-current opacity-15"
                style={{ width: `${w}%` }}
              />
            ))}
          </div>

          {/* File icon + label */}
          <div className="absolute bottom-3 flex flex-col items-center gap-1 z-10">
            <FileText className="w-6 h-6 opacity-70" />
            <span className="text-[9px] font-bold tracking-widest uppercase opacity-60">
              {files.length === 0 ? "PROMPT" : firstType.includes("pdf") ? "PDF" : firstType.includes("ppt") ? "PPTX" : firstType.includes("word") || firstType.includes("doc") ? "DOCX" : "FILE"}
            </span>
          </div>
        </div>

        {/* Orbiting gear */}
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

        {/* Streaming data dots */}
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
        <div className="absolute -right-8 top-1/2 -translate-y-1/2 flex flex-col gap-2">
          {[0.2, 0.5, 0.8].map((delay, i) => (
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

      {/* Label + progress */}
      <div className="flex flex-col items-center gap-3 w-full max-w-md">
        <p className="text-sm font-medium text-foreground text-center animate-pulse">{progressMsg}</p>
        <AnimatedProgressBar label="" />
        {jobId && (
          <Button
            variant="outline"
            className="mt-6 font-semibold border-primary/30 hover:border-primary text-primary hover:bg-primary/5 transition-all duration-300 shadow-sm"
            onClick={() => setLocation("/")}
          >
            Run in Background
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export default function AiModuleWizard() {
  const [, setLocation] = useLocation();

  const [resumedJobId, setResumedJobId] = useState<string | null>(() => {
    return localStorage.getItem("active_ai_job_id");
  });
  const [step, setStep] = useState<Step>(() => {
    return localStorage.getItem("active_ai_job_id") ? 2 : 1;
  });
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [department, setDepartment] = useState("");
  const [assignmentBased, setAssignmentBased] = useState("Department");
  const [instructions, setInstructions] = useState("");

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
    localStorage.removeItem("active_ai_job_progress");
    setLocation("/");
  };

  const handleStep1Next = () => setStep(2);

  const handleProcessingDone = (moduleId: string) => {
    setResumedJobId(null);
    localStorage.removeItem("active_ai_job_id");
    localStorage.removeItem("active_ai_job_progress");
    setLocation(`/modules/${moduleId}`);
  };

  const handleProcessingFailed = () => {
    setResumedJobId(null);
    localStorage.removeItem("active_ai_job_id");
    localStorage.removeItem("active_ai_job_progress");
    setStep(1);
  };



  return (
    /* Full viewport — no scroll, everything fits */
    <div className="h-screen bg-muted/30 flex flex-col overflow-hidden">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-end px-6 py-3.5 border-b border-border bg-background/90 backdrop-blur-sm shrink-0 z-10">
        {/* <h1 className="text-base font-semibold text-foreground tracking-tight">AI Wizard</h1> */}
      </header>

      {/* ── Step indicator ───────────────────────────────────────────────── */}
      <div className="flex justify-center py-5 shrink-0">
        <StepIndicator current={step} />
      </div>

      {/* ── Content area — grows to fill remaining height ─────────────────── */}
      <div className="flex-1 flex items-stretch justify-center px-8 pb-6 overflow-hidden">
        <div className="w-full flex flex-col max-w-[1100px]">
          {/* White card — fills available height */}
          <div className={`
            flex-1 flex flex-col bg-background border border-border rounded-2xl shadow-sm overflow-hidden p-8
          `}>
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
              <StepProcessing
                files={files}
                instructions={instructions}
                onDone={handleProcessingDone}
                onFailed={handleProcessingFailed}
                resumedJobId={resumedJobId}
                department={department}
                assignmentBased={assignmentBased}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
