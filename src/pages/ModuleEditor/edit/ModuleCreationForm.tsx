import  { useState } from "react";
import { useLocation } from "wouter";
import { useFrappeCreateDoc, useFrappeGetDocList } from "frappe-react-sdk";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import RichEditor from "@/components/RichEditor";
import { toast } from "sonner";
import { ArrowLeft, X } from "lucide-react";
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
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [order, setOrder] = useState<number | ''>(1);

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
    // Validate duration only if provided: must be between 1 and 99
    let durationNum: number | undefined = undefined;
    if (duration) {
      durationNum = parseInt(duration, 10);
      if (isNaN(durationNum) || durationNum < 1 || durationNum > 99) {
        toast.error("Duration must be a number between 1 and 99 days");
        return;
      }
    }

    try {
      const response = await createDoc("LMS Module", {
        name1: moduleName,
        description: description,
        duration: durationNum, // Optional: only set if provided
        order: typeof order === 'number' ? order : 1,
        status: "Draft",
        assignment_based: assignmentBased,
        department: assignmentBased === "Department" ? departmentSelected : "",
        created_by: user?.name, // Use user name for link field
        image: imageUrl,
      });

      if (response?.name) {
        toast.success("Module created successfully");
        setLocation(`/edit/${response.name}`);
      } else {
        console.error("Invalid response from server:", response);
        throw new Error("Invalid response from server - module name not found");
      }
    } catch (error) {
      toast.error("Failed to create module");
      console.error("Creation error:", error);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Create local preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    setImageFile(file);
    setUploading(true);
    try {
      const url = await uploadFileToFrappe(file);
      // Store only the relative path, not the full URL
      setImageUrl(url);
      toast.success("Image uploaded successfully");
    } catch (err) {
      toast.error("Failed to upload image");
      setImageFile(null);
      setImageUrl("");
      setImagePreview("");
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImageUrl("");
    setImagePreview("");
    // Reset the file input
    const fileInput = document.getElementById("image") as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
    toast.success("Image removed");
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow digits (0-9), remove any special characters
    const numericValue = value.replace(/[^0-9]/g, '');
    
    // Limit to maximum 2 digits
    if (numericValue.length <= 2) {
      setDuration(numericValue);
    }
    // If user tries to enter more than 2 digits, keep the first 2
    else if (numericValue.length > 2) {
      setDuration(numericValue.slice(0, 2));
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Create New Module</h1>
        <Button
          variant="outline"
          size="sm"
          className="hover:bg-accent hover:text-primary"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
      </div>
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
            type="text"
            inputMode="numeric"
            value={duration}
            onChange={handleDurationChange}
            placeholder="Enter duration in days (1-99)"
            maxLength={2}
            pattern="[0-9]{1,2}"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="order">Order</Label>
          <Input
            id="order"
            type="text"
            inputMode="numeric"
            value={order === '' ? '' : order}
            onChange={(e) => {
              const value = e.target.value;
              // Remove any non-digit characters (including dots and minus)
              const numericValue = value.replace(/[^0-9]/g, '');
              // Limit to maximum 2 digits
              const limitedValue = numericValue.slice(0, 2);
              if (limitedValue === '') {
                setOrder('');
              } else {
                // Store as number, but ensure it's between 1 and 99
                const numValue = parseInt(limitedValue, 10);
                if (!isNaN(numValue)) {
                  // If the number is 0 or would exceed 99, cap it at 99
                  if (numValue === 0) {
                    setOrder('');
                  } else if (numValue > 99) {
                    setOrder(99);
                  } else {
                    setOrder(numValue);
                  }
                } else {
                  setOrder('');
                }
              }
            }}
            onBlur={(e) => {
              // On blur, ensure we have a valid number between 1 and 99, default to 1 if empty
              const value = e.target.value.replace(/[^0-9]/g, '');
              if (value === '' || value === '0') {
                setOrder(1);
              } else {
                const numValue = parseInt(value, 10);
                if (isNaN(numValue) || numValue < 1) {
                  setOrder(1);
                } else if (numValue > 99) {
                  setOrder(99);
                } else {
                  setOrder(numValue);
                }
              }
            }}
            onKeyDown={(e) => {
              // Prevent minus key and dot from being entered (just block them, don't clear)
              if (e.key === '-' || e.key === '.') {
                e.preventDefault();
              }
            }}
            maxLength={2}
            placeholder="Enter order (1-99)"
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
          <Label>Module Image</Label>
          <Input
            id="image"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            disabled={uploading}
            className="cursor-pointer"
          />
          {uploading && <div className="text-sm text-muted-foreground">Uploading...</div>}
          {(imagePreview || imageUrl) && (
            <div 
              className="mt-2 relative inline-block"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onMouseDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <img 
                src={imagePreview || (imageUrl.startsWith('http') ? imageUrl : `${LMS_API_BASE_URL.replace(/\/$/, '')}${imageUrl}`)} 
                alt="Module preview" 
                className="max-h-48 max-w-full rounded border border-border object-contain select-none pointer-events-none" 
                draggable="false"
                onError={(e) => {
                  console.error('Failed to load module image:', imagePreview || imageUrl);
                  e.currentTarget.style.display = 'none';
                }}
              />
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-8 w-8"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleRemoveImage();
                }}
                disabled={uploading}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
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