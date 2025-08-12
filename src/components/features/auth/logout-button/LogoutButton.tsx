"use client";

import { Button } from "@/components/ui/button/button";
import { logout } from '@/lib/api/actions';
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      await logout();
      router.push('/');
    });
  };

  return (
    <Button variant="ghost" onClick={handleClick} disabled={isPending}>
      {isPending ? "Logging out..." : "Logout"}
    </Button>
  );
} 