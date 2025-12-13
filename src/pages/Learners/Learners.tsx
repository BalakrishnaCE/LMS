import * as React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LearnersTable } from "@/pages/Learners/LearnersTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Download, Eye, EyeOff, X } from "lucide-react";
import { toast } from "sonner";
import { UserDetailsDrawer } from "./components/LearnerDetailsDrawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { MultiSelect } from "@/components/ui/multi-select";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { useAPI } from "@/lib/api";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import Lottie from 'lottie-react';
import loadingAnimation from '@/assets/Loading.json';
import { useEffect, useRef, useState } from "react";

interface User {
  name: string;
  full_name: string;
  email: string;
  enabled: number;
  department?: string;
  department_id?: string;
  departments?: string[];
  department_ids?: string[];
  mobile_no?: string;
  creation?: string;
  last_login?: string;
  user_image?: string;
  roles?: string[];
  role?: string;
  // Add fields from learner_analytics
  learner_name?: string;
  modules_enrolled?: number;
  modules_completed?: number;
  completion_rate?: number;
  avg_progress?: number;
  avg_score?: number;
  total_time_spent?: number;
  achievements_count?: number;
  last_activity?: string;
  progress_trackers?: any[];
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
  const headers = [
    "Name", 
    "Email", 
    "Status", 
    "Department", 
    "Mobile No", 
    "Modules Enrolled", 
    "Modules Completed", 
    "Completion Rate (%)", 
    "Avg Progress (%)", 
    "Avg Score (%)", 
    "Total Time Spent (min)", 
    "Achievements Count", 
    "Last Activity"
  ];
  const rows = data.map(user => [
    user.full_name,
    user.email,
    user.enabled === 1 ? "Active" : "Inactive",
    user.department || "N/A",
    user.mobile_no || "N/A",
    user.modules_enrolled || 0,
    user.modules_completed || 0,
    user.completion_rate || 0,
    user.avg_progress || 0,
    user.avg_score || 0,
    user.total_time_spent || 0,
    user.achievements_count || 0,
    user.last_activity ? new Date(user.last_activity).toLocaleDateString() : "N/A"
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
  const { total, active, inactive } = stats;

  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const [hoveredSlice, setHoveredSlice] = useState<{ name: string; value: number } | null>(null);

  const wrapperRef = useRef<HTMLDivElement | null>(null);

  const [colors, setColors] = useState({
    primary: "#0ea5e9",
    published: "#22c55e",
    draft: "#9ca3af",
  });

  useEffect(() => {
    setColors({
      primary: (getComputedStyle(document.documentElement).getPropertyValue("--primary") || "#0ea5e9").trim(),
      published: (getComputedStyle(document.documentElement).getPropertyValue("--accent") || "#22c55e").trim(),
      draft: "#9ca3af",
    });
  }, []);

  const activePercent = total > 0 ? (active / total) * 100 : 0;
  const inactivePercent = total > 0 ? (inactive / total) * 100 : 0;

  const pieData = [
    { name: "Total Learners", value: total, percentage: 100, fill: colors.primary },
    { name: "Active Learners", value: active, percentage: activePercent, fill: colors.published },
    { name: "Inactive Learners", value: inactive, percentage: inactivePercent, fill: colors.draft },
  ];

  // mouse move: compute local pos, hit-test exact SVG element under pointer
  const onWrapperMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = wrapperRef.current;
    if (!el) return;
    const bounds = el.getBoundingClientRect();
    const mouseX = e.clientX - bounds.left;
    const mouseY = e.clientY - bounds.top;

    // prefer tooltip below cursor with a small offset, but flip if near bottom
    const OFFSET = 16;
    const EST_TOOLTIP_H = 56; // estimate
    let tooltipY = mouseY + OFFSET;
    if (mouseY + OFFSET + EST_TOOLTIP_H > bounds.height) {
      tooltipY = mouseY - OFFSET - EST_TOOLTIP_H; // flip above if would overflow
    }

    // keep horizontal centered on mouse
    const tooltipX = mouseX;

    setCursorPos({ x: tooltipX, y: tooltipY });

    // hit-test real element under cursor (client coordinates)
    const target = document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null;
    const sliceEl = target?.closest("[data-pie-index]") as HTMLElement | null;

    if (sliceEl && sliceEl.dataset && typeof sliceEl.dataset.pieIndex !== "undefined") {
      const idx = Number(sliceEl.dataset.pieIndex);
      if (!Number.isNaN(idx) && pieData[idx]) {
        setHoveredSlice({ name: pieData[idx].name, value: pieData[idx].value });
        return;
      }
    }

    // nothing under pointer (hole or outside) -> hide
    setHoveredSlice(null);
  };

  const onWrapperMouseLeave = () => {
    setCursorPos(null);
    setHoveredSlice(null);
  };

  const TooltipDiv = ({ top, left, slice }: { top: number; left: number; slice: { name: string; value: number } }) => (
    <div
      className="absolute bg-card border border-border rounded-lg p-3 shadow-lg pointer-events-none"
      style={{
        top,
        left,
        transform: "translate(-50%, 0)", // center horizontally; vertical already chosen in onMouseMove
        whiteSpace: "nowrap",
        zIndex: 50,
      }}
    >
      <p className="font-medium text-card-foreground">{slice.name}</p>
      <p className="text-sm text-muted-foreground">
        Count: <span className="font-semibold">{slice.value}</span>
      </p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      {/* Left Card */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-card-foreground">Learner Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
            <div>
              <h3 className="text-sm font-medium">Total Learners</h3>
              <p className="text-2xl font-bold" style={{ color: colors.primary }}>{total}</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
            <div>
              <h3 className="text-sm font-medium">Active Learners</h3>
              <p className="text-2xl font-bold" style={{ color: colors.published }}>{active}</p>
            </div>
          </div>
          <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30">
            <div>
              <h3 className="text-sm font-medium">Inactive Learners</h3>
              <p className="text-2xl font-bold" style={{ color: colors.draft }}>{inactive}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Right Card - Pie Chart */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-card-foreground">Learner Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div
            ref={wrapperRef}
            className="h-60 w-full relative"
            onMouseMove={onWrapperMouseMove}
            onMouseLeave={onWrapperMouseLeave}
          >
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  innerRadius={40}
                  paddingAngle={8}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      data-pie-index={index}
                      fill={entry.fill}
                      stroke={entry.fill}
                      strokeWidth={2}
                      onMouseEnter={() => setHoveredSlice({ name: entry.name, value: entry.value })}
                    />
                  ))}
                </Pie>
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value, entry: any) => (
                    <span style={{ color: entry.payload.fill }}>
                      {value} ({entry.payload.value})
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
            {cursorPos && hoveredSlice && (
              <TooltipDiv top={cursorPos.y} left={cursorPos.x} slice={hoveredSlice} />
            )}
          </div>
        </CardContent>
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
  onClearNameSearch,
  onClearEmailSearch,
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
  onClearNameSearch: () => void;
  onClearEmailSearch: () => void;
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
            className="w-full pl-8 pr-10 border-2 border-border/50 focus:border-primary"
          />
          {searchName && (
            <button
              onClick={onClearNameSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by email..."
            value={searchEmail}
            onChange={(e) => onSearchEmailChange(e.target.value)}
            className="w-full pl-8 pr-10 border-2 border-border/50 focus:border-primary"
          />
          {searchEmail && (
            <button
              onClick={onClearEmailSearch}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <div className="w-full md:w-48">
        <Select value={searchStatus} onValueChange={onSearchStatusChange}>
          <SelectTrigger className="border-2 border-border/50 focus:border-primary">
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
          onSelect={onDepartmentChange}
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

  // Clear search functions
  const handleClearNameSearch = () => {
    setSearchName("");
  };

  const handleClearEmailSearch = () => {
    setSearchEmail("");
  };
  const [searchStatus, setSearchStatus] = React.useState("all");
  const [selectedLearner, setSelectedLearner] = React.useState<User | null>(null);
  const [departmentFilter, setDepartmentFilter] = React.useState<string[]>([]);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage] = React.useState(20);
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
    send_welcome_email: false
  });
  const [showAddPassword, setShowAddPassword] = React.useState(false);
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
  const [showEditPassword, setShowEditPassword] = React.useState(false);
  const [learnerToEdit, setLearnerToEdit] = React.useState<User | null>(null);

  const api = useAPI();
  const [analyticsData, setAnalyticsData] = React.useState<{ message: any } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isValidating, setIsValidating] = React.useState(false);

  // Fetch learner data from departments API
  const fetchLearnerData = React.useCallback(async () => {
    setIsValidating(true);
    setError(null);
    try {
      
      
      const response = await api.getLearnersData();
      
      
      if (response.message) {
        
      }
      
      setAnalyticsData(response);
    } catch (err: any) {
      console.error("=== API ERROR ===");
      console.error("Error details:", err);
      console.error("Error message:", err.message);
      console.error("Error stack:", err.stack);
      setError(err.message || "Failed to fetch learner data");
    } finally {
      setIsValidating(false);
    }
  }, [api]);

  React.useEffect(() => {
    fetchLearnerData();
  }, [fetchLearnerData]);

  const mutate = fetchLearnerData;
  const message = analyticsData?.message;
  
  // Get departments from the learners data API response
  const [allDepartmentsData, setAllDepartmentsData] = React.useState<any[]>([]);
  const [userDepartmentMapping, setUserDepartmentMapping] = React.useState<Record<string, any>>({});
  const [departmentDataLoaded, setDepartmentDataLoaded] = React.useState(false);
  
  React.useEffect(() => {
    if (message?.departments) {
      setAllDepartmentsData(message.departments);
      setDepartmentDataLoaded(true);
    }
  }, [message?.departments]);

  // Create fallback department mapping when users data is available
  React.useEffect(() => {
    if (message?.users && Object.keys(userDepartmentMapping).length === 0) {
      const fallbackMapping: Record<string, any> = {};
      message.users.forEach((user: any) => {
        if (user.department) {
          const userKey = user.email || user.name;
          if (!fallbackMapping[userKey]) {
            fallbackMapping[userKey] = {
              departments: [],
              department_ids: []
            };
          }
          fallbackMapping[userKey].departments.push(user.department);
          fallbackMapping[userKey].department_ids.push(""); // No ID available
        }
      });
      setUserDepartmentMapping(fallbackMapping);
    }
  }, [message?.users]); // Removed userDepartmentMapping from dependencies to prevent infinite loop
  
  // Transform LearnersData to expected format
  const transformedData = React.useMemo(() => {
    
    
    if (!message) {
      
      return { users: [], stats: null };
    }
    
    // Get users data from the new departments API
    const users = message.users || [];
    const learnerStats = message.learner_analytics || [];
    const stats = message.users_stats || {};
    
    
    
    // Debug: Log if no users found
    if (users.length === 0) {
      
    } else {
    
    }
    
    // Transform users to match frontend expectations
    const mergedUsers = users.map((user: any) => ({
      name: user.name || "",
      full_name: user.full_name || "",
      email: user.email || "",
      enabled: user.enabled || 0,
      department: user.department || "",
      department_id: user.department_id || "",
      departments: user.departments || [],
      department_ids: user.department_ids || [],
      mobile_no: user.mobile_no || "",
      creation: user.creation || "",
      last_login: user.last_login || "",
      user_image: user.user_image || "",
      // Convert single role to roles array for frontend compatibility
      roles: user.role ? [user.role] : [],
      role: user.role || "",
      // Learner analytics fields (already merged by the API)
      learner_name: user.learner_name || user.full_name || "",
      modules_enrolled: user.modules_enrolled || 0,
      modules_completed: user.modules_completed || 0,
      completion_rate: user.completion_rate || 0,
      avg_progress: user.avg_progress || 0,
      avg_score: user.avg_score || 0,
      total_time_spent: user.total_time_spent || 0,
      achievements_count: user.achievements_count || 0,
      last_activity: user.last_activity || user.last_login || "",
      progress_trackers: user.progress_trackers || []
    }));
    
    // Use stats from the API or calculate from merged users
    const finalStats = stats.total !== undefined ? stats : {
      total: mergedUsers.length,
      active: mergedUsers.filter((user: User) => user.enabled === 1).length,
      inactive: mergedUsers.filter((user: User) => user.enabled === 0).length,
      percentage_change: 0
    };
    
    // console.log("=== FINAL TRANSFORMED DATA ===");
    // console.log("Merged users:", mergedUsers);
    // console.log("Merged users length:", mergedUsers.length);
    // console.log("Final stats:", finalStats);
    
    const result = {
      users: mergedUsers,
      stats: finalStats
    };
    
    // console.log("=== FINAL RESULT ===");
    // console.log("Result:", result);
    
    return result;
  }, [message?.users, message?.learner_analytics, message?.users_stats, userDepartmentMapping]);

  const users = transformedData.users;
  const stats = transformedData.stats;
  
  
  
  const allDepartmentOptions = allDepartmentsData || [];
  const departmentIdToName = React.useMemo(() => Object.fromEntries((allDepartmentOptions).map((dep: any) => [dep.name, dep.department])), [allDepartmentOptions]);
  const departmentNameToId = React.useMemo(() => Object.fromEntries((allDepartmentOptions).map((dep: any) => [dep.department, dep.name])), [allDepartmentOptions]);

  const departmentOptions = allDepartmentOptions
    .map((dep: any) => ({ value: dep.name, label: dep.department || dep.name }))
    .sort((a, b) => a.label.localeCompare(b.label)); // Sort alphabetically by department name
  // Filter users based on search criteria with improved logic
  const filteredUsers = React.useMemo(() => {
    if (!users || users.length === 0) return [];
    
    return users.filter((user: User) => {
      // Handle null/undefined values safely
      const fullName = user.full_name || '';
      const email = user.email || '';
      const userDepartments = (user.departments && user.departments.length > 0) 
        ? user.departments 
        : (user.department ? [user.department] : []);
      
      // Name filter - case insensitive
      const nameMatch = searchName === '' || 
        fullName.toLowerCase().includes(searchName.toLowerCase());
      
      // Email filter - case insensitive
      const emailMatch = searchEmail === '' || 
        email.toLowerCase().includes(searchEmail.toLowerCase());
      
      // Status filter
      const statusMatch = searchStatus === "all" || 
        (searchStatus === "active" && user.enabled === 1) || 
        (searchStatus === "inactive" && user.enabled === 0);
      
      // Department filter - check if any selected department matches user's departments
      // Also check against department names (not just IDs)
      const departmentMatch = departmentFilter.length === 0 || 
        departmentFilter.some(depId => {
          const depName = departmentIdToName[depId] || depId;
          return userDepartments.includes(depId) || userDepartments.includes(depName);
        });
      
      return nameMatch && emailMatch && statusMatch && departmentMatch;
    });
  }, [users, searchName, searchEmail, searchStatus, departmentFilter, departmentIdToName]);

  // Pagination logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Reset to first page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchName, searchEmail, searchStatus, departmentFilter]);

  // Performance logging removed
  // Performance logging removed

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

  // Add Learner handler
  async function handleAddLearner(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    if (!addForm.first_name || !addForm.email || !addForm.departments || addForm.departments.length === 0) {
      setAddError("Please fill all required fields and select at least one department.");
      return;
    }
    setAddLoading(true);
    try {
      const response = await api.addLearner({
        email: addForm.email,
        full_name: `${addForm.first_name} ${addForm.last_name}`.trim(),
        first_name: addForm.first_name,
        last_name: addForm.last_name,
        mobile_no: addForm.mobile_no,
        departments: addForm.departments,
        password: addForm.password || undefined,
        // Backend forcibly disables welcome email; keep explicit false for clarity
        send_welcome_email: false
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
        send_welcome_email: false
      });
      setShowAddPassword(false);
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
    if (!editForm.first_name || !editForm.email || !editForm.departments || editForm.departments.length === 0 || !learnerToEdit?.name) {
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
        enabled: editForm.enabled === 1,
        departments: editForm.departments
      };

      // Add password if provided
      if (editForm.password) {
        updateData.password = editForm.password;
      }

      const response = await api.updateLearner(updateData);
      
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
      setShowEditPassword(false);
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
    
    // Convert department names to department IDs for pre-selection
    const getDepartmentIds = (learner: User) => {
      const departments = learner.departments || [];
      const singleDepartment = learner.department ? [learner.department] : [];
      const allDepartmentNames = [...departments, ...singleDepartment].filter(Boolean);
      
      // Convert department names to IDs
      const departmentIds = allDepartmentNames
        .map(deptName => departmentNameToId[deptName] || deptName) // Use ID if mapping exists, otherwise use as-is
        .filter(Boolean);
      
      return departmentIds;
    };
    
    setEditForm({
      first_name: firstName,
      last_name: lastName,
      email: learner.email || '',
      mobile_no: (learner as User).mobile_no || '',
      password: '',
      enabled: learner.enabled,
      departments: getDepartmentIds(learner) // Pre-select current departments using IDs
    });
    setEditOpen(true);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">Error loading learners: {error}</p>
      </div>
    );
  }

  // Show loading state while data is being fetched
  if (isValidating || !departmentDataLoaded) {
    return (
      <div className="flex items-center justify-center h-full min-h-[400px]">
        <div className="text-center">
          <Lottie animationData={loadingAnimation} loop style={{ width: 120, height: 120 }} />
          <p className="text-muted-foreground mt-4">Loading learners data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Learners</h1>
        <div className="flex gap-2">
          <Button onClick={() => setAddOpen(true)} variant="default">Add Learner</Button>
        </div>
      </div>
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Learner</DialogTitle>
            <DialogDescription>Fill in the details to add a new learner. The user will be assigned the LMS Learner role and added to the selected department.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddLearner} className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block mb-1 font-medium">First Name<span className="text-red-500">*</span></label>
                <Input value={addForm.first_name} onChange={e => setAddForm(f => ({ ...f, first_name: e.target.value }))} required disabled={addLoading} className="border-2 border-border/50 focus:border-primary" />
              </div>
              <div className="flex-1">
                <label className="block mb-1 font-medium">Last Name<span className="text-red-500">*</span></label>
                <Input value={addForm.last_name} onChange={e => setAddForm(f => ({ ...f, last_name: e.target.value }))}  disabled={addLoading} className="border-2 border-border/50 focus:border-primary" />
              </div>
            </div>
            <div>
              <label className="block mb-1 font-medium">Email<span className="text-red-500">*</span></label>
              <Input type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} required disabled={addLoading} className="border-2 border-border/50 focus:border-primary" />
            </div>
            <div>
              <label className="block mb-1 font-medium">Departments<span className="text-red-500">*</span></label>
              <MultiSelect
                options={allDepartmentOptions.map((dep: any) => ({ value: dep.name, label: dep.department || dep.name }))}
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
            <div>
              <label className="block mb-1 font-medium">Mobile Number</label>
              <Input 
                type="tel"
                value={addForm.mobile_no} 
                onChange={e => {
                  // Only allow digits and limit to 10 characters
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setAddForm(f => ({ ...f, mobile_no: value }));
                }} 
                disabled={addLoading}
                placeholder="Enter 10 digit mobile number"
                maxLength={10}
                className="border-2 border-border/50 focus:border-primary"
              />
              {addForm.mobile_no && addForm.mobile_no.length !== 10 && (
                <p className="text-sm text-red-500 mt-1">Mobile number must be exactly 10 digits</p>
              )}
            </div>
            <div>
              <label className="block mb-1 font-medium">Password</label>
              <div className="relative">
                <Input 
                  type={showAddPassword ? "text" : "password"} 
                  value={addForm.password} 
                  onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))} 
                  disabled={addLoading} 
                  placeholder="Leave blank to auto-generate"
                  className="pr-10 border-2 border-border/50 focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowAddPassword(!showAddPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={addLoading}
                >
                  {showAddPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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
                <Input value={editForm.first_name} onChange={e => setEditForm(f => ({ ...f, first_name: e.target.value }))} required disabled={editLoading} className="border-2 border-border/50 focus:border-primary" />
              </div>
              <div className="flex-1">
                <label className="block mb-1 font-medium">Last Name<span className="text-red-500">*</span></label>
                <Input value={editForm.last_name} onChange={e => setEditForm(f => ({ ...f, last_name: e.target.value }))}  disabled={editLoading} className="border-2 border-border/50 focus:border-primary" />
              </div>
            </div>
            <div>
              <label className="block mb-1 font-medium">Email<span className="text-red-500">*</span></label>
              <Input type="email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} required disabled={editLoading} className="border-2 border-border/50 focus:border-primary" />
            </div>
            <div>
              <label className="block mb-1 font-medium">Departments<span className="text-red-500">*</span></label>
              <MultiSelect
                options={departmentOptions}
                selected={editForm.departments}
                onSelect={(selected) => setEditForm(f => ({ ...f, departments: selected }))}
                placeholder="Select departments"
                disabled={editLoading}
              />
            </div>
            <div>
              <label className="block mb-1 font-medium">Mobile Number</label>
              <Input 
                type="tel"
                value={editForm.mobile_no} 
                onChange={e => {
                  // Only allow digits and limit to 10 characters
                  const value = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setEditForm(f => ({ ...f, mobile_no: value }));
                }} 
                disabled={editLoading}
                placeholder="Enter 10 digit mobile number"
                maxLength={10}
                className="border-2 border-border/50 focus:border-primary"
              />
              {editForm.mobile_no && editForm.mobile_no.length !== 10 && (
                <p className="text-sm text-red-500 mt-1">Mobile number must be exactly 10 digits</p>
              )}
            </div>
            <div>
              <label className="block mb-1 font-medium">Password</label>
              <div className="relative">
                <Input 
                  type={showEditPassword ? "text" : "password"} 
                  value={editForm.password} 
                  onChange={e => setEditForm(f => ({ ...f, password: e.target.value }))} 
                  disabled={editLoading} 
                  placeholder="Leave blank to keep existing"
                  className="pr-10 border-2 border-border/50 focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowEditPassword(!showEditPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  disabled={editLoading}
                >
                  {showEditPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
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
          <strong>Warning:</strong> Learner stats total ({stats.total}) does not match number of users ({users.length}). This may indicate an API limit issue. Try refreshing the page.
        </div>
      )}
      
      
      
      
      {stats && <StatsCards stats={stats} />}
      
      <Filters
        searchName={searchName}
        searchEmail={searchEmail}
        searchStatus={searchStatus}
        departmentFilter={departmentFilter}
        departmentOptions={departmentOptions}
        onSearchNameChange={setSearchName}
        onSearchEmailChange={setSearchEmail}
        onSearchStatusChange={setSearchStatus}
        onDepartmentChange={setDepartmentFilter}
        onClearNameSearch={handleClearNameSearch}
        onClearEmailSearch={handleClearEmailSearch}
        onExport={handleExport}
      />



      <LearnersTable
        learners={paginatedUsers}
        isLoading={false}
        onEdit={handleEdit}
        onViewDetails={handleViewDetails}
        departmentIdToName={departmentIdToName}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-col items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredUsers.length)} of {filteredUsers.length} learners
          </div>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {/* Page numbers with ellipsis */}
              {(() => {
                const pages = [];
                const maxVisiblePages = 7; // Show max 7 page numbers
                
                if (totalPages <= maxVisiblePages) {
                  // Show all pages if total is small
                  for (let i = 1; i <= totalPages; i++) {
                    pages.push(
                      <PaginationItem key={i}>
                        <PaginationLink
                          isActive={currentPage === i}
                          onClick={() => setCurrentPage(i)}
                          className="cursor-pointer"
                        >
                          {i}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                } else {
                  // Show first page
                  pages.push(
                    <PaginationItem key={1}>
                      <PaginationLink
                        isActive={currentPage === 1}
                        onClick={() => setCurrentPage(1)}
                        className="cursor-pointer"
                      >
                        1
                      </PaginationLink>
                    </PaginationItem>
                  );
                  
                  // Show ellipsis after first page if needed
                  if (currentPage > 4) {
                    pages.push(
                      <PaginationItem key="ellipsis1">
                        <span className="px-2 text-muted-foreground">...</span>
                      </PaginationItem>
                    );
                  }
                  
                  // Show pages around current page
                  const startPage = Math.max(2, currentPage - 1);
                  const endPage = Math.min(totalPages - 1, currentPage + 1);
                  
                  for (let i = startPage; i <= endPage; i++) {
                    if (i !== 1 && i !== totalPages) {
                      pages.push(
                        <PaginationItem key={i}>
                          <PaginationLink
                            isActive={currentPage === i}
                            onClick={() => setCurrentPage(i)}
                            className="cursor-pointer"
                          >
                            {i}
                          </PaginationLink>
                        </PaginationItem>
                      );
                    }
                  }
                  
                  // Show ellipsis before last page if needed
                  if (currentPage < totalPages - 3) {
                    pages.push(
                      <PaginationItem key="ellipsis2">
                        <span className="px-2 text-muted-foreground">...</span>
                      </PaginationItem>
                    );
                  }
                  
                  // Show last page
                  if (totalPages > 1) {
                    pages.push(
                      <PaginationItem key={totalPages}>
                        <PaginationLink
                          isActive={currentPage === totalPages}
                          onClick={() => setCurrentPage(totalPages)}
                          className="cursor-pointer"
                        >
                          {totalPages}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  }
                }
                
                return pages;
              })()}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <UserDetailsDrawer
        learner={selectedLearner}
        open={!!selectedLearner}
        onClose={() => setSelectedLearner(null)}
      />
    </div>
  );
}
