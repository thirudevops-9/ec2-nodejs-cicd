import nodemailer from "nodemailer";
import handlebars from "handlebars";
import { otp_verification_existing_user } from "../templates/userTemplates";
import {
  complaintReply,
  successAdminAuditorRegistration,
  otp_verification_dashboardUsers,
} from "../templates/DashboardTemplates";
import { complaintData, emailData } from "./DataTypes/types.admin";
import { dashboardURL } from "../constants/data";
//OTP email user
export const OTPmailService = async (
  email_id: string,
  data: number | string,
  subject: string,
  template: string
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    // const email_transporter = nodemailer.createTransport({
    //   service: "gmail",
    //   auth: {
    //     user: process.env.EMAIL_ID,
    //     pass: process.env.EMAIL_PASSWORD,
    //   },
    // });
    const email_transporter = nodemailer.createTransport({
      host: "smtpout.secureserver.net",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_ID,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    const compileTemplate = (templates: string) =>
      handlebars.compile(templates);
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

    email_transporter.sendMail(
      {
        ...email_details,
        html: otp_verification_template(email_details.context),
      },
      async (err, data) => {
        if (err) {
          console.log("Error Occurs", err);
          reject(err);
        } else {
          resolve(true);
        }
      }
    );
  });
};

//otp mail admin
export const OTPmailServiceDashboardUser = async (
  email_id: string,
  otp: number,
  fullName: string,
  template: string,
  subject: string
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    // const email_transporter = nodemailer.createTransport({
    //   service: "gmail",
    //   auth: {
    //     user: process.env.EMAIL_ID,
    //     pass: process.env.EMAIL_PASSWORD,
    //   },
    // });
    const email_transporter = nodemailer.createTransport({
      host: "smtpout.secureserver.net",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_ID,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    const compileTemplate = (template: string) => handlebars.compile(template);
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

    email_transporter.sendMail(
      {
        ...email_details,
        html: otp_verification_template(email_details.context),
      },
      async (err, data) => {
        if (err) {
          console.log("Error Occurs", err);
          reject(err);
        } else {
          resolve(true);
        }
      }
    );
  });
};

//existing user otp
export const OTPFamilyCare = async (
  email_id: string,
  fullName: string,
  user: string, //user
  otp: number,
  subject: string,
  template: string
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    // const email_transporter = nodemailer.createTransport({
    //   service: "gmail",
    //   auth: {
    //     user: process.env.EMAIL_ID,
    //     pass: process.env.EMAIL_PASSWORD,
    //   },
    // });
    const email_transporter = nodemailer.createTransport({
      host: "smtpout.secureserver.net",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_ID,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    const compileTemplate = (template: string) => handlebars.compile(template);
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

    email_transporter.sendMail(
      {
        ...email_details,
        html: otp_verification_template(email_details.context),
      },
      async (err, data) => {
        if (err) {
          console.log("Error Occurs", err);
          reject(err);
        } else {
          console.log("Email sent successfully");
          resolve(true);
        }
      }
    );
  });
};

//mail service to reset password
export const ResetPasswordAndChangeContactDetails = async (
  email_id: string,
  data: number | string,
  subject: string,
  template: string,
  firstName: string
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    // const email_transporter = nodemailer.createTransport({
    //   service: "gmail",
    //   auth: {
    //     user: process.env.EMAIL_ID,
    //     pass: process.env.EMAIL_PASSWORD,
    //   },
    // });
    const email_transporter = nodemailer.createTransport({
      host: "smtpout.secureserver.net",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_ID,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    const compileTemplate = (templates: string) =>
      handlebars.compile(templates);
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

    email_transporter.sendMail(
      {
        ...email_details,
        html: otp_verification_template(email_details.context),
      },
      async (err, data) => {
        if (err) {
          console.log("Error Occurs", err);
          reject(err);
        } else {
          resolve(true);
        }
      }
    );
  });
};

export const AdminAuditorCreationMail = async (
  data: emailData
): Promise<boolean> => {
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
    const email_transporter = nodemailer.createTransport({
      host: "smtpout.secureserver.net",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_ID,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
    const compileTemplate = (template: string) => handlebars.compile(template);
    const admin_registration_template = compileTemplate(
      successAdminAuditorRegistration
    );
    const email_details = {
      from: process.env.EMAIL_ID,
      to: [emailId],
      subject: subject,
      template: `successAdminAuditorRegistration`,
      context: {
        role: `${roles}`,
        userName: `${fullName}`,
        dashboardURL: `${dashboardURL}`,
      },
    };

    email_transporter.sendMail(
      {
        ...email_details,
        html: admin_registration_template(email_details.context),
      },
      async (err, data) => {
        if (err) {
          console.log("Error Occured:", err);
          reject(err);
        } else {
          resolve(true);
        }
      }
    );
  });
};

//sending complaint reply to user
export const ComplaintReplyEmail = async (
  data: complaintData,
  template: string
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    const { emailId, admin_reply } = data;

    // const email_transporter = nodemailer.createTransport({
    //   service: "gmail",
    //   auth: {
    //     user: process.env.EMAIL_ID,
    //     pass: process.env.EMAIL_PASSWORD,
    //   },
    // });
    const email_transporter = nodemailer.createTransport({
      host: "smtpout.secureserver.net",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_ID,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    const compileTemplate = (template: string) => handlebars.compile(template);
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

    email_transporter.sendMail(
      {
        ...email_details,
        html: complaint_reply_template(email_details.context),
      },
      async (err, data) => {
        if (err) {
          console.log("Error Occured:", err);
          reject(err);
        } else {
          resolve(true);
        }
      }
    );
  });
};
