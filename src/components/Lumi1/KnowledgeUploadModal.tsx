import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, X } from "lucide-react";
import { useFrappeGetDocList, useFrappePostCall } from "frappe-react-sdk";
import { toast } from "sonner";

export default function KnowledgeUploadModal({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const { data: departments } = useFrappeGetDocList("Department", {
    fields: ["name"],
    limit: 100
  });

  const { call: uploadKnowledge } = useFrappePostCall("novel_lms.lumi_backend.api.upload_knowledge");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files as FileList)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleDept = (deptName: string) => {
    setSelectedDepts(prev => 
      prev.includes(deptName) 
        ? prev.filter(d => d !== deptName)
        : [...prev, deptName]
    );
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }

    setIsUploading(true);
    try {
      const fileDataList = await Promise.all(files.map(async (f) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve({
            filename: f.name,
            content: e.target?.result
          });
          reader.readAsDataURL(f);
        });
      }));

      await uploadKnowledge({
        title,
        content,
        departments: JSON.stringify(selectedDepts),
        files: JSON.stringify(fileDataList)
      });

      toast.success("Knowledge uploaded successfully. Pending approval if applicable.");
      setOpen(false);
      setTitle("");
      setContent("");
      setSelectedDepts([]);
      setFiles([]);
    } catch (error) {
      console.error(error);
      toast.error("Failed to upload knowledge");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Knowledge</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input 
              id="title" 
              placeholder="E.g., Q3 Sales Pitch Deck" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Departments (Optional)</Label>
            <p className="text-xs text-muted-foreground mb-2">
              Select departments manually, or leave blank to let Lumi AI suggest them.
            </p>
            <div className="flex flex-wrap gap-2 p-3 border rounded-lg max-h-32 overflow-y-auto bg-muted/20">
              {departments?.map((dept: any) => (
                <div 
                  key={dept.name}
                  onClick={() => toggleDept(dept.name)}
                  className={`px-3 py-1 text-sm rounded-full cursor-pointer border transition-colors ${
                    selectedDepts.includes(dept.name) 
                      ? 'bg-primary text-primary-foreground border-primary' 
                      : 'bg-background hover:border-primary/50'
                  }`}
                >
                  {dept.name}
                </div>
              ))}
              {!departments && <span className="text-sm text-muted-foreground">Loading departments...</span>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Manual Text Content (Optional)</Label>
            <Textarea 
              id="content" 
              placeholder="Paste or type text content directly..." 
              className="min-h-[100px]"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>File Attachments</Label>
            <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center bg-muted/10">
              <Upload className="w-8 h-8 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground mb-4">
                Drag & drop files or click to browse.
              </p>
              <Input 
                type="file" 
                multiple 
                className="hidden" 
                id="file-upload" 
                onChange={handleFileChange}
              />
              <Button variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
                Select Files
              </Button>
            </div>
            
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-muted/30 rounded-md border text-sm">
                    <span className="truncate flex-1">{file.name}</span>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:text-red-700" onClick={() => removeFile(i)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isUploading}>
            {isUploading ? "Uploading..." : "Upload & Analyze"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
