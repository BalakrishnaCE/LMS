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
import { useFrappeGetDocList, useFrappeUpdateDoc, useFrappeGetCall } from "frappe-react-sdk"
import { BookOpen, Clock, Award, Calendar, Star, Target, Mail, Phone, MapPin, Flame, Camera } from "lucide-react"
import { toast } from "sonner"
import Lottie from 'lottie-react';
import loadingAnimation from '@/assets/Loading.json';
import AchievementShowcase from "@/components/AchievementShowcase";
import { LMS_API_BASE_URL } from "@/config/routes";

// Define Achievement type at the top if not already:
type Achievement = {
  id: string;
  icon_name: string;
  text: string;
  description: string;
  created_on?: string;
};

export default function Profile() {
  const { user, isLoading: userLoading } = useUser();
  const [activeTab, setActiveTab] = React.useState("overview")
  const [isLoading, setIsLoading] = React.useState(true)
  const [isUploading, setIsUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Fetch module progress using LearnerModuleData API
  const { data: learnerData, isLoading: learnerLoading } = useFrappeGetCall<any>("novel_lms.novel_lms.api.module_management.LearnerModuleData", {
    user: user?.email,
    limit: 100,
    offset: 0,
  });
  const modules = learnerData?.data?.modules || [];
  const meta = learnerData?.data?.meta || {};
  const totalModules = meta.total_count || 0;
  const completedModules = meta.completed_modules || 0;
  const inProgressModules = meta.in_progress_modules || 0;
  const averageProgress = meta.average_progress || 0;

  // Fetch achievements using User Achievement doctype (like in LearnerDashboard)
  const { data: userAchievements, isLoading: achievementsLoading } = useFrappeGetDocList(
    "User Achievement",
    {
      fields: [
        "name",
        "achievement",
        "created_on",
        "user",
        "achievement.icon_name",
        "achievement.text",
        "achievement.description"
      ],
      filters: [["user", "=", user?.name || ""]],
    },
    { enabled: !!user?.name }
  );
  let achievements: Achievement[] = [];
  if (userAchievements && Array.isArray(userAchievements)) {
    achievements = userAchievements.map((ua: any) => ({
      id: ua.name,
      icon_name: ua.icon_name,
      text: ua.text,
      description: ua.description,
      created_on: ua.created_on,
    }));
  }

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
      const response = await fetch(`${LMS_API_BASE_URL}/api/method/upload_file`, {
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
          <Card className="bg-primary/5 border-0 shadow-none rounded-2xl">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
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
                    <Avatar className="h-32 w-32 shadow-lg border-4 border-white">
                      <AvatarImage src={user?.user_image ? `${LMS_API_BASE_URL}${user.user_image}` : undefined} alt={user?.full_name} />
                      <AvatarFallback className="text-3xl">{user?.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <Camera className="h-8 w-8 text-white" />
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
                <div className="flex-1 space-y-2">
                  <h2 className="text-3xl font-bold leading-tight">{user?.full_name}</h2>
                  <div className="flex items-center gap-2 text-muted-foreground text-lg">
                    <Mail className="h-5 w-5" />
                    <span>{user?.email}</span>
                  </div>
                  {typeof (user as any)?.phone === 'string' && (user as any).phone && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{(user as any).phone}</span>
                    </div>
                  )}
                  {typeof (user as any)?.location === 'string' && (user as any).location && (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>{(user as any).location}</span>
                    </div>
                  )}
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
          {/* Achievements Showcase below header */}
          <div className="mt-4">
            <AchievementShowcase achievements={achievements as Achievement[]} loading={achievementsLoading} />
          </div>

          {/* Profile Content */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
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
                          <p className="text-2xl font-bold">{totalModules}</p>
                        </div>
                        <BookOpen className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Completed Modules</p>
                          <p className="text-2xl font-bold">{completedModules}</p>
                        </div>
                        <Award className="h-8 w-8 text-green-500" />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">In Progress</p>
                          <p className="text-2xl font-bold">{inProgressModules}</p>
                        </div>
                        <Clock className="h-8 w-8 text-blue-500" />
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Avg. Progress</p>
                          <p className="text-2xl font-bold">{Math.round(averageProgress)}%</p>
                        </div>
                        <Target className="h-8 w-8 text-blue-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
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