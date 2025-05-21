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

export default function ModuleCreationForm() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const { createDoc } = useFrappeCreateDoc();
  const [moduleName, setModuleName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("");
  const [assignmentBased, setAssignmentBased] = useState("Everyone");
  const [department, setDepartment] = useState("");

  const { data: departments } = useFrappeGetDocList("Department", {
    fields: ["name", "department"],
  });

  const handleCreateModule = async () => {
    if (!moduleName.trim()) {
      toast.error("Module name is required");
      return;
    }

    try {
      const response = await createDoc("LMS Module", {
        name1: moduleName,
        description: description,
        duration: duration,
        status: "Draft",
        assignment_based: assignmentBased,
        department: assignmentBased === "Department" ? department : "",
        created_by: user?.email,
      });

      if (response?.name) {
        toast.success("Module created successfully");
        setLocation(`/test/edit/${response.name}`);
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      toast.error("Failed to create module");
      console.error("Creation error:", error);
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
            <Select value={department} onValueChange={setDepartment}>
              <SelectTrigger>
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments?.map((dept) => (
                  <SelectItem key={dept.name} value={dept.name}>
                    {dept.department}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

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