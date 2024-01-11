import { of } from "rxjs";
import * as faker from "faker";
import * as supertest from "supertest";
import * as cookieParser from "cookie-parser";
import { HttpService } from "@nestjs/axios";
import { INestApplication } from "@nestjs/common";

import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { generateNestApplication } from "@test/util/test.util";
import { ApplicationRepository } from "@src/application/repository/application.repository";
import { NotificationRepository } from "@src/notification/repository/notification.repository";
import { UserRepository } from "@src/user/repository/user.repository";

import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { testAdmins, testUsers } from "@root/seeding/seeder/seed/user.seed";
import { Category } from "@src/common/entity/notification.entity";
import { Role } from "@src/auth/interface/auth.interface";

let app: INestApplication;
let seederService: SeederService;

let applicationRepository: ApplicationRepository;
let notificationRepository: NotificationRepository;
let userRepository: UserRepository;

let httpService: HttpService;

const customOriginHeaderKey = "x-origin";
const userServiceOrigin = "user";

const currentAdmin = testAdmins[0];
const currentUser = testUsers[0];

const genEmployeeId = () => faker.datatype.uuid();
const genEmail = () => faker.internet.email();
const genName = () => faker.name.findName();
const genPhoneNumber = () => faker.phone.phoneNumber();

beforeAll(async () => {
  app = await generateNestApplication();

  app.use(cookieParser());

  seederService = app.get(SeederService);
  applicationRepository = app.get(ApplicationRepository);
  notificationRepository = app.get(NotificationRepository);
  userRepository = app.get(UserRepository);

  httpService = app.get<HttpService>(HttpService);

  await app.init();
});

afterAll(async () => {
  await seederService.empty();
  await app.close();
});

describe("POST /applications", () => {
  beforeEach(async () => {
    await seederService.empty();
  });

  test("BAD_REQUEST, DTO가 유효하지 않음(미입력)", async () => {
    // when
    const res = await supertest.agent(app.getHttpServer()).post("/applications");

    // then
    expect(res.body.error).toEqual(HutomHttpException.BAD_REQUEST.error);
  });

  test("DUPLICATED_USER_EMPLOYEE_ID, 사용자 정보가 중복되는 경우(employeeId)", async () => {
    // given
    const givenEmployeeId = genEmployeeId();
    const initData = { employeeId: givenEmployeeId, email: genEmail(), name: genName(), phoneNumber: genPhoneNumber() };
    await applicationRepository.save(initData);

    // when
    const testData = { employeeId: givenEmployeeId, email: genEmail(), name: genName() };
    const res = await supertest(app.getHttpServer()).post("/applications").send(testData);

    // then
    expect(res.body.error).toEqual(HutomHttpException.DUPLICATED_USER_EMPLOYEE_ID.error);
  });

  test("DUPLICATED_USER_EMAIL, 사용자 정보가 중복되는 경우(email)", async () => {
    // given
    const givenEmail = genEmail();
    const initData = { employeeId: genEmployeeId(), email: givenEmail, name: genName(), phoneNumber: genPhoneNumber() };
    await applicationRepository.save(initData);

    // when
    const testData = { employeeId: genEmployeeId(), email: givenEmail, name: genName() };
    const res = await supertest(app.getHttpServer()).post("/applications").send(testData);

    // then
    expect(res.body.error).toEqual(HutomHttpException.DUPLICATED_USER_EMAIL.error);
  });

  test("DUPLICATED_USER_PHONE_NUMBER, 사용자 정보가 중복되는 경우(phoneNumber)", async () => {
    // given
    const givenPhoneNumber = genPhoneNumber();
    const initData = { employeeId: genEmployeeId(), email: genEmail(), name: genName(), phoneNumber: givenPhoneNumber };
    await applicationRepository.save(initData);

    // when
    const testData = { employeeId: genEmployeeId(), email: genEmail(), name: genName(), phoneNumber: givenPhoneNumber };
    const res = await supertest(app.getHttpServer()).post("/applications").send(testData);

    // then
    expect(res.body.error).toEqual(HutomHttpException.DUPLICATED_USER_PHONE_NUMBER.error);
  });

  test("성공 - 가입 신청서 생성, 대표 계정에게 알림 생성", async () => {
    // given
    const admin = await userRepository.save(testAdmins[0]);

    // when
    const testData = { employeeId: genEmployeeId(), email: genEmail(), name: genName(), phoneNumber: genPhoneNumber() };
    const res = await supertest(app.getHttpServer()).post("/applications").send(testData).expect(201);

    // then
    const expectedBody = {
      id: expect.any(Number),
    };
    const expectedData = {
      id: expect.any(Number),
      employeeId: testData.employeeId,
      email: testData.email,
      name: testData.name,
      phoneNumber: testData.phoneNumber,
      createdAt: expect.any(Date),
    };
    const expectedNoti = {
      id: expect.any(Number),
      userId: admin.id,
      category: Category.NEW_APPLICATION,
      message: `The approval request for ${testData.name} (${testData.employeeId}) has been submitted.`,
      read: false,
      createdAt: expect.any(Date),
    };
    const insertResult = await applicationRepository.findOne(res.body.id);
    const createdNoti = await notificationRepository.findOne({ where: { userId: admin.id }, order: { createdAt: "DESC" } });

    expect(res.body).toEqual(expectedBody);
    expect(insertResult).toEqual(expectedData);
    expect(createdNoti).toEqual(expectedNoti);
  });

  test("성공 - 가입 신청서 생성, 대표 계정 없음 (알림 생성하지 않음)", async () => {
    // given

    // when
    const testData = { employeeId: genEmployeeId(), email: genEmail(), name: genName(), phoneNumber: genPhoneNumber() };
    await supertest(app.getHttpServer()).post("/applications").send(testData).expect(201);

    // then
    const createdNoti = await notificationRepository.findOne({ where: { userId: testAdmins[0].id }, order: { createdAt: "DESC" } });
    expect(createdNoti).toBeUndefined();
  });
});

