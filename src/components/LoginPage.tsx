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
import { useFrappeAuth, useFrappeGetDoc } from "frappe-react-sdk"
import { toast } from "sonner"
import { navigate } from "wouter/use-browser-location"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { motion, HTMLMotionProps } from "framer-motion"
import { useUser } from "@/hooks/use-user"
import { ROUTES, getFullPath } from "@/config/routes"

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
  const { login, error: loginError, isLoading: isLoginLoading } = useFrappeAuth()
  const { user, isLoading: isUserLoading, isLMSAdmin, isLMSStudent, isLMSContentEditor } = useUser()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoggingIn(true)

    try {
      // First, attempt to login
      const loginResponse = await login({ username: username, password: password })
      
      if (loginResponse) {
        toast.success("Login successful")
        
        // Wait for user data to be loaded
        const checkUserData = setInterval(() => {
          if (user) {
            clearInterval(checkUserData)
            setIsLoggingIn(false)
            
            // Redirect based on role
            if (isLMSAdmin) {
              navigate(getFullPath(ROUTES.HOME))
            } else if (isLMSContentEditor) {
              navigate(getFullPath(ROUTES.MODULES))
            } else if (isLMSStudent) {
              navigate(getFullPath(ROUTES.LEARNER_DASHBOARD))
            } else {
              navigate(getFullPath(ROUTES.LOGIN))
              toast.error("You don't have the required permissions to access this system")
            }
          }
        }, 100) // Check every 100ms

        // Clear interval after 5 seconds if user data is not loaded
        setTimeout(() => {
          clearInterval(checkUserData)
          if (!user) {
            setIsLoggingIn(false)
            toast.error("Failed to load user data. Please try again.")
          }
        }, 5000)
      }
    } catch (err) {
      console.error("Login failed", err)
      toast.error("Login failed. Please check your credentials.")
      setIsLoggingIn(false)
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
            {loginError && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-500 text-sm text-center mt-2"
              >
                {loginError.message || "Login error"}
              </motion.p>
            )}
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
