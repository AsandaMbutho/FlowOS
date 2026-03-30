import { sendEmail, emailTemplates } from "../src/lib/email";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function testEmail() {
  console.log("Testing email configuration...");

  const result = await sendEmail({
    to: "test@example.com", // Replace with your email
    subject: "FlowOS Test Email",
    html: emailTemplates.overdue(
      "Test Workflow",
      new Date(),
      "Test User",
      "123",
    ).html,
  });

  console.log("Result:", result);
}

testEmail();