describe("POST /applications/approve", () => {
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

  describe("일반 계정 요청", () => {
    let agent: supertest.SuperAgentTest;

    beforeEach(async () => {
      await seederService.empty();
      await seederService.seedUsers();

      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentUser.employeeId,
        password: currentUser.password,
      });

      const cookies = res.header["set-cookie"];
      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", cookies);
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("FORBIDDEN_RESOURCE, 접근 권한 없음", async () => {
      // given

      // when
      const res = await agent.post("/applications/approve");

      // then
      expect(res.body.error).toEqual(HutomHttpException.FORBIDDEN_RESOURCE.error);
    });
  });

  describe("대표 계정 요청", () => {
    let agent: supertest.SuperAgentTest;

    beforeEach(async () => {
      await seederService.empty();
      await seederService.seedUsers();
      await applicationRepository.delete({});

      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentAdmin.employeeId,
        password: currentAdmin.password,
      });

      const cookies = res.header["set-cookie"];
      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", cookies);
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("BAD_REQUEST, Request Body가 유효하지 않음 (빈 배열)", async () => {
      // given
      // when
      const invalidRequest = { ids: [] };
      const res = await agent.post("/applications/approve").send(invalidRequest);

      // then
      expect(res.body.error).toEqual(HutomHttpException.BAD_REQUEST.error);
    });

    test("NOT_FOUND_DATA, 요청한 가입 신청서가 존재하지 않음", async () => {
      // given
      // when
      const invalidRequest = { ids: [9999] };
      const res = await agent.post("/applications/approve").send(invalidRequest);

      // then
      expect(res.body.error).toEqual(HutomHttpException.NOT_FOUND_DATA.error);
    });

    test("200 response, 모든 Approve 요청이 성공한 경우", async () => {
      // given
      const testDatas = Array(10)
        .fill(null)
        .map(() => {
          return { employeeId: genEmployeeId(), email: genEmail(), name: genName(), phoneNumber: genPhoneNumber() };
        });
      const givenApplications = await applicationRepository.save(testDatas);
      const givenApplicationIds = givenApplications.map((givenApplication) => givenApplication.id);

      // when
      const validIds = givenApplications.map((application) => application.id);
      const validRequest = { ids: validIds };
      const res = await agent.post("/applications/approve").send(validRequest);

      // then
      const expectedMeta = {
        failed: expect.any(Array),
      };
      const expectedBody = {
        ids: expect.any(Array),
        meta: expectedMeta,
      };
      expect(res.body).toEqual(expectedBody);
      expect(res.body.ids.length).toEqual(givenApplicationIds.length);
      expect(postSendMailReqSpy).toBeCalledTimes(givenApplicationIds.length);
    });

    test("200 response, 일부 Approve 요청이 성공한 경우(일부 실패)", async () => {
      // given
      const testDatas = Array(10)
        .fill(null)
        .map(() => {
          return { employeeId: genEmployeeId(), email: genEmail(), name: genName(), phoneNumber: genPhoneNumber() };
        });
      const givenUserDatas = testDatas.map((testData) => {
        return { ...testData, password: faker.random.words(), role: Role.USER };
      });

      // 가입 신청서 및 사용자 테스트 데이터 설정
      const givenApplications = await applicationRepository.save(testDatas);
      await userRepository.save(givenUserDatas);

      // Apporve 실패 케이스 (employeeId, email, phoneNumber 중복)
      const dupEmpIdApps = givenApplications.slice(0, 3);
      const dupEmailApps = givenApplications.slice(3, 6).map((givenApp) => {
        return { ...givenApp, employeeId: genEmployeeId() };
      });
      const dupPNumberApps = givenApplications.slice(6, 9).map((givenApp) => {
        return { ...givenApp, employeeId: genEmployeeId(), email: genEmail() };
      });

      // Approve 성공 케이스
      const approveApps = givenApplications.slice(9, 10).map((givenApp) => {
        return { ...givenApp, employeeId: genEmployeeId(), email: genEmail(), phoneNumber: genPhoneNumber() };
      });

      // 테스트용 가입 신청서 수정
      const updatedGivenApplications = [...dupEmpIdApps, ...dupEmailApps, ...dupPNumberApps, ...approveApps];
      await applicationRepository.save(updatedGivenApplications);

      // when
      const invalidIds = givenApplications.map((application) => application.id);
      const invalidRequest = { ids: invalidIds };
      const res = await agent.post("/applications/approve").send(invalidRequest);

      // then
      const expectedMeta = {
        failed: expect.any(Array),
      };
      const expectedBody = {
        ids: expect.any(Array),
        meta: expectedMeta,
      };
      expect(res.body).toEqual(expectedBody);
      expect(res.body.ids.length).toBeGreaterThan(0);

      expect(res.body.meta.failed[0].errorCode).toEqual(HutomHttpException.DUPLICATED_USER_EMPLOYEE_ID.error);
      expect(res.body.meta.failed[1].errorCode).toEqual(HutomHttpException.DUPLICATED_USER_EMAIL.error);
      expect(res.body.meta.failed[2].errorCode).toEqual(HutomHttpException.DUPLICATED_USER_PHONE_NUMBER.error);

      expect(res.body.meta.failed[0].employeeIds).toEqual(expect.arrayContaining(dupEmpIdApps.map((dupEmpIdApp) => dupEmpIdApp.employeeId)));
      expect(res.body.meta.failed[1].employeeIds).toEqual(expect.arrayContaining(dupEmailApps.map((dupEmailApp) => dupEmailApp.employeeId)));
      expect(res.body.meta.failed[2].employeeIds).toEqual(expect.arrayContaining(dupPNumberApps.map((dupPNumberApp) => dupPNumberApp.employeeId)));

      expect(res.body.ids.length).toEqual(approveApps.length);
      expect(postSendMailReqSpy).toBeCalledTimes(approveApps.length);
    });

    test("200 response, 모든 Approve 요청이 실패한 경우", async () => {
      // given
      const testDatas = Array(10)
        .fill(null)
        .map(() => {
          return { employeeId: genEmployeeId(), email: genEmail(), name: genName(), phoneNumber: genPhoneNumber() };
        });
      const givenApplications = await applicationRepository.save(testDatas);
      const givenUserDatas = testDatas.map((testData) => {
        return { ...testData, password: faker.random.words(), role: Role.USER, id: undefined };
      });
      await userRepository.save(givenUserDatas);

      // when
      const invalidIds = givenApplications.map((application) => application.id);
      const invalidRequest = { ids: invalidIds };
      const res = await agent.post("/applications/approve").send(invalidRequest);

      // then
      const expectedFailed = {
        employeeIds: expect.any(Array),
        errorCode: HutomHttpException.DUPLICATED_USER_EMPLOYEE_ID.error,
      };
      const expectedMeta = {
        failed: expect.any(Array),
      };
      const expectedBody = {
        ids: expect.any(Array),
        meta: expectedMeta,
      };
      expect(res.body).toEqual(expectedBody);
      expect(res.body.ids.length).toEqual(0);

      expect(res.body.meta.failed[0]).toEqual(expectedFailed);
      expect(res.body.meta.failed[0].employeeIds).toEqual(expect.arrayContaining(testDatas.map((testData) => testData.employeeId)));

      expect(postSendMailReqSpy).toBeCalledTimes(0);
    });
  });
});

