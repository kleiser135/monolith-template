"use client"

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { loginSchema } from "@/lib/validators";
import { useEffect } from "react";
import { useActionState } from "react";
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
  const [state, formAction, isPending] = useActionState(login, initialState);
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

  return (
    <Form {...form}>
      <form action={formAction} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  placeholder="email@example.com"
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
                <Input type="password" {...field} disabled={isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? "Logging in..." : "Login"}
        </Button>
      </form>
    </Form>
  );
}