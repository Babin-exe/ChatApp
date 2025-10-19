//This is for my local host
// const sendEmail = async (to, subject, text) => {
//   try {
//     const transporter = nodemailer.createTransport({
//       host: "smtp.gmail.com",
//       port: 587,
//       secure: false,
//       auth: {
//         user: process.env.EMAIL_USER,
//         pass: process.env.EMAIL_PASS,
//       },
//       tls: {
//         rejectUnauthorized: false,
//       },
//     });

//     const mailOptions = {
//       from: ` "ChatApp" ${process.env.EMAIL_USER}`,
//       to,
//       subject,
//       text,
//     };

//     const info = await transporter.sendMail(mailOptions);
//     return { success: true, message: `${info.messageId}` };
//   } catch (error) {
//     console.log(error);
//     throw new Error(`${error} Error email could not be sent`);
//   }
// };

// export default sendEmail;

import dotenv from "dotenv";
import sgMail from "@sendgrid/mail";

dotenv.config();
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendEmail = async (to, subject, text) => {
  try {
    const msg = {
      to,
      from: {
        email: "chatApp@gmail.com",
        name: "Baaabin",
      },
      subject,
      text,
    };

    const response = await sgMail.send(msg);
    console.log("Email send : ", response[0].statusCode);
    return { success: true, message: "Email sent successfully" };
  } catch (error) {
    console.log(error);
    throw new Error("Email could not be sent");
  }
};
export default sendEmail;
