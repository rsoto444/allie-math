import nodemailer from "nodemailer";

export async function sendParentEmail(subject: string, html: string): Promise<void> {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  const to = process.env.PARENT_EMAILS;

  if (!user || !pass || !to) {
    throw new Error("GMAIL_USER, GMAIL_APP_PASSWORD, and PARENT_EMAILS must all be set.");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  await transporter.sendMail({
    from: `"Allie's Math Practice" <${user}>`,
    to,
    subject,
    html,
  });
}
