import * as React from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { navigate } from "wouter/use-browser-location"
import { ROUTES, getFullPath } from "@/config/routes"
import { useUser } from "@/hooks/use-user"
import { ArrowLeft, Home } from "lucide-react"

export default function NotFound() {
  const { user } = useUser()

  const handleGoBack = () => {
    window.history.back()
  }

  const handleGoHome = () => {
    if (user) {
      // Navigate to appropriate dashboard based on user role
      if (user.roles.some(role => role.role === "LMS Admin")) {
        navigate(getFullPath(ROUTES.HOME))
      } else {
        navigate(getFullPath(ROUTES.LEARNER_DASHBOARD))
      }
    } else {
      navigate(getFullPath(ROUTES.HOME))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full text-center space-y-8"
      >
        {/* 404 Text */}
        <div className="space-y-4">
          <motion.h1
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="text-9xl font-bold text-primary"
          >
            404
          </motion.h1>
          <motion.h2
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-semibold"
          >
            Oops! Page Not Found
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-muted-foreground text-lg"
          >
            The page you're looking for doesn't exist or has been moved.
          </motion.p>
        </div>

        {/* Decorative Elements */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="relative h-32"
        >
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-32 h-32 border-4 border-primary rounded-full animate-pulse" />
            <div className="absolute w-24 h-24 border-4 border-primary/50 rounded-full animate-ping" />
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <Button
            variant="outline"
            size="lg"
            onClick={handleGoBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
          <Button
            size="lg"
            onClick={handleGoHome}
            className="flex items-center gap-2"
          >
            <Home className="h-4 w-4" />
            Go to Dashboard
          </Button>
        </motion.div>

        {/* Additional Help Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-sm text-muted-foreground"
        >
          Need help? Contact support if you believe this is a mistake.
        </motion.p>
      </motion.div>
    </div>
  )
} 