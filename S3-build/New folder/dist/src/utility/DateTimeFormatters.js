"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.convertSecondsToTimeFormat = exports.getFirstDayOfCurrentYear = exports.formatTimeForDB = exports.formatDateForDB = exports.formatTime = exports.formatDate = void 0;
function formatDate(dateString) {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0"); // Pad with leading zero
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}
exports.formatDate = formatDate;
// Function to format time in HH:MM (24-hour format)
function formatTime(timeString) {
    const hours = String(timeString.getUTCHours()).padStart(2, "0");
    const minutes = String(timeString.getUTCMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
}
exports.formatTime = formatTime;
function formatDateForDB(dateString) {
    return `${dateString}T00:00:00Z`;
}
exports.formatDateForDB = formatDateForDB;
function formatTimeForDB(timeString) {
    return `1970-01-01T${timeString}Z`;
}
exports.formatTimeForDB = formatTimeForDB;
function getFirstDayOfCurrentYear() {
    const currentYear = new Date().getFullYear(); // Get the current year
    const firstDayOfYear = new Date(currentYear, 0, 1); // Create a new date representing January 1st of the current year
    return firstDayOfYear;
}
exports.getFirstDayOfCurrentYear = getFirstDayOfCurrentYear;
// 126 -> 2:06 format
const convertSecondsToTimeFormat = async (duration) => {
    console.log(typeof duration);
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor(duration / 60);
    const seconds = Math.floor(duration % 60);
    const time = `${hours == 0 ? "" : `${hours < 10 ? "0" : ""}${hours}:`}${minutes < 10 ? "0" : ""}${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
    return time;
};
exports.convertSecondsToTimeFormat = convertSecondsToTimeFormat;
//# sourceMappingURL=DateTimeFormatters.js.map