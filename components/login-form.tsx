import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/auth-forms/button"
import { Card, CardContent } from "@/components/ui/auth-forms/card"
import Input from "@/components/ui/auth-forms/input"
import { Label } from "@/components/ui/auth-forms/label"
import { useAuth } from "@/hooks/useAuth"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function LoginForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [loading, setLoading] = useState(false)
  const { signInWithEmail, signInWithGithub, resetPassword } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const message = searchParams.get('message')
    if (message) {
      setMessage(message)
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const { user, session } = await signInWithEmail(email, password)
      console.log('Login response:', { user, session })
      
      if (!session) {
        throw new Error('No session created')
      }
      
      router.refresh()
      router.push("/dashboard")
    } catch (err) {
      console.error('Login error:', err)
      setError(err instanceof Error ? err.message : "Failed to sign in")
    } finally {
      setLoading(false)
    }
  }

  const handleGithubSignIn = async () => {
    setError("")
    try {
      await signInWithGithub()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in with GitHub")
    }
  }

  const handleForgotPassword = async (e: React.MouseEvent) => {
    e.preventDefault()
    setError("")
    
    if (!email) {
      setError("Please enter your email address")
      return
    }

    try {
      await resetPassword(email)
      setError("Check your email for password reset instructions")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send reset email")
    }
  }

  return (
    <div className={cn("flex flex-col gap-8 max-w-5xl mx-auto w-full", className)} {...props}>
      <Card className="overflow-hidden shadow-[0_0_25px_rgba(255,255,255,0.15)] transition-shadow duration-300 hover:shadow-[0_0_35px_rgba(255,255,255,0.2)] border">
        <CardContent className="grid p-0 md:grid-cols-2">
          <form className="p-8 md:p-10" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Log in</h1>
                <p className="text-balance text-muted-foreground">
                  Welcome back
                </p>
                <div className="h-6 mt-2">
                  {error && (
                    <div className="text-sm text-red-500">{error}</div>
                  )}
                  {message && (
                    <div className="text-sm text-green-500">{message}</div>
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="b5ling@uwaterloo.ca"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  tabIndex={1}
                />
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password" tabIndex={-1}>Password</Label>
                  <a
                    href="#"
                    onClick={handleForgotPassword}
                    className="ml-auto text-sm underline-offset-2 hover:underline"
                    tabIndex={3}
                  >
                    Forgot your password?
                  </a>
                </div>
                <Input 
                  id="password" 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  tabIndex={2}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
              <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border">
                <span className="relative z-10 bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <Button 
                  type="button"
                  variant="outline" 
                  className="w-full"
                  onClick={handleGithubSignIn}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                    <path
                      d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"
                      fill="currentColor"
                    />
                  </svg>
                  <span className="sr-only">Login with GitHub</span>
                  GitHub
                </Button>
              </div>
              <div className="text-center text-sm">
                Don&apos;t have an account?{" "}
                <a href="/signup" className="underline underline-offset-4">
                  Sign up
                </a>
              </div>
              <div className="text-center text-sm text-muted-foreground">
                <a href="/" className="inline-flex items-center gap-2 hover:text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                  Home
                </a>
              </div>
            </div>
          </form>
          <div className="relative hidden animate-gradient bg-gradient-to-br from-zinc-900 via-zinc-800 via-zinc-700 to-zinc-900 md:block">
            <img
              src="/blackbear.svg"
              alt="Image"
              className="absolute inset-0 h-full w-full object-contain p-8 opacity-90 transition-all duration-300 hover:opacity-100 dark:brightness-[0.4] dark:grayscale-[50%]"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
