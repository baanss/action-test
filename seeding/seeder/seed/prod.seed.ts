import * as moment from "moment";
import { Role } from "@src/auth/interface/auth.interface";
import { CreditCategory } from "@src/common/entity/credit-history.entity";

export const prodAdmins = [
  {
    id: 1,
    employeeId: "hutomadm1",
    password: "change_this!",
    email: "hutomadm1@gmail.com",
    name: "Kim admin",
    role: Role.ADMIN,
  },
];

export const prodUsers = [
  {
    id: 2,
    employeeId: "doctor1",
    password: "change_this!",
    email: "hsvusr1@gmail.com",
    name: "Kim user",
    role: Role.USER,
  },
  {
    id: 3,
    employeeId: "doctor2",
    password: "change_this!",
    email: "hsvusr2@gmail.com",
    name: "Lee user",
    role: Role.USER,
  },
];

// V&V용
export const prodCreditHistories = [
  {
    userId: null,
    employeeId: "hutom",
    name: "hutom",
    category: CreditCategory.ALLOCATE,
    quantity: 100,
    status: true,
    isUserRequest: false,
    huId: null,
    createdAt: moment().add(1, "second").toISOString(), // 1초 후
  },
  {
    userId: null,
    employeeId: prodAdmins[0].employeeId,
    name: prodAdmins[0].name,
    category: CreditCategory.RUS_USE,
    quantity: -1,
    status: true,
    isUserRequest: true,
    huId: "T00000_0",
    createdAt: moment().add(3, "seconds").toISOString(), // 3초 후
  },
];
