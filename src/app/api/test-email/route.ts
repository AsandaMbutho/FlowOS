import { NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";

export async function GET() {
  const result = await sendEmail({
    to: "asandambutho@icloud.com",
    subject: "FlowOS Email Test ✅",
    html: `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="color: #10b981;">FlowOS Email Test</h1>
        <p>Congratulations! Your email integration is working.</p>
        <p>Sent from your iCloud account using SMTP.</p>
        <hr />
        <p style="color: #666; font-size: 12px;">Sent from FlowOS</p>
      </div>
    `,
    text: "FlowOS Email Test - Your email integration is working!",
  });

  return NextResponse.json(result);
}
