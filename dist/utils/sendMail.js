"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const nodemailer_1 = __importDefault(require("nodemailer"));
const ejs_1 = __importDefault(require("ejs"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const config_1 = require("../config");
const sendMail = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const transportOptions = {
        host: config_1.CONFIG.SMTP_HOST || "127.0.0.1",
        port: Number(config_1.CONFIG.SMTP_PORT || "1025"),
        secure: Number(config_1.CONFIG.SMTP_PORT) === 465,
    };
    if (config_1.CONFIG.SMTP_SERVICE) {
        transportOptions.service = config_1.CONFIG.SMTP_SERVICE;
    }
    if (config_1.CONFIG.SMTP_MAIL && config_1.CONFIG.SMTP_PASSWORD) {
        transportOptions.auth = {
            user: config_1.CONFIG.SMTP_MAIL,
            pass: config_1.CONFIG.SMTP_PASSWORD,
        };
    }
    const transporter = nodemailer_1.default.createTransport(transportOptions);
    const { email, subject, template, data } = options;
    let templatePath = path_1.default.join(__dirname, `../mails`, template);
    if (!fs_1.default.existsSync(templatePath)) {
        templatePath = path_1.default.join(process.cwd(), "mails", template);
    }
    const html = yield ejs_1.default.renderFile(templatePath, data);
    const mailOptions = {
        from: config_1.CONFIG.SMTP_MAIL,
        to: email,
        subject,
        html,
    };
    const info = yield transporter.sendMail(mailOptions);
    const testUrl = nodemailer_1.default.getTestMessageUrl(info);
    if (testUrl) {
        console.log("✉️  Email Preview URL:", testUrl);
    }
    return testUrl;
});
exports.default = sendMail;
//# sourceMappingURL=sendMail.js.map