import * as supertest from "supertest";
import * as cookieParser from "cookie-parser";
import * as moment from "moment";
import { INestApplication } from "@nestjs/common";

import { generateNestApplication, delayTime } from "@test/util/test.util";
import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { testAdmins, testUsers } from "@root/seeding/seeder/seed/user.seed";

import { HutomHttpException } from "@src/common/constant/http-exception.constant";

import { UserRepository } from "@src/user/repository/user.repository";
import { SessionRepository } from "@src/auth/repository/session.repository";
import { OtpRepository } from "@src/otp/repository/otp.repository";
import { UtilService } from "@src/util/util.service";

let app: INestApplication;
let seederService: SeederService;
let utilService: UtilService;

let userRepository: UserRepository;
let sessionRepository: SessionRepository;
let otpRepository: OtpRepository;

const customOriginHeaderKey = "x-origin";
const userServiceOrigin = "user";

beforeAll(async () => {
  app = await generateNestApplication();
  app.use(cookieParser());

  seederService = app.get(SeederService);
  utilService = app.get(UtilService);

  userRepository = app.get(UserRepository);
  sessionRepository = app.get(SessionRepository);
  otpRepository = app.get(OtpRepository);

  await seederService.empty();
  await seederService.seedEncryption();
  await app.init();
});

beforeEach(async () => {
  await seederService.empty();
  await seederService.seedEncryption();
});

afterAll(async () => {
  await app.close();
});

