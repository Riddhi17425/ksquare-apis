import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

const transporter = env.SMTP_HOST
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
    })
  : null;

export const mailConfigured = Boolean(transporter);

/** Emails the reset link. Without SMTP configured, the link is only logged outside production. */
export async function sendPasswordResetEmail(to, link, ttlMinutes) {
  if (!transporter) {
    if (env.isProd) logger.error("SMTP is not configured: password reset email NOT sent");
    else logger.info(`[mail disabled] Password reset link for ${to}: ${link}`);
    return false;
  }
  await transporter.sendMail({
    from: env.MAIL_FROM,
    to,
    subject: "Reset your Ksquare admin password",
    text: `We received a request to reset your password.\n\nOpen this link within ${ttlMinutes} minutes:\n${link}\n\nIf you did not ask for this, you can ignore this email.`,
  });
  return true;
}
