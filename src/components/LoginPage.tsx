import React, { useLayoutEffect, useRef } from "react"
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
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { motion, HTMLMotionProps } from "framer-motion"
import { ROUTES, getFullPath, LMS_API_BASE_URL } from "@/config/routes"
import Lottie from 'lottie-react';
import errorAnimation from '@/assets/Error.json';
import loadingAnimation from '@/assets/Loading.json';

export function LoginForm({
  className,
}: React.ComponentPropsWithoutRef<"div">) {
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoggingIn, setIsLoggingIn] = React.useState(false)
  const { login, error: loginError, currentUser } = useFrappeAuth()
  const [isRedirecting, setIsRedirecting] = React.useState(false)
  const isLoggingInRef = useRef(false)
  
  // Keep ref in sync with state for synchronous checks
  useLayoutEffect(() => {
    isLoggingInRef.current = isLoggingIn || isRedirecting
  }, [isLoggingIn, isRedirecting])

  // Clear error state when component mounts (e.g., after logout)
  React.useEffect(() => {
    // If we're on login page and there's no current user, reset state
    // This handles the case after logout when auth hook might show an error
    if (!currentUser) {
      setIsRedirecting(false)
      setIsLoggingIn(false)
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
    // Set loading state immediately and synchronously to prevent form flash
    isLoggingInRef.current = true
    setIsLoggingIn(true)
    setIsRedirecting(false)
    try {
      // First, attempt to login
      const loginResponse = await login({ username: username, password: password })
      if (loginResponse) {
        // Set redirecting immediately to show loading screen and hide form
        // Keep both states true to ensure loading screen stays visible
        setIsLoggingIn(true)
        setIsRedirecting(true)
        
        // Immediately fetch user data using the username to check roles
        const trimmedUsername = username.trim()
        
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
            // Reset all loading states including ref to show login form again
            isLoggingInRef.current = false
            setIsRedirecting(false)
            setIsLoggingIn(false)
            return;
          }
          
          // Use window.location.href for immediate redirect to prevent flicker
          // This causes a full page reload which prevents any component re-rendering issues
          const fullRedirectPath = getFullPath(redirectPath);
          toast.success("Login successful")
          
          // Small delay to ensure toast is shown, then redirect
          setTimeout(() => {
            window.location.href = fullRedirectPath;
          }, 100);
          
        } catch (fetchErr: any) {
          console.error('❌ Error fetching user data:', fetchErr);
          // Reset all loading states including ref to show login form again
          isLoggingInRef.current = false
          setIsRedirecting(false)
          setIsLoggingIn(false)
          toast.error("Failed to load user data. Please try again.");
        }
      }
    } catch (err) {
      console.error("Login failed", err)
      toast.error("Login failed. Please check your credentials.")
      // Reset all loading states including ref to show login form again
      isLoggingInRef.current = false
      setIsLoggingIn(false)
      setIsRedirecting(false)
    }
  }


  // Show loading screen only when actively logging in or redirecting
  // Don't show loading if login failed (isLoggingIn will be false on error)
  // Check this FIRST before any other rendering to prevent form flash
  if (isLoggingIn || isRedirecting) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-bg-soft fixed inset-0 z-50">
        <div className="flex flex-col items-center gap-4">
          <Lottie animationData={loadingAnimation} loop style={{ width: 120, height: 120 }} />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  // Disable motion animation when logging in to prevent flash
  const motionProps: HTMLMotionProps<"div"> = {
    initial: { opacity: 0, y: 20 },
    animate: isLoggingIn || isRedirecting ? { opacity: 0 } : { opacity: 1, y: 0 },
    transition: { duration: isLoggingIn || isRedirecting ? 0 : 0.5 }
  }

  return (
    <motion.div 
      {...motionProps}
      className={cn(
        "flex flex-col gap-6 min-w-[400px] max-w-[450px] w-full px-4",
        (isLoggingIn || isRedirecting) && "opacity-0 pointer-events-none",
        className
      )} 
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
