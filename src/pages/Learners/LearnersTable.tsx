import * as React from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import Lottie from 'lottie-react';
import loadingAnimation from '@/assets/Loading.json';
import { Badge } from "@/components/ui/badge";

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
  role?: string; // Add role field from backend
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

interface LearnersTableProps {
  learners: User[];
  isLoading: boolean;
  showActions?: boolean;
  onViewDetails?: (learner: User) => void;
  onEdit?: (learner: User) => void;
  departmentIdToName?: Record<string, string>;
}

export function LearnersTable({ learners, isLoading, showActions = true, onViewDetails, onEdit, departmentIdToName = {} }: LearnersTableProps) {
  const handleEdit = (learner: User) => {
    if (onEdit) {
      onEdit(learner);
    }
  };

  const handleRowClick = (learner: User, event: React.MouseEvent) => {
    // Prevent row click when clicking on edit button
    if (!(event.target as HTMLElement).closest('button')) {
      if (onViewDetails) {
        onViewDetails(learner);
      }
    }
  };

  // Helper function to get departments to display
  const getDepartmentsToDisplay = (learner: User) => {
    // Check for multiple departments first
    if (learner.departments && Array.isArray(learner.departments) && learner.departments.length > 0) {
      return learner.departments;
    }
    // Fallback to single department
    if (learner.department) {
      return [learner.department];
    }
    return [];
  };

  return (
    <motion.div 
      className="flex flex-col items-center justify-center h-full w-full mt-4"
      layout
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            {/*<TableHead>Role</TableHead>*/}
            <TableHead>Departments</TableHead>
            <TableHead>Status</TableHead>
            {showActions && <TableHead>Edit</TableHead>}
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
) : learners.length === 0 ? (
  <TableRow>
    <TableCell colSpan={showActions ? 5 : 4} className="text-center py-8">
      <div className="text-muted-foreground">No learners found matching your criteria</div>
    </TableCell>
  </TableRow>
          ) : (
            <AnimatePresence mode="popLayout">
              {learners.map((learner) => (
                <motion.tr
                  key={`${learner.name}-${learner.email}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ 
                    duration: 0.15,
                    ease: "easeOut"
                  }}
                  className="group hover:bg-muted/50 transition-colors duration-200 cursor-pointer"
                  onClick={(e) => handleRowClick(learner, e)}
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
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(learner);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </motion.tr>
              ))}
            </AnimatePresence>
          )}
        </TableBody>
      </Table>
    </motion.div>
  );
}