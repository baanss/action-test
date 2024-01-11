export enum Role {
  USER = "user",
  ADMIN = "admin",
}

export interface VerifiedToken {
  id: number;
  employeeId: string;
  role: Role;
  iat: number;
  exp: number;
}
