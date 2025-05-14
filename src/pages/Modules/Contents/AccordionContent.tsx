import { useState } from "react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent as ShadAccordionContent } from "@/components/ui/accordion";

interface AccordionItemType {
  header_title: string;
  body_content: string;
  image?: string;
}

interface AccordionContentProps {
  content: {
    title: string;
    description?: string;
    accordion_items?: AccordionItemType[];
    acoordian_items?: AccordionItemType[];
  };
}

export default function AccordionContent({ content }: AccordionContentProps) {
  // Prefer acoordian_items if present, else fallback to accordion_items
  const items = Array.isArray(content.acoordian_items)
    ? content.acoordian_items
    : Array.isArray(content.accordion_items)
      ? content.accordion_items
      : [];

  return (
    <div className="my-4">
      <div className="text-lg font-semibold mb-1">{content.title}</div>
      {content.description && (
        <div className="prose prose-sm mb-2 text-muted-foreground" dangerouslySetInnerHTML={{ __html: content.description }} />
      )}
      <Accordion type="single" collapsible className="w-full">
        {items.length > 0 ? (
          items.map((item, idx) => (
            <AccordionItem value={String(idx)} key={idx}>
              <AccordionTrigger>{item.header_title}</AccordionTrigger>
              <ShadAccordionContent>
                <div className="flex gap-4 items-start py-2">
                  {item.image ? (
                    <img
                      src={"http://10.80.4.72" + item.image}
                      alt="Accordion Item"
                      className="max-w-[120px] h-auto rounded shadow border"
                    />
                  ) : null}
                  <div className="prose prose-sm" dangerouslySetInnerHTML={{ __html: item.body_content }} />
                </div>
              </ShadAccordionContent>
            </AccordionItem>
          ))
        ) : (
          <div className="py-4 text-muted-foreground text-center">No accordion items available.</div>
        )}
      </Accordion>
    </div>
  );
} 