import * as supertest from "supertest";
import * as cookieParser from "cookie-parser";
import { INestApplication } from "@nestjs/common";
import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { testAdmins, testUsers } from "@root/seeding/seeder/seed/user.seed";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { CreditCategory } from "@src/common/entity/credit-history.entity";
import { CreditHistoryRepository } from "@src/credit-history/repository/credit-history.repository";
import { testCreditHistories } from "@root/seeding/seeder/seed/credit-history.seed";
import { UserRepository } from "@src/user/repository/user.repository";
import { NotificationRepository } from "@src/notification/repository/notification.repository";
import { Category } from "@src/common/entity/notification.entity";
import { generateNestApplication } from "@test/util/test.util";

let app: INestApplication;
let seederService: SeederService;
let creditHistoryRepository: CreditHistoryRepository;
let userRepository: UserRepository;
let notificationRepository: NotificationRepository;

const customOriginHeaderKey = "x-origin";
const userServiceOrigin = "user";

const currentUser = testUsers[0];
const currentAdmin = testAdmins[0];

beforeAll(async () => {
  app = await generateNestApplication();
  app.use(cookieParser());

  seederService = app.get(SeederService);
  creditHistoryRepository = app.get(CreditHistoryRepository);
  userRepository = app.get(UserRepository);
  notificationRepository = app.get(NotificationRepository);

  await app.init();
});

afterAll(async () => {
  await seederService.empty();
  await app.close();
});

