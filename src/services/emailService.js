import nodemailer from "nodemailer";
import { config } from "../config/config.js";
import fs from "fs/promises";
import createHttpError from "http-errors";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: config.EMAIL_USER,
    pass: config.EMAIL_PASSWORD,
  },
});

export const sendUserDetailsTemplate = async (
  name,
  email,
  password,
  login_url = "http://localhost:3000/api/v1/auth/login"
) => {
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
      subject: "User Details",
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
  reset_url
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
      subject: "Password Reset",
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.log(error);
    throw createHttpError(500, "Error sending email");
  }
};
