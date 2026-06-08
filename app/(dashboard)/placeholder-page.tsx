import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          This area is reserved for the next MVP phase.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Not implemented yet</CardTitle>
          <CardDescription>
            OAuth, database ownership, and connection state are the focus for this build.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Auto-publishing and scheduling are intentionally excluded from this stage.
        </CardContent>
      </Card>
    </div>
  );
}
