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
import { Label } from "@/components/ui/label"

interface ModulesProps {
    itemsPerPage: number;
}

type FilterOperator = "=" | "!=" | ">" | ">=" | "<" | "<=" | "like";
type Filter = [string, FilterOperator, string | number];

function Modules({ itemsPerPage }: ModulesProps) {
    const [page, setPage] = useState(1)
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedDepartment, setSelectedDepartment] = useState("all")
    const [selectedStatus, setSelectedStatus] = useState("all")

    // Get departments for filter
    const { data: departments } = useFrappeGetDocList("Department", {
        fields: ["name"],
    })
    console.log(departments)
    const filters: Filter[] = []
    if (selectedDepartment && selectedDepartment !== "all") {
        filters.push(["department", "=", selectedDepartment])
    }
    if (selectedStatus && selectedStatus !== "all") {
        filters.push(["is_published", "=", selectedStatus === "published" ? 1 : 0])
    }
    if (searchQuery) {
        filters.push(["name1", "like", `%${searchQuery}%`])
    }

    const { data: module_data, error: module_error, isValidating } = useFrappeGetDocList("LMS Module",
        {
          fields: ["name", "name1", "short_text", "description", "is_published", "image", "department"],
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

    const module_list = module_data?.map((module: { name: string; name1: string; description: string; is_published: number; image: string; short_text: string; department: string }) => ({
        name: module.name,
        name1: module.name1,
        description: module.description,
        is_published: module.is_published,
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
                            <SelectItem value="published">Published</SelectItem>
                            <SelectItem value="draft">Draft</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 max-w-300 p-4">
                {module_list?.map((module) => (
                    <Card className="@container/card border-t-2 " key={module.name}>
                        <CardHeader>
                            <CardTitle className="text-sm ont-semibold ">
                                {module.name1}
                            </CardTitle>
                            <CardAction>
                                {module.is_published === 1 ? (
                                    <Badge variant="outline" >
                                        <IconPointFilled className="text-primary" />
                                        <p className="">Published</p>
                                    </Badge>
                                ) : (
                                    <Badge variant="outline" >
                                        <IconPointFilled className="text-accent-foreground" />
                                        <p className="">Draft</p>
                                    </Badge>
                                )}
                            </CardAction>
                        </CardHeader>
                        <CardContent>
                            <CardDescription>{module.short_text}</CardDescription>
                        </CardContent>
                        <CardFooter className="flex justify-between flex-col gap-4">
                            <Progress value={10} className="text-sm" />
                            <Link href={`/module/${module.name}`} className="w-full">
                                <Button variant="outline" className="hover:text-white w-full">View</Button>
                            </Link>
                        </CardFooter>
                    </Card>
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