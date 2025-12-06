import { useState } from "react";
import * as React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building2, Users, Calendar, Search, X, User, ChevronUp, ChevronDown, Trash2 } from "lucide-react";
import { useFrappeGetCall } from "frappe-react-sdk";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import Lottie from 'lottie-react';
import loadingAnimation from '@/assets/Loading.json';
import { LMS_API_BASE_URL } from "@/config/routes";

interface Department {
  name: string;
  department: string;
  member_count: number;
  created_at: string;
}

type DepartmentData = Department;

interface DepartmentMember {
  name: string;
  full_name: string;
  email: string;
}

interface DepartmentDetails {
  success: boolean;
  department_name: string;
  members: DepartmentMember[];
  tl_users: DepartmentMember[];
}


export default function DepartmentPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<DepartmentData | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [departmentDetails, setDepartmentDetails] = useState<DepartmentDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [departmentName, setDepartmentName] = useState("");
  const [addingDepartment, setAddingDepartment] = useState(false);
  const [showAddMemberDialog, setShowAddMemberDialog] = useState(false);
  const [memberEmail, setMemberEmail] = useState("");
  const [addingMember, setAddingMember] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingDepartment, setDeletingDepartment] = useState(false);
  const [showDeleteMemberDialog, setShowDeleteMemberDialog] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState<DepartmentMember | null>(null);
  const [deletingMember, setDeletingMember] = useState(false);
  const [sortField, setSortField] = useState<"department" | "member_count" | "created_at" | null>(null);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc" | null>(null);
  const itemsPerPage = 10;

  const { data, isLoading, error, mutate } = useFrappeGetCall<any>("novel_lms.novel_lms.api.analytics.get_departments_data");

  // Handle both nested and direct message structures
  // useFrappeGetCall wraps the response, so we need to check data.message
  const responseData = (data as any)?.message || data || {};
  const allDepartments: DepartmentData[] = responseData.departments || [];
  const count = responseData.count || allDepartments.length;
  const totalLearners = responseData.total_learners || 0;

  // Filter and sort departments based on search query and sort settings
  const filteredDepartments = React.useMemo(() => {
    let filtered = allDepartments;
    
    // Apply search filter
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter((dept: DepartmentData) => {
        const deptName = (dept.department || dept.name || "").toLowerCase();
        return deptName.includes(searchLower);
      });
    }
    
    // Apply sorting
    if (sortField && sortOrder) {
      filtered = [...filtered].sort((a: DepartmentData, b: DepartmentData) => {
        let aValue: any;
        let bValue: any;
        
        if (sortField === "department") {
          aValue = (a.department || a.name || "").toLowerCase();
          bValue = (b.department || b.name || "").toLowerCase();
        } else if (sortField === "member_count") {
          aValue = a.member_count || 0;
          bValue = b.member_count || 0;
        } else if (sortField === "created_at") {
          aValue = a.created_at ? new Date(a.created_at).getTime() : 0;
          bValue = b.created_at ? new Date(b.created_at).getTime() : 0;
        }
        
        if (aValue < bValue) return sortOrder === "asc" ? -1 : 1;
        if (aValue > bValue) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
    }
    
    return filtered;
  }, [allDepartments, searchQuery, sortField, sortOrder]);

  // Pagination calculations based on filtered results
  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const departments = filteredDepartments.slice(startIndex, endIndex);

  // Reset to page 1 if current page exceeds total pages or search query changes
  React.useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [filteredDepartments.length, currentPage, totalPages]);

  // Reset to page 1 when search query changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  // Fetch department details when dialog opens
  React.useEffect(() => {
    if (showDialog && selectedDepartment) {
      setLoadingDetails(true);
      fetch(`${LMS_API_BASE_URL}/api/method/novel_lms.novel_lms.api.analytics.get_department_details?department_id=${selectedDepartment.name}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      })
        .then(response => response.json())
        .then(data => {
          const details = (data as any)?.message || data || {};
          setDepartmentDetails(details);
          setLoadingDetails(false);
        })
        .catch(error => {
          console.error('Error fetching department details:', error);
          setLoadingDetails(false);
          setDepartmentDetails({
            success: false,
            department_name: selectedDepartment.department || selectedDepartment.name,
            members: [],
            tl_users: []
          });
        });
    }
  }, [showDialog, selectedDepartment]);

  const handleDepartmentClick = (dept: DepartmentData) => {
    setSelectedDepartment(dept);
    setShowDialog(true);
  };

  const closeSidebar = () => {
    setShowDialog(false);
    setSelectedDepartment(null);
    setDepartmentDetails(null);
    setMemberSearchQuery(""); // Reset search when closing sidebar
  };

  const handleAddDepartment = async () => {
    if (!departmentName.trim()) {
      return; // Don't submit if empty
    }

    setAddingDepartment(true);
    try {
      const response = await fetch(`${LMS_API_BASE_URL}/api/resource/Department`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          department: departmentName.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create department');
      }

      await response.json();
      
      // Reset form and close dialog
      setDepartmentName("");
      setShowAddDialog(false);
      
      // Refresh the department list
      await mutate();
    } catch (error: any) {
      console.error('Error adding department:', error);
      alert(error.message || 'Failed to add department. Please try again.');
    } finally {
      setAddingDepartment(false);
    }
  };

  const handleCloseAddDialog = () => {
    setShowAddDialog(false);
    setDepartmentName("");
  };

  const handleAddMember = async () => {
    if (!memberEmail.trim() || !selectedDepartment) {
      return;
    }

    setAddingMember(true);
    try {
      const response = await fetch(`${LMS_API_BASE_URL}/api/method/novel_lms.novel_lms.api.analytics.add_department_member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: new URLSearchParams({
          department_id: selectedDepartment.name,
          email: memberEmail.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message?.error || errorData.error || 'Failed to add member to department');
      }

      const data = await response.json();
      const result = (data as any)?.message || data || {};

      if (!result.success) {
        throw new Error(result.error || 'Failed to add member to department');
      }

      // Reset form and close dialog
      setMemberEmail("");
      setShowAddMemberDialog(false);
      
      // Refresh the main department list to update member counts
      await mutate();
      
      // Refresh the department details in sidebar
      if (selectedDepartment) {
        const refreshResponse = await fetch(`${LMS_API_BASE_URL}/api/method/novel_lms.novel_lms.api.analytics.get_department_details?department_id=${selectedDepartment.name}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          credentials: 'include',
        });
        
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          const details = (refreshData as any)?.message || refreshData || {};
          setDepartmentDetails(details);
        }
      }
    } catch (error: any) {
      console.error('Error adding member:', error);
      alert(error.message || 'Failed to add member. Please try again.');
    } finally {
      setAddingMember(false);
    }
  };

  const handleCloseAddMemberDialog = () => {
    setShowAddMemberDialog(false);
    setMemberEmail("");
  };

  const handleDeleteDepartment = async () => {
    if (!selectedDepartment) return;

    setDeletingDepartment(true);
    try {
      const response = await fetch(`${LMS_API_BASE_URL}/api/resource/Department/${selectedDepartment.name}`, {
        method: 'DELETE',
        headers: {
          'Accept': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete department');
      }

      // Close dialogs and sidebar
      setShowDeleteDialog(false);
      closeSidebar();
      
      // Refresh the department list
      await mutate();
    } catch (error: any) {
      console.error('Error deleting department:', error);
      alert(error.message || 'Failed to delete department. Please try again.');
    } finally {
      setDeletingDepartment(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!memberToDelete || !selectedDepartment) return;

    setDeletingMember(true);
    try {
      const response = await fetch(`${LMS_API_BASE_URL}/api/method/novel_lms.novel_lms.api.analytics.remove_department_member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json',
        },
        credentials: 'include',
        body: new URLSearchParams({
          department_id: selectedDepartment.name,
          email: memberToDelete.email,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message?.error || errorData.error || 'Failed to remove member from department');
      }

      const data = await response.json();
      const result = (data as any)?.message || data || {};

      if (!result.success) {
        throw new Error(result.error || 'Failed to remove member from department');
      }

      // Close dialog
      setShowDeleteMemberDialog(false);
      setMemberToDelete(null);
      
      // Refresh the main department list to update member counts
      await mutate();
      
      // Refresh the department details in sidebar
      if (selectedDepartment) {
        const refreshResponse = await fetch(`${LMS_API_BASE_URL}/api/method/novel_lms.novel_lms.api.analytics.get_department_details?department_id=${selectedDepartment.name}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
          credentials: 'include',
        });
        
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          const details = (refreshData as any)?.message || refreshData || {};
          setDepartmentDetails(details);
        }
      }
    } catch (error: any) {
      console.error('Error removing member:', error);
      alert(error.message || 'Failed to remove member. Please try again.');
    } finally {
      setDeletingMember(false);
    }
  };

  // Filter department members based on search query
  const filteredMembers = React.useMemo(() => {
    if (!departmentDetails?.members) return [];
    if (!memberSearchQuery.trim()) return departmentDetails.members;
    
    const searchLower = memberSearchQuery.toLowerCase();
    return departmentDetails.members.filter((member) => {
      const name = (member.full_name || member.name || "").toLowerCase();
      const email = (member.email || "").toLowerCase();
      return name.includes(searchLower) || email.includes(searchLower);
    });
  }, [departmentDetails?.members, memberSearchQuery]);

  const handleRefresh = async () => {
    await mutate();
  };

  const handleSort = (field: "department" | "member_count" | "created_at") => {
    if (sortField === field) {
      // Cycle through: asc -> desc -> null (unsorted)
      if (sortOrder === "asc") {
        setSortOrder("desc");
      } else if (sortOrder === "desc") {
        setSortField(null);
        setSortOrder(null);
      }
    } else {
      // Set new sort field and default to ascending
      setSortField(field);
      setSortOrder("asc");
    }
    setCurrentPage(1); // Reset to page 1 when sorting changes
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (e) {
      return dateString;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
        <Lottie animationData={loadingAnimation} loop style={{ width: 120, height: 120 }} />
        <div className="mt-4 text-muted-foreground">Loading departments...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 min-h-[400px]">
        <div className="text-red-500 mb-4">Error loading departments</div>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Departments</h1>
          <p className="text-muted-foreground">
            Manage and view all departments
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)} variant="default">
          Add Department
        </Button>
      </div>

      {/* Stats Card */}
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>Department statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-sm text-muted-foreground">Total Departments</div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
              <Users className="h-8 w-8 text-primary" />
              <div>
                <div className="text-2xl font-bold">
                  {totalLearners}
                </div>
                <div className="text-sm text-muted-foreground">Total Members</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Departments List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Departments</CardTitle>
              <CardDescription>
                List of all departments with member count and creation date
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Input */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search departments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {allDepartments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No departments found</p>
            </div>
          ) : filteredDepartments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No departments match your search query "{searchQuery}"</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchQuery("")}
                className="mt-4"
              >
                Clear search
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse table-fixed">
                  <colgroup>
                    <col className="w-[50%]" />
                    <col className="w-[20%]" />
                    <col className="w-[30%]" />
                  </colgroup>
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-semibold text-sm">
                        <div className="flex items-center gap-2">
                          <span 
                            className="cursor-pointer hover:text-primary transition-colors select-none"
                            onClick={() => handleSort("department")}
                          >
                            Department Name
                          </span>
                          {sortField === "department" ? (
                            sortOrder === "asc" ? (
                              <ChevronUp className="h-4 w-4 text-primary flex-shrink-0 cursor-pointer" onClick={() => handleSort("department")} />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-primary flex-shrink-0 cursor-pointer" onClick={() => handleSort("department")} />
                            )
                          ) : (
                            <div className="flex flex-col flex-shrink-0">
                              <ChevronUp className="h-3 w-3 text-muted-foreground opacity-30" />
                              <ChevronDown className="h-3 w-3 text-muted-foreground opacity-30 -mt-1" />
                            </div>
                          )}
                        </div>
                      </th>
                      <th className="text-left p-3 font-semibold text-sm">
                        <div className="flex items-center gap-2">
                          <span 
                            className="cursor-pointer hover:text-primary transition-colors select-none"
                            onClick={() => handleSort("member_count")}
                          >
                            Members
                          </span>
                          {sortField === "member_count" ? (
                            sortOrder === "asc" ? (
                              <ChevronUp className="h-4 w-4 text-primary flex-shrink-0 cursor-pointer" onClick={() => handleSort("member_count")} />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-primary flex-shrink-0 cursor-pointer" onClick={() => handleSort("member_count")} />
                            )
                          ) : (
                            <div className="flex flex-col flex-shrink-0">
                              <ChevronUp className="h-3 w-3 text-muted-foreground opacity-30" />
                              <ChevronDown className="h-3 w-3 text-muted-foreground opacity-30 -mt-1" />
                            </div>
                          )}
                        </div>
                      </th>
                      <th className="text-left p-3 font-semibold text-sm">
                        <div className="flex items-center gap-2">
                          <span 
                            className="cursor-pointer hover:text-primary transition-colors select-none"
                            onClick={() => handleSort("created_at")}
                          >
                            Created At
                          </span>
                          {sortField === "created_at" ? (
                            sortOrder === "asc" ? (
                              <ChevronUp className="h-4 w-4 text-primary flex-shrink-0 cursor-pointer" onClick={() => handleSort("created_at")} />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-primary flex-shrink-0 cursor-pointer" onClick={() => handleSort("created_at")} />
                            )
                          ) : (
                            <div className="flex flex-col flex-shrink-0">
                              <ChevronUp className="h-3 w-3 text-muted-foreground opacity-30" />
                              <ChevronDown className="h-3 w-3 text-muted-foreground opacity-30 -mt-1" />
                            </div>
                          )}
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {departments.map((dept: DepartmentData) => (
                      <tr 
                        key={dept.name} 
                        className="border-b hover:bg-muted/50 cursor-pointer"
                        onClick={() => handleDepartmentClick(dept)}
                      >
                        <td className="p-3">
                          <div className="font-medium cursor-pointer hover:text-primary transition-colors truncate" title={dept.department || dept.name}>
                            {dept.department || dept.name}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span>{dept.member_count || 0}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm text-muted-foreground whitespace-nowrap">{formatDate(dept.created_at)}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {filteredDepartments.length > itemsPerPage && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to {Math.min(endIndex, filteredDepartments.length)} of {filteredDepartments.length} entries
                    {searchQuery && (
                      <span className="ml-2">(filtered from {allDepartments.length} total)</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handlePrevPage}
                      disabled={currentPage === 1}
                    >
                      <span className="mr-1">&lt;</span> Previous
                    </Button>
                    
                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                      {(() => {
                        const pages = [];
                        
                        // Show first page
                        if (currentPage > 3) {
                          pages.push(
                            <Button
                              key={1}
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(1)}
                              className="w-8 h-8 p-0"
                            >
                              1
                            </Button>
                          );
                          if (currentPage > 4) {
                            pages.push(<span key="ellipsis1" className="px-2">...</span>);
                          }
                        }
                        
                        // Show pages around current page
                        const startPage = Math.max(1, currentPage - 2);
                        const endPage = Math.min(totalPages, currentPage + 2);
                        
                        for (let i = startPage; i <= endPage; i++) {
                          pages.push(
                            <Button
                              key={i}
                              variant={currentPage === i ? "default" : "outline"}
                              size="sm"
                              onClick={() => handlePageChange(i)}
                              className="w-8 h-8 p-0"
                            >
                              {i}
                            </Button>
                          );
                        }
                        
                        // Show last page
                        if (currentPage < totalPages - 2) {
                          if (currentPage < totalPages - 3) {
                            pages.push(<span key="ellipsis2" className="px-2">...</span>);
                          }
                          pages.push(
                            <Button
                              key={totalPages}
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(totalPages)}
                              className="w-8 h-8 p-0"
                            >
                              {totalPages}
                            </Button>
                          );
                        }
                        
                        return pages;
                      })()}
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleNextPage}
                      disabled={currentPage === totalPages}
                    >
                      Next <span className="ml-1">&gt;</span>
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Department Details Sidebar */}
      {showDialog && selectedDepartment && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50" 
            onClick={closeSidebar}
          />
          
          {/* Sidebar */}
          <div className="relative ml-auto h-full w-full max-w-2xl bg-background border-l shadow-lg">
            <div className="flex h-full flex-col">
              {/* Header */}
              <div className="flex items-center justify-between border-b p-4">
                <div>
                  <h3 className="text-lg font-semibold">
                    {departmentDetails?.department_name || selectedDepartment.department || selectedDepartment.name || "Department Details"}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Department Information
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                    className="h-8"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={closeSidebar}
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-4">
                {loadingDetails ? (
                  <div className="flex flex-col items-center justify-center py-8">
                    <RefreshCw className="h-8 w-8 animate-spin mb-4 text-primary" />
                    <p className="text-muted-foreground">Loading department details...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Department Information */}
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Department Information
                      </h4>
                      <div className="space-y-3">
                        <div className="flex">
                          <span className="text-sm text-muted-foreground">Name:</span>
                          <span className="text-sm font-medium ml-2">
                            {departmentDetails?.department_name || selectedDepartment.department || selectedDepartment.name}
                          </span>
                        </div>
                        <div className="flex">
                          <span className="text-sm text-muted-foreground">Members:</span>
                          <span className="text-sm font-medium ml-2">
                            {departmentDetails?.members?.length || 0}
                          </span>
                        </div>
                        <div className="flex">
                          <span className="text-sm text-muted-foreground">Team Leads:</span>
                          <span className="text-sm font-medium ml-2">
                            {departmentDetails?.tl_users?.length || 0}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Team Leads Section */}
                    {departmentDetails?.tl_users && departmentDetails.tl_users.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-3 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Team Leads ({departmentDetails.tl_users.length})
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b bg-muted/50">
                                <th className="text-left p-2 font-medium text-xs text-muted-foreground">Name</th>
                                <th className="text-left p-2 font-medium text-xs text-muted-foreground">Email</th>
                              </tr>
                            </thead>
                            <tbody>
                              {departmentDetails.tl_users.map((tl) => (
                                <tr key={tl.name} className="border-b">
                                  <td className="p-2 text-xs font-medium">{tl.full_name || tl.name}</td>
                                  <td className="p-2 text-xs text-muted-foreground">{tl.email}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Department Members Section */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          Department Members ({departmentDetails?.members?.length || 0})
                        </h4>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setShowAddMemberDialog(true)}
                          className="h-8"
                        >
                          Add Member
                        </Button>
                      </div>
                      
                      {/* Search Input for Members */}
                      {departmentDetails?.members && departmentDetails.members.length > 0 && (
                        <div className="mb-4">
                          <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                              type="text"
                              placeholder="Search members by name or email..."
                              value={memberSearchQuery}
                              onChange={(e) => setMemberSearchQuery(e.target.value)}
                              className="pl-10"
                            />
                          </div>
                        </div>
                      )}

                      {departmentDetails?.members && departmentDetails.members.length > 0 ? (
                        filteredMembers.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                              <thead>
                                <tr className="border-b bg-muted/50">
                                  <th className="text-left p-2 font-medium text-xs text-muted-foreground">Name</th>
                                  <th className="text-left p-2 font-medium text-xs text-muted-foreground">Email</th>
                                  <th className="text-left p-2 font-medium text-xs text-muted-foreground">Action</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredMembers.map((member) => (
                                  <tr key={member.name} className="border-b">
                                    <td className="p-2 text-xs font-medium">{member.full_name || member.name}</td>
                                    <td className="p-2 text-xs text-muted-foreground">{member.email}</td>
                                    <td className="p-2">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                          setMemberToDelete(member);
                                          setShowDeleteMemberDialog(true);
                                        }}
                                        className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                                        title="Remove member from department"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="bg-muted/50 rounded-lg p-4 text-center">
                            <Search className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">No members match your search query</p>
                          </div>
                        )
                      ) : (
                        <div className="bg-muted/50 rounded-lg p-4 text-center">
                          <Users className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                          <p className="text-sm text-muted-foreground">No members found in this department</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Department Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Department</DialogTitle>
            <DialogDescription>
              Create a new department in the system.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="department-name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Department Name<span className="text-red-500">*</span>
              </label>
              <Input
                id="department-name"
                placeholder="Enter department name"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && departmentName.trim() && !addingDepartment) {
                    handleAddDepartment();
                  }
                }}
                disabled={addingDepartment}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseAddDialog}
              disabled={addingDepartment}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddDepartment}
              disabled={!departmentName.trim() || addingDepartment}
            >
              {addingDepartment ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Department'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Member Dialog */}
      <Dialog open={showAddMemberDialog} onOpenChange={setShowAddMemberDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Add Member</DialogTitle>
            <DialogDescription>
              Add a member to this department by entering their email address.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="member-email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Email Address<span className="text-red-500">*</span>
              </label>
              <Input
                id="member-email"
                type="email"
                placeholder="Enter member email address"
                value={memberEmail}
                onChange={(e) => setMemberEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && memberEmail.trim() && !addingMember) {
                    handleAddMember();
                  }
                }}
                disabled={addingMember}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={handleCloseAddMemberDialog}
              disabled={addingMember}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddMember}
              disabled={!memberEmail.trim() || addingMember}
            >
              {addingMember ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                'Add Member'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Department Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Delete Department</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete the department "{selectedDepartment?.department || selectedDepartment?.name}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={deletingDepartment}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteDepartment}
              disabled={deletingDepartment}
            >
              {deletingDepartment ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Member Confirmation Dialog */}
      <Dialog open={showDeleteMemberDialog} onOpenChange={setShowDeleteMemberDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Remove Member</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove "{memberToDelete?.full_name || memberToDelete?.name}" ({memberToDelete?.email}) from this department?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteMemberDialog(false);
                setMemberToDelete(null);
              }}
              disabled={deletingMember}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteMember}
              disabled={deletingMember}
            >
              {deletingMember ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

