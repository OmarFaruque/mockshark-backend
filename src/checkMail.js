import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

// STEP 1: Print env values to be sure they're correct
console.log("📌 MAIL_USER:", process.env.MAIL_USER);
console.log("📌 MAIL_PASS:", process.env.MAIL_PASS ? "Loaded ✅" : "MISSING ❌");

// STEP 2: Create transporter
const transporter = nodemailer.createTransport({
  host: "mail.privateemail.com",
  port: 465, // if fails, try 587
  secure: true, // true for 465, false for 587
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
  authMethod: "LOGIN", // force LOGIN instead of PLAIN
});

// STEP 3: Verify connection
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP Connection Failed:", error);
  } else {
    console.log("✅ SMTP Server is ready to take messages:", success);
  }
});

// STEP 4: Send test mail
async function sendTest() {
  try {
    const info = await transporter.sendMail({
      from: `"MockShark Test" <${process.env.MAIL_USER}>`,
      to: "yourgmail@gmail.com", // replace with your test email
      subject: "SMTP Test Mail",
      text: "If you see this, Namecheap SMTP works!",
    });
    console.log("✅ Mail Sent:", info.response);
  } catch (err) {
    console.error("❌ Mail Send Failed:", err);
  }
}

sendTest();
