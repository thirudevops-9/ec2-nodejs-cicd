import fs from "fs";

export const renameFile = (data: any, newFileName: string) => {
  try {
    // const type = data.mimetype.split("/")[1];
    const newPath = `${data.destination}/${newFileName}`;
    fs.renameSync(data.path, newPath);
    data.filename = `${newFileName}`;
    data.originalname = `${newFileName}`;
    data.path = newPath;
    return data;
  } catch (error) {
    console.error("Error renaming file:", error);
    throw error;
  }
};

// export const renameDocument = (data: any, newFileName: string) => {
//   try {
//     const type = data.mimetype.split("/")[1];
//     const newPath = `${data.destination}/${newFileName}.${type}`;
//     fs.renameSync(data.path, newPath);
//     data.filename = `${newFileName}.${type}`;
//     data.originalname = `${newFileName}.${type}`;
//     data.path = newPath;
//     return data;
//   } catch (error) {
//     console.error("Error renaming file:", error);
//     throw error;
//   }
// };
