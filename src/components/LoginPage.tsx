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


export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const { login, error, isLoading } = useFrappeAuth()
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      await login({ username: username, password: password })
      toast("Login Success")
      location.href = "/" // redirect on success
    } catch (err) {
      console.error("Login failed", err)
      toast("Login Failed")
    }
  }
  return (
    <div className={cn("flex flex-col gap-6 min-w-120", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin}>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="grid gap-2 mt-4">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password here"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full mt-4" disabled={isLoading}>
              {isLoading ? "Logging in..." : "Login"}
            </Button>
            {error && (
              <p className="text-red-500 text-sm mt-2">
                {error.message || "Login error"}
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
