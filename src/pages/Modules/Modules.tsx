import {
    Card,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {  useFrappeGetDocList, useFrappeAuth } from "frappe-react-sdk"
import { Link } from "wouter"
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { motion } from "framer-motion"
import { Download, X, CopyPlus } from "lucide-react"
import { toast } from "sonner"
import { LMS_API_BASE_URL, ROUTES } from "@/config/routes"

// Debounce utility function
const debounce = (fn: Function, delay: number) => {
    let timeout: NodeJS.Timeout;
    return (...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
};

interface ModulesProps {
    itemsPerPage: number;
    showArchived?: boolean;
    onShowArchivedChange?: (value: boolean) => void;
}


// Helper function to convert module data to CSV
function convertToCSV(modules: any[]) {
  const headers = ["Name", "Short Text", "Description", "Status", "Department", "Image"];
  const rows = modules.map(module => [
    module.name1,
    module.short_text,
    module.description,
    module.status,
    module.department,
    module.image
  ]);
  
  return [
    headers.join(","),
    ...rows.map(row => row.map(cell => `"${cell?.replace(/"/g, '""') || ''}"`).join(","))
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

function Modules({ itemsPerPage, showArchived = false, onShowArchivedChange }: ModulesProps) {
    const [page, setPage] = useState(1)
    // Initialize search query from localStorage
    const [searchQuery, setSearchQuery] = useState(() => {
        return localStorage.getItem('modules_search') || "";
    })



    const [selectedDepartment, setSelectedDepartment] = useState(() => {
        return localStorage.getItem('modules_department') || "all";
    })
    const [selectedStatus, setSelectedStatus] = useState(() => {
        return localStorage.getItem('modules_status') || "all";
    })
    const [isExporting, setIsExporting] = useState(false)
    // Add image error state for all cards
    const [imageErrors, setImageErrors] = useState<{ [key: string]: boolean }>({});
    // Duplicate dialog state
    const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
    const [moduleToDuplicate, setModuleToDuplicate] = useState<{ name: string; name1: string } | null>(null);

    // Add authentication check to prevent race condition
    const { currentUser, isLoading: isAuthLoading } = useFrappeAuth();

    // Debounced save function for search query
    const saveSearchToStorage = useCallback(
        debounce((value: string) => {
            if (value && value.trim()) {
                localStorage.setItem('modules_search', value.trim());
            } else {
                localStorage.removeItem('modules_search');
            }
        }, 300),
        []
    );

    // Persist department filter
    useEffect(() => {
        if (selectedDepartment && selectedDepartment !== "all") {
            localStorage.setItem('modules_department', selectedDepartment);
        } else {
            localStorage.removeItem('modules_department');
        }
    }, [selectedDepartment]);

    // Persist status filter
    useEffect(() => {
        if (selectedStatus && selectedStatus !== "all") {
            localStorage.setItem('modules_status', selectedStatus);
        } else {
            localStorage.removeItem('modules_status');
        }
    }, [selectedStatus]);

    // Handle search query change
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);
        saveSearchToStorage(value);
    };

    // Handle clear search
    const handleClearSearch = () => {
        setSearchQuery("");
        saveSearchToStorage("");
    };

    // Get departments for filter
    const { data: departments } = useFrappeGetDocList("Department", {
        fields: ["name", "department"],
        limit: 100,
    });
    
    // Sort departments alphabetically by department name
    const sortedDepartments = departments?.sort((a, b) => 
        (a.department || a.name).localeCompare(b.department || b.name)
    ) || [];
    
    const filters: any[] = []
    if (selectedDepartment && selectedDepartment !== "all") {
        filters.push(["department", "=", selectedDepartment])
    }
    // If showArchived is true, filter to show only archived modules
    // If showArchived is false, exclude archived modules from the list
    if (showArchived) {
        // When showing archived, force status to Archived
        filters.push(["status", "=", "Archived"])
    } else {
        // When not showing archived, exclude archived modules
        filters.push(["status", "!=", "Archived"])
        // Apply status filter if selected and not "all"
        if (selectedStatus && selectedStatus !== "all") {
            filters.push(["status", "=", selectedStatus])
        }
    }
    if (searchQuery) {
        filters.push(["name1", "like", `%${searchQuery}%`])
    }

    const { data: module_data } = useFrappeGetDocList("LMS Module",
        {
          fields: ["name", "name1", "short_text", "description", "status", "image", "department"],
          limit: itemsPerPage,
          limit_start: (page - 1) * itemsPerPage,
          filters: filters
        }
      )

    const { data: total_count } = useFrappeGetDocList("LMS Module",
        {
          fields: ["name"],
          limit: 0,
          filters: filters
        }
      )

    const totalPages = Math.ceil((total_count?.length || 0) / itemsPerPage)

    const module_list = module_data?.map((module: { name: string; name1: string; description: string; status: string; image: string; short_text: string; department: string }) => ({
        name: module.name,
        name1: module.name1,
        description: module.description,
        status: module.status,
        image: module.image,
        short_text: module.short_text,
        department: module.department,
      }))

    const handlePageChange = (newPage: number) => {
        setPage(newPage)
    }

    // Reset page when filters change
    useEffect(() => {
        setPage(1)
    }, [searchQuery, selectedDepartment, selectedStatus, showArchived])
    
    // Reset status filter when showArchived changes
    useEffect(() => {
        if (showArchived && selectedStatus !== "all" && selectedStatus !== "Archived") {
            setSelectedStatus("all")
        }
    }, [showArchived])

    // Show loading state while authentication is being determined
    if (isAuthLoading || !currentUser) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
                    <p className="mt-4 text-muted-foreground">Loading modules...</p>
                </div>
            </div>
        );
    }

    const handleExport = async () => {
        try {
            setIsExporting(true);
            toast.loading("Preparing export...");

            // Prepare fields and filters for the API call
            const exportFields = ["name", "name1", "short_text", "description", "status", "department", "is_published", "image"];
            const query = new URLSearchParams({
                fields: JSON.stringify(exportFields),
                filters: JSON.stringify(filters),
                limit: "0"
            }).toString();

            // Fetch all modules for export using regular fetch with fields and filters
            const response = await fetch(`${LMS_API_BASE_URL}/api/resource/LMS Module?${query}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                },
                credentials: 'include',
            });

            if (!response.ok) {
                throw new Error('Failed to fetch modules');
            }

            const data = await response.json();
            const exportModules = data.data?.map((module: any) => ({
                name: module.name,
                name1: module.name1,
                description: module.description,
                status: module.status,
                short_text: module.short_text,
                department: module.department,
                is_published: module.is_published,
                image: module.image,
            })) || [];

            const csv = convertToCSV(exportModules);
            const filename = `modules_export_${new Date().toISOString().split('T')[0]}.csv`;
            downloadCSV(csv, filename);
            
            toast.dismiss();
            toast.success(`Successfully exported ${exportModules.length} modules`);
        } catch (error) {
            toast.dismiss();
            toast.error("Failed to export modules");
            console.error("Export error:", error);
        } finally {
            setIsExporting(false);
        }
    };

    const handleDuplicateClick = (moduleName: string, moduleDisplayName: string) => {
        setModuleToDuplicate({ name: moduleName, name1: moduleDisplayName });
        setShowDuplicateDialog(true);
    };

    const handleDuplicateConfirm = async () => {
        if (!moduleToDuplicate) return;

        setShowDuplicateDialog(false);

        try {
            toast.loading("Duplicating module...");

            const response = await fetch(`${LMS_API_BASE_URL}/api/method/novel_lms.novel_lms.api.module_management.duplicate_module`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    module_name: moduleToDuplicate.name
                })
            });

            if (!response.ok) {
                throw new Error('Failed to duplicate module');
            }

            const data = await response.json();
            
            if (data.message && data.message.success) {
                toast.dismiss();
                toast.success("Module duplicated successfully");
                
                // Refresh the page to show the new module
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                throw new Error(data.message?.error || 'Failed to duplicate module');
            }
        } catch (error: any) {
            toast.dismiss();
            toast.error(error.message || "Failed to duplicate module");
            console.error("Duplicate error:", error);
        } finally {
            setModuleToDuplicate(null);
        }
    };

    return (
        <div>

            <div className="flex gap-4 p-4 mb-4">
                <div className="flex-[5] relative min-w-[550px]">
                    <Input
                        placeholder="Search modules..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                        className="pr-10 w-full"
                    />
                    {searchQuery && (
                        <button
                            onClick={handleClearSearch}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            type="button"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                </div>
                <div className="w-[180px] flex-shrink-0">
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                        <SelectTrigger>
                            <SelectValue placeholder="Department" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Departments</SelectItem>
                            {sortedDepartments.map((dept) => (
                                <SelectItem key={dept.name} value={dept.name}>
                                    {dept.department || dept.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-[180px] -ml-3 flex-shrink-0">
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger>
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="Published">Published</SelectItem>
                            <SelectItem value="Draft">Draft</SelectItem>
                            <SelectItem value="Approval Pending">Approval Pending</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 -ml-2">
                    <Label htmlFor="archived-toggle" className="text-sm font-medium whitespace-nowrap">
                        {showArchived ? "Archived" : "Archived"}
                    </Label>
                    <button
                        id="archived-toggle"
                        type="button"
                        role="switch"
                        aria-checked={showArchived}
                        onClick={() => onShowArchivedChange?.(!showArchived)}
                        className={`
                            relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                            focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                            ${showArchived ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}
                        `}
                    >
                        <span
                            className={`
                                inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                                ${showArchived ? 'translate-x-6' : 'translate-x-1'}
                            `}
                        />
                    </button>
                </div>
                <Button 
                    variant="outline" 
                    className="w-auto flex-shrink-0 ml-2"
                    onClick={handleExport}
                    disabled={isExporting}
                >
                    <Download className="mr-2 h-4 w-4" />
                    {isExporting ? "Exporting..." : "Export"}
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-300 p-4">
                {module_list?.map((module) => {
                    // Status bar color logic
                    let statusColor = "bg-gray-200 text-gray-700";
                    if (module.status === "Published") statusColor = "bg-green-100 text-green-700";
                    else if (module.status === "Approval Pending") statusColor = "bg-amber-100 text-amber-700";
                    else if (module.status === "Draft") statusColor = "bg-gray-200 text-gray-700";
                    else if (module.status === "Archived") statusColor = "bg-orange-100 text-orange-700";

                    let statusDarkColor = "dark:bg-gray-800 dark:text-gray-300";
                    if (module.status === "Published") statusDarkColor = "dark:bg-green-900 dark:text-green-300";
                    else if (module.status === "Approval Pending") statusDarkColor = "dark:bg-amber-900 dark:text-amber-200";
                    else if (module.status === "Draft") statusDarkColor = "dark:bg-gray-800 dark:text-gray-300";
                    else if (module.status === "Archived") statusDarkColor = "dark:bg-orange-900 dark:text-orange-300";

                    // Helper function to get full image URL
                    const getImageUrl = (path?: string): string => {
                        if (!path) return '';
                        const trimmed = path.trim();
                        if (!trimmed) return '';
                        
                        // If already a full URL, return as is
                        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
                            return trimmed;
                        }
                        
                        // Ensure path starts with / if it doesn't already
                        const relativePath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
                        
                        // Determine base URL
                        // In production: use LMS_API_BASE_URL (https://lms.noveloffice.org)
                        // In development: use http://lms.noveloffice.org
                        const baseUrl = LMS_API_BASE_URL || 'http://lms.noveloffice.org';
                        const cleanBaseUrl = baseUrl.replace(/\/$/, '');
                        
                        return `${cleanBaseUrl}${relativePath}`;
                    };
                    
                    // Use imageErrors state for this module
                    const imageUrl = module.image ? getImageUrl(module.image) : null;
                    
                    // Debug: Log image URL construction
                    // if (module.image) {
                    //     console.log(`Module ${module.name1}: image="${module.image}", imageUrl="${imageUrl}"`);
                    // }
                    
                    const hasError = imageErrors[module.name];

                    return (
                        <motion.div
                            key={module.name}
                            whileHover={{ 
                                scale: 1.02,
                                transition: { duration: 0.2 }
                            }}
                            className="h-full"
                        >
                            <Card className="@container/card overflow-hidden h-full flex flex-col hover:shadow-lg transition-all duration-300 dark:hover:border-primary/50 dark:hover:bg-accent/50 !pt-0 !py-0">
                                <div className="flex-1 flex flex-col">
                                    <div className="relative">
                                        {/* Status Bar */}
                                        <div className={`w-full h-8 flex items-center justify-center text-sm font-medium ${statusColor} ${statusDarkColor} z-10`}
                                             style={{ position: 'absolute', top: 0, left: 0 }}>
                                            {module.status === "Approval Pending" ? "Pending" : module.status}
                                        </div>
                                        {/* Duplicate Icon Button - Top Right Corner */}
                                        <button
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleDuplicateClick(module.name, module.name1);
                                            }}
                                            className="absolute top-2 right-2 z-20 p-2 rounded-full bg-white/90 dark:bg-gray-800/90 hover:bg-white dark:hover:bg-gray-800 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-110 active:scale-95"
                                            title="Duplicate Module"
                                        >
                                            <CopyPlus className="h-4 w-4 text-primary" />
                                        </button>
                                        {/* Image or Letter Avatar with fallback */}
                                        {imageUrl && !hasError ? (
                                            <img
                                                src={imageUrl}
                                                alt={module.name1}
                                                className="w-full h-48 object-cover pb-4"
                                                style={{ marginTop: '2rem' }}
                                                onError={() => {
                                                    console.log(`Image failed to load: ${imageUrl}`);
                                                    setImageErrors(prev => ({ ...prev, [module.name]: true }));
                                                }}
                                            />
                                        ) : (
                                            <div className="w-full h-48 flex items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20 pb-4" style={{ marginTop: '2rem' }}>
                                                <div className="text-center">
                                                    <div className="text-6xl font-semibold text-primary/60 dark:text-primary/70">
                                                        {module.name1?.charAt(0).toUpperCase() || "M"}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <CardHeader className="space-y-1 pb-4">
                                        <CardTitle className="text-lg dark:text-foreground  ">
                                            {module.name1}
                                        </CardTitle>
                                    </CardHeader>
                                </div>
                                <CardFooter className="pt-0 pb-4 mt-auto">
                                    <Link href={ROUTES.ADMIN_MODULE_DETAIL(module.name)} className="w-full">
                                        <Button 
                                            variant="outline"
                                            className="w-full transition-all duration-200 dark:text-foreground dark:hover:bg-primary dark:hover:text-primary-foreground dark:border-primary/50 hover:scale-[1.02] active:scale-[0.98]"
                                        >
                                            View
                                        </Button>
                                    </Link>
                                </CardFooter>
                            </Card>
                        </motion.div>
                    )
                })}
            </div>

            <div className="flex justify-center mt-6">
                <Pagination>
                    <PaginationContent>
                        <PaginationItem>
                            <PaginationPrevious 
                                onClick={() => handlePageChange(Math.max(1, page - 1))}
                                className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                        </PaginationItem>
                        
                        {/* Updated Pagination Logic with Ellipsis */}
                        {(() => {
                            const pageButtons = [];
                            const maxPageButtons = 5; // Show at most 5 page numbers (can adjust)
                            let startPage = Math.max(1, page - 1);
                            let endPage = Math.min(totalPages, page + 1);

                            // Always show first and last page
                            if (page <= 3) {
                                startPage = 1;
                                endPage = Math.min(totalPages, maxPageButtons);
                            } else if (page >= totalPages - 2) {
                                startPage = Math.max(1, totalPages - maxPageButtons + 1);
                                endPage = totalPages;
                            } else {
                                startPage = page - 1;
                                endPage = page + 1;
                            }

                            // First page
                            if (startPage > 1) {
                                pageButtons.push(
                                    <PaginationItem key={1}>
                                        <PaginationLink onClick={() => handlePageChange(1)} isActive={page === 1} className="cursor-pointer">{1}</PaginationLink>
                                    </PaginationItem>
                                );
                                if (startPage > 2) {
                                    pageButtons.push(
                                        <PaginationItem key="start-ellipsis">
                                            <PaginationEllipsis />
                                        </PaginationItem>
                                    );
                                }
                            }

                            // Middle pages
                            for (let i = startPage; i <= endPage; i++) {
                                pageButtons.push(
                                    <PaginationItem key={i}>
                                        <PaginationLink onClick={() => handlePageChange(i)} isActive={page === i} className="cursor-pointer">{i}</PaginationLink>
                                    </PaginationItem>
                                );
                            }

                            // Last page
                            if (endPage < totalPages) {
                                if (endPage < totalPages - 1) {
                                    pageButtons.push(
                                        <PaginationItem key="end-ellipsis">
                                            <PaginationEllipsis />
                                        </PaginationItem>
                                    );
                                }
                                pageButtons.push(
                                    <PaginationItem key={totalPages}>
                                        <PaginationLink onClick={() => handlePageChange(totalPages)} isActive={page === totalPages} className="cursor-pointer">{totalPages}</PaginationLink>
                                    </PaginationItem>
                                );
                            }

                            return pageButtons;
                        })()}

                        <PaginationItem>
                            <PaginationNext 
                                onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                                className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>

            {/* Duplicate Confirmation Dialog */}
            <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <CopyPlus className="h-5 w-5 text-primary" />
                            Duplicate Module
                        </DialogTitle>
                        <DialogDescription className="pt-2">
                            Are you sure you want to duplicate all lessons, chapters and contents from this module?
                        </DialogDescription>
                    </DialogHeader>
                    {moduleToDuplicate && (
                        <div className="py-4">
                            <div className="rounded-lg bg-muted p-4">
                                <p className="text-sm font-medium text-muted-foreground mb-1">Module Name:</p>
                                <p className="text-base font-semibold">{moduleToDuplicate.name1}</p>
                            </div>
                            <div className="mt-4 space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    This will create a duplicate module with:
                                </p>
                                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 ml-2">
                                    <li>All lessons</li>
                                    <li>All chapters</li>
                                    <li>All contents (including Audio,video,image etc.)</li>
                                    <li>Quiz questions and answers</li>
                                    <li>Question Answer questions</li>
                                </ul>
                                <p className="text-sm font-medium mt-3">
                                    The new module will be named: <span className="text-primary">{moduleToDuplicate.name1} (copy)</span>
                                </p>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => {
                                setShowDuplicateDialog(false);
                                setModuleToDuplicate(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleDuplicateConfirm}
                            className="bg-primary hover:bg-primary/90"
                        >
                            <CopyPlus className="mr-2 h-4 w-4" />
                            Confirm Duplicate
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default Modules;