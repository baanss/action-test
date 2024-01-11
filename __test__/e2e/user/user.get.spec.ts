import * as supertest from "supertest";
import * as cookieParser from "cookie-parser";
import { INestApplication } from "@nestjs/common";

import { generateNestApplication, expectNullableString } from "@test/util/test.util";
import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { testAdmins, testUsers } from "@root/seeding/seeder/seed/user.seed";

import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { SERVICE_CODE } from "@src/common/middleware/server-auth.middleware";
import { UserRepository } from "@src/user/repository/user.repository";
import { Role } from "@src/auth/interface/auth.interface";

let app: INestApplication;
let seederService: SeederService;

let userRepository: UserRepository;

const customOriginHeaderKey = "x-origin";
const userServiceOrigin = "user";

const rusClientOrigin = "rus-client";

const authTokenHeaderKey = "x-auth-token";
const authToken = SERVICE_CODE;

const currentUser = testUsers[0];
const currentAdmin = testAdmins[0];

beforeAll(async () => {
  app = await generateNestApplication();
  app.use(cookieParser());

  seederService = app.get(SeederService);
  userRepository = app.get(UserRepository);

  await app.init();
  await seederService.empty();
  await seederService.seedEncryption();
});

afterAll(async () => {
  await seederService.empty();
  await app.close();
});

