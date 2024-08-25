import { z } from "zod";

//validations for userUploadFile
// 1. file must be in .jpeg,jpg,pdf,png,heic,docx and less than 5mb
// 2. form data must contain category: string;name: string;dr_name: string;note?: string;isSensitive: string;

const max_file_size: number = 10 * 1024 * 1024 * 1024;
const validFileFormat: Array<string> = [
  "png",
  "jpeg",
  "jpg",
  "pdf",
  "heif",
  "heic",
  "docx",
];

const CategoryEnum = z.enum(["report", "bill", "prescription", "other"]);
const isSensitiveEnum = z.enum(["true", "false"]);
export const uploadFileSchemaValidation = z.object({
  fieldname: z.string().min(1),
  originalname: z.string().refine(
    (originalname: string) => {
      const org: string = originalname.split(".").pop() as string;
      return validFileFormat.includes(org);
    },
    {
      message: "file type is not supported",
    }
  ),
  size: z.number().refine((size: number) => size <= max_file_size, {
    message: "file must be of maximum 5mb",
  }),
});

export const uploadFormDataValidation = z
  .object({
    category: CategoryEnum.refine((val) => CategoryEnum.options.includes(val)),
    name: z.string().min(1, "name is required"),
    dr_name: z.string().optional(),
    documentLabName: z.string().optional(),
    note: z.string().optional().nullable(),
    isSensitive: isSensitiveEnum.refine((val) =>
      isSensitiveEnum.options.includes(val)
    ),
  })
  .refine(
    (data) => {
      const { category, documentLabName } = data;

      if (
        (category == "prescription" || category == "report") &&
        (documentLabName == undefined || documentLabName == "")
      )
        return false;

      return true;
    },
    {
      message: "Lab Name is compulsory when category is prescription/report",
      path: ["documentLabName"],
    }
  );

export const editFileSchemaValidation = z.object({
  fieldname: z.string().optional(),
  originalname: z
    .string()
    .refine(
      (originalname: string) => {
        const org: string = originalname.split(".").pop() as string;
        return validFileFormat.includes(org);
      },
      {
        message: "file type is not supported",
      }
    )
    .optional(),
  size: z
    .number()
    .refine((size: number) => size <= max_file_size, {
      message: "file must be of maximum 5mb",
    })
    .optional(),
});

export const editFormDataValidation = z
  .object({
    category: CategoryEnum.refine((val) =>
      CategoryEnum.options.includes(val)
    ).optional(),
    name: z.string().optional(),
    dr_name: z.string().optional(),
    documentLabName: z.string().optional(),
    note: z.string().optional().nullable(),
    isSensitive: isSensitiveEnum
      .refine((val) => isSensitiveEnum.options.includes(val))
      .optional(),
  })
  .refine(
    (data) => {
      const { category, documentLabName } = data;

      if (
        category &&
        (category == "prescription" || category == "report") &&
        (documentLabName == undefined || documentLabName == "")
      )
        return false;

      return true;
    },
    {
      message: "Lab Name is compulsory when category is prescription/report",
      path: ["documentLabName"],
    }
  );

export const uploadFileValidation = z.object({
  file: uploadFileSchemaValidation,
  form_data: uploadFormDataValidation,
});

export const editFileValidation = z.object({
  doc_file: editFileSchemaValidation.optional(),
  data: editFormDataValidation.optional(),
});

const base64ImageRegex = /^data:image\/(png|jpeg|jpg|heif|heic);base64,/;

export const base64String = z.string().refine(
  (data) => {
    // Allow empty string
    if (data === "") {
      return true;
    }

    // Ensure the string matches the base64 image pattern
    if (!base64ImageRegex.test(data)) {
      return false;
    }

    // Extract the base64 encoded part
    const base64String = data.replace(base64ImageRegex, "");

    // Calculate the size in bytes (1 character = 1 byte)
    const sizeInBytes =
      base64String.length * (3 / 4) -
      (data.indexOf("=") > 0 ? data.length - data.indexOf("=") : 0);

    // 5MB = 5 * 1024 * 1024 bytes
    return sizeInBytes <= 10 * 1024 * 1024 * 1024;
  },
  {
    message:
      "Image must be a valid base64 encoded string and not exceed 5MB in size.",
  }
);

export const base64ImageValidation = z.object({
  profileImage: base64String,
});
