import express, { Express } from "express";
import dotenv from "dotenv";
import cors from "cors";
import bodyParser from "body-parser";
// import cookieParser from "cookie-parser";
import appRoute from "./routes/app_user_route";
import adminRoute from "./routes/app_admin_route";
import familyCareRoute from "./routes/app_familycare_route";
import vitalsRoute from "./routes/app_vitals_route";
import cron from "node-cron";
import "./utility/globalExpressDeclaration";
import {
  deleteOldNonRegisteredUsers,
  deleteOldOtpStoreData,
} from "./utility/cleanUp/deleteOldData";
import { unblockUsers } from "./utility/cleanUp/unBlockUser";
import firebase from "firebase-admin";
import { ServiceAccount } from "../config/pushNotificationServiceAccountCreds";
dotenv.config();

// Schedule the task to run every 30 days at midnight: 0 0 */30 * *
//Five minutes : */5 * * * *
cron.schedule("0 0 */30 * *", async () => {
  console.log("Running cleanup job...");
  await deleteOldNonRegisteredUsers();
  await deleteOldOtpStoreData();
});

firebase.initializeApp({
  credential: firebase.credential.cert(
    ServiceAccount as firebase.ServiceAccount
  ),
});

//unblocking users: Call the unblockUsers function periodically (every minute)
setInterval(unblockUsers, 60 * 1000);

const app: Express = express();
const port = process.env.PORT || 3000;

// app.use(express.json()); //to get json request data
// app.use(bodyParser.urlencoded({ extended: true }));

// Increase the body size limit to 5MB
app.use(bodyParser.urlencoded({ limit: "5mb", extended: false }));
app.use(bodyParser.json({ limit: "5mb" }));
// app.use(cookieParser());
app.use(cors());
// app.use(cors({ origin: "http://localhost:3000", credentials: true }));

app.use("/api/", appRoute);
app.use("/api/admin", adminRoute);
app.use("/api/familyCare/", familyCareRoute);
app.use("/api/vitals/", vitalsRoute);

app.listen(port, () => {
  console.log(`Server is running`);
});
