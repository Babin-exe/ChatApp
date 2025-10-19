import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const sendEmail = async (to, subject, text) => {
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: ` "ChatApp" ${process.env.EMAIL_USER}`,
      to,
      subject,
      text,
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, message: `${info.messageId}` };
  } catch (error) {
    console.log(error);
    throw new Error("Email could not be sent");
  }
};

export default sendEmail;
