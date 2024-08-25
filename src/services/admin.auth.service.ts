import prisma from "../prisma";
import jwt, { JwtPayload } from "jsonwebtoken";
import { ParsedQs } from "qs";
import {
  adminTokenData,
  createAdminAuditorInput,
  createAdminInput,
  role,
  updateAdminAuditorInput,
} from "../utility/DataTypes/types.admin";
import HTTPError from "../utility/HttpError";
import {
  generateAccessTokenAdmin,
  generateRefreshTokenAdmin,
} from "../utility/Tokens";
import crypto from "crypto";
import { AdminAuditorCreationMail } from "../utility/emailService";
import { StoreOtpInDb, verifyOTPFromDb } from "../utility/OtpStorageInDb";
import { UpdateData } from "../utility/DataTypes/types.user";
import { getUserByUniqueData } from "./auth.services";
import { trackActiveSession } from "../utility/changeHistoryTrackFunction";
import {
  otp_verification_dashboardUsers,
  otp_verification_dashboardUsers_login,
} from "../templates/DashboardTemplates";
import { String } from "aws-sdk/clients/acm";

//login
//check session
export const checkUserSession = async (data: { emailId: string }) => {
  try {
    const { emailId } = data;

    //check if user exist
    const findUser = await prisma.dashboardUser.findFirst({
      where: {
        emailId: {
          equals: emailId,
          mode: "insensitive",
        },
      },
    });
    if (!findUser) {
      throw new HTTPError("could not find user ", 404);
    }

    //check user session
    const isSessionValid = await prisma.dashboardUser.findFirst({
      where: {
        emailId: {
          equals: emailId,
          mode: "insensitive",
        },
        NOT: {
          currentSessionId: null,
        },
      },
    });
    if (isSessionValid) {
      throw new HTTPError("You are already logged in", 423);
    }
    return {
      success: true,
      message: "You can continue to login",
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("prisma client error", 412);
      throw new HTTPError(error.name, 500);
    }
  }
};
//1.send otp
export const createOtpforLogin = async (data: { emailId: string }) => {
  try {
    const { emailId } = data;

    const existingAdmin = await prisma.dashboardUser.findFirst({
      where: {
        emailId: {
          equals: emailId,
          mode: "insensitive",
        },
      },
    });
    if (!existingAdmin) {
      throw new HTTPError(`user with ${emailId} does not exist`, 404); // user already exist throw error
    }

    const storedOtpInDb = await StoreOtpInDb(
      emailId,
      existingAdmin.position,
      existingAdmin.role as role,
      existingAdmin.fullName,
      otp_verification_dashboardUsers_login,
      "THITO- OTP for login"
    );

    if (!storedOtpInDb.success) {
      throw new HTTPError("cannot store otp", 204);
    }

    return {
      success: true,
      message: "OTP send successfully!!",
      emailId: emailId,
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("Prisma Client error", 500);
      throw new HTTPError(error.name, 500);
    }
  }
};
//2.verify otp
export const loginDashboardUser = async (data: {
  emailId: string;
  otp: number;
}) => {
  try {
    const { emailId, otp } = data;

    //password verification
    const admin_create = await prisma.dashboardUser.findFirst({
      where: {
        emailId: {
          equals: emailId,
          mode: "insensitive",
        },
      },
    });
    if (!admin_create) {
      throw new HTTPError(`could not find user with email id ${emailId}`, 404);
    }
    //otp verification
    const verifyUser = await verifyOTPFromDb(emailId, otp);
    if (!verifyUser) {
      throw new HTTPError("cannot verify user: db error", 500);
    }

    //session id generation
    const currentSessionId = crypto.randomBytes(20).toString("hex");
    //token generation
    const { id, role } = admin_create;
    const adminData = {
      id,
      emailId,
      role,
      currentSessionId,
    };
    const accessToken = generateAccessTokenAdmin(adminData);
    const refreshToken = generateRefreshTokenAdmin(adminData);
    //adding refresh token to db
    const loggedinAdmin = await prisma.dashboardUser.update({
      data: {
        refreshToken,
        currentSessionId,
      },
      where: {
        id,
        emailId,
      },
    });
    if (!loggedinAdmin) {
      throw new HTTPError("DB Error:could not login user", 500);
    }
    await prisma.dashboardUserOtpStore.delete({
      where: {
        emailId,
      },
    });
    return {
      success: true,
      message: " logged in successfully!!",
      role: admin_create.role,
      name: admin_create.fullName,
      accessToken: accessToken,
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("Prisma Client error", 500);
      throw new HTTPError(error.name, 500);
    }
  }
};

