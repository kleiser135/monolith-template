import { cookies } from "next/headers";
import { HeaderUI } from "./HeaderUI";

export async function Header() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");
  const isLoggedIn = !!token;

  return <HeaderUI isLoggedIn={isLoggedIn} />;
} 