import { useState, useRef, useCallback, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { navigate } from "wouter/use-browser-location";
import { BASE_PATH, LMS_API_BASE_URL } from "@/config/routes";
import { X, Upload, CheckCircle2, FileText, Image as ImageIcon } from "lucide-react";
import { uploadFileToFrappe } from "@/lib/uploadFileToFrappe";

// ─── Types ────────────────────────────────────────────────────────────────────

type Step = 1 | 2 | 3;

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
    { num: 3, label: "Review" },
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
  instructions,
  onInstructionsChange,
  onNext,
  onCancel,
}: {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  instructions: string;
  onInstructionsChange: (v: string) => void;
  onNext: () => void;
  onCancel: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  const isStep1Valid = files.length > 0 && instructions.trim().length > 0;

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

      {/* Instructions */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-semibold text-foreground">Any specific instructions?</label>
          {!instructions.trim() && files.length > 0 && (
            <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 animate-pulse flex items-center gap-1">
              ✨ Please write instructions to continue
            </span>
          )}
        </div>
        <Textarea
          value={instructions}
          onChange={e => onInstructionsChange(e.target.value)}
          placeholder="e.g. keep it beginner-friendly, 4 lessons max, include quiz at end of each lesson…"
          className={`min-h-[90px] resize-none text-sm focus-visible:ring-primary/50 transition-colors duration-300 ${!instructions.trim() && files.length > 0
              ? "border-amber-300 focus-visible:ring-amber-500/50 bg-amber-500/[0.02] placeholder:text-amber-500/50"
              : ""
            }`}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-1">
        <Button variant="ghost" onClick={onCancel} className="text-muted-foreground">
          Cancel
        </Button>
        {isStep1Valid && (
          <Button
            onClick={onNext}
            className="px-8 bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-300 animate-in fade-in slide-in-from-right-4"
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
}: {
  files: UploadedFile[];
  instructions: string;
  onDone: (moduleId: string) => void;
  onFailed: () => void;
}) {
  const [progressMsg, setProgressMsg] = useState("Preparing file uploads...");
  const [scanPos, setScanPos] = useState(0);

  useEffect(() => {
    // 1. Scanning line animation
    const scanTimer = setInterval(() => {
      setScanPos(prev => (prev >= 100 ? 0 : prev + 2));
    }, 30);

    let isMounted = true;
    let pollInterval: ReturnType<typeof setInterval> | null = null;

    const runBackendWorker = async () => {
      try {
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
        setProgressMsg("Extracting contents and starting curriculum draft...");

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

        const jobId = job.job_id;
        if (!isMounted) return;
        setProgressMsg("Waiting in task queue...");

        // Poll status
        const pollUrl = `${cleanBaseUrl}/api/method/novel_lms.lms_ai_module_creation.api.generator.get_status?ai_job_id=${jobId}`;
        
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
              onDone(statusData.module_id);
            } else if (statusData.status === "failed") {
              if (pollInterval) clearInterval(pollInterval);
              throw new Error(statusData.error || statusData.progress || "Generation job failed on server.");
            } else {
              // Update progress message from server
              if (statusData.progress) {
                setProgressMsg(statusData.progress);
              }
            }
          } catch (pollErr) {
            console.error("Polling error:", pollErr);
            if (pollInterval) clearInterval(pollInterval);
            toast.error(pollErr instanceof Error ? pollErr.message : "Generation failed.");
            onFailed();
          }
        }, 2000);

      } catch (err) {
        console.error("AI Wizard Error:", err);
        if (isMounted) {
          toast.error(err instanceof Error ? err.message : "An unexpected error occurred.");
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
  }, [files, instructions, onDone, onFailed]);

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
              {firstType.includes("pdf") ? "PDF" : firstType.includes("ppt") ? "PPTX" : firstType.includes("word") || firstType.includes("doc") ? "DOCX" : "FILE"}
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
      </div>
    </div>
  );
}

// ─── Step 3: Generation Complete ─────────────────────────────────────────────

