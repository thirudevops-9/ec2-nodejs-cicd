import request from "request";
import * as dotenv from "dotenv";
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

import axios from "axios";

export const sendOtpToMobile = async (
  phoneNumber: string,
  message: string
): Promise<Object> => {
  const options = {
    method: "POST",
    url: process.env.SMS_URL as string,
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    data: new URLSearchParams({
      userid: process.env.SMS_USER_ID as string,
      password: process.env.SMS_PASSWORD as string,
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
    await axios(options);
    return true;
  } catch (error) {
    throw error;
  }
};

export const sendUUIDToMobile = async (phoneNumber: string, uuid: string) => {
  var options = {
    method: "POST",
    url: process.env.SMS_URL as string,
    headers: {
      apikey: process.env.SMS_API_KEY as string,
      "cache-control": "no-cache",
      "content-type": "application/x-www-form-urlencoded",
    },
    form: {
      userid: process.env.SMS_USER_ID as string,
      password: process.env.SMS_PASSWORD as string,
      senderid: process.env.SMS_SENDER_ID as string,
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
    request(
      options,
      function (error: string | undefined, response: { body: object }) {
        if (error) {
          reject(error);
        } else {
          resolve(response.body);
        }
      }
    );
  });
};
