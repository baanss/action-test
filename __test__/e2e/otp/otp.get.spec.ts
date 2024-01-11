import * as moment from "moment";
import * as supertest from "supertest";
import { INestApplication } from "@nestjs/common";

import { OtpRepository } from "@src/otp/repository/otp.repository";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";

import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { generateNestApplication } from "@test/util/test.util";
import { testUsers } from "@root/seeding/seeder/seed/user.seed";

let app: INestApplication;
let seederService: SeederService;
let otpRepository: OtpRepository;

beforeAll(async () => {
  app = await generateNestApplication();

  seederService = app.get(SeederService);
  otpRepository = app.get(OtpRepository);

  await app.init();

  await seederService.empty();
  await seederService.seedEncryption();
});

afterAll(async () => {
  await seederService.empty();
  await app.close();
});

describe("GET /otps", () => {
  test("BAD_REQUEST, query 존재하지 않음", async () => {
    // given
    // when
    const res = await supertest.agent(app.getHttpServer()).get("/otps");

    // then
    expect(res.body.error).toBe(HutomHttpException.BAD_REQUEST.error);
  });

  test("NOT_FOUND_DATA, 토큰이 유효하지 않음", async () => {
    // given
    // when
    const query = { token: "invalid" };
    const res = await supertest.agent(app.getHttpServer()).get("/otps").query(query);

    // then
    expect(res.body.error).toBe(HutomHttpException.NOT_FOUND_DATA.error);
  });

  test("NOT_FOUND_DATA, 토큰 유효 기간이 초과됨", async () => {
    // given
    const targetUser = testUsers[0];
    const token = "valid-token";
    await otpRepository.delete({});
    await otpRepository.save({ userId: targetUser.id, token, expiresIn: moment().subtract(1, "h") });

    // when
    const res = await supertest.agent(app.getHttpServer()).get("/otps").query({ token });

    // then
    expect(res.body.error).toBe(HutomHttpException.NOT_FOUND_DATA.error);
  });

  test("성공", async () => {
    // given
    const targetUser = testUsers[0];
    const token = "valid-token";
    await otpRepository.delete({});
    await otpRepository.save({ userId: targetUser.id, token, expiresIn: moment().add(1, "h") });

    // when
    const res = await supertest.agent(app.getHttpServer()).get("/otps").query({ token }).expect(200);

    // then
    const expectedResult = { userId: targetUser.id, employeeId: targetUser.employeeId, name: targetUser.name };
    expect(res.body).toEqual(expectedResult);
  });
});
