import nodemailer, { Transporter } from "nodemailer";
import ejs from "ejs";
import path from "path";
import { CONFIG } from "../config";

interface EmailOptions {
  email: string;
  subject: string;
  template: string;
  data: { [key: string]: any };
}

const sendMail = async (options: EmailOptions): Promise<void> => {
  const transporter: Transporter = nodemailer.createTransport({
    host: CONFIG.SMTP_HOST,
    port: Number(CONFIG.SMTP_PORT || "587"),
    service: CONFIG.SMTP_SERVICE,
    auth: {
      user: CONFIG.SMTP_MAIL,
      pass: CONFIG.SMTP_PASSWORD,
    },
  });
  const { email, subject, template, data } = options;

  const templatePath = path.join(__dirname, `../mails`, template);
  const html: string = await ejs.renderFile(templatePath, data);

  const mailOptions = {
    from: CONFIG.SMTP_MAIL,
    to: email,
    subject,
    html,
  };
  await transporter.sendMail(mailOptions);
};

export default sendMail;