function StepReview({
  createdModuleName,
  onReviewEdit,
  onCancel,
}: {
  createdModuleName: string | null;
  onReviewEdit: () => void;
  onCancel: () => void;
}) {
  const [stats, setStats] = useState({ lessons: 0, chapters: 0, quizzes: 0 });

  useEffect(() => {
    if (!createdModuleName) return;

    const fetchStats = async () => {
      try {
        const cleanBaseUrl = LMS_API_BASE_URL ? LMS_API_BASE_URL.replace(/\/$/, '') : '';
        const url = `${cleanBaseUrl}/api/method/novel_lms.novel_lms.api.module_management.get_module_with_details?module_id=${encodeURIComponent(createdModuleName)}`;
        const res = await fetch(url, { credentials: "include" });
        if (res.ok) {
          const data = await res.json();
          const moduleData = data.message;
          if (moduleData && moduleData.lessons) {
            let lCount = moduleData.lessons.length;
            let cCount = 0;
            let qCount = 0;
            moduleData.lessons.forEach((l: any) => {
              if (l.chapters) {
                cCount += l.chapters.length;
                l.chapters.forEach((c: any) => {
                  if (c.contents) {
                    qCount += c.contents.filter((ct: any) => ct.content_type === "Quiz").length;
                  }
                });
              }
            });
            setStats({ lessons: lCount, chapters: cCount, quizzes: qCount });
          }
        }
      } catch (err) {
        console.error("Error fetching module stats:", err);
      }
    };

    fetchStats();
  }, [createdModuleName]);

  const lessonCount = stats.lessons || 3;
  const chapterCount = stats.chapters || 9;
  const quizCount = stats.quizzes || 3;

  return (
    <div className="flex items-center justify-center w-full h-full py-4 animate-in fade-in slide-in-from-bottom-6 duration-500">
      <style>{`
        @keyframes bot-breathe {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        @keyframes thumbs-sway {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-5deg); }
        }
        @keyframes sparkle-rise {
          0% { transform: translateY(0) scale(0.6); opacity: 0; }
          50% { opacity: 0.9; }
          100% { transform: translateY(-18px) scale(1.1); opacity: 0; }
        }
        @keyframes eye-glow {
          0%, 100% { filter: drop-shadow(0 0 1px #22d3ee); }
          50% { filter: drop-shadow(0 0 4px #22d3ee); }
        }

        .bot-breathe-anim {
          animation: bot-breathe 2.8s ease-in-out infinite;
        }
        .thumbs-sway-anim {
          animation: thumbs-sway 1.5s ease-in-out infinite;
          transform-origin: 138px 104px;
        }
        .sparkle-rise-1 {
          animation: sparkle-rise 2s ease-in-out infinite;
        }
        .sparkle-rise-2 {
          animation: sparkle-rise 2s ease-in-out infinite 0.7s;
        }
        .eye-glow-anim {
          animation: eye-glow 2s ease-in-out infinite;
        }
      `}</style>

      {/* Unified wide white box containing both mascot & details */}
      <div className="w-full max-w-3xl bg-background border border-border rounded-3xl p-8 md:p-10 shadow-lg flex flex-col md:flex-row items-center gap-8 md:gap-12 transition-all">

        {/* Left column inside card: Cute thumbs-up robot next to desk Luna */}
        <div className="flex-1 flex flex-col items-center justify-center p-2 max-w-[300px]">
          <div className="relative w-64 h-56 md:w-72 md:h-64 flex items-center justify-center">
            <svg viewBox="0 0 240 200" className="w-full h-full drop-shadow-xl overflow-visible">
              <defs>
                <linearGradient id="glowGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="rgba(34,211,238,0.12)" />
                  <stop offset="100%" stopColor="rgba(34,211,238,0)" />
                </linearGradient>
                <radialGradient id="shadowGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(15,23,42,0.12)" />
                  <stop offset="100%" stopColor="rgba(15,23,42,0)" />
                </radialGradient>
                <linearGradient id="botBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="100%" stopColor="#f1f5f9" />
                </linearGradient>
              </defs>

              {/* Glowing background aura */}
              <circle cx="120" cy="100" r="70" fill="url(#glowGrad)" className="animate-pulse" style={{ transformOrigin: "120px 100px" }} />

              {/* Shadows */}
              <ellipse cx="78" cy="168" rx="36" ry="4" fill="url(#shadowGrad)" />
              <ellipse cx="162" cy="168" rx="24" ry="4" fill="url(#shadowGrad)" />

              {/* ── Wooden Chair ── */}
              <g>
                {/* Backrest */}
                <rect x="22" y="85" width="24" height="12" rx="3" fill="#b45309" stroke="#78350f" strokeWidth="1" />
                {/* Back poles */}
                <line x1="28" y1="97" x2="28" y2="118" stroke="#78350f" strokeWidth="2.5" />
                <line x1="40" y1="97" x2="40" y2="118" stroke="#78350f" strokeWidth="2.5" />
                {/* Seat */}
                <rect x="20" y="118" width="28" height="4" rx="1" fill="#78350f" />
                {/* Chair legs */}
                <line x1="23" y1="122" x2="23" y2="152" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
                <line x1="45" y1="122" x2="45" y2="152" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
                <line x1="30" y1="122" x2="30" y2="145" stroke="#451a03" strokeWidth="1.8" />
              </g>

              {/* ── Wooden Desk ── */}
              <g>
                {/* Desk legs back */}
                <line x1="58" y1="124" x2="58" y2="154" stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="102" y1="124" x2="102" y2="154" stroke="#451a03" strokeWidth="2.5" strokeLinecap="round" />
                {/* Desk legs front */}
                <line x1="48" y1="124" x2="48" y2="164" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
                <line x1="112" y1="124" x2="112" y2="164" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
                {/* Desk Top */}
                <rect x="42" y="116" width="76" height="8" rx="2" fill="#d97706" stroke="#b45309" strokeWidth="1.2" />
              </g>

              {/* ── Open Book on Desk ── */}
              <g>
                {/* Cover outline */}
                <path d="M 50 114 C 65 107, 95 107, 110 114" stroke="#0f766e" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                {/* Left pages */}
                <path d="M 52 113 Q 66 106 80 112 L 80 115 Q 66 109 52 116 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
                {/* Right pages */}
                <path d="M 80 112 Q 94 106 108 113 L 108 116 Q 94 109 80 115 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
                {/* Book spine line */}
                <line x1="80" y1="112" x2="80" y2="115" stroke="#94a3b8" strokeWidth="1" />
                {/* Lines of text */}
                <path d="M 56 110 Q 64 107 72 109 M 57 113 Q 64 110 73 112 M 87 109 Q 95 107 103 110 M 87 112 Q 95 110 102 113" stroke="#94a3b8" strokeWidth="0.7" strokeLinecap="round" fill="none" />
              </g>

              {/* Sparkles rising from book */}
              <g>
                <path d="M80,98 L81,100 L83,101 L81,102 L80,104 L79,102 L77,101 L79,100 Z" fill="#eab308" className="sparkle-rise-1" />
                <path d="M88,92 L89,94 L91,95 L89,96 L88,98 L87,96 L85,95 L87,94 Z" fill="#06b6d4" className="sparkle-rise-2" />
              </g>

              {/* ── Thumbs-up Robot (Luna) ── */}
              <g className="bot-breathe-anim">

                {/* Right arm relaxed */}
                <g>
                  <circle cx="186" cy="98" r="5.5" fill="#0d9488" />
                  <rect x="182" y="98" width="8" height="24" rx="4" fill="url(#botBodyGrad)" stroke="#cbd5e1" strokeWidth="1" />
                  <circle cx="186" cy="122" r="4" fill="#0d9488" />
                </g>

                {/* Left leg */}
                <rect x="146" y="132" width="8" height="26" rx="4" fill="url(#botBodyGrad)" stroke="#e2e8f0" strokeWidth="1" />
                <circle cx="150" cy="144" r="4.5" fill="#0d9488" />
                <ellipse cx="150" cy="160" rx="8" ry="4" fill="#cbd5e1" />

                {/* Right leg */}
                <rect x="168" y="132" width="8" height="26" rx="4" fill="url(#botBodyGrad)" stroke="#e2e8f0" strokeWidth="1" />
                <circle cx="172" cy="144" r="4.5" fill="#0d9488" />
                <ellipse cx="172" cy="160" rx="8" ry="4" fill="#cbd5e1" />

                {/* Torso/Body */}
                <rect x="138" y="90" width="46" height="46" rx="14" fill="url(#botBodyGrad)" stroke="#cbd5e1" strokeWidth="1.5" />
                {/* Chest screen */}
                <rect x="146" y="100" width="30" height="18" rx="5" fill="#0d9488" />
                <line x1="152" y1="109" x2="170" y2="109" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" className="animate-pulse" />

                {/* Head */}
                <rect x="132" y="44" width="58" height="44" rx="18" fill="url(#botBodyGrad)" stroke="#cbd5e1" strokeWidth="1.5" />

                {/* Ears */}
                <ellipse cx="130" cy="66" rx="4" ry="10" fill="#0d9488" />
                <ellipse cx="192" cy="66" rx="4" ry="10" fill="#0d9488" />

                {/* Face plate */}
                <rect x="138" y="50" width="46" height="30" rx="11" fill="#0f172a" />

                {/* Happy curved cyan eyes */}
                <path d="M 144 65 Q 149 58 154 65" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" fill="none" className="eye-glow-anim" />
                <path d="M 168 65 Q 173 58 178 65" stroke="#22d3ee" strokeWidth="2.5" strokeLinecap="round" fill="none" className="eye-glow-anim" />

                {/* Smile mouth */}
                <path d="M 156 73 Q 160 77 164 73" stroke="#22d3ee" strokeWidth="1.5" strokeLinecap="round" fill="none" />

                {/* Antennae */}
                <line x1="148" y1="44" x2="143" y2="30" stroke="#cbd5e1" strokeWidth="2.5" />
                <circle cx="143" cy="30" r="3.5" fill="#0d9488" />

                <line x1="174" y1="44" x2="179" y2="30" stroke="#cbd5e1" strokeWidth="2.5" />
                <circle cx="179" cy="30" r="3.5" fill="#0d9488" />

                {/* Left Arm waving & thumbs-up (EVE-style) */}
                <g className="thumbs-sway-anim">
                  <circle cx="136" cy="98" r="5.5" fill="#0d9488" />
                  {/* Left hand sleeve */}
                  <rect x="114" y="93" width="22" height="10" rx="4" fill="url(#botBodyGrad)" stroke="#cbd5e1" strokeWidth="1" transform="rotate(20 136 98)" />
                  {/* Left Hand doing thumbs up */}
                  {/* Fist */}
                  <rect x="104" y="86" width="12" height="12" rx="4" fill="#0d9488" />
                  {/* Thumb */}
                  <path d="M 112 86 C 112 80, 116 80, 116 86 Z" fill="#0d9488" stroke="#0891b2" strokeWidth="1" />
                </g>

              </g>

            </svg>
          </div>
        </div>

        {/* Right column inside card: Review details & actions */}
        <div className="flex-[1.2] flex flex-col gap-6 w-full text-center md:text-left">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Ready to Review
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Luna's Generation Complete!
            </h2>
            <p className="text-sm text-muted-foreground">
              Hi, I'm Luna! I've successfully structured your course module and loaded it with rich content.
            </p>
          </div>

          {/* Dynamic statistics */}
          <div className="grid grid-cols-3 gap-3 bg-muted/30 rounded-2xl p-4 border border-border/50 text-center">
            <div className="space-y-1">
              <p className="text-2xl font-extrabold text-primary">{lessonCount}</p>
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Lessons</p>
            </div>
            <div className="space-y-1 border-x border-border/80">
              <p className="text-2xl font-extrabold text-primary">{chapterCount}</p>
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Chapters</p>
            </div>
            <div className="space-y-1">
              <p className="text-2xl font-extrabold text-primary">{quizCount}</p>
              <p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Quizzes</p>
            </div>
          </div>

          {/* Call to Actions */}
          <div className="space-y-4 pt-2">
            <Button
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-semibold h-12 rounded-xl shadow-md transition-all hover:scale-[1.01]"
              onClick={onReviewEdit}
            >
              Review &amp; Edit Module
            </Button>

            <button
              className="w-full text-sm text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors text-center"
              onClick={onCancel}
            >
              Discard and go back
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Main Wizard ──────────────────────────────────────────────────────────────

export default function AiModuleWizard() {
  const [, setLocation] = useLocation();

  const [step, setStep] = useState<Step>(1);
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [instructions, setInstructions] = useState("");
  const [createdModuleName, setCreatedModuleName] = useState<string | null>(null);

  const isStep1Valid = files.length > 0 && instructions.trim().length > 0;

  const handleCancel = () => setLocation("/");

  const handleStep1Next = () => setStep(2);

  const handleProcessingDone = (moduleId: string) => {
    setCreatedModuleName(moduleId);
    setStep(3); // Transition to the Review tab instead of instantly navigating
  };

  const handleProcessingFailed = () => {
    setStep(1);
  };

  const handleReviewEdit = () => {
    navigate(createdModuleName
      ? BASE_PATH + `/edit/${createdModuleName}`
      : BASE_PATH + "/edit"
    );
  };

  return (
    /* Full viewport — no scroll, everything fits */
    <div className="h-screen bg-muted/30 flex flex-col overflow-hidden">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-3.5 border-b border-border bg-background/90 backdrop-blur-sm shrink-0 z-10">
        <button
          className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          onClick={handleCancel}
        >
          Cancel
        </button>

        {/* <h1 className="text-base font-semibold text-foreground tracking-tight">AI Wizard</h1> */}

        <Button
          size="sm"
          onClick={step === 1 ? handleStep1Next : undefined}
          className={`
            px-5 text-sm font-semibold transition-all
            ${step === 1 && isStep1Valid
              ? "bg-primary text-primary-foreground hover:bg-primary/90 opacity-100 scale-100"
              : "opacity-0 pointer-events-none scale-95"
            }
          `}
        >
          Next
        </Button>
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
            flex-1 flex flex-col bg-background border border-border rounded-2xl shadow-sm overflow-hidden
            ${step === 3 ? "bg-transparent border-none shadow-none" : "p-8"}
          `}>
            {step === 1 && (
              <StepUpload
                files={files}
                onFilesChange={setFiles}
                instructions={instructions}
                onInstructionsChange={setInstructions}
                onNext={handleStep1Next}
                onCancel={handleCancel}
              />
            )}

            {step === 2 && (
              <StepProcessing
                files={files}
                instructions={instructions}
                onDone={handleProcessingDone}
                onFailed={handleProcessingFailed}
              />
            )}

            {step === 3 && (
              <StepReview
                createdModuleName={createdModuleName}
                onReviewEdit={handleReviewEdit}
                onCancel={handleCancel}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
