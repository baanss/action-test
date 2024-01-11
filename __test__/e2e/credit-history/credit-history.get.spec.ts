import * as moment from "moment";
import * as supertest from "supertest";
import * as cookieParser from "cookie-parser";

import { INestApplication } from "@nestjs/common";

import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { testAdmins, testUsers } from "@root/seeding/seeder/seed/user.seed";
import { generateNestApplication, expectNullableString } from "@test/util/test.util";

import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { SessionRepository } from "@src/auth/repository/session.repository";
import { CreditHistoryRepository } from "@src/credit-history/repository/credit-history.repository";
import { BalanceViewRepository } from "@src/credit-history/repository/balance-view.repository";
import { MyCreditHistoryRequestedBy } from "@src/credit-history/dto/out/my-credit-history-balance.view.dto";
import { CreditHistoryCategoryQuery } from "@src/credit-history/dto/in/get-many-credit-history-query.request.dto";
import { CreditCategory } from "@src/common/entity/credit-history.entity";
import { testCreditHistories } from "@root/seeding/seeder/seed/credit-history.seed";

let app: INestApplication;
let seederService: SeederService;
let sessionRepository: SessionRepository;
let creditHistoryRepository: CreditHistoryRepository;
let balanceViewRepository: BalanceViewRepository;

const customOriginHeaderKey = "x-origin";
const userServiceOrigin = "user";

beforeAll(async () => {
  app = await generateNestApplication();
  app.use(cookieParser());

  seederService = app.get(SeederService);
  sessionRepository = app.get(SessionRepository);
  creditHistoryRepository = app.get(CreditHistoryRepository);
  balanceViewRepository = app.get(BalanceViewRepository);

  await app.init();
  await seederService.empty();
  await seederService.seedEncryption();
});

afterAll(async () => {
  await seederService.empty();
  await app.close();
});

