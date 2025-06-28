// This file will export content details for the bottom bar prototype.

import { textContentInfo, TextPreview } from './text';
import { imageContentInfo, ImagePreview } from './image';
import { videoContentInfo, VideoPreview } from './video';
import { audioContentInfo, AudioPreview } from './audio';
import { checklistContentInfo, CheckListPreview } from './checklist';
import { stepsContentInfo, StepsPreview } from './steps';
import { quizContentInfo, QuizPreview } from './quiz';
import { questionAnswerContentInfo, QuestionAnswerPreview } from './question_answer';
import { slideContentInfo, SlidePreview } from './slide';
import { iframeContentInfo, IframePreview } from './iframe';
import { FileText, Image as ImageIcon, Video as VideoIcon, Volume2, CheckSquare, ListOrdered, File, HelpCircle, FolderKanban, Globe, MessageSquare, Presentation } from 'lucide-react';

export const contentsList = [
  { ...textContentInfo, icon: FileText, Preview: TextPreview },
  { ...imageContentInfo, icon: ImageIcon, Preview: ImagePreview },
  { ...videoContentInfo, icon: VideoIcon, Preview: VideoPreview },
  { ...audioContentInfo, icon: Volume2, Preview: AudioPreview },
  { ...checklistContentInfo, icon: CheckSquare, Preview: CheckListPreview },
  { ...stepsContentInfo, icon: ListOrdered, Preview: StepsPreview },
  { ...quizContentInfo, icon: HelpCircle, Preview: QuizPreview },
  { ...questionAnswerContentInfo, icon: MessageSquare, Preview: QuestionAnswerPreview },
  { ...slideContentInfo, icon: Presentation, Preview: SlidePreview },
  { ...iframeContentInfo, icon: Globe, Preview: IframePreview },
  // Additional content types (placeholders for now)
  { id: 'file', name: 'File', icon: File, description: 'A file upload or attachment block.' },
  { id: 'Accordion Content', name: 'Accordion Content', icon: FolderKanban, description: 'An accordion content block.' },
  // Example:
  // { id: 'text', name: 'Text', icon: '📝', description: 'Text content block' },
]; 