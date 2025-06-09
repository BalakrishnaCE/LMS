import React from "react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent as ShadAccordionContent } from "@/components/ui/accordion";
import { LMS_API_BASE_URL } from "@/config/routes";

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
      <div className="text-lg font-semibold mb-1 text-foreground">{content.title}</div>
      {content.description && (
        <div className="prose prose-sm dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-li:text-foreground prose-blockquote:text-foreground mb-2" dangerouslySetInnerHTML={{ __html: content.description }} />
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
                      src={LMS_API_BASE_URL + item.image}
                      alt="Accordion Item"
                      className="max-w-[120px] h-auto rounded shadow border"
                    />
                  ) : null}
                  <div className="prose prose-sm dark:prose-invert prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-em:text-foreground prose-li:text-foreground prose-blockquote:text-foreground" dangerouslySetInnerHTML={{ __html: item.body_content }} />
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