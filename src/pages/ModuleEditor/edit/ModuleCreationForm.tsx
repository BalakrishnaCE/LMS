import  { useState } from "react";
import { useLocation } from "wouter";
import { useFrappeCreateDoc, useFrappeGetDocList } from "frappe-react-sdk";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import RichEditor from "@/components/RichEditor";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUser } from "@/hooks/use-user";
import { uploadFileToFrappe } from "@/lib/uploadFileToFrappe";
import { LMS_API_BASE_URL } from "@/config/routes";
// Removed MultiSelect import

export default function ModuleCreationForm() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { createDoc } = useFrappeCreateDoc();
  const [moduleName, setModuleName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [assignmentBased, setAssignmentBased] = useState("Everyone");
  const [departmentSelected, setDepartmentSelected] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [order, setOrder] = useState(1);

  const { data: departments } = useFrappeGetDocList("Department", {
    fields: ["name", "department"],
    limit: 100,
  });

  const departmentOptions = (departments || []).map((dept) => ({
    value: dept.name,
    label: dept.department,
  }));

  const handleCreateModule = async () => {
    if (!moduleName.trim()) {
      toast.error("Module name is required");
      return;
    }
    if (assignmentBased === "Department" && !departmentSelected) {
      toast.error("Please select a department");
      return;
    }

    try {
      const response = await createDoc("LMS Module", {
        name1: moduleName,
        description: description,
        duration: duration,
        order: order,
        status: "Draft",
        assignment_based: assignmentBased,
        department: assignmentBased === "Department" && departmentSelected
          ? [{ department: departmentSelected }]
          : [],
        created_by: user?.email,
        image: imageUrl,
      });

      if (response?.name) {
        toast.success("Module created successfully");
        setLocation(`/edit/${response.name}`);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      toast.error("Failed to create module");
      console.error("Creation error:", error);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setUploading(true);
    try {
      const url = await uploadFileToFrappe(file);
      setImageUrl(`${LMS_API_BASE_URL}${url}`);
      toast.success("Image uploaded successfully");
    } catch (err) {
      toast.error("Failed to upload image");
      setImageFile(null);
      setImageUrl("");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Create New Module</h1>
      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="moduleName">Module Name</Label>
          <Input
            id="moduleName"
            value={moduleName}
            onChange={(e) => setModuleName(e.target.value)}
            placeholder="Enter module name"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <RichEditor
            content={description}
            onChange={setDescription}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="duration">Duration (in days)</Label>
          <Input
            id="duration"
            type="number"
            value={duration}
            onChange={(e) => setDuration(e.target.value)}
            placeholder="Enter duration in days"
            min={1}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="order">Order</Label>
          <Input
            id="order"
            type="number"
            value={order}
            onChange={(e) => setOrder(Number(e.target.value))}
            placeholder="Enter module order"
            min={1}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="assignmentBased">Assignment Based</Label>
          <Select value={assignmentBased} onValueChange={setAssignmentBased}>
            <SelectTrigger>
              <SelectValue placeholder="Select assignment type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Department">Department</SelectItem>
              <SelectItem value="Everyone">Everyone</SelectItem>
              <SelectItem value="Manual">Manual</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {assignmentBased === "Department" && (
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select
              value={departmentSelected}
              onValueChange={setDepartmentSelected}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departmentOptions.map(opt => (
                  <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="image">Module Image</Label>
          <Input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={uploading}
          />
          {uploading && <div className="text-sm text-muted-foreground">Uploading...</div>}
          {imageUrl && (
            <img src={imageUrl} alt="Module" className="mt-2 max-h-32 rounded" />
          )}
        </div>

        <Button
          onClick={handleCreateModule}
          disabled={!moduleName}
          className="w-full"
        >
          Create Module
        </Button>
      </div>
    </div>
  );
} 