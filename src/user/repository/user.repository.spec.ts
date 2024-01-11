import * as moment from "moment";
import { INestApplication } from "@nestjs/common";
import { generateNestApplication } from "@test/util/test.util";

import { SeederService } from "@root/seeding/seeder/services/seeder.service";

import { UserRepository } from "@src/user/repository/user.repository";
import { testUsers } from "@root/seeding/seeder/seed/user.seed";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";

let app: INestApplication;
let seederService: SeederService;
let userRepository: UserRepository;

beforeAll(async () => {
  app = await generateNestApplication();

  seederService = app.get(SeederService);
  userRepository = app.get(UserRepository);

  await app.init();
  await seederService.seed();
});

afterAll(async () => {
  await seederService.empty();
  await app.close();
});

describe("userRepository", () => {
  describe("createOne", () => {
    test("CREATE_DATA_ERROR, 데이터가 생성되지 않은 경우", async () => {
      // given

      // when, then
      const targetUser = testUsers[0];
      const createDto = {
        ...targetUser,
        password: null,
      };

      await userRepository.createOne(createDto).catch(({ response }) => {
        expect(response.error).toBe(HutomHttpException.CREATE_DATA_ERROR.error);
      });
    });
  });
});

describe("userRepository", () => {
  describe("getManyLastLoggedInBefore", () => {
    test("SUCCESS, 최종 접속 시간이 365일이 지난 일반 사용자들 조회합니다.", async () => {
      // given
      const targetUser = await userRepository.findOne({ employeeId: testUsers[0].employeeId });
      targetUser.lastLogin = moment().subtract(365, "days").toDate();
      await userRepository.save(targetUser);

      // when
      const oneYearAgo = moment().subtract(365, "days").toDate();
      const target = await userRepository.getManyLastLoggedInBefore(oneYearAgo);

      // then
      expect(target.length).toBe(1);
    });
  });
});

describe("getUsersByLastLoginBetween", () => {
  test("SUCCESS, 최종 접속 시간이 335일에 해당되는 일반 사용자들 조회합니다.", async () => {
    // given
    const targetUser = await userRepository.findOne({ employeeId: testUsers[0].employeeId });
    targetUser.lastLogin = moment().subtract(335, "days").toDate();
    await userRepository.save(targetUser);

    // when
    const startDate = moment().subtract(336, "days").toDate();
    const endDate = moment().subtract(335, "days").toDate();
    const target = await userRepository.getManyByLastLoginBetween(startDate, endDate);

    // then
    expect(target.length).toBe(1);
  });
});