describe("PATCH /users/me", () => {
  test("401 response, x-origin 헤더 없음", (done: jest.DoneCallback) => {
    // given

    // when
    supertest(app.getHttpServer()).patch("/users/me").expect(401, done); // then
  });

  test("401 response, Cookie 헤더에 토큰 없거나 잘못된 토큰 설정됨", async () => {
    // given

    // when
    await supertest(app.getHttpServer()).patch("/users/me").set(customOriginHeaderKey, userServiceOrigin).expect(401); // then

    // given
    const token = "invalid";

    // when
    await supertest(app.getHttpServer()).patch("/users/me").set(customOriginHeaderKey, userServiceOrigin).set("Cookie", token).expect(401); // then
  });

  describe("일반 사용자로 로그인 후", () => {
    let agent: supertest.SuperAgentTest;
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

    test("DUPLICATED_USER_EMAIL, 이미 존재하는 email로 요청", async () => {
      // given
      const update = {
        email: testUsers[0].email,
        name: "new",
        phoneNumber: "010-1111-2222",
      };

      // when
      const res = await agent.patch("/users/me").send(update);

      // then
      expect(res.body.error).toBe(HutomHttpException.DUPLICATED_USER_EMAIL.error);
    });

    test("DUPLICATED_USER_PHONE_NUMBER, 이미 존재하는 phoneNumber로 요청", async () => {
      // given
      const update = {
        email: "new@new.com",
        name: "new",
        phoneNumber: testUsers[0].phoneNumber,
      };

      // when
      const res = await agent.patch("/users/me").send(update);

      // then
      expect(res.body.error).toBe(HutomHttpException.DUPLICATED_USER_PHONE_NUMBER.error);
    });

    test("200 response, 현재 일반 사용자 정보 변경 성공", async () => {
      // given
      const update = {
        email: "new@hutom.io",
        name: "new",
        phoneNumber: "010-1111-2222",
      };

      // when
      const res = await agent.patch("/users/me").send(update).expect(200);

      // then
      expect(res.body.id).toBe(currentUser.id);

      const updatedUser = await userRepository.findOne(res.body.id);
      expect(updatedUser.email).toBe(update.email);
      expect(updatedUser.name).toBe(update.name);
      expect(updatedUser.phoneNumber).toBe(update.phoneNumber);
    });

    test("200 response, 사용자 가이드 노출여부 변경 성공", async () => {
      // given
      const update = {
        showGuide: false,
      };

      // when
      const res = await agent.patch("/users/me").send(update);

      // then
      expect(res.body.id).toBe(currentUser.id);

      const updatedUser = await userRepository.findOne(res.body.id);
      expect(updatedUser.showGuide).toStrictEqual(update.showGuide);
    });

    test("200 response, 비밀번호 설정 일자 변경 성공", async () => {
      // given
      const now = new Date();
      const update = {
        passwordSettingAt: now.toISOString(),
      };

      // when
      const res = await agent.patch("/users/me").send(update);

      // then
      expect(res.body.id).toBe(currentUser.id);

      const updatedUser = await userRepository.findOne(res.body.id);
      expect(updatedUser.passwordSettingAt).toStrictEqual(new Date(update.passwordSettingAt));
    });
  });

  describe("대표 계정으로 로그인 후", () => {
    let agent: supertest.SuperAgentTest;
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

    test("DUPLICATED_USER_EMAIL, 이미 존재하는 email로 요청", async () => {
      // given
      const update = {
        email: testAdmins[0].email,
        name: "new",
        phoneNumber: "010-1111-2222",
      };

      // when
      const res = await agent.patch("/users/me").send(update);

      // then
      expect(res.body.error).toBe(HutomHttpException.DUPLICATED_USER_EMAIL.error);
    });

    test("DUPLICATED_USER_PHONE_NUMBER, 이미 존재하는 phoneNumber로 요청", async () => {
      // given
      const update = {
        email: "new@new.com",
        name: "new",
        phoneNumber: testAdmins[0].phoneNumber,
      };

      // when
      const res = await agent.patch("/users/me").send(update);

      // then
      expect(res.body.error).toBe(HutomHttpException.DUPLICATED_USER_PHONE_NUMBER.error);
    });

    test("200 response, 현재 대표 계정 정보 변경 성공", async () => {
      // given
      const update = {
        email: "admin-new@hutom.io",
        name: "new",
        phoneNumber: "010-1111-2222",
      };

      // when
      const res = await agent.patch("/users/me").send(update).expect(200);

      // then
      expect(res.body.id).toBe(currentAdmin.id);

      const updatedUser = await userRepository.findOne(res.body.id);
      expect(updatedUser.email).toBe(update.email);
      expect(updatedUser.name).toBe(update.name);
      expect(updatedUser.phoneNumber).toBe(update.phoneNumber);
    });

    test("200 response, 사용자 가이드 노출여부 변경 성공", async () => {
      // given
      const update = {
        showGuide: false,
      };

      // when
      const res = await agent.patch("/users/me").send(update);

      // then
      expect(res.body.id).toBe(currentAdmin.id);

      const updatedUser = await userRepository.findOne(res.body.id);
      expect(updatedUser.showGuide).toStrictEqual(update.showGuide);
    });

    test("200 response, 비밀번호 설정 일자 변경 성공", async () => {
      // given
      const now = new Date();
      const update = {
        passwordSettingAt: now.toISOString(),
      };

      // when
      const res = await agent.patch("/users/me").send(update);

      // then
      expect(res.body.id).toBe(currentAdmin.id);

      const updatedUser = await userRepository.findOne(res.body.id);
      expect(updatedUser.passwordSettingAt).toStrictEqual(new Date(update.passwordSettingAt));
    });
  });
});

