import * as React from "react";
import { useFrappeGetCall, useFrappeGetDocList, useFrappePostCall } from "frappe-react-sdk";
import { Card, CardHeader, CardTitle, CardDescription, CardAction, CardFooter } from "@/components/ui/card";
import { LearnersTable } from "@/pages/Learners/LearnersTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, CheckCircle, PauseCircle, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { UserDetailsDrawer } from "./components/LearnerDetailsDrawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { MultiSelect } from "@/components/ui/multi-select";

interface User {
  name: string;
  full_name: string;
  email: string;
  enabled: number;
  department?: string;
  departments?: string[];
  mobile_no?: string;
  creation?: string;
  last_login?: string;
  user_image?: string;
  roles?: string[];
}

interface ApiData {
  stats: {
    total: number;
    active: number;
    inactive: number;
    percentage_change: number;
  };
  users: User[];
}

// Helper function to convert data to CSV
function convertToCSV(data: User[]) {
  const headers = ["Name", "Email", "Status"];
  const rows = data.map(user => [
    user.full_name,
    user.email,
    user.enabled === 1 ? "Active" : "Inactive"
  ]);
  
  return [
    headers.join(","),
    ...rows.map(row => row.join(","))
  ].join("\n");
}

// Helper function to download CSV
function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Stats Cards Component
function StatsCards({ stats }: { stats: ApiData["stats"] }) {
  const percentageChange = stats.percentage_change ?? 0;
  const isPositive = percentageChange >= 0;
  const activePercent = stats.total > 0 ? ((stats.active / stats.total) * 100) : 0;
  const inactivePercent = stats.total > 0 ? ((stats.inactive / stats.total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total Learners */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Learners</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.total}
          </CardTitle>
          <CardAction>
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${isPositive ? 'border-green-300 text-green-700 bg-green-50' : 'border-red-300 text-red-700 bg-red-50'}`}> 
              {isPositive ? <TrendingUp className="w-4 h-4 text-green-500" /> : <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />} 
              {`${Math.abs(percentageChange).toFixed(1)}%`}
            </span>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">
            {isPositive ? '+' : '-'}{Math.abs(percentageChange)}% from last month
          </div>
        </CardFooter>
      </Card>
      {/* Active Learners */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Learners</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.active}
          </CardTitle>
          <CardAction>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border border-green-300 text-green-700 bg-green-50">
              <CheckCircle className="w-4 h-4 text-green-500" />
              {`${activePercent.toFixed(1)}%`}
            </span>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">
            {stats.active} of {stats.total} learners active
          </div>
        </CardFooter>
      </Card>
      {/* Inactive Learners */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Inactive Learners</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.inactive}
          </CardTitle>
          <CardAction>
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border border-blue-300 text-blue-700 bg-blue-50">
              <PauseCircle className="w-4 h-4 text-blue-400" />
              {`${inactivePercent.toFixed(1)}%`}
            </span>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">
            {stats.inactive} of {stats.total} learners inactive
          </div>
        </CardFooter>
      </Card>
      {/* Growth Rate */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Growth Rate</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {stats.percentage_change}%
          </CardTitle>
          <CardAction>
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${isPositive ? 'border-green-300 text-green-700 bg-green-50' : 'border-red-300 text-red-700 bg-red-50'}`}> 
              {isPositive ? <TrendingUp className="w-4 h-4 text-green-500" /> : <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />} 
              {isPositive ? '+' : '-'}{Math.abs(percentageChange)}%
            </span>
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="text-muted-foreground">Monthly growth rate</div>
        </CardFooter>
      </Card>
    </div>
  );
}

