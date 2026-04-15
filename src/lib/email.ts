import nodemailer from "nodemailer";

// Email configuration interface
interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// Create transporter based on environment
let transporter: nodemailer.Transporter | null = null;

// Only create transporter if SMTP is configured
if (
  process.env.EMAIL_HOST &&
  process.env.EMAIL_USER &&
  process.env.EMAIL_PASSWORD
) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === "true",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    // Vercel-specific: shorter timeouts
    connectionTimeout: 5000,
    greetingTimeout: 5000,
    socketTimeout: 10000,
  });
}

// Email templates for different notification types
export const emailTemplates = {
  mention: (
    mentionedBy: string,
    workflowTitle: string,
    comment: string,
    workflowId: string,
  ) => ({
    subject: `📢 You were mentioned in a comment on "${workflowTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #0f1f3d; padding: 20px; text-align: center;">
          <h1 style="color: #10b981; margin: 0;">FlowOS</h1>
        </div>
        <div style="padding: 20px; background-color: #ffffff;">
          <h2 style="color: #0f1f3d;">You were mentioned! 🎯</h2>
          <p><strong>${mentionedBy}</strong> mentioned you in a comment on workflow:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="color: #0f1f3d; margin: 0 0 10px 0;">${workflowTitle}</h3>
            <p style="margin: 0;">"${comment}"</p>
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/workflows/${workflowId}" 
             style="display: inline-block; background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">
            View Workflow
          </a>
        </div>
        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>You're receiving this because you were mentioned in a comment on FlowOS.</p>
          <p>© 2026 Media on Africa</p>
        </div>
      </div>
    `,
    text: `${mentionedBy} mentioned you in a comment on "${workflowTitle}": "${comment}". View it at: ${process.env.NEXT_PUBLIC_APP_URL}/workflows/${workflowId}`,
  }),

  overdue: (
    workflowTitle: string,
    dueDate: Date,
    assigneeName: string,
    workflowId: string,
  ) => ({
    subject: `⚠️ OVERDUE: "${workflowTitle}" needs attention`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #0f1f3d; padding: 20px; text-align: center;">
          <h1 style="color: #10b981; margin: 0;">FlowOS</h1>
        </div>
        <div style="padding: 20px; background-color: #ffffff;">
          <h2 style="color: #dc2626;">⚠️ Workflow Overdue!</h2>
          <p>Hello <strong>${assigneeName}</strong>,</p>
          <p>The following workflow is now overdue:</p>
          <div style="background-color: #fee2e2; padding: 15px; border-left: 4px solid #dc2626; margin: 15px 0;">
            <h3 style="color: #0f1f3d; margin: 0 0 10px 0;">${workflowTitle}</h3>
            <p><strong>Due Date:</strong> ${new Date(dueDate).toLocaleDateString()}</p>
            <p><strong>Status:</strong> Overdue</p>
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/workflows/${workflowId}" 
             style="display: inline-block; background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">
            Update Workflow
          </a>
        </div>
        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>Please update this workflow as soon as possible.</p>
          <p>© 2026 Media on Africa</p>
        </div>
      </div>
    `,
    text: `⚠️ OVERDUE: "${workflowTitle}" was due on ${new Date(dueDate).toLocaleDateString()}. Please update it at: ${process.env.NEXT_PUBLIC_APP_URL}/workflows/${workflowId}`,
  }),

  statusChange: (
    workflowTitle: string,
    oldStatus: string,
    newStatus: string,
    changedBy: string,
    workflowId: string,
  ) => ({
    subject: `🔄 Status changed: "${workflowTitle}" → ${newStatus}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #0f1f3d; padding: 20px; text-align: center;">
          <h1 style="color: #10b981; margin: 0;">FlowOS</h1>
        </div>
        <div style="padding: 20px; background-color: #ffffff;">
          <h2 style="color: #0f1f3d;">Status Update 🔄</h2>
          <p><strong>${changedBy}</strong> updated the status of workflow:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="color: #0f1f3d; margin: 0 0 10px 0;">${workflowTitle}</h3>
            <p><strong>From:</strong> <span style="color: #6b7280;">${oldStatus}</span></p>
            <p><strong>To:</strong> <span style="color: #10b981; font-weight: bold;">${newStatus}</span></p>
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/workflows/${workflowId}" 
             style="display: inline-block; background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">
            View Workflow
          </a>
        </div>
        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>© 2026 Media on Africa</p>
        </div>
      </div>
    `,
    text: `Status update: "${workflowTitle}" changed from ${oldStatus} to ${newStatus} by ${changedBy}. View at: ${process.env.NEXT_PUBLIC_APP_URL}/workflows/${workflowId}`,
  }),

  assignment: (
    workflowTitle: string,
    assignedBy: string,
    assigneeName: string,
    workflowId: string,
  ) => ({
    subject: `📋 You've been assigned to: "${workflowTitle}"`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #0f1f3d; padding: 20px; text-align: center;">
          <h1 style="color: #10b981; margin: 0;">FlowOS</h1>
        </div>
        <div style="padding: 20px; background-color: #ffffff;">
          <h2 style="color: #0f1f3d;">New Assignment! 📋</h2>
          <p>Hello <strong>${assigneeName}</strong>,</p>
          <p><strong>${assignedBy}</strong> assigned you to a new workflow:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="color: #0f1f3d; margin: 0;">${workflowTitle}</h3>
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/workflows/${workflowId}" 
             style="display: inline-block; background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">
            View Workflow
          </a>
        </div>
        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>© 2026 Media on Africa</p>
        </div>
      </div>
    `,
    text: `You've been assigned to "${workflowTitle}" by ${assignedBy}. View at: ${process.env.NEXT_PUBLIC_APP_URL}/workflows/${workflowId}`,
  }),

  taskCompleted: (
    taskTitle: string,
    workflowTitle: string,
    completedBy: string,
    workflowId: string,
  ) => ({
    subject: `✅ Task completed: "${taskTitle}" in ${workflowTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #0f1f3d; padding: 20px; text-align: center;">
          <h1 style="color: #10b981; margin: 0;">FlowOS</h1>
        </div>
        <div style="padding: 20px; background-color: #ffffff;">
          <h2 style="color: #10b981;">Task Completed! ✅</h2>
          <p><strong>${completedBy}</strong> completed a task:</p>
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="color: #0f1f3d; margin: 0;">${taskTitle}</h3>
            <p style="margin: 10px 0 0 0;">in workflow: <strong>${workflowTitle}</strong></p>
          </div>
          <a href="${process.env.NEXT_PUBLIC_APP_URL}/workflows/${workflowId}" 
             style="display: inline-block; background-color: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">
            View Workflow
          </a>
        </div>
        <div style="background-color: #f3f4f6; padding: 15px; text-align: center; font-size: 12px; color: #6b7280;">
          <p>© 2026 Media on Africa</p>
        </div>
      </div>
    `,
    text: `Task completed: "${taskTitle}" in "${workflowTitle}" by ${completedBy}. View at: ${process.env.NEXT_PUBLIC_APP_URL}/workflows/${workflowId}`,
  }),
};

