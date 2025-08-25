import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail", // শুধু এটুকুই যথেষ্ট
  auth: {
    user: process.env.GMAIL_ID,  // তোমার Gmail address
    pass: process.env.GMAIL_PASS, // 16-character App Password
  },
});

const sendEmail = async (user_email, subject, body) => {
  try {
    const info = await transporter.sendMail({
      from: `"MockShark" <${process.env.GMAIL_ID}>`,
      to: user_email,
      subject,
      html: body,
    });

    console.log("✅ Email sent:", info.response);
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.error("❌ Email error:", error);
    return { success: false, message: error.message };
  }
};

export default sendEmail;