describe("POST /credits/allocate", () => {
  let agent: supertest.SuperAgentTest;

  beforeAll(async () => {
    await seederService.seed();
  });

  test("헤더에 유효한 인증 정보가 없음", async () => {
    // given

    // when-then
    supertest.agent(app.getHttpServer()).post(`/credits/allocate`).expect(401);
  });

  describe("일반 계정 요청", () => {
    beforeAll(async () => {
      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentUser.employeeId,
        password: currentUser.password,
        isForced: true,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", res.get("Set-Cookie"));
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("UNAUTHORIZED_AUTH_TOKEN, 권한 없음", async () => {
      // given

      // when
      const res = await agent.post("/credits/allocate").expect(400);

      // then
      expect(res.body.error).toBe(HutomHttpException.UNAUTHORIZED_AUTH_TOKEN.error);
    });
  });

  describe("대표 계정 요청", () => {
    beforeAll(async () => {
      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentAdmin.employeeId,
        password: currentAdmin.password,
        isForced: true,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", res.get("Set-Cookie"));
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("UNAUTHORIZED_AUTH_TOKEN, 권한 없음", async () => {
      // given

      // when
      const res = await agent.post("/credits/allocate").expect(400);

      // then
      expect(res.body.error).toBe(HutomHttpException.UNAUTHORIZED_AUTH_TOKEN.error);
    });
  });

  describe("h-Space 요청", () => {
    beforeEach(async () => {
      await seederService.empty();
    });

    beforeAll(async () => {
      agent = supertest.agent(app.getHttpServer());

      const authToken = "hcloud-server";
      agent.set("x-auth-token", authToken);
    });

    test("BAD_REQUEST, quantity 타입이 잘못된 경우", async () => {
      // given

      // when
      const body = { quantity: "invalid" };
      const res = await agent.post("/credits/allocate").send(body).expect(400);

      // then
      expect(res.body.error).toBe(HutomHttpException.BAD_REQUEST.error);
    });

    test("BAD_REQUEST, quantity 값이 1 미만인 경우", async () => {
      // given

      // when
      const body = { quantity: -1 };
      const res = await agent.post("/credits/allocate").send(body).expect(400);

      // then
      expect(res.body.error).toBe(HutomHttpException.BAD_REQUEST.error);
    });

    test("BAD_REQUEST, quantity 값이 9999 이상인 경우", async () => {
      // given

      // when
      const body = { quantity: 10000 };
      const res = await agent.post("/credits/allocate").send(body).expect(400);

      // then
      expect(res.body.error).toBe(HutomHttpException.BAD_REQUEST.error);
    });

    test("NOT_FOUND_DATA, 대표 계정이 존재하지 않는 경우", async () => {
      // given

      // when
      const body = { quantity: 100 };
      const res = await agent.post("/credits/allocate").send(body);

      // then
      expect(res.body.error).toBe(HutomHttpException.NOT_FOUND_DATA.error);
    });

    test("LIMIT_EXCEEDED, 크레딧 총량이 0~9999 사이가 아닌 경우 롤백된다.", async () => {
      // given
      const admin = await userRepository.save(testAdmins[0]);
      const prevtotalCredit = 9999;
      await creditHistoryRepository.save([{ ...testCreditHistories[0], userId: admin.id, quantity: prevtotalCredit }]);

      // when
      const body = { quantity: 100 };
      const res = await agent.post("/credits/allocate").send(body);

      // then: 응답 결과
      expect(res.body.error).toBe(HutomHttpException.LIMIT_EXCEEDED.error);

      // then: 크레딧 이력 생성되지 않음
      const ch = await creditHistoryRepository.findOne({ userId: null });
      expect(ch).toBeUndefined();

      // then: 알림 생성되지 않음
      const noti = await notificationRepository.findOne({ userId: admin.id });
      expect(noti).toBeUndefined();
    });

    test("성공 - 기존 크레딧이 없는 경우 신규 할당된다.", async () => {
      // given
      const admin = await userRepository.save(testAdmins[0]);

      // when
      const body = { quantity: 100 };
      const res = await agent.post("/credits/allocate").send(body).expect(200);

      // then: 응답 결과
      const expectedResult = {
        totalCredit: 100,
      };
      expect(res.body).toEqual(expectedResult);

      // then: 크레딧 이력 생성
      const expectedCreditHistory = {
        id: expect.any(Number),
        quantity: body.quantity,
        category: CreditCategory.ALLOCATE,
        huId: null,
        isUserRequest: false,
        status: true,
        userId: null,
        employeeId: "hutom",
        name: "hutom",
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      };
      const ch = await creditHistoryRepository.findLatestOne();
      expect(ch).toEqual(expectedCreditHistory);

      // then: 알림 생성
      const noti = await notificationRepository.findOne({ userId: admin.id });
      const expectedNotification = {
        id: expect.any(Number),
        category: Category.CREDIT_ALLOCATED,
        userId: admin.id,
        message: `${body.quantity} credits allocated.`,
        read: false,
        createdAt: expect.any(Date),
      };
      expect(noti).toEqual(expectedNotification);
    });

    test("성공 - 기존 크레딧이 존재하는 경우 추가 할당된다.", async () => {
      // given
      const admin = await userRepository.save(testAdmins[0]);
      const prevtotalCredit1 = 100;
      const prevtotalCredit2 = -30;
      await creditHistoryRepository.save([
        { ...testCreditHistories[0], quantity: prevtotalCredit1 },
        { ...testCreditHistories[0], quantity: prevtotalCredit2 },
      ]);

      // when
      const body = { quantity: 100 };
      const res = await agent.post("/credits/allocate").send(body).expect(200);

      // then: 응답 결과
      const expectedResult = {
        totalCredit: prevtotalCredit1 + prevtotalCredit2 + body.quantity,
      };
      expect(res.body).toEqual(expectedResult);

      // then: 알림 생성
      const noti = await notificationRepository.findOne({ userId: admin.id });
      const expectedNotification = {
        id: expect.any(Number),
        category: Category.CREDIT_ALLOCATED,
        userId: admin.id,
        message: `${body.quantity} credits allocated.`,
        read: false,
        createdAt: expect.any(Date),
      };
      expect(noti).toEqual(expectedNotification);
    });
  });
});

describe("POST /credits/revoke", () => {
  let agent: supertest.SuperAgentTest;

  beforeAll(async () => {
    await seederService.seed();
  });

  test("헤더에 유효한 인증 정보가 없음", async () => {
    // given

    // when-then
    supertest.agent(app.getHttpServer()).post(`/credits/revoke`).expect(401);
  });

  describe("일반 계정 요청", () => {
    beforeAll(async () => {
      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentUser.employeeId,
        password: currentUser.password,
        isForced: true,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", res.get("Set-Cookie"));
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("UNAUTHORIZED_AUTH_TOKEN, 권한 없음", async () => {
      // given

      // when
      const res = await agent.post("/credits/revoke").expect(400);

      // then
      expect(res.body.error).toBe(HutomHttpException.UNAUTHORIZED_AUTH_TOKEN.error);
    });
  });

  describe("대표 계정 요청", () => {
    beforeAll(async () => {
      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentAdmin.employeeId,
        password: currentAdmin.password,
        isForced: true,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", res.get("Set-Cookie"));
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("UNAUTHORIZED_AUTH_TOKEN, 권한 없음", async () => {
      // given

      // when
      const res = await agent.post("/credits/revoke").expect(400);

      // then
      expect(res.body.error).toBe(HutomHttpException.UNAUTHORIZED_AUTH_TOKEN.error);
    });
  });

  describe("h-Space 요청", () => {
    beforeEach(async () => {
      await seederService.empty();
    });

    beforeAll(async () => {
      agent = supertest.agent(app.getHttpServer());

      const authToken = "hcloud-server";
      agent.set("x-auth-token", authToken);
    });

    test("BAD_REQUEST, quantity 타입이 잘못된 경우", async () => {
      // given

      // when
      const body = { quantity: "invalid" };
      const res = await agent.post("/credits/revoke").send(body).expect(400);

      // then
      expect(res.body.error).toBe(HutomHttpException.BAD_REQUEST.error);
    });

    test("BAD_REQUEST, quantity 값이 1 미만인 경우", async () => {
      // given

      // when
      const body = { quantity: -1 };
      const res = await agent.post("/credits/revoke").send(body).expect(400);

      // then
      expect(res.body.error).toBe(HutomHttpException.BAD_REQUEST.error);
    });

    test("BAD_REQUEST, quantity 값이 9999 이상인 경우", async () => {
      // given

      // when
      const body = { quantity: 10000 };
      const res = await agent.post("/credits/revoke").send(body).expect(400);

      // then
      expect(res.body.error).toBe(HutomHttpException.BAD_REQUEST.error);
    });

    test("NOT_FOUND_DATA, 대표 계정이 존재하지 않는 경우", async () => {
      // given

      // when
      const body = { quantity: 100 };
      const res = await agent.post("/credits/revoke").send(body);

      // then
      expect(res.body.error).toBe(HutomHttpException.NOT_FOUND_DATA.error);
    });

    test("LIMIT_EXCEEDED, 크레딧 총량이 0~9999 사이가 아닌 경우 롤백된다.", async () => {
      // given
      const admin = await userRepository.save(testAdmins[0]);
      const prevtotalCredit = 10;
      await creditHistoryRepository.save([{ ...testCreditHistories[0], userId: admin.id, quantity: prevtotalCredit }]);

      // when
      const body = { quantity: 100 };
      const res = await agent.post("/credits/revoke").send(body);

      // then: 응답 결과
      expect(res.body.error).toBe(HutomHttpException.LIMIT_EXCEEDED.error);

      // then: 크레딧 이력 생성되지 않음
      const ch = await creditHistoryRepository.findOne({ userId: null });
      expect(ch).toBeUndefined();

      // then: 알림 생성되지 않음
      const noti = await notificationRepository.findOne({ userId: admin.id });
      expect(noti).toBeUndefined();
    });

    test("LIMIT_EXCEEDED, 기존 크레딧이 없는 경우 회수되지 않는다.", async () => {
      // given
      await userRepository.save(testAdmins[0]);

      // when
      const body = { quantity: 100 };
      const res = await agent.post("/credits/revoke").send(body);

      // then: 응답 결과
      expect(res.body.error).toBe(HutomHttpException.LIMIT_EXCEEDED.error);
    });

    test("성공 - 기존 크레딧이 존재하는 경우 추가 회수된다.", async () => {
      // given
      const admin = await userRepository.save(testAdmins[0]);
      const prevtotalCredit1 = 100;
      const prevtotalCredit2 = -30;
      await creditHistoryRepository.save([
        { ...testCreditHistories[0], quantity: prevtotalCredit1 },
        { ...testCreditHistories[0], quantity: prevtotalCredit2 },
      ]);

      // when
      const body = { quantity: 10 };
      const res = await agent.post("/credits/revoke").send(body).expect(200);

      // then: 응답 결과
      const expectedResult = {
        totalCredit: prevtotalCredit1 + prevtotalCredit2 - body.quantity,
      };
      expect(res.body).toEqual(expectedResult);

      // then: 알림 생성
      const noti = await notificationRepository.findOne({ userId: admin.id });
      const expectedNotification = {
        id: expect.any(Number),
        category: Category.CREDIT_REVOKED,
        userId: admin.id,
        message: `${body.quantity} credits revoked.`,
        read: false,
        createdAt: expect.any(Date),
      };
      expect(noti).toEqual(expectedNotification);
    });
  });
});
