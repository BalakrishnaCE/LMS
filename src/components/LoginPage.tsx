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
import { useLMSUserPermissions } from "@/hooks/use-lms-user-permissions";

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
  const { login, error: loginError, isLoading: isLoginLoading, currentUser } = useFrappeAuth()
  const [loginTriggered, setLoginTriggered] = React.useState(false)
  
  // Use the new LMS Users permissions hook
  const { 
    isLoading: permissionsLoading, 
    isLMSAdmin, 
    isLMSStudent, 
    isLMSContentEditor, 
    isLMSTL,
    userType,
    error: permissionsError 
  } = useLMSUserPermissions()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoggingIn(true)
    setLoginTriggered(true)
    try {
      // First, attempt to login
      const loginResponse = await login({ username: username, password: password })
      if (loginResponse) {
        toast.success("Login successful")
        // Now wait for user data to load (handled by useEffect below)
      }
    } catch (err) {
      console.error("Login failed", err)
      toast.error("Login failed. Please check your credentials.")
      setIsLoggingIn(false)
      setLoginTriggered(false)
    }
  }

  // Simplified redirect logic - single useEffect to handle all cases
  React.useEffect(() => {
    if (!loginTriggered || !currentUser) return;
    
    // Wait for permissions to load
    if (permissionsLoading) return;
    
    // Debug logging
    console.log("Login redirect logic:", {
      loginTriggered,
      currentUser,
      permissionsLoading,
      userType,
      isLMSAdmin,
      isLMSContentEditor,
      isLMSTL,
      isLMSStudent
    });
    
    // Reset login state
    setIsLoggingIn(false);
    setLoginTriggered(false);
    
    // Check if user has any valid LMS role
    if (userType) {
      // User has a valid role, redirect accordingly
      if (isLMSAdmin) {
        console.log("Redirecting to admin dashboard");
        navigate(getFullPath(ROUTES.HOME));
      } else if (isLMSContentEditor) {
        console.log("Redirecting to content editor modules");
        navigate(getFullPath(ROUTES.MODULES));
      } else if (isLMSTL) {
        console.log("Redirecting to TL dashboard");
        navigate(getFullPath(ROUTES.TL_DASHBOARD));
      } else if (isLMSStudent) {
        console.log("Redirecting to learner dashboard");
        navigate(getFullPath(ROUTES.LEARNER_DASHBOARD));
      }
    } else {
      // User is logged in but has no LMS role - redirect to login
      console.log("No valid user type found, redirecting to login");
      navigate(getFullPath(ROUTES.LOGIN));
    }
  }, [userType, isLMSAdmin, isLMSStudent, isLMSContentEditor, isLMSTL, permissionsLoading, loginTriggered, currentUser]);

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
                disabled={isLoggingIn || permissionsLoading}
              >
                {isLoggingIn || permissionsLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isLoggingIn ? "Logging in..." : "Loading permissions..."}
                  </>
                ) : (
                  "Sign In"
                )}
              </Button>
            </motion.div>
            {loginError && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center mt-2"
              >
                <Lottie animationData={errorAnimation} loop style={{ width: 80, height: 80 }} />
                <div className="text-red-500 text-sm text-center mt-2">{loginError.message || "Login error"}</div>
              </motion.div>
            )}
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
