import * as moment from "moment";
import { CreditCategory } from "@src/common/entity/credit-history.entity";
import { testUsers } from "@root/seeding/seeder/seed/user.seed";
import { testAdmins } from "@root/seeding/seeder/seed/user.seed";

export const testCreditHistories = [
  {
    id: 1,
    userId: null,
    employeeId: "hutom",
    name: "hutom",
    category: CreditCategory.ALLOCATE,
    quantity: 100,
    status: true,
    isUserRequest: false,
    huId: null,
    createdAt: moment().subtract(1, "year").toISOString(),
  },
  {
    id: 2,
    userId: testAdmins[0].id,
    employeeId: testAdmins[0].employeeId,
    name: testAdmins[0].name,
    category: CreditCategory.RUS_USE,
    quantity: -1,
    status: true,
    isUserRequest: true,
    huId: "test_huId",
    createdAt: moment().subtract(1, "month").toISOString(),
  },
  {
    id: 3,
    userId: testUsers[0].id,
    employeeId: testUsers[0].employeeId,
    name: testUsers[0].name,
    category: CreditCategory.RUS_USE,
    quantity: -1,
    status: true,
    isUserRequest: true,
    huId: "test_huId",
    createdAt: moment().subtract(1, "hour").toISOString(),
  },
  {
    id: 4,
    userId: testUsers[0].id,
    employeeId: testUsers[0].employeeId,
    name: testUsers[0].name,
    category: CreditCategory.RUS_CANCEL,
    quantity: 1,
    status: true,
    isUserRequest: true,
    huId: "test_huId",
    createdAt: moment().subtract(1, "minute").toISOString(),
  },
  // status: false, huId : undefined
  {
    id: 5,
    userId: testUsers[0].id,
    employeeId: testUsers[0].employeeId,
    name: testUsers[0].name,
    category: CreditCategory.RUS_CANCEL,
    quantity: 1,
    status: false,
    isUserRequest: true,
  },
];
