"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Eye, EyeOff, Zap, ArrowRight, CheckCircle } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { authAPI } from "@/lib/api"

const signupSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  whopCommunityName: z.string().optional(),
})

type SignupForm = z.infer<typeof signupSchema>

export default function SignupPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = React.useState(false)
  const [isLoading, setIsLoading] = React.useState(false)
  const [error, setError] = React.useState("")

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupForm>({
    resolver: zodResolver(signupSchema),
  })

  const onSubmit = async (data: SignupForm) => {
    setIsLoading(true)
    setError("")

    try {
      const response = await authAPI.signup(data)
      
      if (response.success && response.data?.access_token) {
        localStorage.setItem("auth_token", response.data.access_token)
        router.push("/dashboard")
      } else {
        setError(response.error || "Signup failed")
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-mesh p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="flex items-center justify-center mb-8"
        >
          <div className="flex items-center space-x-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white shadow-lg">
              <Zap className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Whop Lead Engine</h1>
              <p className="text-white/80 text-sm">AI-Powered Lead Generation</p>
            </div>
          </div>
        </motion.div>

        {/* Signup Card */}
        <Card className="glass border-white/20">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center text-white">Create your account</CardTitle>
            <CardDescription className="text-center text-white/80">
              Start generating high-quality leads today
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="p-3 rounded-lg bg-red-500/20 border border-red-500/30 text-red-200 text-sm"
                >
                  {error}
                </motion.div>
              )}

              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-white">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="John Doe"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                  error={!!errors.fullName}
                  {...register("fullName")}
                />
                {errors.fullName && (
                  <p className="text-red-300 text-sm">{errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-white">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john@example.com"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                  error={!!errors.email}
                  {...register("email")}
                />
                {errors.email && (
                  <p className="text-red-300 text-sm">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-white">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a strong password"
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/60 pr-12"
                    error={!!errors.password}
                    {...register("password")}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 text-white/60 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {errors.password && (
                  <p className="text-red-300 text-sm">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="whopCommunityName" className="text-white">
                  Whop Community Name <span className="text-white/60">(Optional)</span>
                </Label>
                <Input
                  id="whopCommunityName"
                  type="text"
                  placeholder="e.g., Entrepreneur Hub"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/60"
                  {...register("whopCommunityName")}
                />
                <p className="text-white/60 text-xs">
                  You can add this later in settings
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-white text-gray-900 hover:bg-gray-100"
                loading={isLoading}
              >
                {!isLoading && <ArrowRight className="mr-2 h-4 w-4" />}
                Create Account
              </Button>
            </form>


            <div className="text-center text-sm text-white/80">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-white underline hover:text-white/80 transition-colors"
              >
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-8 space-y-3"
        >
          {[
            "AI-powered lead discovery from Reddit & Twitter",
            "Automated personalized outreach campaigns",
            "Advanced member retention analytics",
            "Revenue tracking and optimization"
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1, duration: 0.3 }}
              className="flex items-center space-x-2 text-white/80 text-sm"
            >
              <CheckCircle className="h-4 w-4 text-green-400" />
              <span>{feature}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}