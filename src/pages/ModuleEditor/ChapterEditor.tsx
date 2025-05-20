import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import RichEditor from "@/components/RichEditor";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { useFrappeUpdateDoc, useFrappeCreateDoc, useFrappeFileUpload } from "frappe-react-sdk";
import { Link } from 'wouter';
import TextContentEditor from '@/pages/ModuleEditor/content/TextContentEditor';
import ImageContentEditor from '@/pages/ModuleEditor/content/ImageContentEditor';
import VideoContentEditor from '@/pages/ModuleEditor/content/VideoContentEditor';
import FileAttachContentEditor from '@/pages/ModuleEditor/content/FileAttachContentEditor';
import PDFContentEditor from '@/pages/ModuleEditor/content/PDFContentEditor';
import StepsTableContentEditor from '@/pages/ModuleEditor/content/StepsTableContentEditor';
import CheckListContentEditor from '@/pages/ModuleEditor/content/CheckListContentEditor';
import { getAlignmentClass } from '@/components/ContentAlignment';

// Editor modals for each content type
function TextContentModal({ open, onClose, content, onSave }: any) {
  const [title, setTitle] = useState(content.title || "");
  const [value, setValue] = useState(content.body || "");
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className=" h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Text Content</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto w-full h-full space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Enter text title" />
          </div>
          <div>
            <Label>Body</Label>
            <RichEditor content={value} onChange={setValue} />
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button onClick={() => onSave({ ...content, title, body: value, type: "Text Content" })}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImageContentModal({ open, onClose, content, onSave }: any) {
  const [title, setTitle] = useState(content.title || "");
  const [description, setDescription] = useState(content.description || "");
  const [imageUrl, setImageUrl] = useState(content.attach || "");
  const { upload, loading: uploading } = useFrappeFileUpload();

  const handleUpload = async (file: File) => {
    try {
      const fileArgs = {
        isPrivate: false,
        folder: "Home/Attachments",
        doctype: "Image Content",
        docname: content.name || "new",
        fieldname: "attach"
      };
      const response = await upload(file, fileArgs);
      setImageUrl(response.file_url);
      return response.file_url;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  };

  const handleSave = () => {
    onSave({
      ...content,
      title,
      description,
      attach: imageUrl,
      type: "Image Content"
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full">
        <DialogHeader>
          <DialogTitle>Edit Image Content</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter image title"
            />
          </div>
          <div>
            <Label>Description</Label>
            <RichEditor
              content={description}
              onChange={setDescription}
            />
          </div>
          <div>
            <Label>Image</Label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  const file = e.target.files[0];
                  handleUpload(file);
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={uploading || !imageUrl}>
            {uploading ? "Uploading..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VideoContentInlineEditor({ content, onSave }: any) {
  const [title, setTitle] = useState(content.title || "");
  const [description, setDescription] = useState(content.description || "");
  const [videoUrl, setVideoUrl] = useState(content.video || "");
  const [showUploadArea, setShowUploadArea] = useState(false);
  const { upload, loading: uploading } = useFrappeFileUpload();

  const handleUpload = async (file: File) => {
    try {
      const fileArgs = {
        isPrivate: false,
        folder: "Home/Attachments",
        doctype: "Video Content",
        docname: content.name || "new",
        fieldname: "video"
      };
      const response = await upload(file, fileArgs);
      setVideoUrl(response.file_url);
      setShowUploadArea(false);
      onSave({ ...content, title, description, video: response.file_url, type: "Video Content" });
      return response.file_url;
    } catch (error) {
      console.error("Error uploading video:", error);
      throw error;
    }
  };

  return (
    <div>
      {videoUrl ? (
        <div>
          <video src={videoUrl} controls style={{ maxWidth: 320 }} />
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs break-all">{videoUrl}</span>
            <Button size="sm" variant="outline" onClick={() => { setVideoUrl(""); setShowUploadArea(false); onSave({ ...content, title, description, video: "", type: "Video Content" }); }}>Clear</Button>
          </div>
        </div>
      ) : (
        <div>
          {!showUploadArea ? (
            <Button size="sm" onClick={() => setShowUploadArea(true)}>Upload Video</Button>
          ) : (
            <input
              type="file"
              accept="video/*"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  const file = e.target.files[0];
                  handleUpload(file);
                }
              }}
            />
          )}
        </div>
      )}
      <div className="mt-2 space-y-2">
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Video title" />
        <RichEditor content={description} onChange={setDescription} />
      </div>
    </div>
  );
}

function PDFContentModal({ open, onClose, content, onSave }: any) {
  const [title, setTitle] = useState(content.title || "");
  const [description, setDescription] = useState(content.description || "");
  const [pdfUrl, setPdfUrl] = useState(content.pdf || "");
  const { upload, loading: uploading } = useFrappeFileUpload();

  const handleUpload = async (file: File) => {
    try {
      const fileArgs = {
        isPrivate: false,
        folder: "Home/Attachments",
        doctype: "PDF",
        docname: content.name || "new",
        fieldname: "pdf"
      };
      const response = await upload(file, fileArgs);
      setPdfUrl(response.file_url);
      return response.file_url;
    } catch (error) {
      console.error("Error uploading PDF:", error);
      throw error;
    }
  };

  const handleSave = () => {
    onSave({
      ...content,
      title,
      description,
      pdf: pdfUrl,
      type: "PDF"
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full">
        <DialogHeader>
          <DialogTitle>Edit PDF Content</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter PDF title"
            />
          </div>
          <div>
            <Label>Description</Label>
            <RichEditor
              content={description}
              onChange={setDescription}
            />
          </div>
          <div>
            <Label>PDF File</Label>
            <input
              type="file"
              accept=".pdf"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  const file = e.target.files[0];
                  handleUpload(file);
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={uploading || !pdfUrl}>
            {uploading ? "Uploading..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FileAttachContentModal({ open, onClose, content, onSave }: any) {
  const [title, setTitle] = useState(content.title || "");
  const [attachmentUrl, setAttachmentUrl] = useState(content.attachment || "");
  const { upload, loading: uploading } = useFrappeFileUpload();

  const handleUpload = async (file: File) => {
    try {
      const fileArgs = {
        isPrivate: false,
        folder: "Home/Attachments",
        doctype: "File Attach",
        docname: content.name || "new",
        fieldname: "attachment"
      };
      const response = await upload(file, fileArgs);
      setAttachmentUrl(response.file_url);
      return response.file_url;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  };

  const handleSave = () => {
    onSave({
      ...content,
      title,
      attachment: attachmentUrl,
      type: "File Attach"
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full">
        <DialogHeader>
          <DialogTitle>Edit File Attachment</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter file title"
            />
          </div>
          <div>
            <Label>File</Label>
            <input
              type="file"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  const file = e.target.files[0];
                  handleUpload(file);
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={uploading || !attachmentUrl}>
            {uploading ? "Uploading..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function QuizContentModal({ open, onClose, content, onSave }: any) {
  // TODO: Implement quiz editor
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full">
        <DialogHeader>
          <DialogTitle>Edit Quiz Content</DialogTitle>
        </DialogHeader>
        <div>Quiz editor coming soon...</div>
        <DialogFooter>
          <Button onClick={() => onSave(content)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SlideContentModal({ open, onClose, content, onSave }: any) {
  // TODO: Implement slide content editor
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full">
        <DialogHeader>
          <DialogTitle>Edit Slide Content</DialogTitle>
        </DialogHeader>
        <div>Slide content editor coming soon...</div>
        <DialogFooter>
          <Button onClick={() => onSave(content)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Delete confirmation dialog
function DeleteConfirmModal({ open, onClose, onConfirm }: { open: boolean, onClose: () => void, onConfirm: () => void }) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Confirm Delete</DialogTitle>
        </DialogHeader>
        <div>Are you sure you want to delete this content block? This action cannot be undone.</div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" onClick={onConfirm}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Sortable item wrapper for drag-and-drop
function SortableItem({ id, children }: { id: string; children: React.ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} className="relative">
      <div {...listeners} className="absolute left-0 top-1/2 -translate-y-1/2 cursor-grab p-2">
        <GripVertical className="w-5 h-5 text-muted-foreground" />
      </div>
      <div className="pl-10">{children}</div>
    </div>
  );
}

// Main Chapter Editor
interface ChapterEditorProps {
  chapter: any;
  onChapterUpdate?: () => void;
}

const ChapterEditor: React.FC<ChapterEditorProps> = ({ chapter, onChapterUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [chapterName, setChapterName] = useState("");
  const [chapterDescription, setChapterDescription] = useState("");
  const [modal, setModal] = useState<{ idx: number; type: string } | null>(null);
  const [editingContent, setEditingContent] = useState<any>(null);
  const [deleteIdx, setDeleteIdx] = useState<number | null>(null);
  const [localContents, setLocalContents] = useState<any[]>(() =>
    (chapter.contents || []).sort((a: { order: number }, b: { order: number }) => a.order - b.order)
  );
  const { updateDoc, loading: updating } = useFrappeUpdateDoc();
  const [editingIdx, setEditingIdx] = useState<number | null>(null);

  // Initialize form when chapter changes
  useEffect(() => {
    if (chapter) {
      setChapterName(chapter.title || "");
      setChapterDescription(chapter.description || "");
    }
  }, [chapter]);

  // Update localContents if chapter.contents changes
  useEffect(() => {
    setLocalContents((chapter.contents || []).sort((a: { order: number }, b: { order: number }) => a.order - b.order));
  }, [chapter.contents]);

  const handleSave = async () => {
    if (!chapter.name) return;
    
    try {
      await updateDoc("Chapter", chapter.name, {
        title: chapterName,
        description: chapterDescription
      });
      setIsEditing(false);
      onChapterUpdate?.();
    } catch (error) {
      console.error("Error updating chapter:", error);
    }
  };

  // DnD-kit setup
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const handleContentChange = (idx: number, newContent: any) => {
    setModal(null);
    setEditingContent(null);
    // Update local state
    setLocalContents(prev => prev.map((c, i) => (i === idx ? newContent : c)));
  };
  const handleAddContent = () => {
  };
  const handleDeleteContent = (idx: number) => {
    setDeleteIdx(idx);
  };
  const confirmDeleteContent = () => {
    if (deleteIdx !== null) {
      setLocalContents(prev => prev.filter((_, i) => i !== deleteIdx));
      setDeleteIdx(null);
    }
  };
  const handleReorderContent = (fromIdx: number, toIdx: number) => {
    setLocalContents(prev => arrayMove(prev, fromIdx, toIdx));
  };
  const openEditModal = (idx: number, type: string, content: any) => {
    setModal({ idx, type });
    setEditingContent(content);
  };
  const closeModal = () => {
    setModal(null);
    setEditingContent(null);
  };

  // DnD event handler
  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = localContents.findIndex(c => (c.content_reference || c.id || c._id || c.order || c.tempId) === active.id);
      const newIndex = localContents.findIndex(c => (c.content_reference || c.id || c._id || c.order || c.tempId) === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        handleReorderContent(oldIndex, newIndex);
      }
    }
  };

  return (
    <Card className="p-6 mb-6">
      {isEditing ? (
        <div className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Chapter Title</Label>
            <Input
              value={chapterName}
              onChange={(e) => setChapterName(e.target.value)}
              className="mt-2"
            />
          </div>
          <div>
            <Label className="text-sm font-medium text-muted-foreground">Description</Label>
            <div className="mt-2">
              <RichEditor
                content={chapterDescription}
                onChange={setChapterDescription}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditing(false);
                setChapterName(chapter.title || "");
                setChapterDescription(chapter.description || "");
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={updating}
            >
              {updating ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold">{chapter.title}</h2>
            <Button 
              variant="outline" 
              onClick={() => setIsEditing(true)}
            >
              Edit Chapter
            </Button>
          </div>
          <div 
            className="prose prose-sm mb-4 text-muted-foreground" 
            dangerouslySetInnerHTML={{ __html: chapter.description || '' }} 
          />
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={localContents.map((c, idx) => c.content_reference || c.id || c._id || c.order || idx)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {localContents.map((content: any, idx: number) => {
              const type = content.type || content.content_type;
              const id = content.content_reference || content.id || content._id || content.order || idx;
              const isEditing = editingIdx === idx;
              return (
                <SortableItem id={id.toString()} key={id}>
                  <div className="relative border rounded p-4 bg-muted/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold capitalize">{type.replace(/_/g, ' ')}</span>
                      <div className="flex gap-2">
                        {isEditing ? null : (
                          <Button size="sm" variant="outline" onClick={() => setEditingIdx(idx)}>Edit</Button>
                        )}
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteContent(idx)}>Delete</Button>
                      </div>
                    </div>
                    {/* Inline editing or preview for each content type */}
                    {isEditing ? (
                      type === 'text' || type === 'Text Content' ? (
                        <TextContentEditor
                          content={content}
                          onSave={val => { handleContentChange(idx, { ...content, ...val, type: 'Text Content' }); setEditingIdx(null); }}
                          onCancel={() => setEditingIdx(null)}
                        />
                      ) : type === 'Image Content' ? (
                        <ImageContentEditor
                          content={content}
                          onSave={val => { handleContentChange(idx, { ...content, ...val, type: 'Image Content' }); setEditingIdx(null); }}
                          onCancel={() => setEditingIdx(null)}
                        />
                      ) : type === 'Video Content' ? (
                        <VideoContentEditor
                          content={content}
                          onSave={val => { handleContentChange(idx, { ...content, ...val, type: 'Video Content' }); setEditingIdx(null); }}
                          onCancel={() => setEditingIdx(null)}
                        />
                      ) : type === 'File Attach' ? (
                        <FileAttachContentEditor
                          content={content}
                          onSave={val => { handleContentChange(idx, { ...content, ...val, type: 'File Attach' }); setEditingIdx(null); }}
                          onCancel={() => setEditingIdx(null)}
                        />
                      ) : type === 'PDF' ? (
                        <PDFContentEditor
                          content={content}
                          onSave={val => { handleContentChange(idx, { ...content, ...val, type: 'PDF' }); setEditingIdx(null); }}
                          onCancel={() => setEditingIdx(null)}
                        />
                      ) : type === 'Steps' ? (
                        <StepsTableContentEditor
                          content={content}
                          onSave={val => { handleContentChange(idx, { ...content, ...val, type: 'Steps' }); setEditingIdx(null); }}
                          onCancel={() => setEditingIdx(null)}
                        />
                      ) : type === 'Check List' ? (
                        <CheckListContentEditor
                          content={content}
                          onSave={val => { handleContentChange(idx, { ...content, ...val, type: 'Check List' }); setEditingIdx(null); }}
                          onCancel={() => setEditingIdx(null)}
                        />
                      ) : (
                        <div className="border rounded p-2">Unsupported content type: {type}</div>
                      )
                    ) : (
                      <div className={content.alignment ? getAlignmentClass(content.alignment) : ''}>
                        {type === 'text' || type === 'Text Content' ? (
                          <div className="prose prose-sm" dangerouslySetInnerHTML={{ __html: content.body || "" }} />
                        ) : type === 'Image Content' ? (
                          <img src={content.attach || content.url} alt="Image" className="max-w-xs rounded" />
                        ) : type === 'Video Content' ? (
                          content.video ? <video src={content.video} controls className="max-w-xs rounded" /> : <span>No video</span>
                        ) : type === 'File Attach' ? (
                          content.attachment ? <a href={content.attachment} target="_blank" rel="noopener noreferrer" className="text-primary underline">Download File</a> : <span>No file</span>
                        ) : type === 'PDF' ? (
                          content.pdf ? <a href={content.pdf} target="_blank" rel="noopener noreferrer" className="text-primary underline">View PDF</a> : <span>No PDF</span>
                        ) : type === 'Steps' ? (
                          <div>
                            <div className="font-semibold mb-2">{content.title}</div>
                            <ul className="list-decimal pl-6 space-y-2">
                              {content.steps_table && content.steps_table.map((step: any, sidx: number) => (
                                <li key={sidx}>
                                  <div className="font-medium">{step.item_name}</div>
                                  <div className="text-muted-foreground text-sm">{step.item_content}</div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : type === 'Check List' ? (
                          <div>
                            <div className="font-semibold mb-2">{content.title}</div>
                            <ul className="space-y-2">
                              {content.check_list_items && content.check_list_items.map((item: any, idx: number) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <div className="mt-1 h-5 w-5 border-2 border-primary rounded-sm" />
                                  <div>
                                    <div className="font-medium">{item.item}</div>
                                    <div className="prose prose-sm text-muted-foreground" dangerouslySetInnerHTML={{ __html: item.content || "" }} />
                                  </div>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : type === 'Quiz' ? (
                          <div>Quiz block (preview coming soon)</div>
                        ) : type === 'Slide Content' ? (
                          <div>Slide block (preview coming soon)</div>
                        ) : (
                          <div className="border rounded p-2">Unsupported content type: {type}</div>
                        )}
                      </div>
                    )}
                  </div>
                </SortableItem>
              );
            })}
            <Button variant="outline" onClick={handleAddContent}>+ Add Content Block</Button>
          </div>
        </SortableContext>
      </DndContext>
      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        open={deleteIdx !== null}
        onClose={() => setDeleteIdx(null)}
        onConfirm={confirmDeleteContent}
      />
    </Card>
  );
};

export default ChapterEditor; 