describe("POST /applications/reject", () => {
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

  describe("일반 계정 요청", () => {
    let agent: supertest.SuperAgentTest;

    beforeEach(async () => {
      await seederService.empty();
      await seederService.seedUsers();

      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentUser.employeeId,
        password: currentUser.password,
      });

      const cookies = res.header["set-cookie"];
      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", cookies);
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("FORBIDDEN_RESOURCE, 접근 권한 없음", async () => {
      // given

      // when
      const res = await agent.post("/applications/reject");

      // then
      expect(res.body.error).toEqual(HutomHttpException.FORBIDDEN_RESOURCE.error);
    });
  });

  describe("대표 계정 요청", () => {
    let agent: supertest.SuperAgentTest;

    beforeEach(async () => {
      await seederService.empty();
      await seederService.seed();

      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentAdmin.employeeId,
        password: currentAdmin.password,
      });

      const cookies = res.header["set-cookie"];
      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", cookies);
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("BAD_REQUEST, Request Body가 유효하지 않음 (빈 배열)", async () => {
      // given
      // when
      const invalidRequest = { ids: [] };
      const res = await agent.post("/applications/reject").send(invalidRequest);

      // then
      expect(res.body.error).toEqual(HutomHttpException.BAD_REQUEST.error);
    });

    test("200 response, 일부 Reject(삭제) 요청이 성공한 경우", async () => {
      // given
      const testDatas = Array(10)
        .fill(null)
        .map(() => {
          return { employeeId: genEmployeeId(), email: genEmail(), name: genName(), phoneNumber: genPhoneNumber() };
        });
      const givenApplications = await applicationRepository.save(testDatas);

      // when
      const validIds = givenApplications.map((application) => application.id);
      const invalidRequest = { ids: [...validIds, 998, 999, 1000] };
      const res = await agent.post("/applications/reject").send(invalidRequest).expect(200);

      // then
      const expectedBody = {
        affected: validIds.length,
      };
      expect(res.body).toEqual(expectedBody);
      expect(postSendMailReqSpy).toBeCalledTimes(1);
    });

    test("200 response, 모든 Reject(삭제) 요청이 성공한 경우", async () => {
      // given
      const testDatas = Array(10)
        .fill(null)
        .map(() => {
          return { employeeId: genEmployeeId(), email: genEmail(), name: genName(), phoneNumber: genPhoneNumber() };
        });
      const givenApplications = await applicationRepository.save(testDatas);

      // when
      const validIds = givenApplications.map((application) => application.id);
      const validRequest = { ids: validIds };
      const res = await agent.post("/applications/reject").send(validRequest).expect(200);

      // then
      const expectedBody = {
        affected: validIds.length,
      };
      expect(res.body).toEqual(expectedBody);
      expect(postSendMailReqSpy).toBeCalledTimes(1);
    });
  });
});
