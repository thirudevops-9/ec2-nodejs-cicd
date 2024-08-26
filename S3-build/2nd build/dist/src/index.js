"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = __importDefault(require("body-parser"));
// import cookieParser from "cookie-parser";
const app_user_route_1 = __importDefault(require("./routes/app_user_route"));
const app_admin_route_1 = __importDefault(require("./routes/app_admin_route"));
const app_familycare_route_1 = __importDefault(require("./routes/app_familycare_route"));
const app_vitals_route_1 = __importDefault(require("./routes/app_vitals_route"));
const node_cron_1 = __importDefault(require("node-cron"));
require("./utility/globalExpressDeclaration");
const deleteOldData_1 = require("./utility/cleanUp/deleteOldData");
const unBlockUser_1 = require("./utility/cleanUp/unBlockUser");
const firebase_admin_1 = __importDefault(require("firebase-admin"));
const pushNotificationServiceAccountCreds_1 = require("../config/pushNotificationServiceAccountCreds");
dotenv_1.default.config();
// Schedule the task to run every 30 days at midnight: 0 0 */30 * *
//Five minutes : */5 * * * *
node_cron_1.default.schedule("0 0 */30 * *", async () => {
    console.log("Running cleanup job...");
    await (0, deleteOldData_1.deleteOldNonRegisteredUsers)();
    await (0, deleteOldData_1.deleteOldOtpStoreData)();
});
firebase_admin_1.default.initializeApp({
    credential: firebase_admin_1.default.credential.cert(pushNotificationServiceAccountCreds_1.ServiceAccount),
});
//unblocking users: Call the unblockUsers function periodically (every minute)
setInterval(unBlockUser_1.unblockUsers, 60 * 1000);
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// app.use(express.json()); //to get json request data
// app.use(bodyParser.urlencoded({ extended: true }));
// Increase the body size limit to 5MB
app.use(body_parser_1.default.urlencoded({ limit: "5mb", extended: false }));
app.use(body_parser_1.default.json({ limit: "5mb" }));
// app.use(cookieParser());
app.use((0, cors_1.default)());
// app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use("/api/", app_user_route_1.default);
app.use("/api/admin", app_admin_route_1.default);
app.use("/api/familyCare/", app_familycare_route_1.default);
app.use("/api/vitals/", app_vitals_route_1.default);
app.listen(port, () => {
    console.log(`Server is running`);
});
//# sourceMappingURL=index.js.map