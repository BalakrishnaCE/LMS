import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import RichEditor from "@/components/RichEditor";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

// Editor modals for each content type
function TextContentModal({ open, onClose, content, onSave }: any) {
  const [value, setValue] = useState(content.body || "");
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className=" h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Text Content</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto w-full h-full">
          <RichEditor content={value} onChange={setValue} />
        </div>
        <DialogFooter className="mt-4">
          <Button onClick={() => onSave({ ...content, body: value })}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImageContentModal({ open, onClose, content, onSave }: any) {
  // TODO: Implement image editor
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full">
        <DialogHeader>
          <DialogTitle>Edit Image Content</DialogTitle>
        </DialogHeader>
        <div>Image editor coming soon...</div>
        <DialogFooter>
          <Button onClick={() => onSave(content)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function VideoContentModal({ open, onClose, content, onSave }: any) {
  // TODO: Implement video editor
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full">
        <DialogHeader>
          <DialogTitle>Edit Video Content</DialogTitle>
        </DialogHeader>
        <div>Video editor coming soon...</div>
        <DialogFooter>
          <Button onClick={() => onSave(content)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PDFContentModal({ open, onClose, content, onSave }: any) {
  // TODO: Implement PDF editor
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full">
        <DialogHeader>
          <DialogTitle>Edit PDF Content</DialogTitle>
        </DialogHeader>
        <div>PDF editor coming soon...</div>
        <DialogFooter>
          <Button onClick={() => onSave(content)}>Save</Button>
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
}

const ChapterEditor: React.FC<ChapterEditorProps> = ({ chapter }) => {
  const [modal, setModal] = useState<{ idx: number; type: string } | null>(null);
  const [editingContent, setEditingContent] = useState<any>(null);
  const [deleteIdx, setDeleteIdx] = useState<number | null>(null);
  const [localContents, setLocalContents] = useState<any[]>(() =>
    (chapter.contents || []).sort((a: { order: number }, b: { order: number }) => a.order - b.order)
  );

  // DnD-kit setup
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // Update localContents if chapter.contents changes
  React.useEffect(() => {
    setLocalContents((chapter.contents || []).sort((a: { order: number }, b: { order: number }) => a.order - b.order));
  }, [chapter.contents]);

  const handleContentChange = (idx: number, newContent: any) => {
    setModal(null);
    setEditingContent(null);
    // Update local state
    setLocalContents(prev => prev.map((c, i) => (i === idx ? newContent : c)));
    console.log("Update content", idx, newContent);
  };
  const handleAddContent = () => {
    console.log("Add content");
  };
  const handleDeleteContent = (idx: number) => {
    setDeleteIdx(idx);
  };
  const confirmDeleteContent = () => {
    if (deleteIdx !== null) {
      setLocalContents(prev => prev.filter((_, i) => i !== deleteIdx));
      console.log("Delete content", deleteIdx);
      setDeleteIdx(null);
    }
  };
  const handleReorderContent = (fromIdx: number, toIdx: number) => {
    setLocalContents(prev => arrayMove(prev, fromIdx, toIdx));
    console.log("Reorder content", fromIdx, toIdx);
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
      <h2 className="text-xl font-bold mb-4">{chapter.title}</h2>
      <div className="prose prose-sm mb-4 text-muted-foreground" dangerouslySetInnerHTML={{ __html: chapter.description || '' }} />
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={localContents.map((c, idx) => c.content_reference || c.id || c._id || c.order || idx)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {localContents.map((content: any, idx: number) => {
              const type = content.type || content.content_type;
              const id = content.content_reference || content.id || content._id || content.order || idx;
              return (
                <SortableItem id={id.toString()} key={id}>
                  <div className="relative border rounded p-4 bg-muted/50">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold capitalize">{type.replace(/_/g, ' ')}</span>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" onClick={() => openEditModal(idx, type, content)}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDeleteContent(idx)}>Delete</Button>
                      </div>
                    </div>
                    {/* Preview for each content type */}
                    {type === "text" || type === "Text Content" ? (
                      <div className="prose prose-sm" dangerouslySetInnerHTML={{ __html: content.body || "" }} />
                    ) : type === "Image Content" ? (
                      <img src={content.attach || content.url} alt="Image" className="max-w-xs rounded" />
                    ) : type === "Video Content" ? (
                      <video src={content.video || content.url} controls className="max-w-xs rounded" />
                    ) : type === "PDF" ? (
                      <a href={content.pdf || content.url} target="_blank" rel="noopener noreferrer" className="text-primary underline">View PDF</a>
                    ) : type === "Quiz" ? (
                      <div>Quiz block (preview coming soon)</div>
                    ) : type === "Slide Content" ? (
                      <div>Slide block (preview coming soon)</div>
                    ) : (
                      <div className="border rounded p-2">Unsupported content type: {type}</div>
                    )}
                  </div>
                </SortableItem>
              );
            })}
            <Button variant="outline" onClick={handleAddContent}>+ Add Content Block</Button>
          </div>
        </SortableContext>
      </DndContext>
      {/* Modals for editing content */}
      {modal && editingContent && modal.type === "text" && (
        <TextContentModal
          open={true}
          onClose={closeModal}
          content={editingContent}
          onSave={(val: any) => handleContentChange(modal.idx, val)}
        />
      )}
      {modal && editingContent && modal.type === "Text Content" && (
        <TextContentModal
          open={true}
          onClose={closeModal}
          content={editingContent}
          onSave={(val: any) => handleContentChange(modal.idx, val)}
        />
      )}
      {modal && editingContent && modal.type === "Image Content" && (
        <ImageContentModal
          open={true}
          onClose={closeModal}
          content={editingContent}
          onSave={(val: any) => handleContentChange(modal.idx, val)}
        />
      )}
      {modal && editingContent && modal.type === "Video Content" && (
        <VideoContentModal
          open={true}
          onClose={closeModal}
          content={editingContent}
          onSave={(val: any) => handleContentChange(modal.idx, val)}
        />
      )}
      {modal && editingContent && modal.type === "PDF" && (
        <PDFContentModal
          open={true}
          onClose={closeModal}
          content={editingContent}
          onSave={(val: any) => handleContentChange(modal.idx, val)}
        />
      )}
      {modal && editingContent && modal.type === "Quiz" && (
        <QuizContentModal
          open={true}
          onClose={closeModal}
          content={editingContent}
          onSave={(val: any) => handleContentChange(modal.idx, val)}
        />
      )}
      {modal && editingContent && modal.type === "Slide Content" && (
        <SlideContentModal
          open={true}
          onClose={closeModal}
          content={editingContent}
          onSave={(val: any) => handleContentChange(modal.idx, val)}
        />
      )}
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