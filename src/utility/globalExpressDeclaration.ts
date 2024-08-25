import { adminTokenData } from "../utility/DataTypes/types.admin";
import { TokenData } from "./DataTypes/types.user";

declare global {
  namespace Express {
    interface Request {
      admin?: adminTokenData;
      user?: TokenData;
      expiredToken?: {
        accessToken: string;
      };
    }
  }
}

// export {}
