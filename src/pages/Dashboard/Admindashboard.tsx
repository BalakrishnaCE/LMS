import * as React from "react"
import { useState } from "react"
import { AdminDashboardCards } from "@/components/AdminDashboardCards"
import Module from "@/pages/Modules/Modules"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LearnersTable } from "@/pages/Learners/LearnersTable"
import { useUser } from "@/hooks/use-user"
import { useFrappeGetCall } from "frappe-react-sdk"
import { useLMSAnalytics, useLearnersData } from "@/lib/api"
import { motion, AnimatePresence } from "framer-motion"
import Lottie from 'lottie-react';
import loadingAnimation from '@/assets/Loading.json';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5
    }
  }
}

function Admindashboard() {
    const [userName, setUserName] = React.useState("")
    const [isLoading, setIsLoading] = React.useState(true)
    const { user, isLoading: userLoading, error } = useUser();
    const [activeTab, setActiveTab] = useState("module")
    
    // Pagination state for learners
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 20

    // Fetch learners data using the learners API
    const { data: learnersData, isLoading: studentsLoading } = useLearnersData();
    const message = learnersData?.message || {};
    const users = message.users || [];
    const stats = message.users_stats;

    
    // Pagination logic
    const totalPages = Math.ceil(users.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedUsers = users.slice(startIndex, endIndex)

    React.useEffect(() => {
        if (user) {
            setUserName(user.full_name);
            setIsLoading(false);
        }
    }, [user]);

    return (
        <div className="flex flex-1 flex-col">
            <AnimatePresence mode="wait">
                {(isLoading || userLoading) ? (
                    <motion.div 
                        key="loading"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-center flex justify-center items-center h-full"
                    >
                        <Lottie animationData={loadingAnimation} loop style={{ width: 120, height: 120 }} />
                        <div className="mt-4 text-muted-foreground">Loading dashboard...</div>
                    </motion.div>
                ) : (
                    <motion.div 
                        key="content"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="@container/main flex flex-1 flex-col gap-2"
                    >
                        <motion.div 
                            variants={itemVariants}
                            className="flex flex-col gap-4 py-4 md:gap-6 md:py-6"
                        >
                            <AdminDashboardCards />
                            <motion.div 
                                variants={itemVariants}
                                className="px-4 lg:px-6 @xl/main:px-8 @5xl/main:px-10 @container/main:px-12 w-full mt-4"
                            >
                                <Tabs 
                                    defaultValue="module" 
                                    onValueChange={(value) => setActiveTab(value)}
                                >
                                    <TabsList className="w-1/2 mb-2">
                                        <TabsTrigger value="module">Module</TabsTrigger>
                                        <TabsTrigger value="learners">Learners</TabsTrigger>
                                    </TabsList>
                                    <AnimatePresence>
                                        <TabsContent value="module" key="module">
                                            <motion.div
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: 20 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <Module itemsPerPage={8} />
                                            </motion.div>
                                        </TabsContent>
                                        <TabsContent value="learners" key="learners" className="h-full">
                                            <motion.div
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ duration: 0.3 }}
                                            >
                                                <LearnersTable
                                                    learners={paginatedUsers}
                                                    isLoading={studentsLoading}
                                                    showActions={false}
                                                />
                                                
                                                {/* Pagination */}
                                                {totalPages > 1 && (
                                                    <div className="mt-6 flex flex-col items-center gap-4">
                                                        <div className="text-sm text-muted-foreground">
                                                            Showing {startIndex + 1} to {Math.min(endIndex, users.length)} of {users.length} learners
                                                        </div>
                                                        <Pagination>
                                                            <PaginationContent>
                                                                <PaginationItem>
                                                                    <PaginationPrevious 
                                                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                                                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                                                                    />
                                                                </PaginationItem>
                                                                
                                                                {/* Updated Pagination Logic with Ellipsis - matching Modules format */}
                                                                {(() => {
                                                                    const pageButtons = [];
                                                                    const maxPageButtons = 5; // Show at most 5 page numbers
                                                                    let startPage = Math.max(1, currentPage - 1);
                                                                    let endPage = Math.min(totalPages, currentPage + 1);

                                                                    // Always show first and last page
                                                                    if (currentPage <= 3) {
                                                                        startPage = 1;
                                                                        endPage = Math.min(totalPages, maxPageButtons);
                                                                    } else if (currentPage >= totalPages - 2) {
                                                                        startPage = Math.max(1, totalPages - maxPageButtons + 1);
                                                                        endPage = totalPages;
                                                                    } else {
                                                                        startPage = currentPage - 1;
                                                                        endPage = currentPage + 1;
                                                                    }

                                                                    // First page
                                                                    if (startPage > 1) {
                                                                        pageButtons.push(
                                                                            <PaginationItem key={1}>
                                                                                <PaginationLink 
                                                                                    onClick={() => setCurrentPage(1)} 
                                                                                    isActive={currentPage === 1} 
                                                                                    className="cursor-pointer"
                                                                                >
                                                                                    {1}
                                                                                </PaginationLink>
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
                                                                                <PaginationLink 
                                                                                    onClick={() => setCurrentPage(i)} 
                                                                                    isActive={currentPage === i} 
                                                                                    className="cursor-pointer"
                                                                                >
                                                                                    {i}
                                                                                </PaginationLink>
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
                                                                                <PaginationLink 
                                                                                    onClick={() => setCurrentPage(totalPages)} 
                                                                                    isActive={currentPage === totalPages} 
                                                                                    className="cursor-pointer"
                                                                                >
                                                                                    {totalPages}
                                                                                </PaginationLink>
                                                                            </PaginationItem>
                                                                        );
                                                                    }

                                                                    return pageButtons;
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
                                            </motion.div>
                                        </TabsContent>
                                    </AnimatePresence>
                                </Tabs>
                            </motion.div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

export default Admindashboard