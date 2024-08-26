"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getValidModules = void 0;
const prisma_1 = __importDefault(require("../prisma"));
const getValidModules = async (user, searchFilter) => {
    try {
        const modules = await prisma_1.default.vitalModule.findMany({
            where: {
                ...(searchFilter.length > 0 ? { OR: searchFilter } : {}),
            },
        });
        return modules.filter((module) => {
            return module.filters.every((filter) => {
                if (!Array.isArray(module.filters) || module.filters.length === 0) {
                    // If filters is null, undefined, or not an array, treat it as no filters and include the module
                    return true;
                }
                if (filter.key == "age") {
                    const age = new Date(Date.now()).getFullYear() - user.dob.getFullYear();
                    return age >= parseInt(filter.value);
                }
                if (filter.key == "gender") {
                    return user[filter.key] == filter.value;
                }
                return user[filter.key] == filter.value;
            });
        });
    }
    catch (error) { }
};
exports.getValidModules = getValidModules;
//# sourceMappingURL=ValidVitalModules.js.map