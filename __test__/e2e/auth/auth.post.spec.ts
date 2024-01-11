import * as supertest from "supertest";
import { INestApplication } from "@nestjs/common";
import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { testAdmins, testUsers } from "@root/seeding/seeder/seed/user.seed";

import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { SERVICE_CODE } from "@src/common/middleware/server-auth.middleware";
import { SessionRepository } from "@src/auth/repository/session.repository";
import { generateNestApplication } from "@test/util/test.util";
import { UserRepository } from "@src/user/repository/user.repository";

let app: INestApplication;
let seederService: SeederService;
let sessionRepository: SessionRepository;
let userRepository: UserRepository;

beforeAll(async () => {
  app = await generateNestApplication();

  seederService = app.get(SeederService);
  sessionRepository = app.get(SessionRepository);
  userRepository = app.get(UserRepository);

  await app.init();
  await seederService.empty();
  await seederService.seedEncryption();
});

afterAll(async () => {
  await seederService.empty();
  await app.close();
});

describe("POST /auth/user/login - 일반 사용자 로그인", () => {
  beforeEach(async () => {
    // session이 각 로그인에 영향받지 않도록
    await sessionRepository.clear();
  });

  test("200 response, 로그인 성공", async () => {
    // given
    const targetUser = testUsers[0];

    // when
    const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
      employeeId: targetUser.employeeId,
      password: targetUser.password,
    });

    // then
    expect(res.get("Set-Cookie")[0]).toContain("accessToken=");
    expect(res.get("Set-Cookie")[1]).toContain("sessionToken=");
  });

  test("로그인 실패 - 이미 로그인 중인 사용자", async () => {
    // given
    const targetUser = testUsers[0];
    await supertest(app.getHttpServer())
      .post("/auth/user/login")
      .send({
        employeeId: targetUser.employeeId,
        password: targetUser.password,
      })
      .expect(200);

    // when
    const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
      employeeId: targetUser.employeeId,
      password: targetUser.password,
    });

    // then
    expect(res.body.error).toEqual(HutomHttpException.DUPLICATED_SESSION_DETECTED.error);
  });

  test("로그인 성공 - 중복된 세션 발견 시, 강제 로그인", async () => {
    // given
    const targetUser = testUsers[0];
    await supertest(app.getHttpServer())
      .post("/auth/user/login")
      .send({
        employeeId: targetUser.employeeId,
        password: targetUser.password,
      })
      .expect(200);
    await supertest(app.getHttpServer())
      .post("/auth/user/login")
      .send({
        employeeId: targetUser.employeeId,
        password: targetUser.password,
      })
      .expect(400);

    // when
    const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
      employeeId: targetUser.employeeId,
      password: targetUser.password,
      isForced: true,
    });

    // then
    expect(res.get("Set-Cookie")[0]).toContain("accessToken=");
    expect(res.get("Set-Cookie")[1]).toContain("sessionToken=");
  });

  test("로그인 실패 - 잘못된 employeeId", async () => {
    // given
    const targetUser = testUsers[0];

    // when
    const res = await supertest(app.getHttpServer())
      .post("/auth/user/login")
      .send({
        employeeId: "invalid",
        password: targetUser.password,
      })
      .expect(HutomHttpException.UNAUTHORIZED_NOT_FOUND_EMPLOYEE_ID.statusCode);

    // then
    expect(res.body.error).toBe(HutomHttpException.UNAUTHORIZED_NOT_FOUND_EMPLOYEE_ID.error);
  });

  test("로그인 실패 - 잘못된 password", async () => {
    // given
    const targetUser = testUsers[0];
    await userRepository.update(targetUser.id, { signInFailed: 3 });

    // when
    const res = await supertest(app.getHttpServer())
      .post("/auth/user/login")
      .send({
        employeeId: targetUser.employeeId,
        password: "invalid",
      })
      .expect(HutomHttpException.UNAUTHORIZED_INVALID_PASSWORD.statusCode);

    // then
    expect(res.body.error).toBe(HutomHttpException.UNAUTHORIZED_INVALID_PASSWORD.error);
    expect(res.body.signInFailed).toBeGreaterThan(0);
    expect(res.body.signInFailed).toBeLessThan(5);
  });

  test("로그인 실패 - password 5번째 틀린 경우", async () => {
    // given
    const targetUser = testUsers[2];
    await userRepository.update(targetUser.id, { signInFailed: 4 });

    // when
    const res = await supertest(app.getHttpServer())
      .post("/auth/user/login")
      .send({
        employeeId: targetUser.employeeId,
        password: "invalid",
      })
      .expect(HutomHttpException.LOCKED_PASSWORD_USER.statusCode);

    // then
    expect(res.body.error).toBe(HutomHttpException.LOCKED_PASSWORD_USER.error);
  });

  test("로그인 실패 - password 5번 이상 틀린 경우", async () => {
    // given
    const targetUser = testUsers[4];
    await userRepository.update(targetUser.id, { signInFailed: 5 });

    // when
    const res = await supertest(app.getHttpServer())
      .post("/auth/user/login")
      .send({
        employeeId: targetUser.employeeId,
        password: "invalid",
      })
      .expect(HutomHttpException.LOCKED_PASSWORD_USER.statusCode);

    // then
    expect(res.body.error).toBe(HutomHttpException.LOCKED_PASSWORD_USER.error);
  });

  test("로그인 실패 - 비활성화된 사용자", async () => {
    // given
    const targetUser = testUsers[3];

    // when
    const res = await supertest(app.getHttpServer())
      .post("/auth/user/login")
      .send({
        employeeId: targetUser.employeeId,
        password: targetUser.password,
      })
      .expect(HutomHttpException.UNAUTHORIZED_NOT_FOUND_EMPLOYEE_ID.statusCode);

    // then
    expect(res.body.error).toBe(HutomHttpException.UNAUTHORIZED_NOT_FOUND_EMPLOYEE_ID.error);
  });

  test("로그인 실패 - 비밀번호 초기 미설정 사용자", async () => {
    // given
    const targetUser = testUsers[5];

    // when
    const res = await supertest(app.getHttpServer())
      .post("/auth/user/login")
      .send({
        employeeId: targetUser.employeeId,
        password: targetUser.password,
      })
      .expect(HutomHttpException.PASSWORD_INIT_REQUIRED.statusCode);

    // then
    expect(res.body.error).toBe(HutomHttpException.PASSWORD_INIT_REQUIRED.error);
  });

  describe("로그아웃 된 세션에서의 테스트", () => {
    test("사용자 재 로그인 성공", async () => {
      // given
      const targetUser = testUsers[0];
      await sessionRepository.insert({
        user: targetUser,
        sessionToken: null,
        expiresIn: null,
      });

      // when
      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: targetUser.employeeId,
        password: targetUser.password,
      });

      const userSession = await sessionRepository.findOneByUserId(targetUser.id);
      const expectedSession = {
        id: expect.any(Number),
        sessionToken: expect.any(String),
        expiresIn: expect.any(Date),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        userId: targetUser.id,
      };

      // then
      expect(res.get("Set-Cookie")[0]).toContain("accessToken=");
      expect(res.get("Set-Cookie")[1]).toContain("sessionToken=");
      expect(userSession).toEqual(expectedSession);
    });
  });
});

