import * as supertest from "supertest";
import * as cookieParser from "cookie-parser";
import { INestApplication } from "@nestjs/common";

import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { generateNestApplication } from "@test/util/test.util";
import { testAdmins, testUsers } from "@root/seeding/seeder/seed/user.seed";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";

import { SessionRepository } from "@src/auth/repository/session.repository";

let app: INestApplication;
let seederService: SeederService;
let sessionRepository: SessionRepository;

const expectedFeedback = {
  id: expect.any(Number),
  message: expect.any(String),
  writerEmail: expect.any(String),
  createdAt: expect.any(String),
  updatedAt: expect.any(String),
};

const customOriginHeaderKey = "x-origin";
const userServiceOrigin = "user";

const currentUser = testUsers[0];
const currentAdmin = testAdmins[0];

beforeAll(async () => {
  app = await generateNestApplication();
  app.use(cookieParser());

  seederService = app.get(SeederService);
  sessionRepository = app.get(SessionRepository);

  await seederService.empty();
  await seederService.seedEncryption();
  await app.init();
});

afterAll(async () => {
  await seederService.empty();
  await app.close();
});

describe("GET /feedbacks/:id", () => {
  let agent: supertest.SuperAgentTest;

  test("UNAUTHORIZED_ORIGIN, 헤더에 유효한 인증 정보가 없음", async () => {
    // given
    const feedbackId = "1";

    // when-then
    const res = await supertest.agent(app.getHttpServer()).get(`/feedbacks/${feedbackId}`);

    // then
    expect(res.body.error).toBe(HutomHttpException.UNAUTHORIZED_ORIGIN.error);
  });

  describe("API 접근 권한 있음 - 일반 계정", () => {
    beforeEach(async () => {
      await sessionRepository.clear();

      // rusCase 조회를 위한 로그인
      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentUser.employeeId,
        password: currentUser.password,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", res.get("Set-Cookie"));
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("NOT_FOUND_FEEDBACK_WITH_ID, 피드백이 등록되지 않음", async () => {
      // given
      const feedbackId = "999";

      // when
      const res = await agent.get(`/feedbacks/${feedbackId}`);

      // then
      expect(res.body.error).toBe(HutomHttpException.NOT_FOUND_FEEDBACK_WITH_ID.error);
    });

    test("200 response", async () => {
      // given
      const feedbackId = "1";

      // when
      const res = await agent.get(`/feedbacks/${feedbackId}`).expect(200);

      // then
      expect(res.body).toEqual(expectedFeedback);
    });
  });

  describe("API 접근 권한 있음 - 대표 계정", () => {
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

    test("NOT_FOUND_FEEDBACK_WITH_ID, 피드백이 등록되지 않음", async () => {
      // given
      const feedbackId = "999";

      // when
      const res = await agent.get(`/feedbacks/${feedbackId}`);

      // then
      expect(res.body.error).toBe(HutomHttpException.NOT_FOUND_FEEDBACK_WITH_ID.error);
    });

    test("200 response", async () => {
      // given
      const feedbackId = "1";

      // when
      const res = await agent.get(`/feedbacks/${feedbackId}`).expect(200);

      // then
      expect(res.body).toEqual(expectedFeedback);
    });
  });
});
