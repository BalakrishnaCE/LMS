import * as React from "react";
import { useFrappeGetCall, useFrappeGetDocList, useFrappePostCall } from "frappe-react-sdk";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardAction, CardFooter } from "@/components/ui/card";
import { motion } from "framer-motion";
import { LearnersTable } from "@/pages/Learners/LearnersTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Download, Users, CheckCircle, PauseCircle, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { UserDetailsDrawer } from "./components/LearnerDetailsDrawer";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";

interface User {
  name: string;
  full_name: string;
  email: string;
  enabled: number;
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

interface FrappeResponse {
  data: ApiData;
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
  departmentFilter: string;
  departmentOptions: string[];
  onSearchNameChange: (value: string) => void;
  onSearchEmailChange: (value: string) => void;
  onSearchStatusChange: (value: string) => void;
  onDepartmentChange: (value: string) => void;
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
        <Select value={departmentFilter} onValueChange={onDepartmentChange}>
          <SelectTrigger>
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All</SelectItem>
            {departmentOptions.map(dep => (
              <SelectItem key={dep} value={dep}>{dep}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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
  const [departmentFilter, setDepartmentFilter] = React.useState<string>('All');
  const [addOpen, setAddOpen] = React.useState(false);
  const [addLoading, setAddLoading] = React.useState(false);
  const [addError, setAddError] = React.useState<string | null>(null);
  const [addForm, setAddForm] = React.useState({
    first_name: '',
    last_name: '',
    email: '',
    department: '',
    mobile_no: '',
    password: '',
    send_welcome_email: true
  });

  const { call: addLearnerPost } = useFrappePostCall("addLMSUser");
  const { data: analyticsData, error, isValidating, mutate } = useFrappeGetCall<any>("getLearnerAnalytics");
  const message = analyticsData?.message || {};
  const users = message.users || [];
  const stats = message.stats;

  // Debugging logs
  console.log("message111=",message);
  console.log('Learner stats:', stats);
  console.log('Learner users:', users);

  // Log on every update for more accurate debugging
  React.useEffect(() => {
    console.log('Learner stats (effect):', stats);
    console.log('Learner users (effect):', users);
    if (stats && users && typeof stats.total === 'number' && stats.total !== users.length) {
      console.warn('Mismatch: stats.total does not match users.length', stats.total, users.length);
    }
  }, [stats, users]);

  // Collect unique departments from users
  const departmentOptions = React.useMemo(() => {
    const set = new Set<string>();
    users.forEach((u: any) => {
      if (u.department) set.add(u.department);
    });
    return Array.from(set).sort();
  }, [users]);

  // Filter users based on search criteria
  const filteredUsers = users.filter((user: any) => {
    const nameMatch = user.full_name?.toLowerCase().includes(searchName.toLowerCase());
    const emailMatch = user.email?.toLowerCase().includes(searchEmail.toLowerCase());
    const statusMatch = searchStatus === "all" || 
      (searchStatus === "active" && user.enabled === 1) || 
      (searchStatus === "inactive" && user.enabled === 0);
    const departmentMatch = departmentFilter === 'All' || user.department === departmentFilter;
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

  // Fetch departments for dropdown
  const { data: departmentsData } = useFrappeGetDocList("Department", { fields: ["name", "department"] });
  const departmentOptionsFull = departmentsData || [];

  // Add Learner handler (placeholder)
  async function handleAddLearner(e: React.FormEvent) {
    e.preventDefault();
    setAddError(null);
    if (!addForm.first_name || !addForm.last_name || !addForm.email || !addForm.department) {
      setAddError("Please fill all required fields.");
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
        department: addForm.department,
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
        department: '',
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
              <label className="block mb-1 font-medium">Department<span className="text-red-500">*</span></label>
              <select className="w-full border rounded px-3 py-2" value={addForm.department} onChange={e => setAddForm(f => ({ ...f, department: e.target.value }))} required disabled={addLoading}>
                <option value="">Select department</option>
                {departmentOptionsFull.map((dep: any) => (
                  <option key={dep.name} value={dep.name}>{dep.department || dep.name}</option>
                ))}
              </select>
            </div>
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
        departmentOptions={departmentOptions}
        onSearchNameChange={setSearchName}
        onSearchEmailChange={setSearchEmail}
        onSearchStatusChange={setSearchStatus}
        onDepartmentChange={setDepartmentFilter}
        onExport={handleExport}
      />

      <LearnersTable
        learners={filteredUsers}
        isLoading={isValidating}
        onRowClick={setSelectedLearner}
      />

      <UserDetailsDrawer
        learner={selectedLearner}
        open={!!selectedLearner}
        onClose={() => setSelectedLearner(null)}
      />
    </div>
  );
}
