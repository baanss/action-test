import { of } from "rxjs";
import * as faker from "faker";
import * as supertest from "supertest";
import * as cookieParser from "cookie-parser";
import { INestApplication } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";

import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { UserRepository } from "@src/user/repository/user.repository";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";

import { generateNestApplication } from "@test/util/test.util";
import { testAdmins, testUsers } from "@root/seeding/seeder/seed/user.seed";
import { CreditHistoryRepository } from "@src/credit-history/repository/credit-history.repository";
import { testCreditHistories } from "@root/seeding/seeder/seed/credit-history.seed";
import { testRusCases } from "@root/seeding/seeder/seed/rus-case.seed";
import { RusCaseRepository } from "@src/rus-case/repository/rus-case.repository";
import { RusCaseStatus } from "@src/common/constant/enum.constant";

let app: INestApplication;
let httpService: HttpService;
let seederService: SeederService;

let userRepository: UserRepository;
let creditHistoryRepository: CreditHistoryRepository;
let rusCaseRepository: RusCaseRepository;

const customOriginHeaderKey = "x-origin";
const userServiceOrigin = "user";

beforeAll(async () => {
  app = await generateNestApplication();
  app.use(cookieParser());

  seederService = app.get(SeederService);
  httpService = app.get<HttpService>(HttpService);

  userRepository = app.get(UserRepository);
  creditHistoryRepository = app.get(CreditHistoryRepository);
  rusCaseRepository = app.get(RusCaseRepository);

  await app.init();
  await seederService.empty();
});

afterAll(async () => {
  await seederService.empty();
  await app.close();
});

