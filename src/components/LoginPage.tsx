import React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useFrappeAuth } from "frappe-react-sdk"
import { toast } from "sonner"
import { navigate } from "wouter/use-browser-location"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { motion, HTMLMotionProps } from "framer-motion"
import { ROUTES, getFullPath, LMS_API_BASE_URL } from "@/config/routes"
import Lottie from 'lottie-react';
import errorAnimation from '@/assets/Error.json';

interface UserRole {
  role: string;
}

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoggingIn, setIsLoggingIn] = React.useState(false)
  const { login, error: loginError, currentUser } = useFrappeAuth()
  const [userLoading, setUserLoading] = React.useState(false)
  const [isRedirecting, setIsRedirecting] = React.useState(false)

  // Clear error state when component mounts (e.g., after logout)
  React.useEffect(() => {
    // If we're on login page and there's no current user, reset state
    // This handles the case after logout when auth hook might show an error
    if (!currentUser) {
      setIsRedirecting(false)
      setIsLoggingIn(false)
      setUserLoading(false)
    }
  }, [currentUser])
  
  // Helper function to check if error should be shown
  const shouldShowError = () => {
    // Don't show error if we're redirecting
    if (isRedirecting) return false
    
    // Don't show error if there's a current user (we're not on login page)
    if (currentUser) return false
    
    // Don't show error if it's about fetching logged in user (expected after logout)
    if (loginError?.message?.toLowerCase().includes('fetching the logged in user')) {
      return false
    }
    
    // Show error for actual login failures
    return !!loginError
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    // Reset state for new login attempt
    setUserLoading(false)
    setIsRedirecting(false)
    
    setIsLoggingIn(true)
    try {
      // First, attempt to login
      const loginResponse = await login({ username: username, password: password })
      if (loginResponse) {
        toast.success("Login successful")
        setIsRedirecting(true) // Mark that we're redirecting to prevent error display
        
        // Remove "login" from URL immediately after successful login
        const currentPath = window.location.pathname
        if (currentPath.includes('/login')) {
          // Remove /login from the path, keeping base path if it exists
          // Preserve /lms prefix if it exists in production
          const cleanPath = currentPath.replace(/\/login\/?$/, '') || getFullPath(ROUTES.HOME)
          // Ensure we maintain the base path
          const finalPath = cleanPath || getFullPath(ROUTES.HOME)
          window.history.replaceState({}, '', finalPath)
        }
        
        // Immediately fetch user data using the username to check roles
        const trimmedUsername = username.trim()
        setUserLoading(true)
        
        try {
          // Determine API base URL
          const apiBaseUrl = LMS_API_BASE_URL || '';
          const cleanApiBaseUrl = apiBaseUrl.replace(/\/$/, '');
          const apiUrl = cleanApiBaseUrl 
            ? `${cleanApiBaseUrl}/api/resource/User/${trimmedUsername}`
            : `/api/resource/User/${trimmedUsername}`;
          
        
          
          const res = await fetch(apiUrl, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
            }
          });
          
          if (!res.ok) {
            throw new Error(`Failed to fetch user: ${res.status} ${res.statusText}`);
          }
          
          const userDoc = await res.json();
          const userData = userDoc.data || userDoc;
          
          if (!userData || !userData.name) {
            throw new Error('User data not found in response');
          }
          
          const userName = userData.name; // User name (usually email)
          
          // Step 2: Get LMS Users doctype (Single doctype, name is always "LMS Users")
          const lmsUsersApiUrl = cleanApiBaseUrl 
            ? `${cleanApiBaseUrl}/api/resource/LMS Users/LMS Users`
            : `/api/resource/LMS Users/LMS Users`;
          
          const lmsUsersRes = await fetch(lmsUsersApiUrl, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Accept': 'application/json',
            }
          });
          
          if (!lmsUsersRes.ok) {
            throw new Error(`Failed to fetch LMS Users: ${lmsUsersRes.status} ${lmsUsersRes.statusText}`);
          }
          
          const lmsUsersDoc = await lmsUsersRes.json();
          const lmsUsersData = lmsUsersDoc.data || lmsUsersDoc;
          
          // Step 3: Check which child table the user exists in (priority: admin > content_editor > student)
          const lmsAdmin = (lmsUsersData.lms_admin || []).some((row: any) => row.user === userName);
          const lmsContentEditor = (lmsUsersData.lms_content_editor || []).some((row: any) => row.user === userName);
          const lmsStudent = (lmsUsersData.lms_student || []).some((row: any) => row.user === userName);
          
          // Determine redirect path based on LMS Users doctype roles
          let redirectPath = '';
          if (lmsAdmin) {
            redirectPath = ROUTES.HOME; // "/"
          } else if (lmsContentEditor) {
            redirectPath = ROUTES.MODULES; // "/modules"
          } else if (lmsStudent) {
            redirectPath = ROUTES.LEARNER_DASHBOARD; // "/learner-dashboard"
          } else {
            redirectPath = ROUTES.LOGIN; // "/login"
            toast.error("You don't have the required permissions to access this system");
          }
          
         
          
          setIsLoggingIn(false)
          setUserLoading(false)
          
          // Redirect immediately - use getFullPath to preserve /lms prefix in production
          const fullRedirectPath = getFullPath(redirectPath);
          navigate(fullRedirectPath);
          
          // Fallback: if still on login page after 200ms, force redirect
          setTimeout(() => {
            if (window.location.pathname.includes('/login') && redirectPath !== ROUTES.LOGIN) {
              window.location.href = fullRedirectPath;
            }
          }, 200);
          
        } catch (fetchErr: any) {
          console.error('❌ Error fetching user data:', fetchErr);
          setIsRedirecting(false) // Reset redirecting flag on error
          setIsLoggingIn(false)
          setUserLoading(false)
          toast.error("Failed to load user data. Please try again.");
        }
      }
    } catch (err) {
      console.error("Login failed", err)
      toast.error("Login failed. Please check your credentials.")
      setIsLoggingIn(false)
      setUserLoading(false)
    }
  }


  const motionProps: HTMLMotionProps<"div"> = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 }
  }

  return (
    <motion.div 
      {...motionProps}
      className={cn("flex flex-col gap-6 min-w-[400px] max-w-[450px] w-full px-4", className)} 
    >
      <Card className="border-2 border-border/50 shadow-lg">
        <CardHeader className="space-y-1">
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <CardTitle className="text-2xl font-bold text-center">Welcome Back</CardTitle>
            <CardDescription className="text-center mt-2">
              Enter your credentials to access your account
            </CardDescription>
          </motion.div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">Email</Label>
              <motion.div
                whileFocus={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
              >
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-11"
                  disabled={isLoggingIn}
                />
              </motion.div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Password</Label>
              <motion.div
                whileFocus={{ scale: 1.01 }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-11 pr-10"
                  disabled={isLoggingIn}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-11 px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoggingIn}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </motion.div>
            </div>
            <motion.div
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <Button 
                type="submit" 
                className="w-full h-11 font-medium" 
                disabled={isLoggingIn}
              >
                {isLoggingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in...
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </motion.div>
            {shouldShowError() && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center mt-2"
              >
                <Lottie animationData={errorAnimation} loop style={{ width: 80, height: 80 }} />
                <div className="text-red-500 text-sm text-center mt-2">
                  {loginError?.message || "Login failed. Please check your credentials and try again."}
                </div>
              </motion.div>
            )}
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
