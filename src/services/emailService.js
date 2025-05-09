import nodemailer from "nodemailer";
import fs from "fs/promises";
import createHttpError from "http-errors";
import { config } from "../config/config.js";

const transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: Number(config.SMTP_PORT),
  secure: Number(config.SMTP_PORT) === 465,
  auth: {
    user: config.EMAIL_USER,
    pass: config.EMAIL_PASSWORD,
  },
  // logger: true,
  // debug: true,
  connectionTimeout: 30_000,
  greetingTimeout: 30_000,
  tls: {
    ciphers: "TLSv1.2",
    rejectUnauthorized: false,
  },
  requireTLS: Number(config.SMTP_PORT) === 587,
});

export const sendUserDetailsTemplate = async (
  name,
  email,
  password,
  login_url = `${config.FRONTEND_URL}/login`
) => {
  console.log("Config in email service", config);
  try {
    const htmlTemplate = await fs.readFile(
      "src/templates/userDetails.html",
      "utf-8"
    );

    const htmlContent = htmlTemplate
      .replace("{{name}}", name)
      .replace("{{email}}", email)
      .replace("{{password}}", password)
      .replace("{{login_url}}", login_url);

    const mailOptions = {
      from: config.EMAIL_USER,
      to: email,
      subject: "User Details - Sensedge CRM",
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log(error);
    throw createHttpError(500, "Error sending email");
  }
};

export const sendPasswordResetTemplate = async (
  name,
  email,
  otp,
  reset_url = `${config.FRONTEND_URL}/forgot-password`
) => {
  try {
    const htmlTemplate = await fs.readFile(
      "src/templates/passwordReset.html",
      "utf-8"
    );

    const htmlContent = htmlTemplate
      .replace("{{name}}", name)
      .replace("{{otp}}", otp)
      .replace("{{reset_url}}", reset_url);

    const mailOptions = {
      from: config.EMAIL_USER,
      to: email,
      subject: "Password Reset - Sensedge CRM",
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log(error);
    throw createHttpError(500, "Error sending email");
  }
};
