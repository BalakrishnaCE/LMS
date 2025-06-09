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
  const { login, error: loginError, isLoading: isLoginLoading, currentUser } = useFrappeAuth()
  const [user, setUser] = React.useState<any>(null)
  const [userLoading, setUserLoading] = React.useState(false)
  const [userLoadingError, setUserLoadingError] = React.useState<string | null>(null)
  const [userError, setUserError] = React.useState<string | null>(null)
  const [isLMSAdmin, setIsLMSAdmin] = React.useState(false)
  const [isLMSStudent, setIsLMSStudent] = React.useState(false)
  const [isLMSContentEditor, setIsLMSContentEditor] = React.useState(false)
  const [loginTriggered, setLoginTriggered] = React.useState(false)

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

  // Fetch user doc after login
  React.useEffect(() => {
    if (!loginTriggered || !currentUser) return;
    setUserLoading(true);
    setUserError(null);
    // Fetch user doc using useFrappeGetDoc
    const fetchUser = async () => {
      try {
        // Use direct fetch for user doc
        // add with credentials true 
        const res = await fetch(`${LMS_API_BASE_URL}/api/resource/User/${currentUser}`, {
          credentials: "include"
        });
        const userDoc = await res.json();
        const userData = userDoc.data || userDoc;
        setUser(userData);
        // Set role flags
        const roles = (userData.roles || []) as Array<{ role: string }>;
        setIsLMSAdmin(roles.some((role: { role: string }) => role.role === "LMS Admin"));
        setIsLMSStudent(roles.some((role: { role: string }) => role.role === "LMS Student"));
        setIsLMSContentEditor(roles.some((role: { role: string }) => role.role === "LMS Content Editor"));
        setUserLoading(false);
      } catch (err: any) {
        setUserError(err?.message || "Failed to fetch user data");
        setUserLoading(false);
      }
    };
    fetchUser();
  }, [loginTriggered, currentUser]);

  // Redirect as soon as user data is available after login
  React.useEffect(() => {
    if (!loginTriggered) return;
    if (user) {
      setIsLoggingIn(false);
      setLoginTriggered(false);
      if (isLMSAdmin) {
        navigate(getFullPath(ROUTES.HOME));
      } else if (isLMSContentEditor) {
        navigate(getFullPath(ROUTES.MODULES));
      } else if (isLMSStudent) {
        navigate(getFullPath(ROUTES.LEARNER_DASHBOARD));
      } else {
        navigate(getFullPath(ROUTES.LOGIN));
        toast.error("You don't have the required permissions to access this system");
      }
    }
    // If user data doesn't load in 5 seconds, show error
    const timeout = setTimeout(() => {
      if (!user) {
        setIsLoggingIn(false);
        setLoginTriggered(false);
        toast.error("Failed to load user data. Please try again.");
      }
    }, 5000);
    return () => clearTimeout(timeout);
  }, [user, isLMSAdmin, isLMSStudent, isLMSContentEditor, loginTriggered]);

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
