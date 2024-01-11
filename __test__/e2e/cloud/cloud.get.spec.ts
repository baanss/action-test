import * as supertest from "supertest";
import { INestApplication } from "@nestjs/common";
import { generateNestApplication } from "@test/util/test.util";

let app: INestApplication;

beforeAll(async () => {
  app = await generateNestApplication();

  await app.init();
});

afterAll(async () => {
  await app.close();
});

describe("GET /cloud/echo", () => {
  test("200 response", async () => {
    // given

    // when-then
    await supertest(app.getHttpServer()).get("/cloud/echo").expect(200);
  });
});
