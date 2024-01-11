import * as supertest from "supertest";
import * as cookieParser from "cookie-parser";
import { INestApplication } from "@nestjs/common";

import { generateNestApplication } from "@test/util/test.util";

import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { testAdmins, testUsers } from "@root/seeding/seeder/seed/user.seed";
import { RecipientRepository } from "@src/recipient/repository/recipient.repository";

let app: INestApplication;
let seederService: SeederService;

let recipientRepository: RecipientRepository;

const customOriginHeaderKey = "x-origin";
const userServiceOrigin = "user";

const currentAdmin = testAdmins[0];
const currentUser = testUsers[0];
const expectedRecipient = {
  id: expect.any(Number),
  email: expect.any(String),
  isDefault: expect.any(Boolean),
};

beforeAll(async () => {
  app = await generateNestApplication();
  app.use(cookieParser());

  seederService = app.get(SeederService);

  recipientRepository = app.get(RecipientRepository);

  await app.init();
  await seederService.empty();
  await seederService.seedEncryption();
});

afterAll(async () => {
  await seederService.empty();
  await app.close();
});

describe("GET /recipients", () => {
  test("401 response, 헤더에 유효한 인증 정보가 없음", (done) => {
    // when~then
    supertest.agent(app.getHttpServer()).get("/recipients").expect(401, done);
  });

  describe("대표 계정 요청", () => {
    let agent: supertest.SuperAgentTest;
    let cookies: string[];
    const expectedBody = {
      count: expect.any(Number),
      myEmail: currentAdmin.email,
      data: expect.any(Array),
    };

    beforeAll(async () => {
      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentAdmin.employeeId,
        password: currentAdmin.password,
        isForced: true,
      });

      cookies = res.header["set-cookie"];
      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", cookies);
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("성공 - 본인의 Recipients 조회", async () => {
      // given
      const [myRecipients, expectedCount] = await recipientRepository.findAndCount({ where: { userId: currentAdmin.id } });
      const myRecipientIds = myRecipients.map((recipient) => recipient.id);

      // when
      const res = await agent.get("/recipients");

      // then
      expect(res.body).toEqual(expectedBody);
      expect(res.body.count).toBeGreaterThan(0);
      expect(res.body.count).toEqual(expectedCount);
      expect(res.body.data[0]).toEqual(expectedRecipient);

      const resultIds = res.body.data.map((recipient) => recipient.id);
      expect(myRecipientIds).toEqual(resultIds);
    });
  });

  describe("일반 계정 요청", () => {
    let agent: supertest.SuperAgentTest;
    let cookies: string[];
    const expectedBody = {
      count: expect.any(Number),
      myEmail: currentUser.email,
      data: expect.any(Array),
    };

    beforeAll(async () => {
      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentUser.employeeId,
        password: currentUser.password,
        isForced: true,
      });

      cookies = res.header["set-cookie"];
      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", cookies);
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("성공 - 본인의 Recipients 조회", async () => {
      // given
      const [myRecipients, expectedCount] = await recipientRepository.findAndCount({ where: { userId: currentUser.id } });
      const myRecipientIds = myRecipients.map((recipient) => recipient.id);

      // when
      const res = await agent.get("/recipients");

      // then
      expect(res.body).toEqual(expectedBody);
      expect(res.body.count).toBeGreaterThan(0);
      expect(res.body.count).toEqual(expectedCount);
      expect(res.body.data[0]).toEqual(expectedRecipient);

      const resultIds = res.body.data.map((recipient) => recipient.id);
      expect(myRecipientIds).toEqual(resultIds);
    });
  });
});
