import { of } from "rxjs";
import * as supertest from "supertest";
import * as cookieParser from "cookie-parser";
import { INestApplication } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";

import { generateNestApplication } from "@test/util/test.util";
import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { testAdmins, testUsers } from "@root/seeding/seeder/seed/user.seed";

import { UserRepository } from "@src/user/repository/user.repository";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { SessionRepository } from "@src/auth/repository/session.repository";
import { RusCaseRepository } from "@src/rus-case/repository/rus-case.repository";
import { RusCaseStatus } from "@src/common/constant/enum.constant";
import { testRusCases } from "@root/seeding/seeder/seed/rus-case.seed";

let app: INestApplication;
let httpService: HttpService;
let seederService: SeederService;
let userRepository: UserRepository;
let sessionRepository: SessionRepository;
let rusCaseRespository: RusCaseRepository;

const customOriginHeaderKey = "x-origin";
const userServiceOrigin = "user";

beforeAll(async () => {
  app = await generateNestApplication();
  app.use(cookieParser());

  seederService = app.get(SeederService);
  httpService = app.get<HttpService>(HttpService);

  userRepository = app.get(UserRepository);
  sessionRepository = app.get(SessionRepository);
  rusCaseRespository = app.get(RusCaseRepository);

  await app.init();
  await seederService.empty();
  await seederService.seedEncryption();
});

afterAll(async () => {
  await seederService.empty();
  await app.close();
});

describe("POST /users", () => {
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

  test("UNAUTHORIZED_ORIGIN, x-origin 헤더 없음", async () => {
    // given
    // when
    const res = await supertest(app.getHttpServer()).post("/users");
    // then
    expect(res.body.error).toBe(HutomHttpException.UNAUTHORIZED_ORIGIN.error);
  });

  test("UNAUTHORIZED, Cookie 헤더에 토큰 없음", async () => {
    // given
    // when
    const res = await supertest(app.getHttpServer()).post("/users").set(customOriginHeaderKey, userServiceOrigin);
    // then
    expect(res.body.error).toBe(HutomHttpException.UNAUTHORIZED.error);
  });

  test("UNAUTHORIZED, Cookie 헤더에 잘못된 토큰 설정됨", async () => {
    // given
    const token = "invalid";
    // when
    const res = await supertest(app.getHttpServer()).post("/users").set(customOriginHeaderKey, userServiceOrigin).set("Cookie", token);
    // then
    expect(res.body.error).toBe(HutomHttpException.UNAUTHORIZED.error);
  });

  describe("대표 계정으로 로그인 후", () => {
    let agent: supertest.SuperAgentTest;
    const currentAdmin = testAdmins[0];
    const prevUser = testUsers[0];

    beforeEach(async () => {
      await sessionRepository.clear();
      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentAdmin.employeeId,
        password: currentAdmin.password,
      });
      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", res.get("Set-Cookie"));
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("DUPLICATED_USER_EMPLOYEE_ID, 중복된 employeeId를 사용하여 요청", async () => {
      // given
      // when
      const postUserDto = {
        employeeId: prevUser.employeeId,
        email: "new@new.com",
        name: "new",
      };
      const res = await agent.post("/users").send(postUserDto);

      // then
      expect(res.body.error).toBe(HutomHttpException.DUPLICATED_USER_EMPLOYEE_ID.error);
    });

    test("DUPLICATED_USER_EMAIL, 중복된 email을 사용하여 요청", async () => {
      // given
      // when
      const postUserDto = {
        employeeId: "newEmployeeId",
        email: prevUser.email,
        name: "new",
      };
      const res = await agent.post("/users").send(postUserDto);

      // then
      expect(res.body.error).toBe(HutomHttpException.DUPLICATED_USER_EMAIL.error);
    });

    test("DUPLICATED_USER_PHONE_NUMBER, 중복된 phoneNumber를 사용하여 요청", async () => {
      // given
      // when
      const postUserDto = {
        employeeId: "newEmployeeId",
        email: "new@new.com",
        name: "new",
        phoneNumber: prevUser.phoneNumber,
      };
      const res = await agent.post("/users").send(postUserDto);

      // then
      expect(res.body.error).toBe(HutomHttpException.DUPLICATED_USER_PHONE_NUMBER.error);
    });

    test("201 Response. 사용자 생성 성공", async () => {
      // given
      // when
      const postUserDto = {
        employeeId: "newEmployeeId",
        email: "new@new.com",
        name: "new",
        phoneNumber: "000-1111-2222",
      };
      const res = await agent.post("/users").send(postUserDto);

      // then
      const newUser = await userRepository.findByEmployeeId(postUserDto.employeeId);
      expect(res.body.id).toEqual(newUser.id);

      expect(newUser.employeeId).toEqual(postUserDto.employeeId);
      expect(newUser.email).toEqual(postUserDto.email);
      expect(newUser.name).toEqual(postUserDto.name);
      expect(newUser.phoneNumber).toEqual(postUserDto.phoneNumber);
      expect(newUser.initPassword).toBeFalsy();

      expect(postSendMailReqSpy).toBeCalledTimes(1);
    });
  });
});

