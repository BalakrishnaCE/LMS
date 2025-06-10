import { motion } from "framer-motion";
import { LMS_API_BASE_URL } from "@/config/routes";
interface FileAttachContentProps {
  content: {
    title: string;
    attachment: string;
  };
}

export default function FileAttachContent({ content }: FileAttachContentProps) {
  const fileUrl = content.attachment.startsWith('http') ? content.attachment : `${LMS_API_BASE_URL}${content.attachment}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-muted/30 rounded-lg p-4 flex flex-col gap-4"
    >
      <div className="font-semibold text-lg">{content.title}</div>
      <a
        href={fileUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-primary underline font-medium mt-2"
      >
        Download File
      </a>
    </motion.div>
  );
} 