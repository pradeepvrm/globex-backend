import nodemailer from "nodemailer";

function getTransporter() {
  const { EMAIL_USER, EMAIL_PASS } = process.env;

  if (!EMAIL_USER || !EMAIL_PASS) {
    throw new Error("Email is not configured. Set EMAIL_USER and EMAIL_PASS.");
  }

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
        },
    });

  return transporter;
} 

export function sendEmail({ to, subject, text }) {
  if (!to) {
    throw new Error("An email recipient is required.");
  }

  return getTransporter().sendMail({
    from: `"Globex" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    text,
  });
}
