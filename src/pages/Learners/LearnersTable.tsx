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
import errorAnimation from '@/assets/Error.json';
import loadingAnimation from '@/assets/Loading.json';

interface User {
  name: string;
  full_name: string;
  email: string;
  enabled: number;
  department?: string;
}

interface LearnersTableProps {
  learners: User[];
  isLoading: boolean;
  onRowClick?: (learner: User) => void;
  showActions?: boolean;
}

export function LearnersTable({ learners, isLoading, onRowClick, showActions = true }: LearnersTableProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full mt-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Department</TableHead>
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
                  className="group hover:bg-muted/50 transition-colors duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
                  tabIndex={0}
                  onClick={() => onRowClick && onRowClick(learner)}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onRowClick && onRowClick(learner); }}
                >
                  <TableCell className="group-hover:text-primary transition-colors duration-200">{learner.full_name}</TableCell>
                  <TableCell className="group-hover:text-primary transition-colors duration-200">{learner.email}</TableCell>
                  <TableCell>{learner.department || '-'}</TableCell>
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
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
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