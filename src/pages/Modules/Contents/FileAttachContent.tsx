import { motion } from "framer-motion";

interface FileAttachContentProps {
  content: {
    title: string;
    attachment: string;
  };
}

export default function FileAttachContent({ content }: FileAttachContentProps) {
  const fileUrl = content.attachment.startsWith('http') ? content.attachment : `http://10.80.4.72${content.attachment}`;
  const fileExtension = content.attachment.split('.').pop()?.toLowerCase();
  
  const renderFilePreview = () => {
    switch (fileExtension) {
      case 'pdf':
        return (
          <iframe
            src={fileUrl}
            className="w-full h-[600px] rounded-lg shadow-lg"
            title={content.title}
          />
        );
      case 'doc':
      case 'docx':
        return (
          <iframe
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`}
            className="w-full h-[600px] rounded-lg shadow-lg"
            title={content.title}
          />
        );
      case 'xls':
      case 'xlsx':
        return (
          <iframe
            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`}
            className="w-full h-[600px] rounded-lg shadow-lg"
            title={content.title}
          />
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-muted/30 rounded-lg p-4 flex flex-col gap-4"
    >
      <div className="font-semibold text-lg">{content.title}</div>
      {renderFilePreview()}
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