import * as React from "react";
import { useFrappeGetCall } from "frappe-react-sdk";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { LearnersTable } from "@/pages/Learners/LearnersTable";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Download, Users, CheckCircle, PauseCircle, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { UserDetailsDrawer } from "./components/LearnerDetailsDrawer";

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
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><Users className="w-5 h-5" />Total Learners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.percentage_change > 0 ? "+" : ""}{stats.percentage_change}% from last month
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-500" />Active Learners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.active / stats.total) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><PauseCircle className="w-5 h-5 text-blue-400" />Inactive Learners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactive}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.inactive / stats.total) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <Card className="w-full">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2"><TrendingUp className="w-5 h-5 text-red-500" />Growth Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.percentage_change}%
            </div>
            <p className="text-xs text-muted-foreground">
              Monthly growth rate
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}

// Filters Component
function Filters({ 
  searchName, 
  searchEmail, 
  searchStatus, 
  onSearchNameChange, 
  onSearchEmailChange, 
  onSearchStatusChange,
  onExport
}: {
  searchName: string;
  searchEmail: string;
  searchStatus: string;
  onSearchNameChange: (value: string) => void;
  onSearchEmailChange: (value: string) => void;
  onSearchStatusChange: (value: string) => void;
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

  const { data: studentsData, error, isValidating } = useFrappeGetCall<FrappeResponse>("getStudentRoleCount");
  const users = studentsData?.data?.users || [];
  const stats = studentsData?.data?.stats;

  // Filter users based on search criteria
  const filteredUsers = users.filter(user => {
    const nameMatch = user.full_name?.toLowerCase().includes(searchName.toLowerCase());
    const emailMatch = user.email?.toLowerCase().includes(searchEmail.toLowerCase());
    const statusMatch = searchStatus === "all" || 
      (searchStatus === "active" && user.enabled === 1) || 
      (searchStatus === "inactive" && user.enabled === 0);
    return nameMatch && emailMatch && statusMatch;
  });

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

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">Error loading learners: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-full p-4">
      {stats && <StatsCards stats={stats} />}
      
      <Filters
        searchName={searchName}
        searchEmail={searchEmail}
        searchStatus={searchStatus}
        onSearchNameChange={setSearchName}
        onSearchEmailChange={setSearchEmail}
        onSearchStatusChange={setSearchStatus}
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
