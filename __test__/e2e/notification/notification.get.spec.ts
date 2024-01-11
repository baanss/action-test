import * as supertest from "supertest";
import * as cookieParser from "cookie-parser";

import { INestApplication } from "@nestjs/common";

import { generateNestApplication } from "@test/util/test.util";
import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { testAdmins, testUsers } from "@root/seeding/seeder/seed/user.seed";

import { SessionRepository } from "@src/auth/repository/session.repository";
import { NotificationRepository } from "@src/notification/repository/notification.repository";

let app: INestApplication;
let seederService: SeederService;
let sessionRepository: SessionRepository;
let notificationRepository: NotificationRepository;

const customOriginHeaderKey = "x-origin";
const userServiceOrigin = "user";

beforeAll(async () => {
  app = await generateNestApplication();
  app.use(cookieParser());

  seederService = app.get(SeederService);
  sessionRepository = app.get(SessionRepository);
  notificationRepository = app.get(NotificationRepository);

  await app.init();
  await seederService.empty();
  await seederService.seedEncryption();
});

afterAll(async () => {
  await seederService.empty();
  await app.close();
});

describe("GET /notifications", () => {
  test("401 response, x-origin 헤더 없음", (done: jest.DoneCallback) => {
    // given

    // when
    supertest(app.getHttpServer()).get("/notifications").expect(401, done); // then
  });

  test("401 response, Cookie 헤더에 토큰 없거나 잘못된 토큰 설정됨", async () => {
    // given

    // when
    await supertest(app.getHttpServer()).get("/notifications").set(customOriginHeaderKey, userServiceOrigin).expect(401); // then

    // given
    const token = "invalid";

    // when
    await supertest(app.getHttpServer()).get("/notifications").set(customOriginHeaderKey, userServiceOrigin).set("Cookie", token).expect(401); // then
  });

  describe("대표 계정 로그인 후,", () => {
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

    test("200 response, 모든 알림 조회 성공", async () => {
      // when
      const res = await agent.get("/notifications").expect(200);

      // then
      const expected = {
        id: expect.any(Number),
        category: expect.any(String),
        message: expect.any(String),
        read: expect.any(Boolean),
        createdAt: expect.any(String),
      };

      res.body.data.forEach((noti) => {
        expect(noti).toEqual(expected);
      });
      expect(res.body.count).toBeGreaterThanOrEqual(0);
    });

    test("200 response, 특정 조건(limit = -1) 전체 검색 성공", async () => {
      // given
      const [, expectedCount] = await notificationRepository.findAndCount({ where: { userId: currentAdmin.id } });

      // when
      const searchQuery = { limit: "-1" };
      const res = await agent.get("/notifications").query(searchQuery).expect(200);

      // then
      expect(res.body.count).toEqual(expectedCount);
    });

    test("200 response, 페이지네이션 적용하여 조회 성공", async () => {
      // given
      const [, expectedCount] = await notificationRepository.findAndCount({ where: { userId: currentAdmin.id } });

      // when
      const searchQuery = { page: 2, limit: 2 };
      const res = await agent.get("/notifications").query(searchQuery).expect(200);

      // then
      expect(res.body.count).toEqual(expectedCount);
      expect(res.body.data.length).toBeLessThanOrEqual(searchQuery.limit);
    });
  });
});

describe("GET /notifications/unread-count", () => {
  test("401 response, x-origin 헤더 없음", (done: jest.DoneCallback) => {
    // given

    // when
    supertest(app.getHttpServer()).get("/notifications/unread-count").expect(401, done); // then
  });

  test("401 response, Cookie 헤더에 토큰 없거나 잘못된 토큰 설정됨", async () => {
    // given

    // when
    await supertest(app.getHttpServer()).get("/notifications/unread-count").set(customOriginHeaderKey, userServiceOrigin).expect(401); // then

    // given
    const token = "invalid";

    // when
    await supertest(app.getHttpServer()).get("/notifications/unread-count").set(customOriginHeaderKey, userServiceOrigin).set("Cookie", token).expect(401); // then
  });

  describe("일반 사용자로 로그인 후", () => {
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

    test("200 response, 읽지 않은 알림 개수 조회 성공", async () => {
      // when
      const res = await agent.get("/notifications/unread-count").expect(200);

      const expected = { unreadCount: expect.any(Number) };

      // then
      expect(res.body).toEqual(expected);
    });
  });
});
