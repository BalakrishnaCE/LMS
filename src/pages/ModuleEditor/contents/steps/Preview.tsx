import React from "react";
import { motion } from "framer-motion";

export default function StepsPreview({ steps }: { steps: { item_name: string; item_content?: string }[] }) {
  return (
    <motion.ol
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="list-decimal pl-6 space-y-2 text-left"
    >
      {steps.map((step, idx) => (
        <li key={idx} className="text-foreground">
          <span className="font-semibold">{step.item_name}</span>
          {step.item_content && <div className="ml-2 text-muted-foreground">{step.item_content}</div>}
        </li>
      ))}
    </motion.ol>
  );
} 