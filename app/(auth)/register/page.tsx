import { AuthCard } from "@/app/(auth)/auth-card";
import { signUpAction } from "@/app/(auth)/actions";

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  return (
    <AuthCard
      title="Create account"
      description="Start with secure local MySQL authentication."
      action={signUpAction}
      submitLabel="Create account"
      footerLabel="Already registered?"
      footerHref="/login"
      footerLinkLabel="Sign in"
      error={params.error}
    />
  );
}