describe("GET /credit-histories", () => {
  test("401 response, x-origin 헤더 없음", (done: jest.DoneCallback) => {
    // given

    // when
    supertest(app.getHttpServer()).get("/credit-histories").expect(401, done); // then
  });

  test("401 response, Cookie 헤더에 토큰 없거나 잘못된 토큰 설정됨", async () => {
    // given

    // when
    await supertest(app.getHttpServer()).get("/credit-histories").set(customOriginHeaderKey, userServiceOrigin).expect(401); // then

    // given
    const token = "invalid";

    // when
    await supertest(app.getHttpServer()).get("/credit-histories").set(customOriginHeaderKey, userServiceOrigin).set("Cookie", token).expect(401); // then
  });

  describe("대표 계정으로 로그인 후,", () => {
    let agent: supertest.SuperAgentTest;
    let cookies: string[];

    const currentAdmin = testAdmins[0];
    const expectedCreditHistory = {
      id: expect.any(Number),
      employeeId: expect.any(String),
      name: expect.any(String),
      category: expect.any(String),
      quantity: expect.any(Number),
      balance: expect.any(Number),
      createdAt: expect.any(String),
      isRegisteredUser: expect.any(Boolean),
      // NOTE: expectedCreditHistory.huId
      // huId: string | null
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

    test("200 response, startDate 검색 - endDate 현재를 기준으로 검색한다.", async () => {
      // given

      // when
      const searchQuery = { startDate: moment().subtract(1, "year").toISOString() };
      const res = await agent.get("/credit-histories").query(searchQuery).expect(200);

      // then
      expect(res.body.count).toBeGreaterThan(0);
      res.body.data.forEach((creditHistoryBalanceView) => {
        expect(moment(creditHistoryBalanceView.createdAt).toDate().getTime()).toBeGreaterThanOrEqual(moment(searchQuery.startDate).toDate().getTime());
        expect(moment(creditHistoryBalanceView.createdAt).toDate().getTime()).toBeLessThanOrEqual(moment().toDate().getTime());
      });
    });

    test("200 response, endDate 검색 - startDate 1년 전을 기준으로 검색한다.", async () => {
      // given

      // when
      const searchQuery = { endDate: moment().subtract(1, "month").toISOString() };
      const res = await agent.get("/credit-histories").query(searchQuery).expect(200);

      // then
      expect(res.body.count).toBeGreaterThan(0);
      res.body.data.forEach((creditHistoryBalanceView) => {
        expect(moment(creditHistoryBalanceView.createdAt).toDate().getTime()).toBeGreaterThanOrEqual(
          moment(searchQuery.endDate).subtract(1, "year").toDate().getTime(),
        );
        expect(moment(creditHistoryBalanceView.createdAt).toDate().getTime()).toBeLessThanOrEqual(moment(searchQuery.endDate).toDate().getTime());
      });
    });

    test("200 response, 크레딧 내역 검색 조회 성공 - 삭제된 유저 설정값 조회 성공", async () => {
      // given : creditHistory Entity에 연결된 userId 를 null값으로 Update
      const targetUser = testUsers[0];
      await creditHistoryRepository.update({ userId: targetUser.id }, { userId: null });

      // when
      const res = await agent.get("/credit-histories").expect(200);
      const resData = res.body.data;

      // then
      expect(res.body.count).toBeGreaterThan(0);
      resData.forEach((creditHistoryBalanceView) => {
        // 응답 구조 검증
        const { huId, ...rest } = creditHistoryBalanceView;
        expect(rest).toEqual(expectedCreditHistory);
        expect(rest.quantity).toBeGreaterThanOrEqual(1);
        expectNullableString(huId);

        // 삭제된 유저의 isRegisteredUser: false 검증
        if (creditHistoryBalanceView.employeeId === targetUser.employeeId) {
          expect(creditHistoryBalanceView.isRegisteredUser).toBeFalsy();
        }
      });
    });

    test("200 response, 크레딧 내역 검색 조회 성공 - employeeId, name, 복수 카테고리 검색", async () => {
      // given

      // when
      const searchQuery = { employeeId: "1", name: "k", categories: "rus-use,rus-cancel" };
      const res = await agent.get("/credit-histories").query(searchQuery);

      // then
      const expected = {
        data: expect.any(Array),
        count: expect.any(Number),
      };

      expect(res.body).toEqual(expected);
      res.body.data.forEach((creditHistoryBalanceView) => {
        const { huId, ...rest } = creditHistoryBalanceView;
        const { employeeId, name, category } = creditHistoryBalanceView;

        // 응답 구조 검증
        expect(rest).toEqual(expectedCreditHistory);
        expect(rest.quantity).toBeGreaterThanOrEqual(1);
        expectNullableString(huId);

        // 검색 결과 일치 검증
        expect(employeeId.toLowerCase()).toContain(searchQuery.employeeId.toLowerCase());
        expect(name.toLowerCase()).toContain(searchQuery.name.toLowerCase());
        expect(searchQuery.categories).toContain(category);
      });
    });

    test('200 response, categories=["all"] 검색 성공', async () => {
      // given
      const validCategoryValues = Object.values(CreditHistoryCategoryQuery);

      // when
      const searchQuery = { categories: CreditHistoryCategoryQuery.ALL };
      const res = await agent.get("/credit-histories").query(searchQuery).expect(200);
      const resData = res.body.data;

      // then
      expect(res.body.count).toBeGreaterThan(0);
      resData.forEach((creditHistoryBalanceView) => {
        expect(validCategoryValues).toContain(creditHistoryBalanceView.category);
      });
    });

    test("200 response, 빈 값의 categories 검색 성공 (검색 결과 없음)", async () => {
      // given

      // when
      const searchQuery = { categories: "" };
      const res = await agent.get("/credit-histories").query(searchQuery).expect(200);

      // then
      expect(res.body.count).toEqual(0);
    });

    test("200 response, 특정 조건(limit = -1) 전체 검색 성공", async () => {
      // given
      const [, countOfValidHistories] = await creditHistoryRepository.findAndCount({ where: { status: true } });

      // when
      const searchQuery = { limit: "-1" };
      const res = await agent.get("/credit-histories").query(searchQuery).expect(200);

      // then
      expect(res.body.count).toEqual(countOfValidHistories);
    });

    test("200 response, 페이지네이션 적용하여 조회 성공", async () => {
      // given
      const [, countOfValidHistories] = await creditHistoryRepository.findAndCount({ where: { status: true } });

      // when
      const searchQuery = { page: 2, limit: 2 };
      const res = await agent.get("/credit-histories").query(searchQuery).expect(200);

      // then
      expect(res.body.count).toEqual(countOfValidHistories);
      expect(res.body.data.length).toEqual(searchQuery.limit);
    });

    test("200 response, h-Space 요청인 경우, isRegisteredUser 값 true", async () => {
      // given
      const testHistory = {
        userId: null,
        employeeId: "hutom",
        name: "hutom",
        category: CreditCategory.ALLOCATE,
        quantity: 100,
        status: true,
        isUserRequest: false,
      };
      await creditHistoryRepository.save(testHistory);
      const givenHistory = await creditHistoryRepository.findOne({ order: { createdAt: "DESC" } });

      // when
      const searchQuery = { categories: CreditHistoryCategoryQuery.ALLOCATE };
      const res = await agent.get("/credit-histories").query(searchQuery).expect(200);

      // then
      const expected = {
        id: givenHistory.id,
        employeeId: givenHistory.employeeId,
        name: givenHistory.name,
        category: givenHistory.category,
        quantity: Math.abs(givenHistory.quantity),
        balance: expect.any(Number),
        createdAt: givenHistory.createdAt.toISOString(),
        isRegisteredUser: true,
        huId: null,
      };
      expect(res.body.data[0]).toEqual(expected);
    });

    test("200 response, (isUserRequest=true, userId !== null) isRegisteredUser 값 true", async () => {
      // given
      const givenData = { id: undefined, createdAt: undefined, isUserRequest: true, userId: testUsers[0].id };
      await creditHistoryRepository.save({ ...testCreditHistories[0], ...givenData });

      // when
      const res = await agent.get("/credit-histories").expect(200);

      // then
      expect(res.body.data[0].isRegisteredUser).toBeTruthy();
    });

    test("200 response, (isUserRequest=true, userId === null) isRegisteredUser 값 false", async () => {
      // given
      const givenData = { id: undefined, createdAt: undefined, isUserRequest: true, userId: null };
      await creditHistoryRepository.save({ ...testCreditHistories[0], ...givenData });

      // when
      const res = await agent.get("/credit-histories").expect(200);

      // then
      expect(res.body.data[0].isRegisteredUser).toBeFalsy();
    });
  });
});

describe("GET /credit-histories/me", () => {
  test("UNAUTHORIZED_ORIGIN, x-origin 헤더 없음", async () => {
    // given

    // when
    const res = await supertest(app.getHttpServer()).get("/credit-histories/me");

    // then
    expect(res.body.error).toBe(HutomHttpException.UNAUTHORIZED_ORIGIN.error);
  });

  test("UNAUTHORIZED, Cookie 헤더에 토큰 없음", async () => {
    // given

    // when
    const res = await supertest(app.getHttpServer()).get("/credit-histories/me").set(customOriginHeaderKey, userServiceOrigin);

    //  then
    expect(res.body.error).toBe(HutomHttpException.UNAUTHORIZED.error);
  });

  test("UNAUTHORIZED, Cookie 헤더에 잘못된 토큰 설정됨", async () => {
    // given
    const token = "invalid";

    // when
    const res = await supertest(app.getHttpServer()).get("/credit-histories/me").set(customOriginHeaderKey, userServiceOrigin).set("Cookie", token);

    //  then
    expect(res.body.error).toBe(HutomHttpException.UNAUTHORIZED.error);
  });

  describe("일반 사용자로 로그인 후", () => {
    let agent: supertest.SuperAgentTest;
    let cookies: string[];
    const currentUser = testUsers[0];

    const expectedMyCreditHistory = {
      id: expect.any(Number),
      category: expect.any(String),
      quantity: expect.any(Number),
      balance: expect.any(Number),
      requestedBy: expect.any(String),
      createdAt: expect.any(String),
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

    test("200 response, 응답 구조 검증", async () => {
      // given
      const creditHistoryBalanceView = await balanceViewRepository.find();

      // when
      const res = await agent.get("/credit-histories/me");

      // then
      const expected = {
        data: expect.any(Array),
        count: expect.any(Number),
      };
      expect(res.body).toEqual(expected);
      expect(res.body.count).toBeGreaterThan(0);
      res.body.data.forEach((myBalanceView) => {
        // 구조 검증
        expect(myBalanceView).toEqual(expectedMyCreditHistory);
        expect(myBalanceView.quantity).toBeGreaterThanOrEqual(1);

        // MASKING 검증
        const matchedCreditHistory = creditHistoryBalanceView.find((balanceView) => balanceView.id === myBalanceView.id);
        if (matchedCreditHistory) {
          if (matchedCreditHistory.employeeId === currentUser.employeeId) {
            expect(myBalanceView.requestedBy).toBe(MyCreditHistoryRequestedBy.ME);
          } else if (matchedCreditHistory.employeeId === "hutom") {
            expect(myBalanceView.requestedBy).toBe(MyCreditHistoryRequestedBy.HUTOM);
          } else {
            expect(myBalanceView.requestedBy).toBe(MyCreditHistoryRequestedBy.OTHERS);
          }
        }
      });
    });

    test("200 response, 특정 조건(limit = -1) 전체 검색 성공", async () => {
      // given
      const [, countOfValidHistories] = await creditHistoryRepository.findAndCount({ where: { status: true } });

      // when
      const searchQuery = { limit: "-1" };
      const res = await agent.get("/credit-histories/me").query(searchQuery);

      // then
      expect(res.body.count).toEqual(countOfValidHistories);
    });

    test("200 response, 페이지네이션 적용하여 조회 성공", async () => {
      // given
      const [, countOfValidHistories] = await creditHistoryRepository.findAndCount({ where: { status: true } });

      // when
      const searchQuery = { page: 2, limit: 2 };
      const res = await agent.get("/credit-histories/me").query(searchQuery);

      // then
      expect(res.body.count).toEqual(countOfValidHistories);
      expect(res.body.data.length).toEqual(searchQuery.limit);
    });
  });

  describe("대표 계정으로 로그인 후", () => {
    let agent: supertest.SuperAgentTest;
    let cookies: string[];
    const currentUser = testAdmins[0];

    const expectedMyCreditHistory = {
      id: expect.any(Number),
      category: expect.any(String),
      quantity: expect.any(Number),
      balance: expect.any(Number),
      requestedBy: expect.any(String),
      createdAt: expect.any(String),
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

    test("200 response, 응답 구조 검증", async () => {
      // given
      const creditHistoryBalanceView = await balanceViewRepository.find();

      // when
      const res = await agent.get("/credit-histories/me");

      // then
      const expected = {
        data: expect.any(Array),
        count: expect.any(Number),
      };
      expect(res.body).toEqual(expected);
      expect(res.body.count).toBeGreaterThan(0);
      res.body.data.forEach((myBalanceView) => {
        // 구조 검증
        expect(myBalanceView).toEqual(expectedMyCreditHistory);
        expect(myBalanceView.quantity).toBeGreaterThanOrEqual(1);

        // MASKING 검증
        const matchedCreditHistory = creditHistoryBalanceView.find((balanceView) => balanceView.id === myBalanceView.id);
        if (matchedCreditHistory) {
          if (matchedCreditHistory.employeeId === currentUser.employeeId) {
            expect(myBalanceView.requestedBy).toBe(MyCreditHistoryRequestedBy.ME);
          } else if (matchedCreditHistory.employeeId === "hutom") {
            expect(myBalanceView.requestedBy).toBe(MyCreditHistoryRequestedBy.HUTOM);
          } else {
            expect(myBalanceView.requestedBy).toBe(MyCreditHistoryRequestedBy.OTHERS);
          }
        }
      });
    });

    test("200 response, 특정 조건(limit = -1) 전체 검색 성공", async () => {
      // given
      const [, countOfValidHistories] = await creditHistoryRepository.findAndCount({ where: { status: true } });

      // when
      const searchQuery = { limit: "-1" };
      const res = await agent.get("/credit-histories/me").query(searchQuery);

      // then
      expect(res.body.count).toEqual(countOfValidHistories);
    });

    test("200 response, 페이지네이션 적용하여 조회 성공", async () => {
      // given
      const [, countOfValidHistories] = await creditHistoryRepository.findAndCount({ where: { status: true } });

      // when
      const searchQuery = { page: 2, limit: 2 };
      const res = await agent.get("/credit-histories/me").query(searchQuery);

      // then
      expect(res.body.count).toEqual(countOfValidHistories);
      expect(res.body.data.length).toEqual(searchQuery.limit);
    });
  });
});