describe("POST /auth/user/login - 대표 계정 로그인", () => {
  beforeEach(async () => {
    // session이 각 로그인에 영향받지 않도록
    await sessionRepository.clear();
  });
  test("200 response, 로그인 성공", async () => {
    // given
    const targetAdmin = testAdmins[0];

    // when
    const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
      employeeId: targetAdmin.employeeId,
      password: targetAdmin.password,
    });

    // then
    expect(res.get("Set-Cookie")[0]).toContain("accessToken=");
    expect(res.get("Set-Cookie")[1]).toContain("sessionToken=");
  });

  test("로그인 실패 - 이미 로그인 중인 사용자", async () => {
    // given
    const targetAdmin = testAdmins[0];
    await supertest(app.getHttpServer())
      .post("/auth/user/login")
      .send({
        employeeId: targetAdmin.employeeId,
        password: targetAdmin.password,
      })
      .expect(200);

    // when
    const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
      employeeId: targetAdmin.employeeId,
      password: targetAdmin.password,
    });

    // then
    expect(res.body.error).toEqual(HutomHttpException.DUPLICATED_SESSION_DETECTED.error);
  });

  test("로그인 성공 - 중복된 세션 발견 시, 강제 로그인", async () => {
    // given
    const targetAdmin = testAdmins[0];
    await supertest(app.getHttpServer())
      .post("/auth/user/login")
      .send({
        employeeId: targetAdmin.employeeId,
        password: targetAdmin.password,
      })
      .expect(200);
    await supertest(app.getHttpServer())
      .post("/auth/user/login")
      .send({
        employeeId: targetAdmin.employeeId,
        password: targetAdmin.password,
      })
      .expect(400);

    // when
    const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
      employeeId: targetAdmin.employeeId,
      password: targetAdmin.password,
      isForced: true,
    });

    // then
    expect(res.get("Set-Cookie")[0]).toContain("accessToken=");
    expect(res.get("Set-Cookie")[1]).toContain("sessionToken=");
  });

  test("로그인 실패 - 잘못된 employeeId", async () => {
    // given
    const targetAdmin = testAdmins[0];

    // when
    const res = await supertest(app.getHttpServer())
      .post("/auth/user/login")
      .send({
        employeeId: "invalid",
        password: targetAdmin.password,
      })
      .expect(HutomHttpException.UNAUTHORIZED_NOT_FOUND_EMPLOYEE_ID.statusCode);

    // then
    expect(res.body.error).toBe(HutomHttpException.UNAUTHORIZED_NOT_FOUND_EMPLOYEE_ID.error);
  });

  test("로그인 실패 - 잘못된 password", async () => {
    // given
    const targetAdmin = testAdmins[0];

    // when
    const res = await supertest(app.getHttpServer())
      .post("/auth/user/login")
      .send({
        employeeId: targetAdmin.employeeId,
        password: "invalid",
      })
      .expect(HutomHttpException.UNAUTHORIZED_INVALID_PASSWORD.statusCode);

    // then
    expect(res.body.error).toBe(HutomHttpException.UNAUTHORIZED_INVALID_PASSWORD.error);
  });

  test("로그인 실패 - 잘못된 password 5번 틀린 경우", async () => {
    // given
    const targetAdmin = testAdmins[2];

    // when
    const res = await supertest(app.getHttpServer())
      .post("/auth/user/login")
      .send({
        employeeId: targetAdmin.employeeId,
        password: "invalid",
      })
      .expect(HutomHttpException.LOCKED_PASSWORD_USER.statusCode); // then

    expect(res.body.error).toBe(HutomHttpException.LOCKED_PASSWORD_USER.error);
  });

  describe("로그아웃 된 세션에서의 테스트", () => {
    test("대표 계정 재 로그인 성공", async () => {
      // given
      const targetAdmin = testAdmins[0];
      await sessionRepository.insert({
        user: targetAdmin,
        sessionToken: null,
        expiresIn: null,
      });

      // when
      const res = await supertest(app.getHttpServer())
        .post("/auth/user/login")
        .send({
          employeeId: targetAdmin.employeeId,
          password: targetAdmin.password,
        })
        .expect(200);

      const adminSession = await sessionRepository.findOneByUserId(targetAdmin.id);
      const expectedSession = {
        id: expect.any(Number),
        sessionToken: expect.any(String),
        expiresIn: expect.any(Date),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        userId: targetAdmin.id,
      };

      // then
      expect(res.get("Set-Cookie")[0]).toContain("accessToken=");
      expect(res.get("Set-Cookie")[1]).toContain("sessionToken=");
      expect(adminSession).toEqual(expectedSession);
    });
  });
});