// Filters Component
function Filters({ 
  searchName, 
  searchEmail, 
  searchStatus, 
  departmentFilter,
  departmentOptions,
  onSearchNameChange, 
  onSearchEmailChange, 
  onSearchStatusChange,
  onDepartmentChange,
  onExport
}: {
  searchName: string;
  searchEmail: string;
  searchStatus: string;
  departmentFilter: string[];
  departmentOptions: { value: string; label: string }[];
  onSearchNameChange: (value: string) => void;
  onSearchEmailChange: (value: string) => void;
  onSearchStatusChange: (value: string) => void;
  onDepartmentChange: (value: string[]) => void;
  onExport: () => void;
}) {
  return (
    <div className="flex flex-col md:flex-row gap-4 mt-6 mb-4">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={searchName}
            onChange={(e) => onSearchNameChange(e.target.value)}
            className="w-full pl-8"
          />
        </div>
      </div>
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email..."
            value={searchEmail}
            onChange={(e) => onSearchEmailChange(e.target.value)}
            className="w-full pl-8"
          />
        </div>
      </div>
      <div className="w-full md:w-48">
        <Select value={searchStatus} onValueChange={onSearchStatusChange}>
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {/* Department Filter */}
      <div className="w-full md:w-48">
        <MultiSelect
          options={departmentOptions}
          selected={departmentFilter}
          onSelect={selected => {
            // If "All" is selected, clear all other selections
            if (selected.includes("__all__")) {
              onDepartmentChange([]);
            } else {
              // Remove "All" if present and set the rest
              onDepartmentChange(selected.filter(v => v !== "__all__"));
            }
          }}
          placeholder="Filter by departments"
          className="w-full md:w-48"
        />
      </div>
      <Button 
        variant="outline" 
        className="w-full md:w-auto"
        onClick={onExport}
      >
        <Download className="mr-2 h-4 w-4" />
        Export
      </Button>
    </div>
  );
}

