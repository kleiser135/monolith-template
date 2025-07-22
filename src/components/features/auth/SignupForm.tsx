"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { signupSchema } from "@/lib/validators"
import { useActionState, useEffect } from "react"
import { signup } from "@/lib/actions"
import { useRouter } from "next/navigation"

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
  const [state, formAction, isPending] = useActionState(signup, initialState)
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

  return (
    <div className="w-full max-w-md">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(() => {
            const formData = new FormData();
            const values = form.getValues();
            formData.append("email", values.email);
            formData.append("password", values.password);
            formData.append("confirmPassword", values.confirmPassword);
            formAction(formData);
          })}
          className="space-y-6"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="your.email@example.com"
                    {...field}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="********"
                    {...field}
                    disabled={isPending}
                  />
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
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="********"
                    {...field}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Creating account..." : "Create Account"}
          </Button>
        </form>
      </Form>
    </div>
  )
} 