describe("POST /auth/rus-client/login - RUS Client 로그인", () => {
  const authTokenHeaderKey = "x-auth-token";
  const authToken = SERVICE_CODE;

  test("로그인 실패 - 잘못된 employeeId", async () => {
    // given
    const targetUser = testUsers[0];

    // when
    const res = await supertest(app.getHttpServer())
      .post("/auth/rus-client/login")
      .send({
        employeeId: "invalid",
        password: targetUser.password,
      })
      .set(authTokenHeaderKey, authToken)
      .expect(HutomHttpException.UNAUTHORIZED_NOT_FOUND_EMPLOYEE_ID.statusCode);

    // then
    expect(res.body.error).toBe(HutomHttpException.UNAUTHORIZED_NOT_FOUND_EMPLOYEE_ID.error);
  });

  test("로그인 실패 - 잘못된 password", async () => {
    // given
    const targetUser = testUsers[0];

    // when
    const res = await supertest(app.getHttpServer())
      .post("/auth/rus-client/login")
      .send({
        employeeId: targetUser.employeeId,
        password: "invalid",
      })
      .set(authTokenHeaderKey, authToken)
      .expect(HutomHttpException.UNAUTHORIZED_INVALID_PASSWORD.statusCode);

    // then
    expect(res.body.error).toBe(HutomHttpException.UNAUTHORIZED_INVALID_PASSWORD.error);
  });

  test("성공, 잠금된 사용자 요청", async () => {
    // given
    const targetUser = testUsers[4];

    // when
    const res = await supertest(app.getHttpServer())
      .post("/auth/rus-client/login")
      .send({
        employeeId: targetUser.employeeId,
        password: targetUser.password,
      })
      .set(authTokenHeaderKey, authToken)
      .expect(200);

    // then
    expect(res.body.accessToken).not.toBeNull();
  });

  test("성공, 일반 계정 요청", async () => {
    // given
    const targetUser = testUsers[0];

    // when
    const res = await supertest(app.getHttpServer())
      .post("/auth/rus-client/login")
      .send({
        employeeId: targetUser.employeeId,
        password: targetUser.password,
      })
      .set(authTokenHeaderKey, authToken)
      .expect(200);

    // then
    expect(res.body.accessToken).not.toBeNull();
  });

  test("성공, 대표 계정 요청", async () => {
    // given
    const targetUser = testAdmins[0];

    // when
    const res = await supertest(app.getHttpServer())
      .post("/auth/rus-client/login")
      .send({
        employeeId: targetUser.employeeId,
        password: targetUser.password,
      })
      .set(authTokenHeaderKey, authToken)
      .expect(200);

    // then
    expect(res.body.accessToken).not.toBeNull();
  });
});
