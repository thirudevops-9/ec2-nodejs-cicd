import { z } from "zod";

const max_file_size: number = 10 * 1024 * 1024 * 1024; //5mb
const validFileFormat: Array<string> = [
  "png",
  "jpeg",
  "jpg",
  "pdf",
  "heif",
  "docx",
];

export const uploadFileSchemaValidation = z.object({
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

export const CreateInsuranceValidation = z
  .object({
    policyNum: z.string().min(1),
    policyName: z.string().min(1),
    policyType: z.string().optional(),
    insuranceProv: z.string().optional(),
    renewalAt: z.string().date("Invalid date format. Use YYYY-MM-DD."),
    ifCoPay: z.string().optional(),
  })
  .refine(
    (data) => {
      const { renewalAt } = data;
      if (!renewalAt) return true;
      const dateTime = new Date(renewalAt);
      const now = new Date();

      return dateTime > now;
    },
    {
      message: "Expiry of insurance date must be in the future",
      path: ["renewalAt"],
    }
  );

export const uploadInsuranceValidation = z.object({
  file: uploadFileSchemaValidation.optional(),
  form_data: CreateInsuranceValidation,
});

export const EditInsuranceValidation = z
  .object({
    policyNum: z.string().optional(),
    policyName: z.string().optional(),
    policyType: z.string().optional(),
    insuranceProv: z.string().optional(),
    renewalAt: z
      .string()
      .date("Date must be of the format YYYY-MM-DD")
      .optional(),
    ifCoPay: z.string().optional(),
  })
  .refine(
    (data) => {
      const { renewalAt } = data;
      if (!renewalAt) return true;
      const dateTime = new Date(renewalAt);
      const now = new Date();

      return dateTime > now;
    },
    {
      message: "Expiry of insurance date must be in the future",
      path: ["renewalAt"],
    }
  );

export const ChangeInsuranceValidation = z.object({
  file: uploadFileSchemaValidation.optional(),
  form_data: EditInsuranceValidation.optional(),
});
