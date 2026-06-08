import { AuthCard } from "@/app/(auth)/auth-card";
import { signInAction } from "@/app/(auth)/actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthCard
      title="Sign in"
      description="Access your Threads dashboard foundation."
      action={signInAction}
      submitLabel="Sign in"
      footerLabel="No account yet?"
      footerHref="/register"
      footerLinkLabel="Create one"
      error={params.error}
    />
  );
}
