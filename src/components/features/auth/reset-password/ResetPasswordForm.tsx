"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import Link from "next/link"
import { ArrowLeft, CheckCircle, Eye, EyeOff, Lock } from "lucide-react"

import { Button } from "@/components/ui/button/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form/form";
import { Input } from "@/components/ui/input/input";
import { toast } from "sonner"
import { useState } from "react"
import { useSearchParams } from "next/navigation"
import apiClient from "@/lib/api-client"
import { useRouter } from "next/navigation"
import { resetPasswordSchema } from "@/lib/validators";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  async function onSubmit(data: z.infer<typeof resetPasswordSchema>) {
    setIsLoading(true)
    if (!token) {
      toast.error("Missing password reset token.")
      setIsLoading(false)
      return;
    }
    try {
      const response = await apiClient.post<{ message: string }>("/auth/reset-password", {
        token,
        password: data.password,
      });
      toast.success(response.message);
      setIsSuccess(true)
      // Redirect after a short delay to let user see success state
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unexpected error occurred.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  if (isSuccess) {
    return (
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">Password Reset Successful</h3>
            <p className="text-sm text-muted-foreground">
              Your password has been updated. Redirecting to login...
            </p>
          </div>
        </div>
        
        <Button asChild className="w-full">
          <Link href="/login">
            Continue to Login
          </Link>
        </Button>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-4">
          <h3 className="text-lg font-semibold text-destructive">Invalid Reset Link</h3>
          <p className="text-sm text-muted-foreground">
            This password reset link is invalid or has expired.
          </p>
        </div>
        
        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/forgot-password">
              Request New Reset Link
            </Link>
          </Button>
          
          <Button asChild variant="ghost" className="w-full">
            <Link href="/login">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Login
            </Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-md space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">New Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"} 
                      className="h-11 pr-10"
                      placeholder="Enter your new password"
                      {...field} 
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-foreground">Confirm New Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type={showConfirmPassword ? "text" : "password"} 
                      className="h-11 pr-10"
                      placeholder="Confirm your new password"
                      {...field} 
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <Button 
            type="submit" 
            disabled={isLoading}
            className="w-full h-11"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Resetting Password...
              </>
            ) : (
              <>
                <Lock className="h-4 w-4 mr-2" />
                Reset Password
              </>
            )}
          </Button>
        </form>
      </Form>
      
      <div className="text-center">
        <Button asChild variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
          <Link href="/login">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Login
          </Link>
        </Button>
      </div>
    </div>
  )
} 