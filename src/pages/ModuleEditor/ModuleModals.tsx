import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import RichEditor from "@/components/RichEditor";

interface ModuleModalsProps {
  showDescModal: boolean;
  setShowDescModal: (open: boolean) => void;
  descContent: string;
  setDescContent: (val: string) => void;
  showLessonModal: boolean;
  setShowLessonModal: (open: boolean) => void;
  showChapterModal: boolean;
  setShowChapterModal: (open: boolean) => void;
  showContentModal: boolean;
  setShowContentModal: (open: boolean) => void;
  showBackConfirm: boolean;
  setShowBackConfirm: (open: boolean) => void;
  confirmBack: () => void;
  deleteTarget: { type: string; idx: number } | null;
  handleDelete: () => void;
  setDeleteTarget: (target: { type: string; idx: number } | null) => void;
}

const ModuleModals: React.FC<ModuleModalsProps> = ({
  showDescModal,
  setShowDescModal,
  descContent,
  setDescContent,
  showLessonModal,
  setShowLessonModal,
  showChapterModal,
  setShowChapterModal,
  showContentModal,
  setShowContentModal,
  showBackConfirm,
  setShowBackConfirm,
  confirmBack,
  deleteTarget,
  handleDelete,
  setDeleteTarget,
}) => (
  <>
    {/* Module Description Modal */}
    <Dialog open={showDescModal} onOpenChange={setShowDescModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Module Description</DialogTitle>
        </DialogHeader>
        <RichEditor
          content={descContent}
          onChange={setDescContent}
        />
        <DialogFooter>
          <Button onClick={() => setShowDescModal(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    {/* Lesson Modal */}
    <Dialog open={showLessonModal} onOpenChange={setShowLessonModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Lesson Modal (placeholder)</DialogTitle>
        </DialogHeader>
        <Button onClick={() => setShowLessonModal(false)}>Close</Button>
      </DialogContent>
    </Dialog>
    {/* Chapter Modal */}
    <Dialog open={showChapterModal} onOpenChange={setShowChapterModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Chapter Modal (placeholder)</DialogTitle>
        </DialogHeader>
        <Button onClick={() => setShowChapterModal(false)}>Close</Button>
      </DialogContent>
    </Dialog>
    {/* Content Modal */}
    <Dialog open={showContentModal} onOpenChange={setShowContentModal}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Content Block Modal (placeholder)</DialogTitle>
        </DialogHeader>
        <Button onClick={() => setShowContentModal(false)}>Close</Button>
      </DialogContent>
    </Dialog>
    {/* Back confirmation dialog */}
    <Dialog open={showBackConfirm} onOpenChange={setShowBackConfirm}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Unsaved Changes</DialogTitle>
          <DialogDescription>
            You have unsaved changes. Are you sure you want to leave? Unsaved changes will be lost.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="destructive" onClick={confirmBack}>Leave Anyway</Button>
          <Button onClick={() => setShowBackConfirm(false)}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    {/* Delete confirmation dialog */}
    <Dialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure you want to delete this {deleteTarget?.type}?</DialogTitle>
        </DialogHeader>
        <DialogFooter>
          <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          <Button onClick={() => setDeleteTarget(null)}>Cancel</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </>
);

export default ModuleModals; 