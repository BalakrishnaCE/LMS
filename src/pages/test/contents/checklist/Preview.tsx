import React from "react";
import { motion } from "framer-motion";

export default function CheckListPreview({ items }: { items: { item: string; content?: string }[] }) {
  return (
    <motion.ul
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="list-disc pl-6 space-y-1 text-left"
    >
      {items.map((it, idx) => (
        <li key={idx} className="text-foreground">
          <span className="font-medium">{it.item}</span>
          {it.content && <span className="ml-2 text-muted-foreground">{it.content}</span>}
        </li>
      ))}
    </motion.ul>
  );
} 