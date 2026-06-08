import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthCardProps = {
  title: string;
  description: string;
  action: (formData: FormData) => Promise<void>;
  submitLabel: string;
  footerLabel: string;
  footerHref: string;
  footerLinkLabel: string;
  error?: string;
};

export function AuthCard({
  title,
  description,
  action,
  submitLabel,
  footerLabel,
  footerHref,
  footerLinkLabel,
  error,
}: AuthCardProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-secondary/40 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-xl">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {decodeURIComponent(error)}
            </div>
          ) : null}
          <form action={action} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" autoComplete="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                minLength={8}
                autoComplete="current-password"
                required
              />
            </div>
            <Button className="w-full" type="submit">
              {submitLabel}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {footerLabel}{" "}
            <Link className="font-medium text-foreground underline-offset-4 hover:underline" href={footerHref}>
              {footerLinkLabel}
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
