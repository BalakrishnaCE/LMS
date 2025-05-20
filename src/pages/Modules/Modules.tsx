import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import { IconPointFilled } from "@tabler/icons-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {  useFrappeGetDocList } from "frappe-react-sdk"
import { Progress } from "@/components/ui/progress"
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
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { motion } from "framer-motion"
import { Download } from "lucide-react"
import { toast } from "sonner"

interface ModulesProps {
    itemsPerPage: number;
}

type FilterOperator = "=" | "!=" | ">" | ">=" | "<" | "<=" | "like";
type Filter = [string, FilterOperator, string | number];

// Helper function to convert module data to CSV
function convertToCSV(modules: any[]) {
  const headers = ["Name", "Short Text", "Description", "Status", "Department"];
  const rows = modules.map(module => [
    module.name1,
    module.short_text,
    module.description,
    module.status,
    module.department
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

function Modules({ itemsPerPage }: ModulesProps) {
    const [page, setPage] = useState(1)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedDepartment, setSelectedDepartment] = useState("all")
    const [selectedStatus, setSelectedStatus] = useState("all")
    const [isExporting, setIsExporting] = useState(false)

    // Get departments for filter
    const { data: departments } = useFrappeGetDocList("Department", {
        fields: ["name"],
    })
    const filters: Filter[] = []
    if (selectedDepartment && selectedDepartment !== "all") {
        filters.push(["department", "=", selectedDepartment])
    }
    if (selectedStatus && selectedStatus !== "all") {
        filters.push(["status", "=", selectedStatus])
    }
    if (searchQuery) {
        filters.push(["name1", "like", `%${searchQuery}%`])
    }

    const { data: module_data, error: module_error, isValidating } = useFrappeGetDocList("LMS Module",
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
    }, [searchQuery, selectedDepartment, selectedStatus])

    const handleExport = async () => {
        try {
            setIsExporting(true);
            toast.loading("Preparing export...");

            // Fetch all modules for export, ignoring pagination
            const { data: exportData } = await useFrappeGetDocList("LMS Module", {
                fields: ["name", "name1", "short_text", "description", "status", "department"],
                limit: 0, // No limit to get all records
                filters: filters
            });

            const exportModules = exportData?.map((module: any) => ({
                name: module.name,
                name1: module.name1,
                description: module.description,
                status: module.status,
                short_text: module.short_text,
                department: module.department,
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

    return (
        <div>
            <div className="flex gap-4 p-4 mb-4">
                <div className="flex-1">
                    <Input
                        placeholder="Search modules..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="w-[200px]">
                    <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
                        <SelectTrigger>
                            <SelectValue placeholder="Department" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Departments</SelectItem>
                            {departments?.map((dept) => (
                                <SelectItem key={dept.name} value={dept.name}>
                                    {dept.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="w-[200px]">
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
                <Button 
                    variant="outline" 
                    className="w-auto"
                    onClick={handleExport}
                    disabled={isExporting}
                >
                    <Download className="mr-2 h-4 w-4" />
                    {isExporting ? "Exporting..." : "Export"}
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-300 p-4">
                {module_list?.map((module) => (
                    <motion.div
                        key={module.name}
                        whileHover={{ 
                            scale: 1.02,
                            transition: { duration: 0.2 }
                        }}
                        className="h-full"
                    >
                        <Card 
                            className={`@container/card border-t-2 relative overflow-hidden h-full ${module.image ? 'min-h-[200px]' : ''}`} 
                        >
                            {module.image && (
                                <div 
                                    className="absolute inset-0 bg-cover bg-center"
                                    style={{ 
                                        backgroundImage: `url(${module.image.startsWith('http') ? module.image : `http://10.80.4.72${module.image}`})`,
                                    }}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/70 to-black/70" />
                                </div>
                            )}
                            <CardHeader className={`relative ${module.image ? 'text-white' : ''}`}>
                                <div className="flex items-center justify-between gap-2">
                                    <CardTitle className={`text-sm font-semibold ${module.image ? 'drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)]' : ''}`}>
                                        {module.name1}
                                    </CardTitle>
                                    {module.status === "Published" ? (
                                        <Badge variant="outline" className="bg-green-50/95 text-green-700 border-green-200 shrink-0">
                                            <IconPointFilled className="text-green-500 mr-1 h-2 w-2" />
                                            Published
                                        </Badge>
                                    ) : module.status === "Approval Pending" ? (
                                        <Badge variant="outline" className="bg-amber-50/95 text-amber-700 border-amber-200 shrink-0">
                                            <IconPointFilled className="text-amber-500 mr-1 h-2 w-2" />
                                            Pending
                                        </Badge>
                                    ) : (
                                        <Badge variant="outline" className="bg-gray-50/95 text-gray-700 border-gray-200 shrink-0">
                                            <IconPointFilled className="text-gray-500 mr-1 h-2 w-2" />
                                            Draft
                                        </Badge>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent className={`relative ${module.image ? 'text-white' : ''}`}>
                                <CardDescription className={`${module.image ? 'text-white/95 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]' : ''}`}>
                                    {module.short_text}
                                </CardDescription>
                            </CardContent>
                            <CardFooter className="flex justify-between flex-col gap-4 relative">
                                <Link href={`/module/${module.name}`} className="w-full">
                                    <Button 
                                        variant={ "outline"} 
                                        className={`w-full transition-colors duration-200 ${
                                             'hover:text-white'
                                        }`}
                                    >
                                        View
                                    </Button>
                                </Link>
                            </CardFooter>
                        </Card>
                    </motion.div>
                ))}
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
                        
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                            <PaginationItem key={pageNum}>
                                <PaginationLink
                                    onClick={() => handlePageChange(pageNum)}
                                    isActive={page === pageNum}
                                >
                                    {pageNum}
                                </PaginationLink>
                            </PaginationItem>
                        ))}

                        <PaginationItem>
                            <PaginationNext 
                                onClick={() => handlePageChange(Math.min(totalPages, page + 1))}
                                className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                            />
                        </PaginationItem>
                    </PaginationContent>
                </Pagination>
            </div>
        </div>
    );
}

export default Modules;