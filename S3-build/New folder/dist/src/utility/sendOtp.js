"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendUUIDToMobile = exports.sendOtpToMobile = void 0;
const request_1 = __importDefault(require("request"));
const dotenv = __importStar(require("dotenv"));
dotenv.config();
// import gupshup from "@api/gupshup";
// export const sendSMS = async (phoneNumber: string, message: string) => {
//   var params = {
//     userid: process.env.SMS_USER_ID as string,
//     password: process.env.SMS_PASSWORD as string,
//     send_to: phoneNumber,
//     msg: message,
//     method: "sendMessage",
//     msg_type: "text",
//     format: "json",
//     auth_scheme: "plain",
//     v: 1.1,
//   };
//   gupshup
//     .sendMessagePOST(params)
//     .then(({ data }: any) => console.log(data))
//     .catch((err: Error) => console.error(err));
// };
const axios_1 = __importDefault(require("axios"));
const sendOtpToMobile = async (phoneNumber, message) => {
    const options = {
        method: "POST",
        url: process.env.SMS_URL,
        headers: {
            "content-type": "application/x-www-form-urlencoded",
        },
        data: new URLSearchParams({
            userid: process.env.SMS_USER_ID,
            password: process.env.SMS_PASSWORD,
            send_to: phoneNumber,
            msg: message,
            method: "sendMessage",
            msg_type: "text",
            format: "json",
            auth_scheme: "plain",
            v: "1.1",
        }),
    };
    try {
        await (0, axios_1.default)(options);
        return true;
    }
    catch (error) {
        throw error;
    }
};
exports.sendOtpToMobile = sendOtpToMobile;
const sendUUIDToMobile = async (phoneNumber, uuid) => {
    var options = {
        method: "POST",
        url: process.env.SMS_URL,
        headers: {
            apikey: process.env.SMS_API_KEY,
            "cache-control": "no-cache",
            "content-type": "application/x-www-form-urlencoded",
        },
        form: {
            userid: process.env.SMS_USER_ID,
            password: process.env.SMS_PASSWORD,
            senderid: process.env.SMS_SENDER_ID,
            sendMethod: "quick",
            msgType: "text",
            mobile: phoneNumber, //7066528104
            msg: `Welcome to THITO!
      Enter the OTP ${uuid} to proceed further -STEIGEN HEALTHCARE`,
            duplicateCheck: "true",
            output: "json",
        },
    };
    //wrapped request in apromise because request doesnt explicitly support promises
    return new Promise((resolve, reject) => {
        (0, request_1.default)(options, function (error, response) {
            if (error) {
                reject(error);
            }
            else {
                resolve(response.body);
            }
        });
    });
};
exports.sendUUIDToMobile = sendUUIDToMobile;
//# sourceMappingURL=sendOtp.js.map