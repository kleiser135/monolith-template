"use client";

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
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { changePassword } from "@/lib/actions";
import { changePasswordSchema } from "@/lib/validators";

type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;

const initialState: {
  message?: string | null | undefined;
  errors?: any;
  success: boolean;
} = {
  message: null,
  errors: undefined,
  success: false,
};

export function ChangePasswordForm() {
  const [state, setState] = useState(initialState);
  const [isPending, setIsPending] = useState(false);

  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: ChangePasswordFormValues) => {
    setIsPending(true);
    const formData = new FormData();
    formData.append("currentPassword", values.currentPassword);
    formData.append("newPassword", values.newPassword);
    formData.append("confirmPassword", values.confirmPassword);
    const result = await changePassword(initialState, formData);
    setState(result);
    setIsPending(false);
  };

  useEffect(() => {
    if (state.success) {
      toast.success(state.message);
      form.reset();
    }
    if (state.message && !state.success) {
      toast.error(state.message);
    }
  }, [state, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="currentPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Current Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} disabled={isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="newPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>New Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} disabled={isPending} />
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
              <FormLabel>Confirm New Password</FormLabel>
              <FormControl>
                <Input type="password" {...field} disabled={isPending} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isPending}>
          {isPending ? "Changing..." : "Change Password"}
        </Button>
      </form>
    </Form>
  );
} 