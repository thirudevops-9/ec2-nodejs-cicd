export const statusCodes: any = {
  200: {
    code: 200,
    flag: "OK",
    message: "Process Successful",
  },
  201: {
    code: 201,
    flag: "Created",
    message: "Created Successful",
  },
  204: {
    code: 204,
    flag: "Not created",
    message: "Could not create",
  },

  400: {
    code: 400,
    flag: "Bad Request",
    message: "The Server could not process the request due to bad syntax",
  },
  401: {
    code: 401,
    flag: "Unauthorized",
    message: "Unauthorized access",
  },
  403: {
    code: 403,
    flag: "Forbidden",
    message: "forbidden",
  },
  500: {
    code: 500,
    flag: "Internal Server error",
    message: "An Internal Server error occured",
  },
};
//412: custom error
