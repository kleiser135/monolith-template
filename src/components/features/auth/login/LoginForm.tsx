"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { loginSchema } from "@/lib/validators";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { login } from "@/lib/actions";

type LoginFormValues = z.infer<typeof loginSchema>;

type State = {
  message?: string | null;
  errors?: {
    email?: string[];
    password?: string[];
  };
  success: boolean;
};

const initialState: State = {
  message: null,
  errors: undefined,
  success: false,
};

export function LoginForm() {
  const [state, setState] = useState(initialState);
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (state.success) {
      toast.success("Login successful!");
      router.push("/dashboard");
    }
    if (state.message && !state.success) {
      toast.error(state.message);
    }
  }, [state, router]);

  const onSubmit = async (values: LoginFormValues) => {
    setIsPending(true);
    const formData = new FormData();
    formData.append("email", values.email);
    formData.append("password", values.password);
    const result = await login(initialState, formData);
    setState(result);
    setIsPending(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-slate-300 mb-2 block">
                  Email address
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="Enter your email"
                      className="h-12 text-base px-4 bg-slate-800/50 border border-slate-600 text-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-slate-800 transition-all duration-200 placeholder:text-slate-400"
                      {...field}
                      disabled={isPending}
                      autoComplete="email"
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-xs mt-1 text-red-400" />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium text-slate-300 mb-2 block">
                  Password
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type="password" 
                      placeholder="Enter your password"
                      className="h-12 text-base px-4 bg-slate-800/50 border border-slate-600 text-white rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:bg-slate-800 transition-all duration-200 placeholder:text-slate-400"
                      {...field} 
                      disabled={isPending}
                      autoComplete="current-password"
                    />
                  </div>
                </FormControl>
                <FormMessage className="text-xs mt-1 text-red-400" />
              </FormItem>
            )}
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full h-12 text-base font-semibold rounded-xl bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800 text-white focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 transition-all duration-200 shadow-lg hover:shadow-xl" 
          disabled={isPending}
        >
          {isPending ? (
            <div className="flex items-center justify-center space-x-3">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Signing in...</span>
            </div>
          ) : (
            <span className="flex items-center justify-center space-x-2">
              <span>Sign in</span>
              <svg className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </span>
          )}
        </Button>
      </form>
    </Form>
  );
}
