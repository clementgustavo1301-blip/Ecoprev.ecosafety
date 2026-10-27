import { redirect } from "next/navigation";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  // Login is now handled on the landing page
  // Redirect there with the role param preserved
  return redirect("/");
}
