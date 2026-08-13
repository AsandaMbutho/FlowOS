import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { googleRedirectUri, verifyGoogleState } from "@/lib/google-oauth";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const destination = new URL("/meetings", url.origin);
  if (error || !code || !state) { destination.searchParams.set("google", "failed"); return NextResponse.redirect(destination); }
  try {
    const userId = verifyGoogleState(state);
    const response = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ code, client_id: process.env.GOOGLE_CLIENT_ID || "", client_secret: process.env.GOOGLE_CLIENT_SECRET || "", redirect_uri: googleRedirectUri(), grant_type: "authorization_code" }) });
    if (!response.ok) throw new Error(await response.text());
    const token = await response.json() as { access_token: string; refresh_token?: string; expires_in?: number };
    const profileResponse = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", { headers: { Authorization: `Bearer ${token.access_token}` } });
    if (!profileResponse.ok) throw new Error("Could not identify Google account");
    const profile = await profileResponse.json() as { email: string };
    const current = await db.googleAccount.findUnique({ where: { userId } });
    if (!token.refresh_token && !current?.refreshToken) throw new Error("Google did not return a refresh token; disconnect and reconnect your Google account");
    await db.googleAccount.upsert({ where: { userId }, create: { userId, googleEmail: profile.email, accessToken: token.access_token, refreshToken: token.refresh_token!, expiresAt: new Date(Date.now() + (token.expires_in ?? 3600) * 1000) }, update: { googleEmail: profile.email, accessToken: token.access_token, refreshToken: token.refresh_token ?? current!.refreshToken, expiresAt: new Date(Date.now() + (token.expires_in ?? 3600) * 1000) } });
    destination.searchParams.set("google", "connected");
  } catch (callbackError) { console.error("Google Calendar connection failed", callbackError); destination.searchParams.set("google", "failed"); }
  return NextResponse.redirect(destination);
}
