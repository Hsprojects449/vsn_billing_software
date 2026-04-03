import type React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function OperatorsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "super_admin") {
    redirect("/dashboard");
  }

  return <>{children}</>;
}
