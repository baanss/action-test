import * as supertest from "supertest";
import * as cookieParser from "cookie-parser";
import { INestApplication } from "@nestjs/common";
import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { generateNestApplication } from "@test/util/test.util";
import { CreditHistoryRepository } from "@src/credit-history/repository/credit-history.repository";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { testAdmins, testUsers } from "@root/seeding/seeder/seed/user.seed";
import { testCreditHistories } from "@root/seeding/seeder/seed/credit-history.seed";

let app: INestApplication;
let seederService: SeederService;
let creditHistoryRepository: CreditHistoryRepository;

const customOriginHeaderKey = "x-origin";
const userServiceOrigin = "user";

const currentUser = testUsers[0];
const currentAdmin = testAdmins[0];

beforeAll(async () => {
  app = await generateNestApplication();
  app.use(cookieParser());

  seederService = app.get(SeederService);
  creditHistoryRepository = app.get(CreditHistoryRepository);

  await app.init();

  await seederService.seed();
});

afterAll(async () => {
  await seederService.empty();
  await app.close();
});

describe("GET /credits", () => {
  test("헤더에 유효한 인증 정보가 없음", async () => {
    // given
    // when
    const res = await supertest.agent(app.getHttpServer()).get(`/credits`);

    // then
    expect(res.body.error).toBe(HutomHttpException.UNAUTHORIZED_AUTH_TOKEN.error);
  });

  describe("일반 계정 요청", () => {
    let agent: supertest.SuperAgentTest;
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
      const res = await agent.get("/credits");

      // then
      expect(res.body.error).toBe(HutomHttpException.UNAUTHORIZED_AUTH_TOKEN.error);
    });
  });

  describe("대표 계정 요청", () => {
    let agent: supertest.SuperAgentTest;
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
      const res = await agent.get("/credits");

      // then
      expect(res.body.error).toBe(HutomHttpException.UNAUTHORIZED_AUTH_TOKEN.error);
    });
  });

  describe("h-Space 요청", () => {
    let agent: supertest.SuperAgentTest;
    beforeEach(async () => {
      await seederService.empty();
    });

    beforeAll(async () => {
      agent = supertest.agent(app.getHttpServer());

      const authToken = "hcloud-server";
      agent.set("x-auth-token", authToken);
    });

    test("성공 - 크레딧 이력이 없을 때, 0 조회됨", async () => {
      // given

      // when
      const res = await agent.get("/credits");

      // then
      expect(res.body.totalCredit).toBe(0);
    });

    test("성공 - 크레딧 이력이 있을 때, 총 크레딧 수 조회됨", async () => {
      // given
      const prevCreditHistories = [
        { ...testCreditHistories[0], quantity: 100 },
        { ...testCreditHistories[0], quantity: -10 },
      ];
      const totalCredit = prevCreditHistories.reduce((acc, ch) => {
        return (acc += ch.quantity);
      }, 0);
      await creditHistoryRepository.save(prevCreditHistories);

      // when
      const res = await agent.get("/credits");

      // then
      expect(res.body.totalCredit).toBe(totalCredit);
    });
  });
});