// Main email sending function with Vercel compatibility
export async function sendEmail({ to, subject, html, text }: EmailOptions) {
  // Skip if no transporter configured
  if (!transporter) {
    console.log("📧 [NO SMTP] Email would be sent:", { to, subject });
    console.log("Add EMAIL_HOST, EMAIL_USER, EMAIL_PASSWORD to enable email");
    return { success: true, mock: true };
  }

  try {
    if (
      process.env.NODE_ENV === "development" &&
      !process.env.EMAIL_ENABLE_DEV
    ) {
      console.log("📧 [DEV MODE] Email would be sent:", { to, subject });
      console.log(
        "Email content preview:",
        (text || html.substring(0, 200)).replace(/<[^>]*>/g, ""),
      );
      return { success: true, mock: true };
    }

    // CRITICAL FOR VERCEL: Must await before returning
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ""),
    });

    console.log("✅ Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending email:", error);
    return { success: false, error };
  }
}

// Helper functions
export async function sendMentionEmail(
  mentionedEmail: string,
  mentionedByName: string,
  workflowTitle: string,
  comment: string,
  workflowId: string,
) {
  const template = emailTemplates.mention(
    mentionedByName,
    workflowTitle,
    comment,
    workflowId,
  );
  return sendEmail({
    to: mentionedEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

export async function sendOverdueEmail(
  assigneeEmail: string,
  assigneeName: string,
  workflowTitle: string,
  dueDate: Date,
  workflowId: string,
) {
  const template = emailTemplates.overdue(
    workflowTitle,
    dueDate,
    assigneeName,
    workflowId,
  );
  return sendEmail({
    to: assigneeEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

export async function sendStatusChangeEmail(
  recipientEmail: string,
  workflowTitle: string,
  oldStatus: string,
  newStatus: string,
  changedBy: string,
  workflowId: string,
) {
  const template = emailTemplates.statusChange(
    workflowTitle,
    oldStatus,
    newStatus,
    changedBy,
    workflowId,
  );
  return sendEmail({
    to: recipientEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

export async function sendAssignmentEmail(
  assigneeEmail: string,
  assigneeName: string,
  workflowTitle: string,
  assignedBy: string,
  workflowId: string,
) {
  const template = emailTemplates.assignment(
    workflowTitle,
    assignedBy,
    assigneeName,
    workflowId,
  );
  return sendEmail({
    to: assigneeEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}

export async function sendTaskCompletedEmail(
  recipientEmail: string,
  taskTitle: string,
  workflowTitle: string,
  completedBy: string,
  workflowId: string,
) {
  const template = emailTemplates.taskCompleted(
    taskTitle,
    workflowTitle,
    completedBy,
    workflowId,
  );
  return sendEmail({
    to: recipientEmail,
    subject: template.subject,
    html: template.html,
    text: template.text,
  });
}
