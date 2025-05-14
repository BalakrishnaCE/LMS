import React, { useState } from "react";
import { Checkbox } from '@/components/ui/checkbox';
import { motion } from "framer-motion";

function CheckListContent({ content }: { content: any }) {
  const [checked, setChecked] = useState<{ [key: number]: boolean }>({});
  const items = content.check_list_item || [];
  return (
    <div className="bg-muted/30 rounded-lg p-4">
      <div className="font-semibold text-lg mb-2 text-center">{content.title}</div>
      <ul className="space-y-4">
        {items.map((item: any, idx: number) => (
          <motion.li
            key={idx}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex items-start gap-3"
          >
            <Checkbox
              checked={!!checked[idx]}
              onCheckedChange={() => setChecked(c => ({ ...c, [idx]: !c[idx] }))}
              className="mt-1 h-5 w-5 border-2 border-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
            />
            <div>
              <div className="font-bold">{item.item}</div>
              <div className="prose prose-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: item.content || "" }} />
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}

export default CheckListContent; 