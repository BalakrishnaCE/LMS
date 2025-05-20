import * as React from "react"
import { useState } from "react"
import { AdminDashboardCards } from "@/components/AdminDashboardCards"
import Module from "@/pages/Modules/Modules"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LearnersTable } from "@/pages/Learners/LearnersTable"
import { Spinner } from '@/components/ui/spinner';
import { useUser } from "@/hooks/use-user"
import { useFrappeGetCall } from "frappe-react-sdk"
import { motion, AnimatePresence } from "framer-motion"

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

    // Fetch learners data
    const { data: studentsData, error: studentsError, isValidating: studentsLoading } = useFrappeGetCall<FrappeResponse>("getStudentRoleCount");
    const users = studentsData?.data?.users || [];

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
                        <Spinner size="small" />
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
                                    <AnimatePresence mode="wait">
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
                                                    learners={users}
                                                    isLoading={studentsLoading}
                                                />
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