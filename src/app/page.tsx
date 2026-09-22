import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/auth";

export default async function Home() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  redirect(verifySessionToken(token) ? "/dashboard" : "/login");
}
