import * as moment from "moment";
import * as supertest from "supertest";
import * as cookieParser from "cookie-parser";

import { INestApplication } from "@nestjs/common";

import { generateNestApplication } from "@test/util/test.util";
import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { testUsers } from "@root/seeding/seeder/seed/user.seed";

import { SessionRepository } from "@src/auth/repository/session.repository";
import { OtpRepository } from "@src/otp/repository/otp.repository";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";

let app: INestApplication;
let seederService: SeederService;
let sessionRepository: SessionRepository;
let otpRepository: OtpRepository;

const customOriginHeaderKey = "x-origin";
const userServiceOrigin = "user";

beforeAll(async () => {
  app = await generateNestApplication();
  app.use(cookieParser());

  seederService = app.get(SeederService);
  sessionRepository = app.get(SessionRepository);
  otpRepository = app.get(OtpRepository);

  await app.init();
  await seederService.empty();
  await seederService.seedUsers();
});

afterAll(async () => {
  await seederService.empty();
  await app.close();
});

describe("세션 업데이트 테스트 - 일반 계정 로그인 후", () => {
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

  test("인증이 필요한 API 호출 시 세션 업데이트 예외(1) - GET /auth", async () => {
    // given
    const userSession = await sessionRepository.findOneByUserId(currentUser.id);
    const sessionExpiresIn = userSession.expiresIn;

    // when
    await agent.get("/auth").expect(200);
    const updatedSession = await sessionRepository.findOneByUserId(currentUser.id);
    const updatedExpiresIn = updatedSession.expiresIn;

    // then
    expect(sessionExpiresIn).toStrictEqual(updatedExpiresIn);
  });

  test("인증이 필요한 API 호출 시 세션 업데이트 예외(2) - GET /notifications/unread-count", async () => {
    // given
    const userSession = await sessionRepository.findOneByUserId(currentUser.id);
    const sessionExpiresIn = userSession.expiresIn;

    // when
    await agent.get("/notifications/unread-count").expect(200);
    const updatedSession = await sessionRepository.findOneByUserId(currentUser.id);
    const updatedExpiresIn = updatedSession.expiresIn;

    // then
    expect(sessionExpiresIn).toStrictEqual(updatedExpiresIn);
  });

  test("인증이 필요한 API 호출 시 세션 업데이트(1) - GET /users/me", async () => {
    // given
    const userSession = await sessionRepository.findOneByUserId(currentUser.id);
    const sessionExpiresIn = userSession.expiresIn;

    // when
    await agent.get("/users/me").expect(200);
    const updatedSession = await sessionRepository.findOneByUserId(currentUser.id);
    const updatedExpiresIn = updatedSession.expiresIn;

    // then
    expect(sessionExpiresIn).not.toStrictEqual(updatedExpiresIn);
  });

  test("인증이 필요한 API 호출 시 세션 업데이트(2) - GET /upload-jobs", async () => {
    // given
    const userSession = await sessionRepository.findOneByUserId(currentUser.id);
    const sessionExpiresIn = userSession.expiresIn;

    // when
    await agent.get("/upload-jobs").expect(200);
    const updatedSession = await sessionRepository.findOneByUserId(currentUser.id);
    const updatedExpiresIn = updatedSession.expiresIn;

    // then
    expect(sessionExpiresIn).not.toStrictEqual(updatedExpiresIn);
  });
});

describe("세션 만료 테스트 - 토큰을 이용한 비밀번호 변경", () => {
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

  test("토큰을 이용한 비밀번호 변경 시, 기존 세션 삭제 및 로그아웃", async () => {
    // given : 비밀번호 변경을 위한 토큰 발급
    const userSession = await sessionRepository.findOneByUserId(currentUser.id);
    const token = "validToken";
    const updateDto = {
      token,
      newPassword: "newPwd",
    };
    await otpRepository.save({ token, user: currentUser, expiresIn: moment().add(1, "h") });

    // when : 토큰을 이용한 비밀번호 변경 후, 기존 접속중인 계정의 인증이 필요한 API 호출
    await supertest(app.getHttpServer()).patch(`/users/${currentUser.id}/password`).send(updateDto);
    const updatedSession = await sessionRepository.findOneByUserId(currentUser.id);

    const res = await agent.get("/auth");

    // then
    expect(userSession).not.toBeUndefined();
    expect(updatedSession).toBeUndefined();

    expect(res.body.error).toEqual(HutomHttpException.UNAUTHORIZED_SESSION_DELETED.error);
  });
});
