"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_middleware_1 = require("../middleware/user.middleware");
const vitalsController_1 = require("../controllers/vitalsController");
const router = express_1.default.Router();
//VITALS - user records
//Add new vital record for user
router.post("/vitalRecord", user_middleware_1.verifyUserToken, vitalsController_1.createVitalRecord);
//Add new record for period diary (custom function for period diary only)
// router.post("/vitalRecord/periodDiary", verifyUserToken, addPeriodRecord);
//Get vital data of user by vital module code and user/dependantId
router.get("/vitalData", user_middleware_1.verifyUserToken, vitalsController_1.getVitalDataByModule);
//get all "VALID" vital modules of a user
router.get("/vitalModule", user_middleware_1.verifyUserToken, vitalsController_1.getValidVitalModules);
//delete vital record of user by recordId
router.delete("/vitalRecord", user_middleware_1.verifyUserToken, vitalsController_1.deleteVitalRecordById);
exports.default = router;
//# sourceMappingURL=app_vitals_route.js.map