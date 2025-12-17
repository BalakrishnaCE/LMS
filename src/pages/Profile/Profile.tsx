import * as React from "react"
import { useUser } from "@/hooks/use-user"
import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useFrappeUpdateDoc } from "frappe-react-sdk"
import { BookOpen, Clock, Award, Target, Mail, Phone, MapPin, Camera } from "lucide-react"
import { toast } from "sonner"
import Lottie from 'lottie-react';
import loadingAnimation from '@/assets/Loading.json';
import AchievementShowcase from "@/components/AchievementShowcase";
import { LMS_API_BASE_URL } from "@/config/routes";
import { useLearnerModuleData, useLearnerDashboard } from "@/lib/api";

// Define Achievement type at the top if not already:
type Achievement = {
  id: string;
  icon_name: string;
  text: string;
  description: string;
  created_on?: string;
};

export default function Profile() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = React.useState("overview")
  const [isLoading, setIsLoading] = React.useState(true)
  const [isUploading, setIsUploading] = React.useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Use user email or name as fallback - API accepts both
  const userIdentifier = user?.email || user?.name || "";
  const shouldCallAPI = !!userIdentifier;

  // Fetch module progress using the same approach as dashboard
  // Prioritize get_learner_dashboard (filters for published modules) over useLearnerModuleData
  const { data: learnerData, error: learnerError, isLoading: learnerLoading } = useLearnerModuleData(userIdentifier, {
    limit: 100,
    offset: 0,
  }, { enabled: shouldCallAPI && userIdentifier.trim() !== "" });
  
  // Also fetch from learner dashboard API as fallback (filters for published modules)
  const { data: dashboardData, error: dashboardError, isLoading: dashboardLoading } = useLearnerDashboard(
    userIdentifier, 
    { enabled: shouldCallAPI && userIdentifier.trim() !== "" }
  );

  // Extract modules and meta - match dashboard logic to handle different response formats
  let modules: any[] = [];
  let meta: any = {};
  
  // First try to use get_learner_dashboard (filters for published modules) - same as dashboard
  if (dashboardData?.message && Array.isArray(dashboardData.message) && dashboardData.message.length > 0) {
    // Transform the data to match expected format
    modules = dashboardData.message.map((item: any) => ({
      ...item.module,
      progress: item.progress
    }));
    
    // Calculate meta from modules
    meta = {
      total_modules: modules.length,
      completed_modules: modules.filter((m: any) => m.progress?.status === "Completed").length,
      in_progress_modules: modules.filter((m: any) => m.progress?.status === "In Progress").length,
      not_started_modules: modules.filter((m: any) => m.progress?.status === "Not Started").length,
      total_count: modules.length
    };
  } 
  // Fallback to useLearnerModuleData
  else if (learnerData?.message?.modules && Array.isArray(learnerData.message.modules)) {
    // Response format: { message: { modules: [...], meta: {...} } }
    modules = learnerData.message.modules || [];
    meta = learnerData.message.meta || {};
  } else if (learnerData?.modules && Array.isArray(learnerData.modules)) {
    // Direct structure: { modules: [...], meta: {...} }
    modules = learnerData.modules || [];
    meta = learnerData.meta || {};
  } else if (learnerData?.message && Array.isArray(learnerData.message)) {
    // Array format: { message: [{ module: {...}, progress: {...} }] }
    modules = learnerData.message.map((item: any) => ({
      ...item.module,
      progress: item.progress
    }));
    // Calculate meta from modules
    meta = {
      total_modules: modules.length,
      completed_modules: modules.filter((m: any) => m.progress?.status === "Completed").length,
      in_progress_modules: modules.filter((m: any) => m.progress?.status === "In Progress").length,
      not_started_modules: modules.filter((m: any) => m.progress?.status === "Not Started").length,
      total_count: modules.length
    };
  }
  
  // Check if modules have the nested structure (module.module, module.progress)
  if (modules.length > 0 && modules[0].module) {
    modules = modules.map((item: any) => ({
      ...item.module,
      progress: item.progress
    }));
  }

  // Extract stats from meta
  const totalModules = meta.total_count || meta.total_modules || modules.length || 0;
  const completedModules = meta.completed_modules || modules.filter((m: any) => m.progress?.status === "Completed").length || 0;
  const inProgressModules = meta.in_progress_modules || modules.filter((m: any) => m.progress?.status === "In Progress").length || 0;
  
  // Calculate average progress
  const averageProgress = meta.average_progress || (modules.length > 0 
    ? Math.round(modules.reduce((sum: number, m: any) => {
        const progress = m.progress?.overall_progress ?? m.progress?.progress ?? 0;
        return sum + (typeof progress === 'number' && !isNaN(progress) ? progress : 0);
      }, 0) / modules.length)
    : 0);
  
  // Debug logging for extracted data
  console.log('🔍 Profile - Extracted data:', {
    userIdentifier,
    hasDashboardData: !!dashboardData,
    hasLearnerData: !!learnerData,
    modulesCount: modules.length,
    totalModules,
    completedModules,
    inProgressModules,
    averageProgress,
    meta,
    modules: modules.map((m: any) => ({ name: m.name1, status: m.progress?.status }))
  });

  // Fetch achievements using direct API call (same as LearnerDashboard)
  // This approach works better with child table fields
  const [profileAchievements, setProfileAchievements] = React.useState<any[]>([]);
  const [achievementsLoading, setAchievementsLoading] = React.useState(true);
  
  // Try both user.name and user.email as the user identifier might vary
  const userIdentifierForAchievements = user?.name || user?.email || "";
  
  const fetchAchievements = React.useCallback(async () => {
    if (!userIdentifierForAchievements) {
      setAchievementsLoading(false);
      return;
    }
    
    try {
      setAchievementsLoading(true);
      console.log('🔍 Profile - Fetching achievements for user:', userIdentifierForAchievements);
      
      // Try with user.name first
      let response = await fetch(`${LMS_API_BASE_URL}api/resource/User Achievement?filters=[["user","=","${userIdentifierForAchievements}"]]&fields=["name","achievement","created_on","user","achievement.icon_name","achievement.text","achievement.description"]`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include'
      });
      
      let data = await response.json();
      
      // If no results with current identifier, try with email if different
      if ((!data.data || data.data.length === 0) && user?.email && user?.email !== userIdentifierForAchievements) {
        console.log('🔍 Profile - No achievements found with name, trying email:', user.email);
        response = await fetch(`${LMS_API_BASE_URL}api/resource/User Achievement?filters=[["user","=","${user.email}"]]&fields=["name","achievement","created_on","user","achievement.icon_name","achievement.text","achievement.description"]`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });
        data = await response.json();
      }
      
      console.log('🔍 Profile - Achievements API response:', {
        hasData: !!data.data,
        count: data.data?.length || 0,
        data: data.data
      });
      
      if (data.data && Array.isArray(data.data)) {
        setProfileAchievements(data.data);
      } else {
        setProfileAchievements([]);
      }
    } catch (error) {
      console.error('❌ Profile - Error fetching achievements:', error);
      setProfileAchievements([]);
    } finally {
      setAchievementsLoading(false);
    }
  }, [userIdentifierForAchievements, user?.email]);
  
  React.useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);
  
  // Refetch achievements periodically to catch newly created ones
  React.useEffect(() => {
    if (userIdentifierForAchievements) {
      const interval = setInterval(() => {
        fetchAchievements();
      }, 5000); // Refetch every 5 seconds
      return () => clearInterval(interval);
    }
  }, [userIdentifierForAchievements, fetchAchievements]);
  
  // Map API data to AchievementShowcase props
  let achievements: Achievement[] = [];
  if (profileAchievements && Array.isArray(profileAchievements)) {
    achievements = profileAchievements.map((ua: any) => ({
      id: ua.name,
      icon_name: ua.icon_name || "",
      text: ua.text || "",
      description: ua.description || "",
      created_on: ua.created_on,
    }));
    
    console.log('🔍 Profile - Mapped achievements:', achievements);
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