describe("PATCH /users/me/password", () => {
  test("401 response, x-origin 헤더 없음", (done: jest.DoneCallback) => {
    // given

    // when
    supertest(app.getHttpServer()).patch("/users/me/password").expect(401, done); // then
  });

  test("401 response, Cookie 헤더에 토큰 없거나 잘못된 토큰 설정됨", async () => {
    // given

    // when
    await supertest(app.getHttpServer()).patch("/users/me/password").set(customOriginHeaderKey, userServiceOrigin).expect(401); // then

    // given
    const token = "invalid";

    // when
    await supertest(app.getHttpServer()).patch("/users/me/password").set(customOriginHeaderKey, userServiceOrigin).set("Cookie", token).expect(401); // then
  });

  describe("일반 사용자로 로그인 후", () => {
    let agent: supertest.SuperAgentTest;
    let cookies: string[];

    const currentUser = testUsers[0];
    const initUpdate = {
      current: currentUser.password,
      new: "prev_password",
    };
    const reUpdate = {
      current: initUpdate.new,
      new: "new_password",
    };

    beforeEach(async () => {
      await sessionRepository.clear();

      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentUser.employeeId,
        password: currentUser.password,
      });

      cookies = res.header["set-cookie"];
      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", cookies);
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("초기 수정 - UNAUTHORIZED_INVALID_PASSWORD, 현재 비밀번호 틀림", async () => {
      // given
      const update = {
        current: "invalid",
        new: "new_password",
      };

      // when
      const res = await agent.patch("/users/me/password").send(update);

      // then
      expect(res.body.error).toBe(HutomHttpException.UNAUTHORIZED_INVALID_PASSWORD.error);
    });

    test("초기 수정 - INVALID_REQUEST_BODY, 현재 비밀번호와 동일한 비밀번호로 변경 불가", async () => {
      // given
      const update = {
        current: currentUser.password,
        new: currentUser.password,
      };

      // when
      const res = await agent.patch("/users/me/password").send(update);

      // then
      expect(res.body.error).toBe(HutomHttpException.INVALID_REQUEST_BODY.error);
    });

    test("초기 수정 - 성공", async () => {
      // given
      const update = initUpdate;

      // when
      const res = await agent.patch("/users/me/password").send(update).expect(200);

      // then
      expect(res.body.id).toBe(currentUser.id);
      expect(res.body.meta.passwordSettingAt).not.toStrictEqual(currentUser.passwordSettingAt);

      // 변경된 비밀번호로 로그인 성공
      await sessionRepository.clear();

      const loginRes = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentUser.employeeId,
        password: update.new,
      });

      expect(loginRes.status).toEqual(200);
    });

    describe("비밀번호 수정 후 재 수정", () => {
      let changedPwdAgent: supertest.SuperAgentTest;

      beforeEach(async () => {
        await delayTime(1000); // 다른 토큰 발급을 위한 1초 대기

        // NOTE : Cookie(AccessToken) 갱신. 새로운 agent로 테스트
        const prevRequest = await agent.patch("/users/me/password").send(initUpdate);
        const changedToken = prevRequest.header["set-cookie"][0];
        cookies = cookies.map((item) => (item.includes("accessToken=") ? changedToken : item));

        changedPwdAgent = supertest.agent(app.getHttpServer());
        changedPwdAgent.set("Cookie", cookies);
        changedPwdAgent.set(customOriginHeaderKey, userServiceOrigin);
      });

      test("INVALID_REQUEST_BODY, 직전 비밀번호와 동일한 비밀번호로 변경 불가", async () => {
        // given
        const update = {
          current: reUpdate.current,
          new: initUpdate.current,
        };

        // when
        const res = await changedPwdAgent.patch("/users/me/password").send(update);

        // then
        expect(res.body.error).toBe(HutomHttpException.INVALID_REQUEST_BODY.error);
      });

      test("성공", async () => {
        // given
        const update = reUpdate;

        // when
        const res = await changedPwdAgent.patch("/users/me/password").send(update);

        // then
        expect(res.body.id).toBe(currentUser.id);
        expect(res.body.meta.passwordSettingAt).not.toStrictEqual(currentUser.passwordSettingAt);

        // 변경된 비밀번호로 로그인 성공
        await sessionRepository.clear();

        const loginRes = await supertest(app.getHttpServer()).post("/auth/user/login").send({
          employeeId: currentUser.employeeId,
          password: update.new,
        });

        expect(loginRes.status).toEqual(200);
      });
    });
  });

  describe("대표 계정 로그인 후", () => {
    let agent: supertest.SuperAgentTest;
    let cookies: string[];

    const currentAdmin = testAdmins[0];
    const initUpdate = {
      current: currentAdmin.password,
      new: "prev_password",
    };
    const reUpdate = {
      current: initUpdate.new,
      new: "new_password",
    };

    beforeEach(async () => {
      await sessionRepository.clear();

      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentAdmin.employeeId,
        password: currentAdmin.password,
      });

      cookies = res.header["set-cookie"];
      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", cookies);
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("초기 수정 - UNAUTHORIZED_INVALID_PASSWORD, 현재 비밀번호 틀림", async () => {
      // given
      const update = {
        current: "invalid",
        new: "new_password",
      };

      // when
      const res = await agent.patch("/users/me/password").send(update);

      // then
      expect(res.body.error).toBe(HutomHttpException.UNAUTHORIZED_INVALID_PASSWORD.error);
    });

    test("초기 수정 - INVALID_REQUEST_BODY, 현재 비밀번호와 동일한 비밀번호로 변경 불가", async () => {
      // given
      const update = {
        current: currentAdmin.password,
        new: currentAdmin.password,
      };

      // when
      const res = await agent.patch("/users/me/password").send(update);

      // then
      expect(res.body.error).toBe(HutomHttpException.INVALID_REQUEST_BODY.error);
    });

    test("초기 수정 - 성공", async () => {
      // given
      const update = initUpdate;

      // when
      const res = await agent.patch("/users/me/password").send(update).expect(200);

      // then
      expect(res.body.id).toBe(currentAdmin.id);
      expect(res.body.meta.passwordSettingAt).not.toStrictEqual(currentAdmin.passwordSettingAt);

      // 변경된 비밀번호로 로그인 성공
      await sessionRepository.clear();

      const loginRes = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentAdmin.employeeId,
        password: update.new,
      });

      expect(loginRes.status).toEqual(200);
    });

    describe("비밀번호 수정 후 재 수정", () => {
      let changedPwdAgent: supertest.SuperAgentTest;

      beforeEach(async () => {
        await delayTime(1000); // 다른 토큰 발급을 위한 1초 대기

        // NOTE : Cookie(AccessToken) 갱신. 새로운 agent로 테스트
        const prevRequest = await agent.patch("/users/me/password").send(initUpdate);
        const changedToken = prevRequest.header["set-cookie"][0];
        cookies = cookies.map((item) => (item.includes("accessToken=") ? changedToken : item));

        changedPwdAgent = supertest.agent(app.getHttpServer());
        changedPwdAgent.set("Cookie", cookies);
        changedPwdAgent.set(customOriginHeaderKey, userServiceOrigin);
      });

      test("INVALID_REQUEST_BODY, 직전 비밀번호와 동일한 비밀번호로 변경 불가", async () => {
        // given
        const update = {
          current: reUpdate.current,
          new: initUpdate.current,
        };

        // when
        const res = await changedPwdAgent.patch("/users/me/password").send(update);

        // then
        expect(res.body.error).toBe(HutomHttpException.INVALID_REQUEST_BODY.error);
      });

      test("성공", async () => {
        // given
        const update = reUpdate;

        // when
        const res = await changedPwdAgent.patch("/users/me/password").send(update);

        // then
        expect(res.body.id).toBe(currentAdmin.id);
        expect(res.body.meta.passwordSettingAt).not.toStrictEqual(currentAdmin.passwordSettingAt);

        // 변경된 비밀번호로 로그인 성공
        await sessionRepository.clear();

        const loginRes = await supertest(app.getHttpServer()).post("/auth/user/login").send({
          employeeId: currentAdmin.employeeId,
          password: update.new,
        });

        expect(loginRes.status).toEqual(200);
      });
    });
  });
});

