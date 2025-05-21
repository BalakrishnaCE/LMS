import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function TextPreview({ body }: { body: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("text-sm prose dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-li:text-foreground prose-blockquote:text-foreground")}
      dangerouslySetInnerHTML={{ __html: body }}
    />
  );
} 