describe("POST /users/delete", () => {
  test("UNAUTHORIZED_ORIGIN, x-origin 헤더 없음", async () => {
    // given
    // when
    const res = await supertest(app.getHttpServer()).post("/users/delete");
    // then
    expect(res.body.error).toBe(HutomHttpException.UNAUTHORIZED_ORIGIN.error);
  });

  test("UNAUTHORIZED, Cookie 헤더에 토큰 없음", async () => {
    // given
    // when
    const res = await supertest(app.getHttpServer()).post("/users/delete").set(customOriginHeaderKey, userServiceOrigin);
    // then
    expect(res.body.error).toBe(HutomHttpException.UNAUTHORIZED.error);
  });

  test("UNAUTHORIZED, Cookie 헤더에 잘못된 토큰 설정됨", async () => {
    // given
    const token = "invalid";
    // when
    const res = await supertest(app.getHttpServer()).post("/users/delete").set(customOriginHeaderKey, userServiceOrigin).set("Cookie", token);
    // then
    expect(res.body.error).toBe(HutomHttpException.UNAUTHORIZED.error);
  });

  describe("대표 계정으로 로그인 후", () => {
    let agent: supertest.SuperAgentTest;
    const currentAdmin = testAdmins[0];

    beforeEach(async () => {
      await seederService.empty();
      await seederService.seedEncryption();

      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentAdmin.employeeId,
        password: currentAdmin.password,
      });
      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", res.get("Set-Cookie"));
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("FORBIDDEN_RESOURCE_INCORRECT_PASSWORD, 비밀번호 틀림", async () => {
      // given
      // when
      const targetUser = testUsers[0];
      const invalidPassword = "invalid";

      const res = await agent.post("/users/delete").send({
        ids: [targetUser.id],
        password: invalidPassword,
      });
      // then
      expect(res.body.error).toBe(HutomHttpException.FORBIDDEN_RESOURCE_INCORRECT_PASSWORD.error);
    });

    test("INVALID_USER_DELETE_OWN_ACCOUNT, 본인 계정 삭제 불가", async () => {
      // given
      // when
      const targetUserId = currentAdmin.id;

      const res = await agent.post("/users/delete").send({
        ids: [targetUserId],
        password: currentAdmin.password,
      });
      // then
      expect(res.body.error).toBe(HutomHttpException.INVALID_USER_DELETE_OWN_ACCOUNT.error);
    });

    test("INVALID_DELETE_USERS_RUS_CASE_IN_PROGRESS, 진행 중인 rusCase가 있는 경우 삭제 실패(IN_PROGRESS)", async () => {
      // given
      const targetRusCase = testRusCases[0];
      await rusCaseRespository.update(targetRusCase.id, { status: RusCaseStatus.IN_PROGRESS });

      // when
      const res = await agent.post("/users/delete").send({
        ids: [targetRusCase.user.id],
        password: currentAdmin.password,
      });

      // then
      expect(res.body.error).toBe(HutomHttpException.INVALID_DELETE_USERS_RUS_CASE_IN_PROGRESS.error);
    });

    test("INVALID_DELETE_USERS_RUS_CASE_IN_PROGRESS, 진행 중인 rusCase가 있는 경우 삭제 실패(TODO)", async () => {
      // given
      const targetRusCase = testRusCases[0];
      await rusCaseRespository.update(targetRusCase.id, { status: RusCaseStatus.TODO });

      // when
      const res = await agent.post("/users/delete").send({
        ids: [targetRusCase.user.id],
        password: currentAdmin.password,
      });

      // then
      expect(res.body.error).toBe(HutomHttpException.INVALID_DELETE_USERS_RUS_CASE_IN_PROGRESS.error);
    });

    test("성공, 모두 처리되지 않은 경우", async () => {
      // given

      // when
      const invalidUserId = 9999;
      const body = {
        ids: [invalidUserId],
        password: currentAdmin.password,
      };
      const res = await agent.post("/users/delete").send(body).expect(200);

      // then
      const expectedResult = { affected: 0 };
      expect(res.body).toEqual(expectedResult);
    });

    test("성공, 존재하지 않는 계정의 id이 포함된 경우 affected 미포함", async () => {
      // given
      const validUser1 = await userRepository.save(testUsers[0]);
      const validUser2 = await userRepository.save(testUsers[1]);

      // when
      const invalidUserId = 9999;
      const body = {
        ids: [validUser1.id, validUser2.id, invalidUserId],
        password: currentAdmin.password,
      };
      const res = await agent.post("/users/delete").send(body);

      // then
      const expectedResult = { affected: 2 };
      expect(res.body).toEqual(expectedResult);

      const afterValidUser1 = await userRepository.findById(validUser1.id);
      expect(afterValidUser1).toBeUndefined();
      const afterValidUser2 = await userRepository.findById(validUser2.id);
      expect(afterValidUser2).toBeUndefined();
    });

    test("성공, 사용자 삭제", async () => {
      // given
      const validUser = await userRepository.save(testUsers[0]);

      // when
      const res = await agent.post("/users/delete").send({
        ids: [validUser.id],
        password: currentAdmin.password,
      });

      // then
      expect(res.body.affected).toEqual(1);
      const afterValidUser = await userRepository.findById(validUser.id);
      expect(afterValidUser).toBeUndefined();
    });
  });
});
