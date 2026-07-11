import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useFrappeUpdateDoc, useFrappeGetDocList, useFrappePostCall } from "frappe-react-sdk";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { MultiSelect } from "@/components/ui/multi-select";

export default function KnowledgeEditModal({ item, children, onUpdate }: { item: any, children: React.ReactNode, onUpdate: () => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(item.title || "");
  const [content, setContent] = useState(item.content || "");
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(item.departments || []);
  
  const { data: departmentDocs } = useFrappeGetDocList("Department", { limit: 1000 });
  const departmentOptions = departmentDocs?.map((d: any) => ({ value: d.name, label: d.name })) || [];
  const { call: updateDepartments, loading: updatingDepts } = useFrappePostCall("novel_lms.lumi_backend.api.update_knowledge_departments");
  
  const { updateDoc, loading } = useFrappeUpdateDoc();

  const handleSave = async () => {
    try {
      await updateDoc("Lumi Knowledge Item", item.name, {
        title,
        content
      });
      
      // Update departments via custom API
      await updateDepartments({
        item_names: JSON.stringify([item.name]),
        departments: JSON.stringify(selectedDepartments)
      });
      
      toast.success("Knowledge Item updated successfully");
      setOpen(false);
      onUpdate();
    } catch (error) {
      toast.error("Failed to update Knowledge Item");
      console.error(error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (isOpen) {
        setTitle(item.title || "");
        setContent(item.content || "");
        setSelectedDepartments(item.departments || []);
      }
    }}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>View / Edit Knowledge Item</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input 
              id="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)} 
              placeholder="Topic title..."
            />
          </div>
          
          <div className="space-y-2">
            <Label>Departments</Label>
            <MultiSelect
              options={departmentOptions}
              selected={selectedDepartments}
              onSelect={setSelectedDepartments}
              placeholder="Select departments..."
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content">Knowledge Content</Label>
            <Textarea 
              id="content" 
              value={content} 
              onChange={(e) => setContent(e.target.value)} 
              placeholder="Enter the extracted knowledge text here..."
              className="min-h-[300px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading || updatingDepts}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading || updatingDepts}>
            {loading || updatingDepts ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
