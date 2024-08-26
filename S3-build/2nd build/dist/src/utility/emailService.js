"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ComplaintReplyEmail = exports.AdminAuditorCreationMail = exports.ResetPasswordAndChangeContactDetails = exports.OTPFamilyCare = exports.OTPmailServiceDashboardUser = exports.OTPmailService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
const handlebars_1 = __importDefault(require("handlebars"));
const DashboardTemplates_1 = require("../templates/DashboardTemplates");
const data_1 = require("../constants/data");
//OTP email user
const OTPmailService = async (email_id, data, subject, template) => {
    return new Promise((resolve, reject) => {
        // const email_transporter = nodemailer.createTransport({
        //   service: "gmail",
        //   auth: {
        //     user: process.env.EMAIL_ID,
        //     pass: process.env.EMAIL_PASSWORD,
        //   },
        // });
        const email_transporter = nodemailer_1.default.createTransport({
            host: "smtpout.secureserver.net",
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_ID,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
        const compileTemplate = (templates) => handlebars_1.default.compile(templates);
        const otp_verification_template = compileTemplate(template);
        const email_details = {
            from: process.env.EMAIL_ID,
            to: [email_id],
            subject: subject,
            template: `otp_verification_template`,
            context: {
                data: `${data}`,
            },
        };
        email_transporter.sendMail({
            ...email_details,
            html: otp_verification_template(email_details.context),
        }, async (err, data) => {
            if (err) {
                console.log("Error Occurs", err);
                reject(err);
            }
            else {
                resolve(true);
            }
        });
    });
};
exports.OTPmailService = OTPmailService;
//otp mail admin
const OTPmailServiceDashboardUser = async (email_id, otp, fullName, template, subject) => {
    return new Promise((resolve, reject) => {
        // const email_transporter = nodemailer.createTransport({
        //   service: "gmail",
        //   auth: {
        //     user: process.env.EMAIL_ID,
        //     pass: process.env.EMAIL_PASSWORD,
        //   },
        // });
        const email_transporter = nodemailer_1.default.createTransport({
            host: "smtpout.secureserver.net",
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_ID,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
        const compileTemplate = (template) => handlebars_1.default.compile(template);
        const otp_verification_template = compileTemplate(template);
        const email_details = {
            from: process.env.EMAIL_ID,
            to: [email_id],
            subject: subject,
            template: `otp`,
            context: {
                data: `${otp}`,
                firstName: `${fullName}`,
            },
        };
        email_transporter.sendMail({
            ...email_details,
            html: otp_verification_template(email_details.context),
        }, async (err, data) => {
            if (err) {
                console.log("Error Occurs", err);
                reject(err);
            }
            else {
                resolve(true);
            }
        });
    });
};
exports.OTPmailServiceDashboardUser = OTPmailServiceDashboardUser;
//existing user otp
const OTPFamilyCare = async (email_id, fullName, user, //user
otp, subject, template) => {
    return new Promise((resolve, reject) => {
        // const email_transporter = nodemailer.createTransport({
        //   service: "gmail",
        //   auth: {
        //     user: process.env.EMAIL_ID,
        //     pass: process.env.EMAIL_PASSWORD,
        //   },
        // });
        const email_transporter = nodemailer_1.default.createTransport({
            host: "smtpout.secureserver.net",
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_ID,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
        const compileTemplate = (template) => handlebars_1.default.compile(template);
        const otp_verification_template = compileTemplate(template);
        const email_details = {
            from: process.env.EMAIL_ID,
            to: [email_id],
            subject: subject,
            context: {
                otp: `${otp}`,
                fullName: `${fullName}`,
                user: `${user}`,
            },
        };
        email_transporter.sendMail({
            ...email_details,
            html: otp_verification_template(email_details.context),
        }, async (err, data) => {
            if (err) {
                console.log("Error Occurs", err);
                reject(err);
            }
            else {
                console.log("Email sent successfully");
                resolve(true);
            }
        });
    });
};
exports.OTPFamilyCare = OTPFamilyCare;
//mail service to reset password
const ResetPasswordAndChangeContactDetails = async (email_id, data, subject, template, firstName) => {
    return new Promise((resolve, reject) => {
        // const email_transporter = nodemailer.createTransport({
        //   service: "gmail",
        //   auth: {
        //     user: process.env.EMAIL_ID,
        //     pass: process.env.EMAIL_PASSWORD,
        //   },
        // });
        const email_transporter = nodemailer_1.default.createTransport({
            host: "smtpout.secureserver.net",
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_ID,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
        const compileTemplate = (templates) => handlebars_1.default.compile(templates);
        const otp_verification_template = compileTemplate(template);
        const email_details = {
            from: process.env.EMAIL_ID,
            to: [email_id],
            subject: subject,
            template: `otp_verification_template`,
            context: {
                data: `${data}`,
                firstName: `${firstName}`,
            },
        };
        email_transporter.sendMail({
            ...email_details,
            html: otp_verification_template(email_details.context),
        }, async (err, data) => {
            if (err) {
                console.log("Error Occurs", err);
                reject(err);
            }
            else {
                resolve(true);
            }
        });
    });
};
exports.ResetPasswordAndChangeContactDetails = ResetPasswordAndChangeContactDetails;
const AdminAuditorCreationMail = async (data) => {
    return new Promise((resolve, reject) => {
        const { emailId, subject, role, fullName } = data;
        const roles = role?.toLowerCase();
        // const email_transporter = nodemailer.createTransport({
        //   service: "gmail",
        //   auth: {
        //     user: process.env.EMAIL_ID,
        //     pass: process.env.EMAIL_PASSWORD,
        //   },
        // });
        const email_transporter = nodemailer_1.default.createTransport({
            host: "smtpout.secureserver.net",
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_ID,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
        const compileTemplate = (template) => handlebars_1.default.compile(template);
        const admin_registration_template = compileTemplate(DashboardTemplates_1.successAdminAuditorRegistration);
        const email_details = {
            from: process.env.EMAIL_ID,
            to: [emailId],
            subject: subject,
            template: `successAdminAuditorRegistration`,
            context: {
                role: `${roles}`,
                userName: `${fullName}`,
                dashboardURL: `${data_1.dashboardURL}`,
            },
        };
        email_transporter.sendMail({
            ...email_details,
            html: admin_registration_template(email_details.context),
        }, async (err, data) => {
            if (err) {
                console.log("Error Occured:", err);
                reject(err);
            }
            else {
                resolve(true);
            }
        });
    });
};
exports.AdminAuditorCreationMail = AdminAuditorCreationMail;
//sending complaint reply to user
const ComplaintReplyEmail = async (data, template) => {
    return new Promise((resolve, reject) => {
        const { emailId, admin_reply } = data;
        // const email_transporter = nodemailer.createTransport({
        //   service: "gmail",
        //   auth: {
        //     user: process.env.EMAIL_ID,
        //     pass: process.env.EMAIL_PASSWORD,
        //   },
        // });
        const email_transporter = nodemailer_1.default.createTransport({
            host: "smtpout.secureserver.net",
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_ID,
                pass: process.env.EMAIL_PASSWORD,
            },
        });
        const compileTemplate = (template) => handlebars_1.default.compile(template);
        const complaint_reply_template = compileTemplate(template);
        const email_details = {
            from: process.env.EMAIL_ID,
            to: [emailId],
            subject: `Your complaint No. ${data.user_complaintId}`,
            template: `complaint_reply`,
            context: {
                admin_reply: `${admin_reply}`,
                name: `${data.name}`,
                complaintId: `${data.user_complaintId}`,
            },
        };
        email_transporter.sendMail({
            ...email_details,
            html: complaint_reply_template(email_details.context),
        }, async (err, data) => {
            if (err) {
                console.log("Error Occured:", err);
                reject(err);
            }
            else {
                resolve(true);
            }
        });
    });
};
exports.ComplaintReplyEmail = ComplaintReplyEmail;
//# sourceMappingURL=emailService.js.map