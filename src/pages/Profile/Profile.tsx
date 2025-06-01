import * as React from "react"
import { useUser } from "@/hooks/use-user"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useFrappeGetDocList, useFrappeUpdateDoc } from "frappe-react-sdk"
import { BookOpen, Clock, Award, Calendar, Star, Target, Mail, Phone, MapPin, Flame, Camera } from "lucide-react"
import { toast } from "sonner"
import Lottie from 'lottie-react';
import loadingAnimation from '@/assets/Loading.json';

export default function Profile() {
  const { user, isLoading: userLoading } = useUser();
  const [activeTab, setActiveTab] = React.useState("overview")
  const [isLoading, setIsLoading] = React.useState(true)
  const [isUploading, setIsUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Fetch user's enrolled modules
  const { data: enrolledModules, isLoading: modulesLoading } = useFrappeGetDocList(
    "LMS Module",
    {
      fields: ["name", "name1", "description", "progress"],
      filters: [["status", "=", "Published"]],
    }
  );

  // Fetch user's achievements
  const { data: achievements, isLoading: achievementsLoading } = useFrappeGetDocList(
    "LMS Achievement",
    {
      fields: ["name", "title", "description", "date_earned"],
      filters: [["user", "=", user?.name || ""]],
    }
  );

  const { updateDoc } = useFrappeUpdateDoc()

  React.useEffect(() => {
    if (user) {
      setIsLoading(false);
    }
  }, [user]);

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    try {
      setIsUploading(true)
      
      // Create a FormData object
      const formData = new FormData()
      formData.append('file', file)
      formData.append('doctype', 'User')
      formData.append('docname', user.name)
      formData.append('fieldname', 'user_image')
      formData.append('is_private', '0')

      // Upload the file
      const response = await fetch('http://10.80.4.72/api/method/upload_file', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('Failed to upload image')
      }

      const data = await response.json()
      
      // Update the user's image field
      await updateDoc('User', user.name, {
        user_image: data.message.file_url
      })

      toast.success('Profile image updated successfully')
    } catch (error) {
      console.error('Error uploading image:', error)
      toast.error('Failed to update profile image')
    } finally {
      setIsUploading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <Lottie animationData={loadingAnimation} loop style={{ width: 120, height: 120 }} />
        <div className="mt-4 text-muted-foreground">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 md:p-8">
      <AnimatePresence mode="wait">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="flex flex-col gap-4"
        >
          {/* Profile Header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="relative group">
                  <div 
                    className="cursor-pointer" 
                    onClick={handleImageClick}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        handleImageClick();
                      }
                    }}
                  >
                    <Avatar className="h-24 w-24">
                      <AvatarImage src={"http://10.80.4.72"+user?.user_image} alt={user?.full_name} />
                      <AvatarFallback className="text-2xl">{user?.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageChange}
                    disabled={isUploading}
                  />
                  {isUploading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                      <Lottie animationData={loadingAnimation} loop style={{ width: 120, height: 120 }} />
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <h2 className="text-2xl font-bold">{user?.full_name}</h2>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span>{user?.email}</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {user?.roles?.map((role) => (
                      <Badge key={role.role} variant="secondary">
                        {role.role}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Profile Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Learning Progress</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Enrolled Modules</p>
                          <p className="text-2xl font-bold">{enrolledModules?.length || 0}</p>
                        </div>
                        <BookOpen className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Completed Modules</p>
                          <p className="text-2xl font-bold">
                            {enrolledModules?.filter(m => m.progress === 100).length || 0}
                          </p>
                        </div>
                        <Target className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Achievements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Total Achievements</p>
                          <p className="text-2xl font-bold">{achievements?.length || 0}</p>
                        </div>
                        <Award className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Learning Streak</p>
                          <p className="text-2xl font-bold">7 days</p>
                        </div>
                        <Flame className="h-8 w-8 text-muted-foreground" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {enrolledModules?.slice(0, 5).map((module) => (
                      <div key={module.name} className="flex items-center gap-4">
                        <div className="flex-1">
                          <p className="font-medium">{module.name1}</p>
                          <p className="text-sm text-muted-foreground">{module.description}</p>
                        </div>
                        <Badge variant="secondary">{module.progress}%</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Account Settings</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name</Label>
                      <Input id="name" value={user?.full_name} disabled />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" value={user?.email} disabled />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Contact your administrator to update your name or email.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </AnimatePresence>
    </div>
  )
} 