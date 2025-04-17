import { SectionCards } from "@/components/section-cards"
import Module from "@/components/Modules"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Learners from "@/components/Learners"
import { useFrappeAuth } from "frappe-react-sdk"


function Dashboard() {
  const { currentUser,  error, isLoading } = useFrappeAuth()
  if (isLoading) {
    return <div>Loading...</div>
  }
  if (error) {
    return <div>Error: {error.message}</div>
  }
  if (!currentUser) {
    return <div>Not logged in</div>
  }
  console.log(currentUser)
  
  return (
    <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <SectionCards />
              <div className="px-4 lg:px-6 @xl/main:px-8 @5xl/main:px-10 @container/main:px-12 w-full mt-4">
              <Tabs defaultValue="module" >
                <TabsList className="w-1/2 mb-2">
                  <TabsTrigger value="module" >Module</TabsTrigger>
                  <TabsTrigger value="learners" >Learners</TabsTrigger>
                </TabsList>
                <TabsContent value="module"><Module /></TabsContent>
                <TabsContent value="learners"><Learners/></TabsContent>
              </Tabs>
              </div>

              
            </div>
          </div>
        </div>
  )
}

export default Dashboard