//refresh token
export const generateNewAccessToken = async (token: string) => {
  try {
    if (!token) throw new HTTPError("Missing Required Fields", 400);

    // const { accessToken } = data;
    const accessToken = token.split(" ")[1];
    if (!accessToken) {
      throw new HTTPError("No token provided.", 401);
    }

    const decodedToken = jwt.decode(accessToken) as JwtPayload;

    if (!decodedToken) throw new HTTPError("Invalid Token.", 401);

    // 3. Find User
    const dashboardUsers = await prisma.dashboardUser.findFirst({
      where: { id: decodedToken["id"] },
    });
    if (!dashboardUsers) {
      throw new HTTPError("User not found.", 404);
    }
    //check if the session is valid
    if (dashboardUsers.currentSessionId !== decodedToken.currentSessionId) {
      throw new HTTPError("Session invalidated. Please log in again.", 403);
    }
    // 4. Check Refresh Token
    if (decodedToken["exp"] && Date.now() / 1000 >= decodedToken["exp"]) {
      // Access token expired
      const refreshToken = dashboardUsers.refreshToken;
      if (!refreshToken) {
        await prisma.dashboardUser.update({
          where: { id: dashboardUsers.id },
          data: { refreshToken: "", currentSessionId: null },
        });
        throw new HTTPError("Access and refresh tokens expired.", 403);
      }

      const refreshDecodedToken = jwt.decode(refreshToken) as JwtPayload;

      if (!refreshDecodedToken) throw new HTTPError("User is logged Out", 403);

      if (
        dashboardUsers.currentSessionId !== refreshDecodedToken.currentSessionId
      ) {
        await prisma.dashboardUser.update({
          where: { id: dashboardUsers.id },
          data: { refreshToken: "", currentSessionId: null },
        });
        throw new HTTPError("Session invalidated. Please log in again.", 403);
      }
      if (
        refreshDecodedToken["exp"] &&
        Date.now() / 1000 >= refreshDecodedToken["exp"]
      ) {
        // Refresh token also expired
        await prisma.dashboardUser.update({
          where: { id: dashboardUsers.id },
          data: { refreshToken: "", currentSessionId: null },
        });
        throw new HTTPError("Session expired. Please Log in again", 403);
      } else {
        // Generate new access token using refresh token data
        const userData = {
          id: refreshDecodedToken["id"],
          emailId: refreshDecodedToken["emailId"],
          role: refreshDecodedToken["role"],
          currentSessionId: refreshDecodedToken["currentSessionId"],
        };
        const newAccessToken = generateAccessTokenAdmin(userData);

        return {
          success: true,
          refreshToken: newAccessToken,
        };
      }
    } else {
      // Access token still valid
      return {
        success: true,
        refreshToken: accessToken,
      };
    }
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("Prisma Client error", 500);
      throw new HTTPError(error.name, 500);
    }
  }
};

//logout admin
export const logoutAdmin = async (token: adminTokenData) => {
  try {
    const { id, emailId } = token;
    //logout user
    const updateUser = await prisma.dashboardUser.update({
      data: {
        // isLoggedIn: false,
        refreshToken: "",
        currentSessionId: null,
      },
      where: {
        id: parseInt(id),
        emailId,
      },
    });

    if (!updateUser) throw new HTTPError("User not found", 404);

    return {
      success: true,
      message: "successfully logged Out",
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("Prisma Client error", 500);
      throw new HTTPError(error.name, 500);
    }
  }
};

// CRUD SuperAdmin
//create otp for superAdmin
export const createOtpforSuperAdminRegistration = async (
  data: createAdminInput
) => {
  try {
    const { emailId, fullName, position } = data;

    const existingAdmin = await prisma.dashboardUser.findFirst({
      where: {
        emailId: {
          equals: emailId,
          mode: "insensitive",
        },
      },
    });
    if (existingAdmin) {
      throw new HTTPError(`user with ${emailId} already exist`, 400); // user already exist throw error
    }

    const storedOtpInDb = await StoreOtpInDb(
      emailId,
      position,
      "SUPERADMIN" as role,
      fullName,
      otp_verification_dashboardUsers,
      "OTP for registration in THITO Dashboard"
    );

    if (!storedOtpInDb.success) {
      throw new HTTPError("cannot store otp", 204);
    }
    return {
      success: true,
      message: "OTP send successfully!!",
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("Prisma Client error", 500);
      throw new HTTPError(error.name, 500);
    }
  }
};

