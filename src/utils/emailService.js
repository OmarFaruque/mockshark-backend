import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();
//

const transporter = nodemailer.createTransport({
  // host: "smtp.gmail.com",
  // port: 465,
  auth: {
    user: process.env.GMAIL_ID,
    pass: process.env.GMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
  secure: true,
  pool: true,
  service: "gmail",
});

const sendEmail = async (user_email, subject, body) => {
  try {
    const info = await transporter.sendMail({
      from: process.env.GMAIL_ID,
      to: user_email,
      subject: subject,
      html: body,
    });

    console.log("Email sent: " + info.response);
    return { success: true, message: "Email is sent!" };
  } catch (error) {
    console.log("Email send error:", error);
    return { success: false, message: error.message };
  }
};


export default sendEmail;