export default function Learners() {
  const [searchName, setSearchName] = React.useState("");
  const [searchEmail, setSearchEmail] = React.useState("");
  const [searchStatus, setSearchStatus] = React.useState("all");
  const [selectedLearner, setSelectedLearner] = React.useState<User | null>(null);
  const [departmentFilter, setDepartmentFilter] = React.useState<string[]>([]);
  const [addOpen, setAddOpen] = React.useState(false);
  const [addLoading, setAddLoading] = React.useState(false);
  const [addError, setAddError] = React.useState<string | null>(null);
  const [addForm, setAddForm] = React.useState({
    first_name: '',
    last_name: '',
    email: '',
    departments: [] as string[],
    mobile_no: '',
    password: '',
    send_welcome_email: true
  });
  const [editOpen, setEditOpen] = React.useState(false);
  const [editLoading, setEditLoading] = React.useState(false);
  const [editError, setEditError] = React.useState<string | null>(null);
  const [editForm, setEditForm] = React.useState({
    first_name: '',
    last_name: '',
    email: '',
    mobile_no: '',
    password: '',
    enabled: 1,
    departments: [] as string[] // Multi-department selection
  });
  const [learnerToEdit, setLearnerToEdit] = React.useState<User | null>(null);

  const { call: addLearnerPost } = useFrappePostCall("addLMSUser");
  const { call: updateLearnerPost } = useFrappePostCall("updateLearner");
  const { data: analyticsData, error, isValidating, mutate } = useFrappeGetCall<{ message: ApiData }>("getLearnerAnalytics");
  const message = analyticsData?.message;
  const users = message?.users || [];
  const stats = message?.stats;
  // Log on every update for more accurate debugging
  React.useEffect(() => {
    console.log('Learner stats (effect):', stats);
    console.log('Learner users (effect):', users);
    if (stats && users && typeof stats.total === 'number' && stats.total !== users.length) {
      console.warn('Mismatch: stats.total does not match users.length', stats.total, users.length);
    }
  }, [stats, users]);

  // Fetch all departments for filter and selection (limit 150)
  const { data: allDepartmentsData } = useFrappeGetDocList("Department", { fields: ["name", "department"], limit: 150 });
  const allDepartmentOptions = allDepartmentsData || [];
  const departmentIdToName = React.useMemo(() => Object.fromEntries((allDepartmentOptions).map(dep => [dep.name, dep.department])), [allDepartmentOptions]);

  const departmentOptionsWithAll = [
    { value: "__all__", label: "All" },
    ...allDepartmentOptions.map(dep => ({ value: dep.name, label: dep.department || dep.name }))
  ];

  // Filter users based on search criteria
  const filteredUsers = users.filter((user: User) => {
    const nameMatch = user.full_name?.toLowerCase().includes(searchName.toLowerCase());
    const emailMatch = user.email?.toLowerCase().includes(searchEmail.toLowerCase());
    const statusMatch = searchStatus === "all" || 
      (searchStatus === "active" && user.enabled === 1) || 
      (searchStatus === "inactive" && user.enabled === 0);
    // Multi-department filter
    const userDepartments = (user.departments && user.departments.length > 0) ? user.departments : (user.department ? [user.department] : []);
    const departmentMatch = departmentFilter.length === 0 || departmentFilter.some(dep => userDepartments.includes(dep));
    return nameMatch && emailMatch && statusMatch && departmentMatch;
  });

  console.log("users22222=",users);
  console.log("filteredUsers22222=",filteredUsers)

  const handleExport = () => {
    try {
      const csv = convertToCSV(filteredUsers);
      const filename = `learners_export_${new Date().toISOString().split('T')[0]}.csv`;
      downloadCSV(csv, filename);
      toast.success("Export completed successfully");
    } catch (error) {
      toast.error("Failed to export data");
      console.error("Export error:", error);
    }
  };

  // Add Learner handler (placeholder)
  async function handleAddLearner(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    if (!addForm.first_name || !addForm.last_name || !addForm.email || !addForm.departments || addForm.departments.length === 0) {
      setAddError("Please fill all required fields and select at least one department.");
      return;
    }
    setAddLoading(true);
    try {
      const response = await addLearnerPost({
        email: addForm.email,
        full_name: `${addForm.first_name} ${addForm.last_name}`.trim(),
        first_name: addForm.first_name,
        last_name: addForm.last_name,
        mobile_no: addForm.mobile_no,
        departments: addForm.departments,
        password: addForm.password || undefined,
        send_welcome_email: addForm.send_welcome_email ? 1 : 0,
        role: "LMS Student"
      });
      // Check for backend error structure in response (for 200 OK with error)
      const msg = response?.message;
      if (msg && msg.success === false) {
        if (msg.error_type === "duplicate_email") {
          setAddError("A user with this email already exists.");
        } else if (msg.error_type === "duplicate_mobile") {
          setAddError("A user with this mobile number already exists.");
        } else if (msg.error) {
          setAddError(msg.error);
        } else {
          setAddError("Failed to add learner.");
        }
        setAddLoading(false);
        return;
      }
      setAddOpen(false);
      setAddForm({
        first_name: '',
        last_name: '',
        email: '',
        departments: [],
        mobile_no: '',
        password: '',
        send_welcome_email: true
      });
      toast.success("Learner added successfully");
      await mutate(); // Refresh the learners list
    } catch (err: any) {
      // Handle HTTP 409 Conflict errors
      const msg = err?.message;
      if (err?.httpStatus === 409 && msg) {
        if (msg.error_type === "duplicate_email") {
          setAddError("A user with this email already exists.");
        } else if (msg.error_type === "duplicate_mobile") {
          setAddError("A user with this mobile number already exists.");
        } else if (msg.error) {
          setAddError(msg.error);
        } else {
          setAddError("Failed to add learner.");
        }
      } else {
        setAddError("Failed to add learner.");
      }
    } finally {
      setAddLoading(false);
    }
  }

  // Edit Learner handler
  async function handleEditLearner(e: React.FormEvent) {
    e.preventDefault();
    setEditError(null);
    if (!editForm.first_name || !editForm.last_name || !editForm.email || !editForm.departments || editForm.departments.length === 0 || !learnerToEdit?.name) {
      setEditError("Please select at least one department.");
      return;
    }
    setEditLoading(true);
    try {
      // Update user information using the updateLearner API
      const updateData: any = {
        user_id: learnerToEdit.name,
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        email: editForm.email,
        mobile_no: editForm.mobile_no,
        enabled: editForm.enabled,
        departments: editForm.departments
      };

      // Add password if provided
      if (editForm.password) {
        updateData.password = editForm.password;
      }

      const response = await updateLearnerPost(updateData);
      
      // Check for backend error structure in response
      const msg = response?.message;
      if (msg && msg.success === false) {
        if (msg.error_type === "duplicate_email") {
          setEditError("A user with this email already exists.");
        } else if (msg.error_type === "duplicate_mobile") {
          setEditError("A user with this mobile number already exists.");
        } else if (msg.error_type === "user_not_found") {
          setEditError("User not found.");
        } else if (msg.error_type === "invalid_department") {
          setEditError("Invalid department selected.");
        } else if (msg.error) {
          setEditError(msg.error);
        } else {
          setEditError("Failed to update learner.");
        }
        setEditLoading(false);
        return;
      }

      setEditOpen(false);
      setEditForm({
        first_name: '',
        last_name: '',
        email: '',
        mobile_no: '',
        password: '',
        enabled: 1,
        departments: []
      });
      setLearnerToEdit(null);
      toast.success("Learner updated successfully");
      await mutate(); // Refresh the learners list
    } catch (err: any) {
      console.error("Edit learner error:", err);
      // Handle different error response formats
      if (err?.message && typeof err.message === 'object') {
        // If message is an object (API response), extract the error message
        const apiResponse = err.message;
        if (apiResponse.error) {
          setEditError(apiResponse.error);
        } else if (apiResponse.error_type) {
          setEditError(`Error: ${apiResponse.error_type}`);
        } else {
          setEditError("Failed to update learner.");
        }
      } else if (typeof err?.message === 'string') {
        setEditError(err.message);
      } else {
        setEditError("Failed to update learner.");
      }
    } finally {
      setEditLoading(false);
    }
  }

  // Handle view details action
  const handleViewDetails = (learner: User) => {
    setSelectedLearner(learner);
  };

  // Handle edit action
  const handleEdit = (learner: User) => {
    setLearnerToEdit(learner);
    // Parse full name into first and last name
    const nameParts = learner.full_name?.split(' ') || [];
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    setEditForm({
      first_name: firstName,
      last_name: lastName,
      email: learner.email || '',
      mobile_no: (learner as User).mobile_no || '',
      password: '',
      enabled: learner.enabled,
      departments: (learner as User).departments || [(learner as User).department || ''].filter(Boolean) // Convert single department to array
    });
    setEditOpen(true);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">Error loading learners: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Learners</h1>
        <Button onClick={() => setAddOpen(true)} variant="default">Add Learner</Button>
      </div>
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Learner</DialogTitle>
            <DialogDescription>Fill in the details to add a new learner. The user will be assigned the LMS Learner role and added to the selected department.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddLearner} className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block mb-1 font-medium">First Name<span className="text-red-500">*</span></label>
                <Input value={addForm.first_name} onChange={e => setAddForm(f => ({ ...f, first_name: e.target.value }))} required disabled={addLoading} />
              </div>
              <div className="flex-1">
                <label className="block mb-1 font-medium">Last Name<span className="text-red-500">*</span></label>
                <Input value={addForm.last_name} onChange={e => setAddForm(f => ({ ...f, last_name: e.target.value }))} required disabled={addLoading} />
              </div>
            </div>
            <div>
              <label className="block mb-1 font-medium">Email<span className="text-red-500">*</span></label>
              <Input type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} required disabled={addLoading} />
            </div>
            <div>
              <label className="block mb-1 font-medium">Departments<span className="text-red-500">*</span></label>
                             <MultiSelect
                 options={allDepartmentOptions.map(dep => ({ value: dep.name, label: dep.department || dep.name }))}
                 selected={addForm.departments}
                 onSelect={(selected) => setAddForm(f => ({ ...f, departments: selected }))}
                 placeholder="Select departments"
                 disabled={addLoading}
               />
              {addForm.departments && addForm.departments.length === 0 && (
                <div className="mt-2 text-xs text-destructive">
                  Please select at least one department.
                </div>
              )}
            </div>
            {addForm.departments && addForm.departments.length > 0 && (
              <div className="mt-2 text-xs text-muted-foreground">
                Selected: {addForm.departments.map(depId => departmentIdToName[depId] || depId).join(', ')}
              </div>
            )}
            <div>
              <label className="block mb-1 font-medium">Mobile Number</label>
              <Input value={addForm.mobile_no} onChange={e => setAddForm(f => ({ ...f, mobile_no: e.target.value }))} disabled={addLoading} />
            </div>
            <div>
              <label className="block mb-1 font-medium">Password</label>
              <Input type="password" value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} disabled={addLoading} placeholder="Leave blank to auto-generate" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="send_welcome_email" checked={addForm.send_welcome_email} onChange={e => setAddForm(f => ({ ...f, send_welcome_email: e.target.checked }))} disabled={addLoading} />
              <label htmlFor="send_welcome_email" className="font-medium">Send Welcome Email</label>
            </div>
            {addError && (
              <div className="flex items-center gap-2 p-3 mt-2 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
                <span>{addError}</span>
              </div>
            )}
            <DialogFooter>
              <Button type="submit" disabled={addLoading}>{addLoading ? "Adding..." : "Add Learner"}</Button>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={addLoading}>Cancel</Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Learner</DialogTitle>
            <DialogDescription>Edit the details of the selected learner.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditLearner} className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block mb-1 font-medium">First Name<span className="text-red-500">*</span></label>
                <Input value={editForm.first_name} onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))} required disabled={editLoading} />
              </div>
              <div className="flex-1">
                <label className="block mb-1 font-medium">Last Name<span className="text-red-500">*</span></label>
                <Input value={editForm.last_name} onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))} required disabled={editLoading} />
              </div>
            </div>
            <div>
              <label className="block mb-1 font-medium">Email<span className="text-red-500">*</span></label>
              <Input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} required disabled={editLoading} />
            </div>
            <div>
              <label className="block mb-1 font-medium">Departments<span className="text-red-500">*</span></label>
                             <MultiSelect
                 options={allDepartmentOptions.map(dep => ({ value: dep.name, label: dep.department || dep.name }))}
                 selected={editForm.departments}
                 onSelect={(selected) => setEditForm(f => ({ ...f, departments: selected }))}
                 placeholder="Select departments"
                 disabled={editLoading}
               />
              {editForm.departments && editForm.departments.length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Selected: {editForm.departments.map(depId => departmentIdToName[depId] || depId).join(', ')}
                </div>
              )}
            </div>
            <div>
              <label className="block mb-1 font-medium">Mobile Number</label>
              <Input value={editForm.mobile_no} onChange={e => setEditForm(f => ({ ...f, mobile_no: e.target.value }))} disabled={editLoading} />
            </div>
            <div>
              <label className="block mb-1 font-medium">Password</label>
              <Input type="password" value={editForm.password} onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))} disabled={editLoading} placeholder="Leave blank to keep existing" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="enabled" checked={editForm.enabled === 1} onChange={e => setEditForm(f => ({ ...f, enabled: e.target.checked ? 1 : 0 }))} disabled={editLoading} />
              <label htmlFor="enabled" className="font-medium">Enabled</label>
            </div>
            {editError && (
              <div className="flex items-center gap-2 p-3 mt-2 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" /></svg>
                <span>{editError}</span>
              </div>
            )}
            <DialogFooter>
              <Button type="submit" disabled={editLoading}>{editLoading ? "Saving..." : "Save Changes"}</Button>
              <DialogClose asChild>
                <Button type="button" variant="outline" disabled={editLoading}>Cancel</Button>
              </DialogClose>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      {/* Show a visible warning if stats.total !== users.length */}
      {stats && users && typeof stats.total === 'number' && stats.total !== users.length && (
        <div className="mb-4 p-3 rounded bg-yellow-100 text-yellow-800 border border-yellow-300">
          <strong>Warning:</strong> Learner stats total ({stats.total}) does not match number of users ({users.length}). This may indicate an API or backend data issue.
        </div>
      )}
      {stats && <StatsCards stats={stats} />}
      
      <Filters
        searchName={searchName}
        searchEmail={searchEmail}
        searchStatus={searchStatus}
        departmentFilter={departmentFilter}
        departmentOptions={departmentOptionsWithAll}
        onSearchNameChange={setSearchName}
        onSearchEmailChange={setSearchEmail}
        onSearchStatusChange={setSearchStatus}
        onDepartmentChange={setDepartmentFilter}
        onExport={handleExport}
      />

      <LearnersTable
        learners={filteredUsers}
        isLoading={isValidating}
        onEdit={handleEdit}
        onViewDetails={handleViewDetails}
      />

      <UserDetailsDrawer
        learner={selectedLearner}
        open={!!selectedLearner}
        onClose={() => setSelectedLearner(null)}
      />
    </div>
  );
}
