import path from "path";
import multer from "multer";

const paths = path.join(__dirname, "../src/uploads");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, paths);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); //datenow is used to prevent overriding of file
  },
});
export const upload = multer({ storage });
