import * as supertest from "supertest";
import { INestApplication } from "@nestjs/common";
import { generateNestApplication } from "@test/util/test.util";
import { CreditHistoryRepository } from "@src/credit-history/repository/credit-history.repository";
import { testCreditHistories } from "@root/seeding/seeder/seed/credit-history.seed";
import { SeederService } from "@root/seeding/seeder/services/seeder.service";

let app: INestApplication;
let seederService: SeederService;
let creditHistoryRepository: CreditHistoryRepository;

beforeAll(async () => {
  app = await generateNestApplication();

  seederService = app.get(SeederService);
  creditHistoryRepository = app.get(CreditHistoryRepository);

  await app.init();

  await seederService.empty();
});

afterAll(async () => {
  await seederService.empty();
  await app.close();
});

describe("GET /server-status", () => {
  test("응답 값 검사", async () => {
    // given
    // when
    const res = await supertest.agent(app.getHttpServer()).get("/server-status");

    // then
    const expected = {
      status: "running",
      name: process.env.SERVER_CODE,
      version: process.env.APP_VERSION,
      redirectUrl: process.env.REDIRECT_URL,
      totalCredit: 0,
    };
    expect(res.body).toEqual(expected);
  });

  test("크레딧 조회 성공", async () => {
    // given
    const totalCredit = 100;
    await creditHistoryRepository.save({ ...testCreditHistories[0], quantity: totalCredit });

    // when
    const res = await supertest.agent(app.getHttpServer()).get("/server-status");

    // then
    const expected = {
      status: "running",
      name: process.env.SERVER_CODE,
      version: process.env.APP_VERSION,
      redirectUrl: process.env.REDIRECT_URL,
      totalCredit,
    };
    expect(res.body).toEqual(expected);
  });
});

describe("GET /custom-exception", () => {
  test("사용자 권한 필요", async () => {
    // given

    // when-then
    await supertest.agent(app.getHttpServer()).get("/custom-exception").expect(401);
  });
});