describe("GET /users", () => {
  test("401 response, x-origin 헤더 없음", (done: jest.DoneCallback) => {
    // given

    // when
    supertest(app.getHttpServer()).get("/users").expect(401, done); // then
  });

  test("401 response, Cookie 헤더에 토큰 없거나 잘못된 토큰 설정됨", async () => {
    // given

    // when
    await supertest(app.getHttpServer()).get("/users").set(customOriginHeaderKey, userServiceOrigin).expect(401); // then

    // given
    const token = "invalid";

    // when
    await supertest(app.getHttpServer()).get("/users").set(customOriginHeaderKey, userServiceOrigin).set("Cookie", token).expect(401); // then
  });

  describe("일반 사용자로 로그인 후", () => {
    let agent: supertest.SuperAgentTest;

    beforeEach(async () => {
      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentUser.employeeId,
        password: currentUser.password,
        isForced: true,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", res.get("Set-Cookie"));
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("403 response, FORBIDDEN_RESOURCE - 자원에 접근 권한이 없음", async () => {
      // given

      // when
      const res = await agent.get("/users");

      // then
      expect(res.body.error).toEqual(HutomHttpException.FORBIDDEN_RESOURCE.error);
    });
  });

  describe("대표 계정으로 로그인 후,", () => {
    let agent: supertest.SuperAgentTest;
    let cookies: string[];

    const currentAdmin = testAdmins[0];
    const expectGetManyUsersView = {
      id: expect.any(Number),
      employeeId: expect.any(String),
      email: expect.any(String),
      name: expect.any(String),
      // phoneNumber: string | null,
      // role: Role,
      // lastLogin: string | null,
      createdAt: expect.any(String),
    };

    beforeEach(async () => {
      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentAdmin.employeeId,
        password: currentAdmin.password,
        isForced: true,
      });

      cookies = res.header["set-cookie"];
      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", cookies);
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("200 response, 사용자 목록 검색 조회 성공 - employeeId, name 검색", async () => {
      // given

      // when
      const searchQuery = { employeeId: "1", name: "k" };
      const res = await agent.get("/users").query(searchQuery);

      // then
      const validRoles = [Role.ADMIN, Role.USER];
      const expected = {
        data: expect.any(Array),
        count: expect.any(Number),
      };

      expect(res.body).toEqual(expected);
      expect(res.body.count).toBeGreaterThan(0);
      res.body.data.forEach((getManyUsersView) => {
        const { phoneNumber, lastLogin, role, ...rest } = getManyUsersView;
        const { employeeId, name } = getManyUsersView;

        // 응답 구조 검증
        expect(rest).toEqual(expectGetManyUsersView);
        expectNullableString(phoneNumber);
        expectNullableString(lastLogin);
        expect(validRoles).toContain(role);

        // 검색 결과 일치 검증
        expect(employeeId.toLowerCase()).toContain(searchQuery.employeeId.toLowerCase());
        expect(name.toLowerCase()).toContain(searchQuery.name.toLowerCase());
      });
    });

    test("200 response, 사용자 목록 조회 성공 - 대표 계정 최상위 배치 검증", async () => {
      // given

      // when
      const res = await agent.get("/users");

      // then
      expect(res.body.count).toBeGreaterThan(0);
      expect(res.body.data[0].role).toEqual(Role.ADMIN);
    });

    test("200 response, 특정 조건(limit = -1) 전체 검색 성공", async () => {
      // given
      const [, expectedUserCount] = await userRepository.findAndCount();

      // when
      const searchQuery = { limit: "-1" };
      const res = await agent.get("/users").query(searchQuery).expect(200);

      // then
      expect(res.body.count).toEqual(expectedUserCount);
    });

    test("200 response, 페이지네이션 적용하여 조회 성공", async () => {
      // given
      const [, expectedUserCount] = await userRepository.findAndCount();

      // when
      const searchQuery = { page: 2, limit: 2 };
      const res = await agent.get("/users").query(searchQuery).expect(200);

      // then
      expect(res.body.count).toEqual(expectedUserCount);
      expect(res.body.data.length).toEqual(searchQuery.limit);
    });
  });
});

describe("GET /users/me", () => {
  test("401 response, Cookie 헤더에 토큰 없거나 잘못된 토큰 설정됨", async () => {
    // given

    // when
    await supertest(app.getHttpServer()).get("/users/me").expect(401); // then

    // given
    const token = "invalid";

    // when
    await supertest(app.getHttpServer()).get("/users/me").set("Cookie", token).expect(401); // then
  });

  describe("일반 사용자로 로그인 후", () => {
    let agent: supertest.SuperAgentTest;

    beforeEach(async () => {
      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentUser.employeeId,
        password: currentUser.password,
        isForced: true,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", res.get("Set-Cookie"));
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("200 response, 사용자 정보 조회", async () => {
      // given

      // when
      const res = await agent.get("/users/me").expect(200);

      // then
      const expectedBody = {
        id: currentUser.id,
        employeeId: currentUser.employeeId,
        email: currentUser.email,
        name: currentUser.name,
        phoneNumber: currentUser.phoneNumber,
      };
      expect(res.body).toEqual(expectedBody);
    });
  });

  describe("대표 계정으로 로그인 후", () => {
    let agent: supertest.SuperAgentTest;

    beforeEach(async () => {
      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentAdmin.employeeId,
        password: currentAdmin.password,
        isForced: true,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", res.get("Set-Cookie"));
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("200 response, 사용자 정보 조회", async () => {
      // given

      // when
      const res = await agent.get("/users/me");

      // then
      const expectedBody = {
        id: currentAdmin.id,
        employeeId: currentAdmin.employeeId,
        email: currentAdmin.email,
        name: currentAdmin.name,
        phoneNumber: currentAdmin.phoneNumber,
      };
      expect(res.body).toEqual(expectedBody);
    });
  });

  describe("RUS Client 로그인 후 ", () => {
    let agent: supertest.SuperAgentTest;

    beforeAll(async () => {
      const res = await supertest(app.getHttpServer()).post("/auth/rus-client/login").set(authTokenHeaderKey, authToken).send({
        employeeId: currentUser.employeeId,
        password: currentUser.password,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Authorization", "Bearer " + res.body.accessToken);
      agent.set(customOriginHeaderKey, rusClientOrigin);
    });

    test("200 response", async () => {
      // given

      // when
      const res = await agent.get("/users/me").set(authTokenHeaderKey, authToken).expect(200);

      // then
      const expectedBody = {
        id: currentUser.id,
        employeeId: currentUser.employeeId,
        email: currentUser.email,
        name: currentUser.name,
        phoneNumber: currentUser.phoneNumber,
      };
      expect(res.body).toEqual(expectedBody);
    });
  });
});

describe("GET /users/:id", () => {
  test("X-Origin 정보가 없음", async () => {
    // given
    const userId = "1";

    // when
    const res = await supertest(app.getHttpServer()).get(`/users/${userId}`);
    expect(res.body.error).toBe(HutomHttpException.UNAUTHORIZED_ORIGIN.error); // then
  });

  test("X-Origin 정보가 잘못됨", async () => {
    // given
    const userId = "1";

    // when
    const res = await supertest(app.getHttpServer()).get(`/users/${userId}`).set(customOriginHeaderKey, userServiceOrigin);
    expect(res.body.error).toBe(HutomHttpException.UNAUTHORIZED.error); // then
  });

  describe("일반 사용자 로그인 후", () => {
    let agent: supertest.SuperAgentTest;
    const currentUser = testUsers[0];

    beforeEach(async () => {
      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentUser.employeeId,
        password: currentUser.password,
        isForced: true,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", res.get("Set-Cookie"));
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("FORBIDDEN_RESOURCE, 자원에 접근 권한이 없음", async () => {
      // given

      // when
      const res = await agent.get(`/users/${currentUser.id}`).set(customOriginHeaderKey, userServiceOrigin);

      // then
      expect(res.body.error).toEqual(HutomHttpException.FORBIDDEN_RESOURCE.error);
    });
  });

  describe("대표 계정 로그인 후", () => {
    let agent: supertest.SuperAgentTest;
    const currentAdmin = testAdmins[0];

    beforeEach(async () => {
      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentAdmin.employeeId,
        password: currentAdmin.password,
        isForced: true,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", res.get("Set-Cookie"));
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("NOT_FOUND_USER_WITH_ID, user가 존재하지 않음", async () => {
      // given
      const notFoundUserId = 999;

      // when
      const res = await agent.get(`/users/${notFoundUserId}`).set(customOriginHeaderKey, userServiceOrigin);

      // then
      expect(res.body.error).toEqual(HutomHttpException.NOT_FOUND_USER_WITH_ID.error);
    });

    test("200 response", async () => {
      // given

      // when
      const res = await agent.get(`/users/${currentAdmin.id}`).set(customOriginHeaderKey, userServiceOrigin).expect(200);

      // then
      // TODO: GET /users/:id res(opional -> required, nullable) 변경 후 작업 예정
      const expected = {
        id: expect.any(Number),
        employeeId: expect.any(String),
        email: expect.any(String),
        name: expect.any(String),
        phoneNumber: expect.any(String), // nullable
      };
      expect(Object.keys(res.body)).toEqual(Object.keys(expected));
    });
  });
});
