"use strict";
// export type generateOtpReturnData = {
//   fullName?: string;
//   phoneNumber?: string;
//   emailId?: string;
//   hashedPassword?: string;
//   hashedotp: string;
// };
Object.defineProperty(exports, "__esModule", { value: true });
exports.OtpExpiryEnum = void 0;
var OtpExpiryEnum;
(function (OtpExpiryEnum) {
    OtpExpiryEnum[OtpExpiryEnum["3m"] = 0] = "3m";
    OtpExpiryEnum[OtpExpiryEnum["5m"] = 1] = "5m";
    OtpExpiryEnum[OtpExpiryEnum["15m"] = 2] = "15m";
    OtpExpiryEnum[OtpExpiryEnum["30m"] = 3] = "30m";
    OtpExpiryEnum[OtpExpiryEnum["1h"] = 4] = "1h";
    OtpExpiryEnum[OtpExpiryEnum["2h"] = 5] = "2h";
})(OtpExpiryEnum || (exports.OtpExpiryEnum = OtpExpiryEnum = {}));
//# sourceMappingURL=otp.js.map