describe("PATCH /users/{id}", () => {
  test("401 response, x-origin 헤더 없음", (done: jest.DoneCallback) => {
    // given

    // when
    supertest(app.getHttpServer()).patch("/users/1").expect(401, done); // then
  });

  test("401 response, Cookie 헤더에 토큰 없거나 잘못된 토큰 설정됨", async () => {
    // given

    // when
    await supertest(app.getHttpServer()).patch("/users/1").set(customOriginHeaderKey, userServiceOrigin).expect(401); // then

    // given
    const token = "invalid";

    // when
    await supertest(app.getHttpServer()).patch("/users/1").set(customOriginHeaderKey, userServiceOrigin).set("Cookie", token).expect(401); // then
  });

  describe("대표 계정으로 로그인 후", () => {
    let agent: supertest.SuperAgentTest;
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

    test("FORBIDDEN_RESOURCE, 본인 정보를 수정하려는 경우", async () => {
      // given
      // when
      const res = await agent.patch(`/users/${currentAdmin.id}`).send({});
      // then
      expect(res.body.error).toBe(HutomHttpException.FORBIDDEN_RESOURCE.error);
    });

    test("DUPLICATED_USER_EMAIL, 이미 존재하는 email로 요청", async () => {
      // given
      const targetUser = testUsers[0];
      const update = {
        email: testUsers[1].email,
        name: "new name",
        phoneNumber: "010-1234-1234",
      };
      // when
      const res = await agent.patch(`/users/${targetUser.id}`).send(update);
      // then
      expect(res.body.error).toBe(HutomHttpException.DUPLICATED_USER_EMAIL.error);
    });

    test("DUPLICATED_USER_PHONE_NUMBER, 이미 존재하는 phoneNumber로 요청", async () => {
      // given
      const targetUser = testUsers[0];
      const update = {
        email: "new@new.com",
        name: "new name",
        phoneNumber: testUsers[1].phoneNumber,
      };
      // when
      const res = await agent.patch(`/users/${targetUser.id}`).send(update);
      // then
      expect(res.body.error).toBe(HutomHttpException.DUPLICATED_USER_PHONE_NUMBER.error);
    });

    test("200 response, 해당 id의 사용자 정보 변경 성공", async () => {
      // given
      const targetUser = testUsers[0];
      const update = {
        email: "new@email.com",
        name: "new name",
        phoneNumber: "010-1234-1234",
      };
      // when
      const res = await agent.patch(`/users/${targetUser.id}`).send(update).expect(200);
      // then
      expect(res.body.id).toBe(targetUser.id);
      const updatedUser = await userRepository.findOne(targetUser.id);
      expect(updatedUser.email).toBe(update.email);
      expect(updatedUser.name).toBe(update.name);
      expect(updatedUser.phoneNumber).toBe(update.phoneNumber);
    });
  });
});

