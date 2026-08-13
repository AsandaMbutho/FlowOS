import crypto from "crypto";

const scope = "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.freebusy https://www.googleapis.com/auth/userinfo.email";

function secret() {
  if (!process.env.NEXTAUTH_SECRET) throw new Error("NEXTAUTH_SECRET is required for Google connection");
  return process.env.NEXTAUTH_SECRET;
}

export function googleRedirectUri() {
  const base = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL;
  if (!base) throw new Error("NEXTAUTH_URL or NEXT_PUBLIC_APP_URL is required");
  return `${base.replace(/\/$/, "")}/api/google/calendar/callback`;
}

export function googleAuthorizationUrl(userId: string) {
  const payload = Buffer.from(JSON.stringify({ userId, expiresAt: Date.now() + 10 * 60 * 1000 })).toString("base64url");
  const signature = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID || "", redirect_uri: googleRedirectUri(), response_type: "code", scope, access_type: "offline", prompt: "consent", state: `${payload}.${signature}`, include_granted_scopes: "true" }).toString();
  return url.toString();
}

export function verifyGoogleState(state: string) {
  const [payload, signature] = state.split(".");
  if (!payload || !signature) throw new Error("Invalid Google OAuth state");
  const expected = crypto.createHmac("sha256", secret()).update(payload).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) throw new Error("Invalid Google OAuth state");
  const result = JSON.parse(Buffer.from(payload, "base64url").toString()) as { userId: string; expiresAt: number };
  if (result.expiresAt < Date.now()) throw new Error("Google OAuth request expired");
  return result.userId;
}
