import { AxiosResponse } from "axios";
import { of } from "rxjs";
import * as moment from "moment";
import * as supertest from "supertest";
import * as cookieParser from "cookie-parser";
import { HttpService } from "@nestjs/axios";
import { INestApplication } from "@nestjs/common";

import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { generateNestApplication } from "@test/util/test.util";
import { testAdmins, testUsers } from "@root/seeding/seeder/seed/user.seed";
import { FindStudyDto } from "@src/qr/dto";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";

let app: INestApplication;
let seederService: SeederService;
let httpService: HttpService;

const currentUser = testUsers[0];
const currentAdmin = testAdmins[0];
const customOriginHeaderKey = "x-origin";
const userServiceOrigin = "user";

beforeAll(async () => {
  app = await generateNestApplication();
  httpService = app.get<HttpService>(HttpService);

  app.use(cookieParser());

  seederService = app.get(SeederService);

  await seederService.empty();
  await seederService.seedEncryption();

  await app.init();
});

afterAll(async () => {
  await app.close();
});

describe("GET /qr/studies", () => {
  let agent: supertest.SuperAgentTest;
  let mockAxiosResponse: AxiosResponse;

  const searchPatientId = "patient-id";
  const studyResponse: FindStudyDto = {
    patientId: searchPatientId,
    specificCharacterSet: "ISO_IR 100",
    studyInstanceUID: "1.2.3",
    studyDate: null,
    studyDescription: null,
    patientName: null,
    patientSex: null,
    patientAge: null,
    studyId: null,
    modality: null,
    numberOfStudyRelatedSeries: null,
    numberOfStudyRelatedInstances: null,
  };

  test("401 response, 헤더에 유효한 인증 정보가 없음", (done) => {
    // given
    const rusCaseId = "1";

    // when-then
    supertest.agent(app.getHttpServer()).patch(`/rus-cases/${rusCaseId}`).expect(401, done);
  });

  describe("일반 계정 요청", () => {
    beforeEach(async () => {
      const res = await supertest(app.getHttpServer())
        .post("/auth/user/login")
        .send({
          employeeId: currentUser.employeeId,
          password: currentUser.password,
          isForced: true,
        })
        .expect(200);

      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", res.get("Set-Cookie"));
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("BAD_REQUEST, 쿼리 필수값이 포함되지 않음", async () => {
      // given

      // when
      const res = await agent.get("/qr/studies");

      // then
      expect(res.body.error).toBe(HutomHttpException.BAD_REQUEST.error);
    });

    test("UNEXPECTED_ERROR_DICOM_SERVER, 다이콤서버 에러", async () => {
      // given
      jest.clearAllMocks();
      mockAxiosResponse = {
        data: {
          message: "스터디 검색 실패",
          error_code: "BAD_REQUEST",
        },
        status: 400,
        statusText: "Bad Request",
        headers: {},
        config: {},
      };
      jest.spyOn(httpService, "get").mockImplementationOnce(() => of(mockAxiosResponse));

      // when
      const query = { patientId: searchPatientId, today: moment().toISOString() };
      const res = await agent.get("/qr/studies").query(query);

      // then
      expect(res.body.error).toBe(HutomHttpException.UNEXPECTED_ERROR_DICOM_SERVER.error);
    });

    test("성공", async () => {
      // given
      mockAxiosResponse = {
        data: {
          message: "스터디 검색 성공",
          studies: [studyResponse],
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config: {},
      };
      jest.spyOn(httpService, "get").mockImplementationOnce(() => of(mockAxiosResponse));

      // when
      const query = { patientId: searchPatientId, today: moment().toISOString() };
      const res = await agent.get("/qr/studies").query(query);

      // then
      const expectedResult = {
        message: mockAxiosResponse.data.message,
        data: expect.any(Array),
        count: mockAxiosResponse.data.studies.length,
      };
      expect(res.body).toEqual(expectedResult);
      const expectedStudy = {
        studyDate: "1900-01-01",
        patientId: studyResponse.patientId,
        patientName: studyResponse.patientName,
        studyInstanceUID: studyResponse.studyInstanceUID,
        modality: studyResponse.modality,
        specificCharacterSet: studyResponse.specificCharacterSet,
        studyDescription: studyResponse.studyDescription,
        sex: studyResponse.patientSex,
        age: studyResponse.patientAge,
        studyId: studyResponse.studyId,
        seriesCount: studyResponse.numberOfStudyRelatedSeries,
        instancesCount: studyResponse.numberOfStudyRelatedInstances,
      };
      expect(res.body.data[0]).toMatchObject(expectedStudy);
    });
  });

  describe("대표 계정 요청", () => {
    beforeEach(async () => {
      const res = await supertest(app.getHttpServer())
        .post("/auth/user/login")
        .send({
          employeeId: currentAdmin.employeeId,
          password: currentAdmin.password,
          isForced: true,
        })
        .expect(200);

      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", res.get("Set-Cookie"));
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("성공", async () => {
      // given
      mockAxiosResponse = {
        data: {
          message: "스터디 검색 성공",
          studies: [studyResponse],
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config: {},
      };
      jest.spyOn(httpService, "get").mockImplementationOnce(() => of(mockAxiosResponse));

      // when
      const query = { patientId: searchPatientId, today: moment().toISOString() };
      const res = await agent.get("/qr/studies").query(query);

      // then
      const expectedResult = {
        message: mockAxiosResponse.data.message,
        data: expect.any(Array),
        count: mockAxiosResponse.data.studies.length,
      };
      expect(res.body).toEqual(expectedResult);
      const expectedStudy = {
        studyDate: "1900-01-01",
        patientId: studyResponse.patientId,
        patientName: studyResponse.patientName,
        studyInstanceUID: studyResponse.studyInstanceUID,
        modality: studyResponse.modality,
        specificCharacterSet: studyResponse.specificCharacterSet,
        studyDescription: studyResponse.studyDescription,
        sex: studyResponse.patientSex,
        age: studyResponse.patientAge,
        studyId: studyResponse.studyId,
        seriesCount: studyResponse.numberOfStudyRelatedSeries,
        instancesCount: studyResponse.numberOfStudyRelatedInstances,
      };
      expect(res.body.data[0]).toMatchObject(expectedStudy);
    });
  });
});