describe("PATCH /users/:id/password", () => {
  const currentUser = testUsers[0];
  const otherUser = testUsers[1];
  const token = "validToken";

  beforeEach(async () => {
    await otpRepository.save({ token, user: currentUser, expiresIn: moment().add(1, "h") });
  });

  test("NOT_FOUND_USER_WITH_ID, 수정할 계정이 존재하지 않음", async () => {
    // given
    const targetId = 999999;
    const updateDto = {
      token,
      newPassword: "newPwd",
    };

    // when
    const res = await supertest(app.getHttpServer()).patch(`/users/${targetId}/password`).send(updateDto);

    // then
    expect(res.body.error).toBe(HutomHttpException.NOT_FOUND_USER_WITH_ID.error);
  });

  test("NOT_FOUND_DATA, 유효한 토큰을 찾을 수 없음", async () => {
    // given
    // when
    const targetId = currentUser.id;
    const updateDto = {
      token: "invalid",
      newPassword: "newPwd",
    };
    const res = await supertest(app.getHttpServer()).patch(`/users/${targetId}/password`).send(updateDto);

    // then
    expect(res.body.error).toBe(HutomHttpException.NOT_FOUND_DATA.error);
  });

  test("NOT_FOUND_DATA, 요청한 계정의 토큰을 찾을 수 없음", async () => {
    // given
    // when
    const targetId = otherUser.id;
    const updateDto = {
      token,
      newPassword: "newPwd",
    };
    const res = await supertest(app.getHttpServer()).patch(`/users/${targetId}/password`).send(updateDto);

    // then
    expect(res.body.error).toBe(HutomHttpException.NOT_FOUND_DATA.error);
  });

  test("UNAUTHORIZED, 토큰 만료", async () => {
    // given
    await otpRepository.delete({});
    await otpRepository.save({ token, user: currentUser, expiresIn: moment().subtract(1, "h") });

    // when
    const targetId = currentUser.id;
    const updateDto = {
      token,
      newPassword: "newPwd",
    };
    const res = await supertest(app.getHttpServer()).patch(`/users/${targetId}/password`).send(updateDto);

    // then
    expect(res.body.error).toBe(HutomHttpException.UNAUTHORIZED.error);
  });

  test("INVALID_REQUEST_CURRENT_PASSWORD, 현재 비밀번호와 동일한 비밀번호로 변경 불가", async () => {
    // given
    const updateDto = {
      token,
      newPassword: currentUser.password,
    };

    // when
    const targetId = currentUser.id;
    const res = await supertest(app.getHttpServer()).patch(`/users/${targetId}/password`).send(updateDto);

    // then
    expect(res.body.error).toBe(HutomHttpException.INVALID_REQUEST_CURRENT_PASSWORD.error);
  });

  test("INVALID_REQUEST_PREV_PASSWORD, 직전 비밀번호와 동일한 비밀번호로 변경 불가", async () => {
    // given
    const prevPassword = "prevPwd";
    const hashedPrevPassword = await utilService.hashString(prevPassword);
    await userRepository.update({ id: currentUser.id }, { prevPassword: hashedPrevPassword });

    // when
    const updateDto = {
      token,
      newPassword: prevPassword,
    };
    const targetId = currentUser.id;
    const res = await supertest(app.getHttpServer()).patch(`/users/${targetId}/password`).send(updateDto);

    // then
    expect(res.body.error).toBe(HutomHttpException.INVALID_REQUEST_PREV_PASSWORD.error);
  });

  test("200 Response, 비밀번호 변경 성공", async () => {
    // given
    const updateDto = {
      token,
      newPassword: "newPwd",
    };

    // when
    const targetUser = currentUser;
    const res = await supertest(app.getHttpServer()).patch(`/users/${targetUser.id}/password`).send(updateDto);

    // then
    expect(res.body.id).toBe(targetUser.id);
    expect(res.body.meta.passwordSettingAt).not.toStrictEqual(targetUser.passwordSettingAt);

    const expectedUser = await userRepository.findById(res.body.id);
    expect(expectedUser.signInFailed).toEqual(0);

    // 변경된 비밀번호로 로그인 성공
    const loginRes = await supertest(app.getHttpServer()).post("/auth/user/login").send({
      employeeId: targetUser.employeeId,
      password: updateDto.newPassword,
    });

    expect(loginRes.status).toEqual(200);
  });

  describe("다른 곳에서 로그인 중인 경우", () => {
    let agent: supertest.SuperAgentTest;

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

    test("200 Response, 비밀번호 변경 성공.", async () => {
      // given
      const prevUser = await userRepository.findOne(currentUser.id);
      const updateDto = {
        token,
        newPassword: "newPwd",
      };

      // when
      const res = await supertest(app.getHttpServer()).patch(`/users/${currentUser.id}/password`).send(updateDto);

      // then
      expect(res.body.id).toBe(currentUser.id);
      expect(res.body.meta.passwordSettingAt).not.toStrictEqual(currentUser.passwordSettingAt);

      const user = await userRepository.findOne(res.body.id);
      expect(user.prevPassword).toBe(prevUser.password);
      expect(user.initPassword).toBeTruthy();

      const session = await sessionRepository.findOne({ user: currentUser });
      expect(session).toBeUndefined();

      const otp = await otpRepository.findOne({ token });
      expect(otp).toBeUndefined();
    });
  });
});
