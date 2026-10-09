import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default async function RootPage() {
  const cookieStore = await cookies();
  const sid = cookieStore.get("sevana_sid")?.value;
  if (sid) {
    redirect("/dashboard");
  }
  redirect("/login");
}
