import * as moment from "moment";

import { Role } from "@src/auth/interface/auth.interface";

// TODO: admin 1개로 수정?
export const testAdmins = [
  // admin 1
  {
    id: 1,
    employeeId: "admin1",
    password: "change_this!",
    email: "admin1@test.com",
    name: "Kim_admin",
    phoneNumber: "010-5555-5555",
    role: Role.ADMIN,
    passwordSettingAt: moment(new Date()).subtract(90, "days").format(), // 90일 전
    initPassword: true,
  },
  // admin 2
  {
    id: 2,
    employeeId: "admin2",
    password: "change_this!",
    email: "admin2@test.com",
    name: "Kim%admin",
    role: Role.ADMIN,
    passwordSettingAt: moment(new Date()).subtract(90, "days").format(), // 90일 전
    initPassword: true,
  },
  // admin 3 (로그인 잠금)
  {
    id: 3,
    employeeId: "admin3",
    password: "change_this!",
    email: "admin3@test.com",
    name: "Kim\\admin",
    role: Role.ADMIN,
    signInFailed: 5,
    passwordSettingAt: moment(new Date()).subtract(90, "days").format(), // 90일 전
    initPassword: true,
  },
  // manager 1
  {
    id: 4,
    employeeId: "manager1",
    password: "change_this!",
    email: "manager1@test.com",
    name: "Kim%manager",
    phoneNumber: "010-3333-3333",
    role: Role.ADMIN,
  },
  // manager 2
  {
    id: 5,
    employeeId: "manager2",
    password: "change_this!",
    email: "manager2@test.com",
    name: "Kim%manager",
    phoneNumber: "010-4444-4444",
    role: Role.ADMIN,
  },
  // manager 3
  {
    id: 6,
    employeeId: "manager3",
    password: "change_this!",
    email: "manager3@test.com",
    name: "Park\\manager",
    role: Role.ADMIN,
  },
  // manager 4 (비활성화)
  {
    id: 7,
    employeeId: "manager4",
    password: "change_this!",
    email: "manager4@test.com",
    name: "Park_manager",
    role: Role.ADMIN,
    deletedAt: new Date(),
  },
  // manager 5 (로그인 잠금)
  {
    id: 8,
    employeeId: "manager5",
    password: "change_this!",
    email: "manager5@test.com",
    name: "Park%manager",
    role: Role.ADMIN,
    signInFailed: 5,
  },
];

export const testUsers = [
  // user 1
  {
    id: 9,
    employeeId: "user1",
    password: "change_this!",
    email: "user1@test.com",
    name: "Lee_user",
    phoneNumber: "010-1111-1111",
    role: Role.USER,
    passwordSettingAt: moment(new Date()).subtract(90, "days").format(), // 90일 전
    initPassword: true,
    lastLogin: moment(new Date()).subtract(1, "hours").format(), // 1시간 전
  },
  // user 2
  {
    id: 10,
    employeeId: "user2",
    password: "change_this!",
    email: "user2@test.com",
    name: "Lee%user",
    phoneNumber: "010-2222-2222",
    role: Role.USER,
    passwordSettingAt: moment(new Date()).subtract(90, "days").format(), // 90일 전
    initPassword: true,
  },
  // user 3
  {
    id: 11,
    employeeId: "user3",
    password: "change_this!",
    email: "user3@test.com",
    name: "Park\\user",
    role: Role.USER,
    passwordSettingAt: moment(new Date()).subtract(90, "days").format(), // 90일 전
    initPassword: true,
  },
  // user 4 (비활성화)
  {
    id: 12,
    employeeId: "user4",
    password: "change_this!",
    email: "user4@test.com",
    name: "Park_user",
    role: Role.USER,
    deletedAt: new Date(),
    passwordSettingAt: moment(new Date()).subtract(90, "days").format(), // 90일 전
    initPassword: true,
  },
  // user 5 (로그인 잠금)
  {
    id: 13,
    employeeId: "user5",
    password: "change_this!",
    email: "user5@test.com",
    name: "Park%user",
    role: Role.USER,
    signInFailed: 5,
    passwordSettingAt: moment(new Date()).subtract(90, "days").format(), // 90일 전
    initPassword: true,
  },
  // user 6 (초기 비밀번호 미설정)
  {
    id: 14,
    employeeId: "user6",
    password: "change_this!",
    email: "user6@test.com",
    name: "Choi_user",
    credit: 50,
    role: Role.USER,
    passwordSettingAt: null,
    initPassword: false,
  },
];