//re-send otp for superAdmin
export const resendOtpforSuperAdminRegistration = async (emailId: String) => {
  try {
    const existingAdmin = await prisma.dashboardUserOtpStore.findFirst({
      where: {
        emailId: {
          equals: emailId,
          mode: "insensitive",
        },
      },
    });
    if (!existingAdmin) {
      throw new HTTPError(`user could not be found`, 404); // user already exist throw error
    }

    const storedOtpInDb = await StoreOtpInDb(
      emailId,
      existingAdmin.position,
      "SUPERADMIN" as role,
      existingAdmin.fullName,
      otp_verification_dashboardUsers,
      "OTP for registration in THITO Dashboard"
    );

    if (!storedOtpInDb.success) {
      throw new HTTPError("cannot store otp", 204);
    }
    return {
      success: true,
      message: "OTP send successfully!!",
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("Prisma Client error", 500);
      throw new HTTPError(error.name, 500);
    }
  }
};

//verify otp for superadmin
export const verifyOtpSuperAdmin = async (data: {
  emailId: string;
  otp: number;
}) => {
  try {
    const { emailId, otp } = data;

    const verifyUser = await verifyOTPFromDb(emailId, otp);
    if (!verifyUser) {
      throw new HTTPError("cannot verify user: db error", 500);
    }

    const admin_create = await prisma.dashboardUser.create({
      data: {
        fullName: verifyUser.fullName,
        emailId,
        position: verifyUser.position,
        // password: hashedPassword,
        role: verifyUser.role,
      },
    });
    if (!admin_create) {
      throw new HTTPError("could not create admin", 500);
    }
    await prisma.dashboardUserOtpStore.delete({
      where: {
        emailId,
      },
    });
    let formattedStr =
      verifyUser.role.charAt(0) + verifyUser.role.slice(1).toLowerCase();

    const emaildata = {
      emailId,
      subject: "Successful registration in THITO Dashboard",
      role: formattedStr as role,
      fullName: verifyUser.fullName,
    };
    AdminAuditorCreationMail(emaildata);

    return {
      success: true,
      message: "Super admin created successfully",
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("Prisma Client error", 500);
      throw new HTTPError(error.name, 500);
    }
  }
};
//read Superadmin
export const getSuperAdmin = async (admin: adminTokenData, param: ParsedQs) => {
  try {
    const { id } = param;
    const adminId = id ? parseInt(id as string) : parseInt(admin.id);
    const findAdmin = await prisma.dashboardUser.findMany({
      where: {
        // id: adminId,
        role: "SUPERADMIN",
      },
      select: {
        id: true,
        fullName: true,
        emailId: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!findAdmin) {
      throw new HTTPError("No Super Admin Found", 404);
    }
    return {
      success: true,
      data: findAdmin,
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("Prisma Client error", 500);
      throw new HTTPError(error.name, 500);
    }
  }
};
//update superAdmin
export const updateSuperAdmin = async (
  data: updateAdminAuditorInput,
  admin: adminTokenData
) => {
  try {
    const adminId = parseInt(admin.id);
    const { fullName, emailId, position } = data;

    const findAdmin = await prisma.dashboardUser.findUnique({
      where: {
        id: adminId,
        role: "SUPERADMIN",
      },
    });
    if (!findAdmin) {
      throw new HTTPError("Could not find superadmin", 404);
    }

    const updateAdmin = await prisma.dashboardUser.update({
      where: {
        id: adminId,
        role: "SUPERADMIN",
      },
      data: {
        fullName,
        emailId,
        position,
      },
    });
    if (!updateAdmin) {
      throw new HTTPError("Failed to update data", 500);
    }
    let formattedStr =
      updateAdmin.role.charAt(0) + updateAdmin.role.slice(1).toLowerCase();

    if (emailId) {
      const emaildata = {
        emailId,
        subject: "Successful registration in THITO Dashboard",
        role: formattedStr as role,
        fullName: updateAdmin.fullName,
      };
      AdminAuditorCreationMail(emaildata);
    }

    return {
      success: true,
      data: "Super admin updated successfully",
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("Prisma Client error", 500);
      throw new HTTPError(error.name, 500);
    }
  }
};
//delete superadmin
export const deleteSuperAdmin = async (admin: adminTokenData) => {
  try {
    const adminId = parseInt(admin.id);

    const findAdmin = await prisma.dashboardUser.findUnique({
      where: {
        id: adminId,
        role: "SUPERADMIN",
      },
    });
    if (!findAdmin) {
      throw new HTTPError("Could not find superadmin", 404);
    }

    const deleteAdmin = await prisma.dashboardUser.delete({
      where: {
        id: adminId,
        role: "SUPERADMIN",
      },
    });
    if (!deleteAdmin) {
      throw new HTTPError("Failed to update data", 500);
    }

    return {
      success: true,
      data: "Super admin deleted successfully",
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("Prisma Client error", 500);
      throw new HTTPError(error.name, 500);
    }
  }
};

//CRUD admin auditor
//create otp for admin & auditor
export const createOtpforAdminAuditor = async (
  data: createAdminAuditorInput
) => {
  try {
    const { emailId, fullName, position, role } = data;

    const existingAdmin = await prisma.dashboardUser.findFirst({
      where: {
        emailId: {
          equals: emailId,
          mode: "insensitive",
        },
      },
    });
    if (existingAdmin) {
      throw new HTTPError(`user with ${emailId} already exist`, 400); // user already exist throw error
    }
    // create otp
    const storedOtpInDb = await StoreOtpInDb(
      emailId,
      position,
      role,
      fullName,
      otp_verification_dashboardUsers,
      "OTP for registration in THITO Dashboard"
    );

    if (!storedOtpInDb.success) {
      throw new HTTPError("cannot store otp", 204);
    }

    return {
      success: true,
      message: "OTP send successfully!!",
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("Prisma Client error", 500);
      throw new HTTPError(error.name, 500);
    }
  }
};

//resend otp for admin & auditor
export const resendOtpforAdminAuditor = async (emailId: string) => {
  try {
    const existingAdmin = await prisma.dashboardUserOtpStore.findFirst({
      where: {
        emailId: {
          equals: emailId,
          mode: "insensitive",
        },
      },
    });
    if (!existingAdmin) {
      throw new HTTPError(`user not found`, 404); // user already exist throw error
    }
    // create otp
    const storedOtpInDb = await StoreOtpInDb(
      emailId,
      existingAdmin.position,
      existingAdmin.role,
      existingAdmin.fullName,
      otp_verification_dashboardUsers,
      "OTP for registration in THITO Dashboard"
    );

    if (!storedOtpInDb.success) {
      throw new HTTPError("cannot store otp", 204);
    }

    return {
      success: true,
      message: "OTP send successfully!!",
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("Prisma Client error", 500);
      throw new HTTPError(error.name, 500);
    }
  }
};

//verify otp
export const verifyOtpAdminAuditor = async (data: {
  emailId: string;
  otp: number;
}) => {
  try {
    const { emailId, otp } = data;
    const verifyUser = await verifyOTPFromDb(emailId, otp);
    if (!verifyUser) {
      throw new HTTPError("cannot verify user: db error", 500);
    }

    const admin_create = await prisma.dashboardUser.create({
      data: {
        fullName: verifyUser.fullName,
        emailId,
        position: verifyUser.position,
        // password: hashedPassword,
        role: verifyUser.role,
      },
    });
    if (!admin_create) {
      throw new HTTPError("could not create admin", 500);
    }
    await prisma.dashboardUserOtpStore.delete({
      where: {
        emailId,
      },
    });
    let formattedStr =
      verifyUser.role.charAt(0) + verifyUser.role.slice(1).toLowerCase();

    const emaildata = {
      emailId,
      subject: `Successful registration in THITO Dashboard`,
      role: formattedStr as role,
      fullName: verifyUser.fullName,
    };
    AdminAuditorCreationMail(emaildata);

    return {
      success: true,
      message: `${verifyUser.role} created successfully`,
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("Prisma Client error", 500);
      throw new HTTPError(error.name, 500);
    }
  }
};

//update admin&auditor
export const updateAdminData = async (
  admin: adminTokenData,
  data: updateAdminAuditorInput,
  params: ParsedQs
) => {
  try {
    const id = parseInt(params.id as string, 10);
    const { fullName, position } = data;

    if (admin.role == "SUPERADMIN") {
      //1. Superadmin is changing admin/ auditor details
      const findAdmin = await prisma.dashboardUser.findUnique({
        where: {
          id,
          OR: [{ role: "ADMIN" }, { role: "AUDITOR" }],
        },
        select: {
          role: true,
        },
      });
      // if (emailId) {
      //   if (findAdmin) {
      //     throw new HTTPError("User with email id already exist", 404);
      //   }
      // }
      if (!findAdmin) {
        throw new HTTPError("Could not find admin or auditor", 404);
      }

      const updateAdmin = await prisma.dashboardUser.update({
        where: {
          id,
          OR: [{ role: "ADMIN" }, { role: "AUDITOR" }],
        },
        data: {
          fullName,
          position,
        },
      });
      if (!updateAdmin) {
        throw new HTTPError("Failed to update data", 500);
      }
      return {
        success: true,
        data: "Admin/auditor updated successfully",
      };
    }

    //2. Auditor is changing his own details
    const findAdmin = await prisma.dashboardUser.findUnique({
      where: {
        id,
        role: "ADMIN",
      },
      select: {
        role: true,
      },
    });
    if (!findAdmin) {
      throw new HTTPError("Could not find admin", 500);
    }

    const updateAdmin = await prisma.dashboardUser.update({
      where: {
        id,
        role: "ADMIN",
      },
      data: {
        fullName,
        position,
      },
    });
    if (!updateAdmin) {
      throw new HTTPError("Failed to update data", 500);
    }

    return {
      success: true,
      data: "Admin updated successfully",
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.name, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("Prisma Client error", 500);
      throw new HTTPError(error.name, 500);
    }
  }
};

//getAdminAuditor
export const fetchAdminAuditor = async (params: ParsedQs) => {
  try {
    const { id, page, search, limit } = params;

    const filters: { id?: number } = {};
    const searchFilter: Array<{}> = [];

    if (id) {
      filters.id = parseInt(id as string);
    }
    if (search) {
      searchFilter.push(
        { emailId: { contains: search, mode: "insensitive" } },
        { fullName: { contains: search, mode: "insensitive" } },
        { position: { contains: search, mode: "insensitive" } }
        // { role: { contains: search, mode: "insensitive" } }
      );
    }

    const fetchedData = await prisma.dashboardUser.findMany({
      where: {
        ...filters,
        AND: [
          { OR: [{ role: "ADMIN" }, { role: "AUDITOR" }] },
          ...(searchFilter.length > 0 ? [{ OR: searchFilter }] : []),
        ],
      },
      select: {
        id: true,
        fullName: true,
        emailId: true,
        role: true,
        position: true,
        createdAt: true,
      },
      skip: page
        ? (parseInt(page as string) - 1) * parseInt(limit as string)
        : 0,
      take: limit ? parseInt(limit as string) : 500,
    });
    if (!fetchedData) {
      throw new HTTPError("No data found", 404);
    }

    const totalRecords = fetchedData.length;

    return {
      success: true,
      data: fetchedData,
      totalRecords: totalRecords,
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("Prisma Client error", 500);
      throw new HTTPError(error.name, 500);
    }
  }
};

//deleteAdminAuditor
export const deleteAdminAuditors = async (params: ParsedQs) => {
  try {
    let adminAuditorId: Array<number> = [];
    const id = params.id as string;
    if (!id) {
      throw new HTTPError("provide the id of the user to be deleted", 400);
    }
    if (!Array.isArray(id)) {
      adminAuditorId = id.split(",").map((item: string) => {
        return parseInt(item);
      });
    }
    const fetchedData = await prisma.dashboardUser.findMany({
      where: {
        id: {
          in: adminAuditorId,
        },
        OR: [{ role: "ADMIN" }, { role: "AUDITOR" }],
      },
    });
    if (!fetchedData.length) {
      throw new HTTPError("No data found", 404);
    }

    const deletedData = await prisma.dashboardUser.deleteMany({
      where: {
        id: {
          in: adminAuditorId,
        },
        OR: [{ role: "ADMIN" }, { role: "AUDITOR" }],
      },
    });

    if (!deletedData || deletedData.count == 0) {
      throw new HTTPError("could not delete the user", 500);
    }

    return {
      success: true,
      data: "Admin/Auditor deleted successfully",
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("Prisma Client error", 500);
      throw new HTTPError(error.name, 500);
    }
  }
};

//getDashboardData
export const getSuperAdminDashboardData = async () => {
  try {
    const AllData: any = {};
    const totalUsers = await prisma.users.count({});
    if (!totalUsers) throw new HTTPError("No data found", 404);
    // const activeUsersDaily
    const [totalMale, totalFemale, otherGender] = await Promise.all([
      prisma.users.count({
        where: {
          gender: "male",
        },
      }),
      prisma.users.count({
        where: {
          gender: "female",
        },
      }),
      prisma.users.count({
        where: {
          gender: "other",
        },
      }),
    ]);
    const currentDate: Date = new Date(Date.now());
    const oneDayAgo = new Date(currentDate);
    oneDayAgo.setDate(currentDate.getDate() - 1);

    const oneWeekAgo = new Date(currentDate);
    oneWeekAgo.setDate(currentDate.getDate() - 7);

    const oneMonthAgo = new Date(currentDate);
    oneMonthAgo.setDate(currentDate.getDate() - 30);

    // const [activeUsersDaily, activeUsersWeekly, activeUsersMonthly] =
    //   await Promise.all([
    //     prisma.activeUsers.count({
    //       where: {
    //         timeStamp: {
    //           gte: oneDayAgo,
    //           lte: currentDate,
    //         },
    //       },
    //     }),
    //     prisma.activeUsers.count({
    //       where: {
    //         timeStamp: {
    //           gte: oneWeekAgo,
    //           lte: currentDate,
    //         },
    //       },
    //     }),
    //     prisma.activeUsers.count({
    //       where: {
    //         timeStamp: {
    //           gte: oneMonthAgo,
    //           lte: currentDate,
    //         },
    //       },
    //     }),
    //   ]);

    const [inActiveUsersMonthly, activeUsersMonthly] = await Promise.all([
      prisma.users.count({
        where: {
          currentSessionId: null,
          activeUsers: {
            timeStamp: {
              lt: oneMonthAgo,
            },
          },
        },
      }),
      prisma.activeUsers.count({
        where: {
          timeStamp: {
            gte: oneMonthAgo,
            lte: currentDate,
          },
        },
      }),
    ]);

    AllData.totalUsers = totalUsers;
    AllData.totalMale = totalMale;
    AllData.totalFemale = totalFemale;
    AllData.otherGender = otherGender;
    AllData.monthlyinActiveUsers = inActiveUsersMonthly;
    // AllData.activeUsersDaily = activeUsersDaily;
    // AllData.weeklyActiveUser = activeUsersWeekly;
    AllData.monthlyActiveUser = activeUsersMonthly;

    return {
      success: true,
      data: AllData,
    };
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("Prisma Client error", 500);
      throw new HTTPError(error.name, 500);
    }
  }
};

//USER Mutations
//Edit User by id
//update user by id - other
export const adminUpdateUserById = async (data: UpdateData, userId: string) => {
  try {
    if (!data || !userId) throw new HTTPError("Required Data missing", 400);

    const {
      phoneNumber,
      emailId,
      gender,
      dob,
      address,
      pincode,
      emergencyContact,
      bloodGroup,
      presentDiseases,
      allergies,
      doctorFullName,
      docAddress,
      docPhoneNumber,
      additionalInformation,
    } = data;

    const findUser = await getUserByUniqueData(userId);
    if (!findUser) throw new HTTPError("User not found!", 404);

    const updateUser = await prisma.users.update({
      where: {
        id: userId,
      },
      data: {
        phoneNumber,
        emailId,
        gender,
        dob,
        address,
        pincode,
        emergencyContact,
        isSync: false,
        healthRecord: {
          update: {
            bloodGroup,
            presentDiseases,
            allergies,
            doctorFullName,
            docAddress,
            docPhoneNumber,
            additionalInformation,
          },
        },
      },
    });

    if (!updateUser) throw new HTTPError("Could Not update User Data", 500);
    const updateActiveSession = trackActiveSession(userId);
    if (!updateActiveSession) {
      throw new HTTPError("Could not update active session", 204);
    }
    const returnData = {
      success: true,
      id: updateUser.id,
      message: "User Data was updated successfully",
    };
    return returnData;
  } catch (error: HTTPError | Error | any) {
    console.log("Error->Log:", error);
    if (error instanceof HTTPError) {
      throw new HTTPError(error.message, error.code);
    } else {
      if (error.name == "PrismaClientKnownRequestError")
        throw new HTTPError("Prisma Client error", 500);
      throw new HTTPError(error.name, 500);
    }
  }
};
