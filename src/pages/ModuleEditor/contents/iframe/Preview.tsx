import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Globe, ExternalLink } from "lucide-react";

export default function IframePreview({ 
  title = "Embedded Content", 
  url = "https://example.com"
}: { 
  title?: string;
  url?: string;
}) {
  const domain = url ? new URL(url).hostname : 'example.com';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("border rounded-lg p-4 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/20")}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <Globe className="h-6 w-6 text-orange-600" />
        </div>
        <div className="flex-1 space-y-2">
          <h3 className="font-semibold text-lg">{title}</h3>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ExternalLink className="h-3 w-3" />
            <span className="truncate">{domain}</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Embedded web content
          </div>
        </div>
      </div>
    </motion.div>
  );
} 