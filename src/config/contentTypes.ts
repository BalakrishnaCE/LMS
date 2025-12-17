export type ContentType = 
  | "Video Content"
  | "Text Content"
  | "Image Content"
  | "Audio Content"
  | "Quiz"
  | "Question Answer"
  | "Slide Content"
  | "Accordion Content"
  | "Steps"
  | "Check List"
  | "File Attach"
  | "Iframe Content"
  | "Chapter Content";

export interface ContentTypeConfig {
  displayName: string;
  requiresProgress?: boolean;
  autoComplete?: boolean;
  completionTime?: number; // in seconds
}

export const CONTENT_TYPES: Record<ContentType, ContentTypeConfig> = {
  "Video Content": {
    displayName: "Video",
    requiresProgress: true,
    autoComplete: true,
    completionTime: 0 // Will be determined by video duration
  },
  "Text Content": {
    displayName: "Text",
    requiresProgress: false,
    autoComplete: false
  },
  "Image Content": {
    displayName: "Image",
    requiresProgress: false,
    autoComplete: false
  },
  "Audio Content": {
    displayName: "Audio",
    requiresProgress: true,
    autoComplete: true,
    completionTime: 0 // Will be determined by audio duration
  },
  "Quiz": {
    displayName: "Quiz",
    requiresProgress: true,
    autoComplete: false
  },
  "Question Answer": {
    displayName: "Question Answer",
    requiresProgress: true,
    autoComplete: false
  },
  "Slide Content": {
    displayName: "Slide",
    requiresProgress: true,
    autoComplete: false
  },
  "Accordion Content": {
    displayName: "Accordion",
    requiresProgress: false,
    autoComplete: false
  },
  "Steps": {
    displayName: "Steps",
    requiresProgress: false,
    autoComplete: false
  },
  "Check List": {
    displayName: "Check List",
    requiresProgress: false,
    autoComplete: false
  },
  "File Attach": {
    displayName: "File Attachment",
    requiresProgress: false,
    autoComplete: false
  },
  "Iframe Content": {
    displayName: "Iframe",
    requiresProgress: false,
    autoComplete: false
  },
  "Chapter Content": {
    displayName: "Chapter",
    requiresProgress: false,
    autoComplete: false
  }
};

