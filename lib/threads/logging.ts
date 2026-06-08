type OAuthLogDetails = Record<string, boolean | number | string | null | undefined>;

function redact(value: string) {
  return value
    .replace(
      /("(?:access_token|client_secret|code)"\s*:\s*")[^"]+"/gi,
      '$1[REDACTED]"',
    )
    .replace(/((?:access_token|client_secret|code)=)[^&\s]+/gi, "$1[REDACTED]")
    .slice(0, 1200);
}

export function threadsOAuthLog(
  level: "error" | "info" | "warn",
  event: string,
  requestId: string,
  details: OAuthLogDetails = {},
) {
  const safeDetails = Object.fromEntries(
    Object.entries(details).map(([key, value]) => [
      key,
      typeof value === "string" ? redact(value) : value,
    ]),
  );
  const payload = JSON.stringify({
    scope: "threads-oauth",
    event,
    requestId,
    ...safeDetails,
  });

  console[level](payload);
}
