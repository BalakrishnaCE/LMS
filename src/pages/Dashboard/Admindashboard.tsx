import * as React from "react"
import { useState } from "react"
import { AdminDashboardCards } from "@/components/AdminDashboardCards"
import Module from "@/pages/Modules/Modules"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Learners from "@/pages/Learners/Learners"
import { Spinner } from '@/components/ui/spinner';
import { useFrappeAuth, useFrappeGetDoc } from "frappe-react-sdk"


function Admindashboard() {
    const [userName, setUserName] = React.useState("")
    const [isLoading, setIsLoading] = React.useState(true)
      const { currentUser} = useFrappeAuth()
      const { data, error: docError, isValidating } = useFrappeGetDoc(
        "User",
        currentUser ?? undefined,
        {
          fields: ["name", "full_name", "email", "image", "role"],
        }
      )
       // async function to get user detials
      async function getUserDetails() {
        if (isValidating) {
          setIsLoading(true)
        }
        if (data) {
          const roles = data.roles
          const isLMSAdmin = roles.some((role: { role: string }) => role.role === "LMS Student");        
          // console.log(isLMSAdmin)
          setUserName(data.first_name)
          setIsLoading(false)
        }
        if (docError) {
          console.log(docError)
        }
      }  
    const [activeTab, setActiveTab] = useState("module")
  
  React.useEffect(() => {
    getUserDetails()
  }, [data, isValidating])
  return (
    <div className="flex flex-1 flex-col">
      {isLoading ? (
      <div className="text-center flex justify-center items-center h-full ">
      <Spinner size="small" />
    {/* <Spinner size="medium" /> */}
    {/* <Spinner size="large" /> */}
    </div>
    ) : (
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <AdminDashboardCards />
              <div className="px-4 lg:px-6 @xl/main:px-8 @5xl/main:px-10 @container/main:px-12 w-full mt-4">
              <Tabs defaultValue="module" >
                <TabsList className="w-1/2 mb-2">
                  <TabsTrigger value="module" >Module</TabsTrigger>
                  <TabsTrigger value="learners" >Learners</TabsTrigger>
                </TabsList>
                <TabsContent value="module"><Module itemsPerPage={5} /></TabsContent>
                <TabsContent value="learners"><Learners/></TabsContent>
              </Tabs>
              </div>
            </div>
          </div>
          )}
        </div>
  )
}

export default Admindashboard