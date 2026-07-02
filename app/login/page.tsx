"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LayoutDashboard } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password")
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch (error) {
      setError("An error occurred. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full lg:grid lg:min-h-screen lg:grid-cols-2">
      <div className="flex flex-col min-h-screen">
        {/* Top Left Branding */}
        <div className="p-8 flex items-center gap-2">
          <LayoutDashboard className="h-6 w-6 text-primary" />
          <span className="font-bold text-xl">DemandStudio</span>
        </div>

        {/* Centered Form */}
        <div className="flex-1 flex items-center justify-center p-8">
          <Card className="w-full max-w-[400px] shadow-lg border-opacity-50">
            <CardHeader className="text-center space-y-1">
              <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
              <CardDescription>
                Sign in to access your CMS dashboard and manage your content efficiently.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="grid gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email or User ID</Label>
                  <Input
                    id="email"
                    type="text"
                    placeholder="m@example.com or DM-AB-0001"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-primary underline-offset-4 hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                {/* Checkbox for agreement could go here if needed as per image, skipping for now as not explicitly asked but shown in image. User said "similar but more attractive like image". I'll stick to the core request. */}

                {error && (
                  <p className="text-sm text-destructive text-center">{error}</p>
                )}

                <Button type="submit" className="w-full mt-2" disabled={loading}>
                  {loading ? "Signing in..." : "Login"}
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground w-full">
                <Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link>
                <Link href="/contact" className="hover:text-primary transition-colors">Contact Us</Link>
              </div>
              <div className="text-center text-sm w-full">
                Don&apos;t have an account?{" "}
                <Link href="/signup" className="underline text-primary">
                  Sign up
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>

        {/* Bottom Powered By */}
        <div className="p-6 text-center text-sm text-muted-foreground">
          Powered by Demand Tech
        </div>
      </div>

      {/* Right Side Image */}
      <div className="hidden bg-muted lg:block relative">
        <div className="h-full w-full relative">
          <img
            src="/ui/login-page/login-light.png"
            alt="Login Light Mode"
            className="absolute inset-0 h-full w-full object-cover dark:hidden"
          />
          <img
            src="/ui/login-page/login-dark.png"
            alt="Login Dark Mode"
            className="absolute inset-0 h-full w-full object-cover hidden dark:block"
          />
        </div>
      </div>
    </div>
  )
}
