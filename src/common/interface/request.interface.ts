import { Request } from "express";
import { User } from "@src/common/entity/user.entity";
import { VerifiedToken } from "@src/auth/interface/auth.interface";

export interface RequestWithUser extends Request {
  user: User;
  verifiedToken: VerifiedToken;
}
