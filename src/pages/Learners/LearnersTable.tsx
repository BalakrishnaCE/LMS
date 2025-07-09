import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Eye, MoreHorizontal, Pencil } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Lottie from 'lottie-react';
import loadingAnimation from '@/assets/Loading.json';
import { Badge } from "@/components/ui/badge";
import { useFrappeGetDocList } from "frappe-react-sdk";

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

interface LearnersTableProps {
  learners: User[];
  isLoading: boolean;
  showActions?: boolean;
  onViewDetails?: (learner: User) => void;
  onEdit?: (learner: User) => void;
}

export function LearnersTable({ learners, isLoading, showActions = true, onViewDetails, onEdit }: LearnersTableProps) {
  const [dropdownKey, setDropdownKey] = React.useState(0);
  const [openDropdown, setOpenDropdown] = React.useState<string | null>(null);

  // Fetch departments for mapping IDs to names
  const { data: departments } = useFrappeGetDocList("Department", {
    fields: ["name", "department"],
    limit: 150,
  });
  const departmentIdToName = React.useMemo(() =>
    Object.fromEntries((departments || []).map(d => [d.name, d.department])), [departments]);

  const handleEdit = (learner: User) => {
    // Reset dropdown key to force re-render and close any open dropdowns
    setDropdownKey(prev => prev + 1);
    setOpenDropdown(null);
    if (onEdit) {
      onEdit(learner);
    }
  };

  const handleViewDetails = (learner: User) => {
    // Reset dropdown key to force re-render and close any open dropdowns
    setDropdownKey(prev => prev + 1);
    setOpenDropdown(null);
    if (onViewDetails) {
      onViewDetails(learner);
    }
  };

  const handleDropdownOpenChange = (learnerName: string, open: boolean) => {
    setOpenDropdown(open ? learnerName : null);
  };

  // Helper function to get departments to display
  const getDepartmentsToDisplay = (learner: User) => {
    if (learner.departments && learner.departments.length > 0) {
      return learner.departments;
    }
    if (learner.department) {
      return [learner.department];
    }
    return [];
  };

  return (
    <div className="flex flex-col items-center justify-center h-full w-full mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Departments</TableHead>
            <TableHead>Status</TableHead>
            {showActions && <TableHead>Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody className="text-secondary-foreground">
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={showActions ? 5 : 4} className="text-center">
                <Lottie animationData={loadingAnimation} loop style={{ width: 80, height: 80 }} />
                <div className="mt-2 text-muted-foreground">Loading learners...</div>
              </TableCell>
            </TableRow>
          ) : (
            <AnimatePresence>
              {learners.map((learner, index) => (
                <motion.tr
                  key={learner.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2, delay: index * 0.1 }}
                  className="group hover:bg-muted/50 transition-colors duration-200"
                >
                  <TableCell className="group-hover:text-primary transition-colors duration-200">{learner.full_name}</TableCell>
                  <TableCell className="group-hover:text-primary transition-colors duration-200">{learner.email}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {getDepartmentsToDisplay(learner).length > 0 ? (
                        getDepartmentsToDisplay(learner).map((dept, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {departmentIdToName[dept] || dept}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs transition-all duration-200 ${
                      learner.enabled === 1 
                        ? "bg-green-100 text-green-800 group-hover:bg-green-200" 
                        : "bg-red-100 text-red-800 group-hover:bg-red-200"
                    }`}>
                      {learner.enabled === 1 ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  {showActions && (
                    <TableCell>
                      <DropdownMenu key={`${learner.name}-${dropdownKey}`} open={openDropdown === learner.name} onOpenChange={handleDropdownOpenChange.bind(null, learner.name)}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={handleViewDetails.bind(null, learner)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={handleEdit.bind(null, learner)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </motion.tr>
              ))}
            </AnimatePresence>
          )}
        </TableBody>
      </Table>
    </div>
  );
} 