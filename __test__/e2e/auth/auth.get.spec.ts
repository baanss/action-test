import * as supertest from "supertest";
import * as cookieParser from "cookie-parser";

import { INestApplication } from "@nestjs/common";

import { generateNestApplication, delayTime } from "@test/util/test.util";
import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { testAdmins, testUsers } from "@root/seeding/seeder/seed/user.seed";

import { Role } from "@src/auth/interface/auth.interface";

import { SessionRepository } from "@src/auth/repository/session.repository";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";

let app: INestApplication;
let seederService: SeederService;
let sessionRepository: SessionRepository;

const customOriginHeaderKey = "x-origin";
const userServiceOrigin = "user";

beforeAll(async () => {
  app = await generateNestApplication();
  app.use(cookieParser());

  seederService = app.get(SeederService);
  sessionRepository = app.get(SessionRepository);

  await app.init();
  await seederService.empty();
  await seederService.seedEncryption();
});

afterAll(async () => {
  await seederService.empty();
  await app.close();
});

describe("GET /auth", () => {
  test("401 response, Cookie 헤더에 토큰 없거나 잘못된 토큰 설정됨", async () => {
    // given

    // when
    await supertest(app.getHttpServer()).get("/auth").expect(401); // then

    // given
    const token = "invalid";

    // when
    await supertest(app.getHttpServer()).get("/auth").set("Cookie", token).expect(401); // then
  });

  describe("일반 사용자로 로그인 후,", () => {
    let agent: supertest.SuperAgentTest;
    // given
    const currentUser = testUsers[0];
    const expectedBody = {
      id: currentUser.id,
      employeeId: currentUser.employeeId,
      role: Role.USER,
      expiresIn: expect.any(Number),
      showGuide: expect.any(Boolean),
      passwordSettingAt: expect.any(String),
      enableEmail: expect.any(Boolean),
    };

    beforeEach(async () => {
      await sessionRepository.clear();

      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentUser.employeeId,
        password: currentUser.password,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", res.get("Set-Cookie"));
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("200 response, 토큰 정보 가져오기", async () => {
      // when
      const res = await agent.get("/auth").expect(200);

      // then
      expect(res.body).toEqual(expectedBody);
    });

    test("같은 계정으로 강제로그인 성공, 기존 사용자 API 접근 실패", async () => {
      // given
      await delayTime(1000); // 다른 토큰 발급을 위한 1초 대기
      const forcedLogin = await supertest(app.getHttpServer())
        .post("/auth/user/login")
        .send({
          employeeId: currentUser.employeeId,
          password: currentUser.password,
          isForced: true,
        })
        .expect(200);

      // when
      const forcedAgent = supertest.agent(app.getHttpServer());
      forcedAgent.set("Cookie", forcedLogin.get("Set-Cookie"));
      forcedAgent.set(customOriginHeaderKey, userServiceOrigin);

      const res = await agent.get("/auth").expect(400);
      const forcedRes = await forcedAgent.get("/auth").expect(200);

      // then
      expect(res.body.error).toEqual(HutomHttpException.UNAUTHORIZED_SESSION_DUPLICATED.error);
      expect(res.get("Set-Cookie")[0]).toContain("accessToken=;");
      expect(res.get("Set-Cookie")[1]).toContain("sessionToken=;");
      expect(forcedRes.body).toEqual(expectedBody);
    });
  });

  describe("대표 계정으로 로그인 후,", () => {
    let agent: supertest.SuperAgentTest;
    // given
    const currentAdmin = testAdmins[0];
    const expectedBody = {
      id: currentAdmin.id,
      employeeId: currentAdmin.employeeId,
      role: Role.ADMIN,
      expiresIn: expect.any(Number),
      showGuide: expect.any(Boolean),
      passwordSettingAt: expect.any(String),
      enableEmail: expect.any(Boolean),
    };

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

    test("200 response, 토큰 정보 가져오기", async () => {
      // when
      const res = await agent.get("/auth").expect(200);

      // then
      expect(res.body).toEqual(expectedBody);
    });

    test("같은 계정으로 강제로그인 성공, 기존 사용자 API 접근 실패", async () => {
      // given
      await delayTime(1000); // 다른 토큰 발급을 위한 1초 대기
      const forcedLogin = await supertest(app.getHttpServer())
        .post("/auth/user/login")
        .send({
          employeeId: currentAdmin.employeeId,
          password: currentAdmin.password,
          isForced: true,
        })
        .expect(200);

      // when
      const forcedAgent = supertest.agent(app.getHttpServer());
      forcedAgent.set("Cookie", forcedLogin.get("Set-Cookie"));
      forcedAgent.set(customOriginHeaderKey, userServiceOrigin);

      const res = await agent.get("/auth").expect(400);
      const forcedRes = await forcedAgent.get("/auth").expect(200);

      // then
      expect(res.body.error).toEqual(HutomHttpException.UNAUTHORIZED_SESSION_DUPLICATED.error);
      expect(res.get("Set-Cookie")[0]).toContain("accessToken=;");
      expect(res.get("Set-Cookie")[1]).toContain("sessionToken=;");
      expect(forcedRes.body).toEqual(expectedBody);
    });
  });
});

describe("GET /auth/logout", () => {
  test("401 response, Cookie 헤더에 토큰 없거나 잘못된 토큰 설정됨", async () => {
    // given

    // when
    await supertest(app.getHttpServer()).get("/auth/logout").expect(401); // then

    // given
    const token = "invalid";

    // when
    await supertest(app.getHttpServer()).get("/auth/logout").set("Cookie", token).expect(401); // then
  });

  describe("일반 사용자로 로그인 후,", () => {
    let agent: supertest.SuperAgentTest;
    // given
    const currentUser = testUsers[0];

    beforeEach(async () => {
      await sessionRepository.clear();

      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentUser.employeeId,
        password: currentUser.password,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", res.get("Set-Cookie"));
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("200 response, 로그아웃 성공", async () => {
      // when
      const res = await agent.get("/auth/logout").expect(200);

      // then
      const userSession = await sessionRepository.findOneByUserId(currentUser.id);

      expect(res.get("Set-Cookie")[0]).toContain("accessToken=;");
      expect(res.get("Set-Cookie")[1]).toContain("sessionToken=;");
      expect(userSession).toBeUndefined();
    });
  });

  describe("대표 계정으로 로그인 후,", () => {
    let agent: supertest.SuperAgentTest;
    // given
    const currentAdmin = testAdmins[0];

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

    test("200 response, 로그아웃 성공", async () => {
      // when
      const res = await agent.get("/auth/logout").expect(200);

      // then
      const userSession = await sessionRepository.findOneByUserId(currentAdmin.id);

      expect(res.get("Set-Cookie")[0]).toContain("accessToken=;");
      expect(res.get("Set-Cookie")[1]).toContain("sessionToken=;");
      expect(userSession).toBeUndefined();
    });
  });
});
