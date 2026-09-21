import nodemailer, { Transporter } from "nodemailer";
import ejs from "ejs";
import path from "path";
import fs from "fs";
import { CONFIG } from "../config";

interface EmailOptions {
  email: string;
  subject: string;
  template: string;
  data: { [key: string]: any };
}

const sendMail = async (options: EmailOptions): Promise<string | false> => {
  const transportOptions: any = {
    host: CONFIG.SMTP_HOST || "127.0.0.1",
    port: Number(CONFIG.SMTP_PORT || "1025"),
    secure: Number(CONFIG.SMTP_PORT) === 465,
  };

  if (CONFIG.SMTP_SERVICE) {
    transportOptions.service = CONFIG.SMTP_SERVICE;
  }

  if (CONFIG.SMTP_MAIL && CONFIG.SMTP_PASSWORD) {
    transportOptions.auth = {
      user: CONFIG.SMTP_MAIL,
      pass: CONFIG.SMTP_PASSWORD,
    };
  }

  const transporter: Transporter = nodemailer.createTransport(transportOptions);
  const { email, subject, template, data } = options;

  let templatePath = path.join(__dirname, `../mails`, template);
  if (!fs.existsSync(templatePath)) {
    templatePath = path.join(process.cwd(), "mails", template);
  }
  const html: string = await ejs.renderFile(templatePath, data);

  const mailOptions = {
    from: CONFIG.SMTP_MAIL,
    to: email,
    subject,
    html,
  };
  const info = await transporter.sendMail(mailOptions);
  const testUrl = nodemailer.getTestMessageUrl(info);
  if (testUrl) {
    console.log("✉️  Email Preview URL:", testUrl);
  }
  return testUrl;
};

export default sendMail;
