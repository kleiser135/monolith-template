import { cookies } from "next/headers";
import { AppHeader } from "../headers";

export async function Header() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");
  const isLoggedIn = !!token;

  return <AppHeader isLoggedIn={isLoggedIn} />;
} 