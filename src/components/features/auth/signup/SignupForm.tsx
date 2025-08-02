"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form/form"
import { Input } from "@/components/ui/input/input"
import { toast } from "sonner"
import { signupSchema } from "@/lib/validators"
import { useState, useEffect, useTransition } from "react"
import { signup } from "@/lib/actions"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"

type SignupFormValues = z.infer<typeof signupSchema>

type State = {
  message?: string | null
  errors?: {
    email?: string[]
    password?: string[]
    confirmPassword?: string[]
  }
  success: boolean
}

const initialState: State = {
  message: null,
  errors: undefined,
  success: false,
}

export function SignupForm() {
  const [state, setState] = useState(initialState);
  const [isPending, startTransition] = useTransition();
  const router = useRouter()
  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
    },
  })

  useEffect(() => {
    if (state.success) {
      toast.success(state.message)
      router.push("/login")
    }
    if (state.message && !state.success) {
      toast.error(state.message)
    }
  }, [state, router])

  const onSubmit = (values: SignupFormValues) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("email", values.email);
      formData.append("password", values.password);
      formData.append("confirmPassword", values.confirmPassword);
      const result = await signup(initialState, formData);
      setState(result);
    });
  };

  const formVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 }
    }
  };

  return (
    <Form {...form}>
      <motion.form
        variants={formVariants}
        initial="hidden"
        animate="visible"
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-5"
      >
        <div className="space-y-4">
          <motion.div variants={itemVariants}>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-slate-300 mb-2 block">
                    Email address
                  </FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <Input
                        placeholder="Enter your email"
                        className="h-12 text-base px-4 bg-slate-800/40 border border-slate-600/50 text-white rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-slate-800/60 transition-all duration-300 placeholder:text-slate-400 backdrop-blur-sm group-hover:border-slate-500/60"
                        {...field}
                        disabled={isPending}
                        autoComplete="email"
                      />
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs mt-1 text-red-400" />
                </FormItem>
              )}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-slate-300 mb-2 block">
                    Password
                  </FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <Input
                        type="password"
                        placeholder="Enter your password"
                        className="h-12 text-base px-4 bg-slate-800/40 border border-slate-600/50 text-white rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-slate-800/60 transition-all duration-300 placeholder:text-slate-400 backdrop-blur-sm group-hover:border-slate-500/60"
                        {...field}
                        disabled={isPending}
                        autoComplete="new-password"
                      />
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs mt-1 text-red-400" />
                </FormItem>
              )}
            />
          </motion.div>

          <motion.div variants={itemVariants}>
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-slate-300 mb-2 block">
                    Confirm Password
                  </FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <Input
                        type="password"
                        placeholder="Confirm your password"
                        className="h-12 text-base px-4 bg-slate-800/40 border border-slate-600/50 text-white rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-slate-800/60 transition-all duration-300 placeholder:text-slate-400 backdrop-blur-sm group-hover:border-slate-500/60"
                        {...field}
                        disabled={isPending}
                        autoComplete="new-password"
                      />
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
                    </div>
                  </FormControl>
                  <FormMessage className="text-xs mt-1 text-red-400" />
                </FormItem>
              )}
            />
          </motion.div>
        </div>

        <motion.div variants={itemVariants}>
          <Button
            type="submit"
            className="w-full h-12 text-base font-semibold rounded-2xl bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 focus:ring-offset-transparent transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-blue-500/25 relative overflow-hidden group"
            disabled={isPending}
            data-testid="signup-submit"
          >
            {/* Animated background shimmer */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            
            {isPending ? (
              <div className="flex items-center justify-center space-x-3 relative z-10">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Creating account...</span>
              </div>
            ) : (
              <span className="flex items-center justify-center space-x-2 relative z-10">
                <span>Create Account</span>
                <motion.svg 
                  className="w-4 h-4 ml-1" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  whileHover={{ x: 2 }}
                  transition={{ type: "spring", stiffness: 400 }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </motion.svg>
              </span>
            )}
          </Button>
        </motion.div>
      </motion.form>
    </Form>
  )
} 