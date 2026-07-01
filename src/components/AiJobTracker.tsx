import { useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { LMS_API_BASE_URL } from "@/config/routes";

export function AiJobTracker() {
  const [location, setLocation] = useLocation();

  useEffect(() => {
    // If on the wizard page, don't poll globally to avoid double polling
    if (location.includes("/ai-module-wizard")) {
      return;
    }

    let isChecking = false;
    const checkJob = async () => {
      const jobId = localStorage.getItem("active_ai_job_id");
      if (!jobId || isChecking) return;

      isChecking = true;
      try {
        const cleanBaseUrl = LMS_API_BASE_URL ? LMS_API_BASE_URL.replace(/\/$/, "") : "";
        const pollUrl = `${cleanBaseUrl}/api/method/novel_lms.lms_ai_module_creation.api.generator.get_status?ai_job_id=${jobId}`;
        const response = await fetch(pollUrl, {
          method: "GET",
          headers: {
            "Accept": "application/json",
          },
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          const statusData = data.message;
          if (statusData) {
            if (statusData.status === "finished") {
              localStorage.removeItem("active_ai_job_id");
              localStorage.removeItem("active_ai_job_progress");
              toast.success("Module Created Successfully!", {
                description: "Luna has finished creating your new LMS module. Click here to review it.",
                duration: 15000,
                onClick: () => {
                  if (statusData.module_id) {
                    setLocation(`/modules/${statusData.module_id}`);
                  } else {
                    setLocation(`/modules`);
                  }
                },
                action: {
                  label: "Review",
                  onClick: (e: any) => {
                    e.stopPropagation();
                    if (statusData.module_id) {
                      setLocation(`/modules/${statusData.module_id}`);
                    } else {
                      setLocation(`/modules`);
                    }
                  },
                },
              } as any);
            } else if (statusData.status === "failed") {
              localStorage.removeItem("active_ai_job_id");
              localStorage.removeItem("active_ai_job_progress");
              toast.error("AI Generation Failed", {
                description: statusData.error || "The background generation task encountered an error.",
                duration: 8000,
              });
            } else {
              if (statusData.progress) {
                localStorage.setItem("active_ai_job_progress", statusData.progress);
              }
            }
          }
        }
      } catch (err) {
        console.error("Global job tracker error:", err);
      } finally {
        isChecking = false;
      }
    };

    // Run check immediately and then every 4 seconds
    checkJob();
    const intervalId = setInterval(checkJob, 4000);

    return () => clearInterval(intervalId);
  }, [location, setLocation]);

  return null;
}
