// This file will export content details for the bottom bar prototype.

import { textContentInfo, TextPreview } from './text';
import { imageContentInfo, ImagePreview } from './image';
import { videoContentInfo, VideoPreview } from './video';
import { checklistContentInfo, CheckListPreview } from './checklist';
import { stepsContentInfo, StepsPreview } from './steps';
import { FileText, Image as ImageIcon, Video as VideoIcon, CheckSquare, ListOrdered, File, HelpCircle, FolderKanban, Globe, MessageSquare, Presentation } from 'lucide-react';

export const contentsList = [
  { ...textContentInfo, icon: FileText, Preview: TextPreview },
  { ...imageContentInfo, icon: ImageIcon, Preview: ImagePreview },
  { ...videoContentInfo, icon: VideoIcon, Preview: VideoPreview },
  { ...checklistContentInfo, icon: CheckSquare, Preview: CheckListPreview },
  { ...stepsContentInfo, icon: ListOrdered, Preview: StepsPreview },
  // Additional content types (placeholders for now)
  { id: 'file', name: 'File', icon: File, description: 'A file upload or attachment block.' },
  { id: 'pdf', name: 'PDF', icon: FileText, description: 'A PDF document block.' },
  { id: 'quiz', name: 'Quiz', icon: HelpCircle, description: 'A quiz or assessment block.' },
  { id: 'slide', name: 'Slide', icon: Presentation, description: 'A slide or presentation block.' },
  { id: 'Accordion Content', name: 'Accordion Content', icon: FolderKanban, description: 'An accordion content block.' },
  { id: 'iframe', name: 'Iframe', icon: Globe, description: 'An embedded web page or iframe block.' },
  { id: 'question_answer', name: 'Question Answer', icon: MessageSquare, description: 'A Q&A or FAQ block.' },
  // Example:
  // { id: 'text', name: 'Text', icon: '📝', description: 'Text content block' },
]; 