describe("POST /admins", () => {
  let agent: supertest.SuperAgentTest;
  let postSendMailReqSpy: jest.SpyInstance;

  beforeEach(async () => {
    jest.restoreAllMocks();
    const mockAxiosResponse = {
      data: {
        message: "이메일 전송 성공",
      },
      status: 200,
      statusText: "OK",
      headers: {},
      config: {},
    };
    postSendMailReqSpy = jest.spyOn(httpService, "post").mockImplementation(() => of(mockAxiosResponse));
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  test("401 response, 헤더에 유효한 인증 정보가 없음", async () => {
    // given

    // when-then
    supertest.agent(app.getHttpServer()).post("/admins").expect(401);
  });

  describe("일반 계정 요청", () => {
    let agent: supertest.SuperAgentTest;
    let cookies: string[];

    beforeEach(async () => {
      await seederService.empty();
      await seederService.seedUsers();

      const currentUser = testUsers[0];

      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentUser.employeeId,
        password: currentUser.password,
      });

      cookies = res.header["set-cookie"];
      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", cookies);
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("UNAUTHORIZED_AUTH_TOKEN, 요청 권한 없음", async () => {
      // when
      const res = await agent.post("/admins");

      // then
      expect(res.body.error).toEqual(HutomHttpException.UNAUTHORIZED_AUTH_TOKEN.error);
    });
  });

  describe("대표 계정 요청", () => {
    let agent: supertest.SuperAgentTest;
    let cookies: string[];

    beforeEach(async () => {
      await seederService.empty();
      await seederService.seedUsers();

      const currentAdmin = testAdmins[0];

      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentAdmin.employeeId,
        password: currentAdmin.password,
      });

      cookies = res.header["set-cookie"];
      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", cookies);
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("UNAUTHORIZED_AUTH_TOKEN, 요청 권한 없음", async () => {
      // when
      const res = await agent.post("/admins");

      // then
      expect(res.body.error).toEqual(HutomHttpException.UNAUTHORIZED_AUTH_TOKEN.error);
    });
  });

  describe("h-Space 요청", () => {
    const postAdminReq = {
      employeeId: faker.lorem.word(),
      email: faker.internet.email(),
      name: faker.internet.userName(),
      phoneNumber: faker.phone.phoneNumber(),
    };

    beforeEach(async () => {
      await seederService.empty();
      agent = supertest.agent(app.getHttpServer());

      const authToken = "hcloud-server";
      agent.set("x-auth-token", authToken);
    });

    test("BAD_REQUEST, DTO가 유효하지 않음(미입력)", async () => {
      // when
      const res = await agent.post("/admins");

      // then
      expect(res.body.error).toEqual(HutomHttpException.BAD_REQUEST.error);
    });

    test("LIMIT_EXCEEDED, 이미 대표 계정이 존재하는 경우 (한도: 1)", async () => {
      // given
      const givenAdmin = testAdmins[0];
      await userRepository.save(givenAdmin);

      // when
      const res = await agent.post("/admins").send(postAdminReq);

      // then
      expect(res.body.error).toEqual(HutomHttpException.LIMIT_EXCEEDED.error);
    });

    test("DUPLICATED_USER_EMPLOYEE_ID, 사용자 정보가 중복되는 경우(employeeId)", async () => {
      // given
      const givenUser = testUsers[0];
      await userRepository.save(givenUser);

      // when
      const res = await agent.post("/admins").send({
        ...postAdminReq,
        employeeId: givenUser.employeeId,
      });

      // then
      expect(res.body.error).toEqual(HutomHttpException.DUPLICATED_USER_EMPLOYEE_ID.error);
    });

    test("DUPLICATED_USER_PHONE_NUMBER, 사용자 정보가 중복되는 경우(phoneNumber)", async () => {
      // given
      const givenUser = testUsers[0];
      await userRepository.save(givenUser);

      // when
      const res = await agent.post("/admins").send({
        ...postAdminReq,
        phoneNumber: givenUser.phoneNumber,
      });

      // then
      expect(res.body.error).toEqual(HutomHttpException.DUPLICATED_USER_PHONE_NUMBER.error);
    });

    test("200 Response, 대표 계정 생성 ", async () => {
      // given

      // when
      const res = await agent.post("/admins").send(postAdminReq);

      // then
      const adminUser = await userRepository.getAdmin();
      expect(res.status).toEqual(200);
      expect(res.body.id).toEqual(adminUser.id);
      expect(res.body.isCreated).toBeTruthy();

      expect(adminUser.email).toEqual(postAdminReq.email);
      expect(adminUser.employeeId).toEqual(postAdminReq.employeeId);
      expect(adminUser.name).toEqual(postAdminReq.name);
      expect(adminUser.phoneNumber).toEqual(postAdminReq.phoneNumber);

      expect(adminUser.initPassword).toBeFalsy();
      expect(postSendMailReqSpy).toBeCalledTimes(1);
    });

    describe("대표 계정 승격 (중복된 Email을 가진 사용자가 존재할 경우)", () => {
      const targetUser = testUsers[0];
      const givenUser = testUsers[1];

      beforeEach(async () => {
        await seederService.empty();
      });

      test("DUPLICATED_USER_EMPLOYEE_ID, 사용자 정보가 중복되는 경우(employeeId)", async () => {
        // given
        await userRepository.save([targetUser, givenUser]);

        // when
        const res = await agent.post("/admins").send({
          ...postAdminReq,
          email: targetUser.email,
          employeeId: givenUser.employeeId,
        });

        // then
        expect(res.body.error).toEqual(HutomHttpException.DUPLICATED_USER_EMPLOYEE_ID.error);
      });

      test("DUPLICATED_USER_PHONE_NUMBER, 사용자 정보가 중복되는 경우(phoneNumber)", async () => {
        // given
        await userRepository.save([targetUser, givenUser]);

        // when
        const res = await agent.post("/admins").send({
          ...postAdminReq,
          email: targetUser.email,
          phoneNumber: givenUser.phoneNumber,
        });

        // then
        expect(res.body.error).toEqual(HutomHttpException.DUPLICATED_USER_PHONE_NUMBER.error);
      });

      test("200 Response (OK), 대표계정 승격 - 입력된 값이 기존 사용자와 일치하지 않을 때", async () => {
        // given
        await userRepository.save(targetUser);

        // when
        const res = await agent.post("/admins").send({
          ...postAdminReq,
          email: targetUser.email,
        });

        // then
        const adminUser = await userRepository.getAdmin();
        expect(res.status).toEqual(200);
        expect(res.body.id).toEqual(adminUser.id);
        expect(adminUser.email).toEqual(targetUser.email);

        expect(adminUser.employeeId).toEqual(postAdminReq.employeeId);
        expect(adminUser.name).toEqual(postAdminReq.name);
        expect(adminUser.phoneNumber).toEqual(postAdminReq.phoneNumber);
      });

      test("200 Response, 대표계정 승격 - 입력된 값이 기존 사용자와 일치할 때", async () => {
        // given
        await userRepository.save(targetUser);

        // when
        const res = await agent.post("/admins").send({
          email: targetUser.email,
          employeeId: targetUser.employeeId,
          phoneNumber: targetUser.phoneNumber,
          name: targetUser.name,
        });

        // then
        const adminUser = await userRepository.getAdmin();
        expect(res.status).toEqual(200);
        expect(res.body.id).toEqual(adminUser.id);
        expect(res.body.isCreated).toBeFalsy();

        expect(adminUser.email).toEqual(targetUser.email);
        expect(adminUser.employeeId).toEqual(targetUser.employeeId);
        expect(adminUser.name).toEqual(targetUser.name);
        expect(adminUser.phoneNumber).toEqual(targetUser.phoneNumber);
      });
    });
  });
});

describe("POST /admins/delete", () => {
  let agent: supertest.SuperAgentTest;
  test("401 response, 헤더에 유효한 인증 정보가 없음", async () => {
    // given

    // when-then
    supertest.agent(app.getHttpServer()).post("/admins/delete").expect(401);
  });

  describe("일반 계정 요청", () => {
    let agent: supertest.SuperAgentTest;
    let cookies: string[];

    beforeEach(async () => {
      await seederService.empty();
      await seederService.seedUsers();

      const currentUser = testUsers[0];

      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentUser.employeeId,
        password: currentUser.password,
      });

      cookies = res.header["set-cookie"];
      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", cookies);
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("UNAUTHORIZED_AUTH_TOKEN, 요청 권한 없음", async () => {
      // when
      const res = await agent.post("/admins/delete");

      // then
      expect(res.body.error).toEqual(HutomHttpException.UNAUTHORIZED_AUTH_TOKEN.error);
    });
  });

  describe("대표 계정 요청", () => {
    let agent: supertest.SuperAgentTest;
    let cookies: string[];

    beforeEach(async () => {
      await seederService.empty();
      await seederService.seedUsers();

      const currentAdmin = testAdmins[0];

      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentAdmin.employeeId,
        password: currentAdmin.password,
      });

      cookies = res.header["set-cookie"];
      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", cookies);
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("UNAUTHORIZED_AUTH_TOKEN, 요청 권한 없음", async () => {
      // when
      const res = await agent.post("/admins/delete");

      // then
      expect(res.body.error).toEqual(HutomHttpException.UNAUTHORIZED_AUTH_TOKEN.error);
    });
  });

  describe("h-Space 요청", () => {
    beforeEach(async () => {
      await seederService.empty();
      agent = supertest.agent(app.getHttpServer());

      const authToken = "hcloud-server";
      agent.set("x-auth-token", authToken);
    });

    test("BAD_REQUEST, DTO가 유효하지 않음(미입력)", async () => {
      // when
      const res = await agent.post("/admins/delete");

      // then
      expect(res.body.error).toEqual(HutomHttpException.BAD_REQUEST.error);
    });

    test("NOT_FOUND_DATA, 대표 계정을 찾을 수 없음", async () => {
      // given
      const givenAdmin = testAdmins[0];

      // when
      const res = await agent.post("/admins/delete").send({
        employeeId: givenAdmin.employeeId,
        email: givenAdmin.email,
      });

      // then
      expect(res.body.error).toEqual(HutomHttpException.NOT_FOUND_DATA.error);
    });

    test("INVALID_REQUEST_BODY, 입력된 email의 정보가 대표 계정의 정보와 일치하지 않음", async () => {
      // given
      const givenAdmin = await userRepository.save(testAdmins[0]);

      // when
      const res = await agent.post("/admins/delete").send({
        employeeId: givenAdmin.employeeId,
        email: "invalid@mail.com",
      });

      // then
      expect(res.body.error).toEqual(HutomHttpException.INVALID_REQUEST_BODY.error);
    });

    test("INVALID_REQUEST_BODY, 입력된 employeeId의 정보가 대표 계정의 정보와 일치하지 않음", async () => {
      // given
      const givenAdmin = await userRepository.save(testAdmins[0]);

      // when
      const res = await agent.post("/admins/delete").send({
        employeeId: "invalidEmployeeId",
        email: givenAdmin.email,
      });

      // then
      expect(res.body.error).toEqual(HutomHttpException.INVALID_REQUEST_BODY.error);
    });

    test("INVALID_DELETE_ADMIN_BY_CREDIT, 크레딧이 남아있을 때, 대표 계정을 삭제할 수 없음.", async () => {
      // given
      const givenAdmin = await userRepository.save(testAdmins[0]);
      await creditHistoryRepository.save({ ...testCreditHistories[0], quantity: 1 });

      // when
      const res = await agent.post("/admins/delete").send({
        employeeId: givenAdmin.employeeId,
        email: givenAdmin.email,
      });

      // then
      expect(res.body.error).toEqual(HutomHttpException.INVALID_DELETE_ADMIN_BY_CREDIT.error);
    });

    test("INVALID_DELETE_USERS_RUS_CASE_IN_PROGRESS, 진행 중인 rusCase가 있는 경우 삭제 실패(IN_PROGRESS)", async () => {
      // given
      await seederService.seedEncryption();
      await creditHistoryRepository.clear();
      const givenAdmin = await userRepository.getAdmin();

      const targetRusCase = testRusCases[0];
      await rusCaseRepository.update(targetRusCase.id, { user: givenAdmin, status: RusCaseStatus.IN_PROGRESS });

      // when
      const res = await agent.post("/admins/delete").send({
        employeeId: givenAdmin.employeeId,
        email: givenAdmin.email,
      });

      // then
      expect(res.body.error).toBe(HutomHttpException.INVALID_DELETE_USERS_RUS_CASE_IN_PROGRESS.error);
    });

    test("INVALID_DELETE_USERS_RUS_CASE_IN_PROGRESS, 진행 중인 rusCase가 있는 경우 삭제 실패(TODO)", async () => {
      // given
      await seederService.seedEncryption();
      await creditHistoryRepository.clear();
      const givenAdmin = await userRepository.getAdmin();

      const targetRusCase = testRusCases[0];
      await rusCaseRepository.update(targetRusCase.id, { user: givenAdmin, status: RusCaseStatus.TODO });

      // when
      const res = await agent.post("/admins/delete").send({
        employeeId: givenAdmin.employeeId,
        email: givenAdmin.email,
      });

      // then
      expect(res.body.error).toBe(HutomHttpException.INVALID_DELETE_USERS_RUS_CASE_IN_PROGRESS.error);
    });

    test("200 response, 대표 계정 삭제 성공", async () => {
      // given
      const givenAdmin = await userRepository.save(testAdmins[0]);

      // when
      const res = await agent.post("/admins/delete").send({
        employeeId: givenAdmin.employeeId,
        email: givenAdmin.email,
      });

      // then
      expect(res.body.affected).toEqual(1);
      const afterValidAdmin = await userRepository.findById(givenAdmin.id);
      expect(afterValidAdmin).toBeUndefined();
    });
  });
});
