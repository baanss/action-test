import { of } from "rxjs";
import * as supertest from "supertest";
import { INestApplication } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";

import { OtpRepository } from "@src/otp/repository/otp.repository";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";

import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { generateNestApplication } from "@test/util/test.util";
import { testUsers } from "@root/seeding/seeder/seed/user.seed";
import { testOtps } from "@root/seeding/seeder/seed/otp.seed";

let app: INestApplication;
let httpService: HttpService;
let seederService: SeederService;
let otpRepository: OtpRepository;

beforeAll(async () => {
  app = await generateNestApplication();

  seederService = app.get(SeederService);
  httpService = app.get<HttpService>(HttpService);
  otpRepository = app.get(OtpRepository);

  await app.init();

  await seederService.empty();
  await seederService.seedEncryption();
});

afterAll(async () => {
  await seederService.empty();
  await app.close();
});

describe("POST /otps", () => {
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

  test("BAD_REQUEST, body가 존재하지 않음", async () => {
    // given
    // when
    const res = await supertest.agent(app.getHttpServer()).post("/otps");

    // then
    expect(res.body.error).toBe(HutomHttpException.BAD_REQUEST.error);
  });

  test("BAD_REQUEST, body 타입이 잘못됨", async () => {
    // given
    // when
    const body = { employeeId: 0, email: 0 };
    const res = await supertest.agent(app.getHttpServer()).post("/otps").send(body);

    // then
    expect(res.body.error).toBe(HutomHttpException.BAD_REQUEST.error);
  });

  test("NOT_FOUND_DATA, 요청한 user가 존재하지 않음", async () => {
    // given
    const targetUser = testUsers[0];

    // when
    const body = { employeeId: "invalid", email: targetUser.email };
    const res = await supertest.agent(app.getHttpServer()).post("/otps").send(body);

    // then
    expect(res.body.error).toBe(HutomHttpException.NOT_FOUND_DATA.error);
  });

  test("UNAUTHORIZED, email이 틀림", async () => {
    // given
    const targetUser = testUsers[0];

    // when
    const body = { employeeId: targetUser.employeeId, email: "invalid" };
    const res = await supertest.agent(app.getHttpServer()).post("/otps").send(body);

    // then
    expect(res.body.error).toBe(HutomHttpException.UNAUTHORIZED.error);
  });

  test("성공, 신규 생성", async () => {
    // given
    const targetUser = testUsers[0];
    await otpRepository.delete({ userId: targetUser.id });

    // when
    const body = { employeeId: targetUser.employeeId, email: targetUser.email };
    const res = await supertest.agent(app.getHttpServer()).post("/otps").send(body).expect(201);

    // then
    const expectedResult = { id: expect.any(Number) };
    expect(res.body).toEqual(expectedResult);
    expect(postSendMailReqSpy).toBeCalledTimes(1);
  });

  test("성공, 중복 생성", async () => {
    // given
    const targetUser = testUsers[0];
    const targetOtp = testOtps[0];
    await otpRepository.delete({});
    await otpRepository.save({ userId: targetUser.id, token: targetOtp.token, expiresIn: targetOtp.expiresIn });

    // when
    const body = { employeeId: targetUser.employeeId, email: targetUser.email };
    const res = await supertest.agent(app.getHttpServer()).post("/otps").send(body).expect(201);

    // then
    const expectedResult = { id: expect.any(Number) };
    expect(res.body).toEqual(expectedResult);
    expect(postSendMailReqSpy).toBeCalledTimes(1);
  });
});
