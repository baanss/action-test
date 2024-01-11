import * as moment from "moment";
import { of } from "rxjs";
import { AxiosResponse } from "axios";
import { HttpService } from "@nestjs/axios";
import { INestApplication } from "@nestjs/common";

import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { generateNestApplication } from "@test/util/test.util";

import { QrService } from "@src/qr/service/qr.service";
import { FindStudyDto } from "@src/qr/dto";
import { AeMode, UploadJobStatus } from "@src/common/constant/enum.constant";
import { UploadJobRepository } from "@src/upload-job/repository/upload-job.repository";
import { testUploadJobs } from "@root/seeding/seeder/seed/upload-job.seed";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { LoggerService } from "@src/logger/logger.service";

let app: INestApplication;
let seederService: SeederService;
let loggerService: LoggerService;
let qrService: QrService;
let httpService: HttpService;
let uploadJobRepository: UploadJobRepository;

beforeAll(async () => {
  app = await generateNestApplication();
  httpService = app.get<HttpService>(HttpService);
  loggerService = app.get(LoggerService);

  seederService = app.get(SeederService);
  qrService = app.get(QrService);
  uploadJobRepository = app.get(UploadJobRepository);

  await app.init();
});

afterAll(async () => {
  await seederService.empty();
  await app.close();
});

describe("QrService", () => {
  let mockAxiosResponse: AxiosResponse;

  describe("requestStudyFind", () => {
    const studyResponse: FindStudyDto = {
      patientId: "검색 ID",
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

    beforeEach(async () => {
      jest.restoreAllMocks();
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
    });

    afterEach(async () => {
      jest.clearAllMocks();
    });

    test("성공 - studyDate 기간 내 존재하지 않음", async () => {
      // given

      // when
      const result = await qrService.requestStudyFind({ patientId: studyResponse.patientId, today: new Date().toISOString(), period: "7" });

      // then
      expect(result.message).toBe(mockAxiosResponse.data.message);
      expect(result.studies).toHaveLength(0);
    });

    test("성공 - studyDate 기간 내 존재함", async () => {
      // given

      // when
      const result = await qrService.requestStudyFind({ patientId: studyResponse.patientId, today: new Date().toISOString(), period: null });

      // then
      expect(result.message).toBe(mockAxiosResponse.data.message);
      const expectedStudy = {
        studyDate: studyResponse.studyDate,
        patientId: studyResponse.patientId,
        patientName: studyResponse.patientName,
        studyInstanceUID: studyResponse.studyInstanceUID,
        modality: studyResponse.modality,
        specificCharacterSet: studyResponse.specificCharacterSet,
        studyDescription: studyResponse.studyDescription,
        patientSex: studyResponse.patientSex,
        patientAge: studyResponse.patientAge,
        studyId: studyResponse.studyId,
        numberOfStudyRelatedSeries: studyResponse.numberOfStudyRelatedSeries,
        numberOfStudyRelatedInstances: studyResponse.numberOfStudyRelatedInstances,
      };
      expect(result.studies[0]).toMatchObject(expectedStudy);
    });
  });

  describe("requestStudyMove", () => {
    let accessLoggerSpy: jest.SpyInstance;
    const studyResponse = {
      status: UploadJobStatus.DONE,
      message: "success",
    };

    beforeEach(async () => {
      await seederService.empty();

      jest.restoreAllMocks();
      mockAxiosResponse = {
        data: {
          message: "성공",
          studies: [studyResponse],
        },
        status: 200,
        statusText: "OK",
        headers: {},
        config: {},
      };
      jest.spyOn(httpService, "post").mockImplementationOnce(() => of(mockAxiosResponse));

      accessLoggerSpy = jest.spyOn(loggerService, "access");
    });

    afterEach(async () => {
      jest.clearAllMocks();
    });

    test("요청 성공 시, 상태가 DONE 업데이트됨", async () => {
      // given
      const uploadJob = await uploadJobRepository.save({ ...testUploadJobs[0], patientId: null, patientName: null, user: null });

      // when
      const result = await qrService.requestStudyMove(null, uploadJob.id, uploadJob.huId, uploadJob.studyInstanceUID);

      // then
      expect(result.status).toBe(UploadJobStatus.DONE);
      expect(result.message).toBe(mockAxiosResponse.data.message);

      // then: 로그
      expect(accessLoggerSpy).toBeCalledTimes(1);
    });

    test("요청 실패 시, 상태가 REJECT 업데이트됨", async () => {
      // given
      jest.restoreAllMocks();
      httpService.post = jest.fn().mockImplementationOnce(() => "error");
      const uploadJob = await uploadJobRepository.save({ ...testUploadJobs[0], patientId: null, patientName: null, user: null });

      // when
      const result = await qrService.requestStudyMove(null, uploadJob.id, uploadJob.huId, uploadJob.studyInstanceUID);

      // then
      expect(result.status).toBe(UploadJobStatus.REJECT);

      // then: 로그
      expect(accessLoggerSpy).toBeCalledTimes(0);
    });
  });

  describe("createOne", () => {
    beforeEach(async () => {
      await seederService.empty();
    });

    test("EXCEEDED_QR_REQUEST_MAX_COUNT, timeoutMs 내, study로 등록되지 않은, scu 요청이 maxCount 존재함", async () => {
      // given
      const seedUploadJobs = [
        { ...testUploadJobs[0], studyId: null, patientId: null, patientName: null, user: null, aeMode: AeMode.SCU, createdAt: moment().subtract(1, "minute") },
        { ...testUploadJobs[1], studyId: null, patientId: null, patientName: null, user: null, aeMode: AeMode.SCU, createdAt: moment().subtract(1, "minute") },
      ];
      await uploadJobRepository.save(seedUploadJobs);

      // when
      const request = () =>
        qrService.createOne({ requestorId: null, studyInstanceUID: "1.2.3", patientId: null, patientName: null, instancesCount: 0, age: null, sex: null });

      // then
      await request().catch((error) => {
        expect(error.response).toEqual(HutomHttpException.EXCEEDED_QR_REQUEST_MAX_COUNT);
      });
    });

    test("DUPLICATED_QR_REQUEST_ON_DB, timeoutMs 내, 동일한 StudyInstanceUID 중복 요청", async () => {
      // given
      const seedUploadJobs = [
        {
          ...testUploadJobs[0],
          patientId: null,
          patientName: null,
          user: null,
          aeMode: AeMode.SCU,
          createdAt: moment().subtract(1, "minute"),
          studyInstanceUID: "prev-study-instance-uid",
        },
      ];
      await uploadJobRepository.save(seedUploadJobs);

      // when
      await qrService
        .createOne({
          requestorId: null,
          studyInstanceUID: seedUploadJobs[0].studyInstanceUID,
          patientId: null,
          patientName: null,
          instancesCount: 0,
          age: null,
          sex: null,
        })
        .catch((error) => {
          // then
          expect(error.response).toEqual(HutomHttpException.DUPLICATED_QR_REQUEST_ON_DB);
        });
    });

    test("성공, timeoutMs 후, 동일한 StudyInstanceUID 중복 요청", async () => {
      // given
      const seedUploadJobs = [
        {
          ...testUploadJobs[0],
          patientId: null,
          patientName: null,
          user: null,
          createdAt: moment().subtract(2, "h"),
          studyInstanceUID: "prev-study-instance-uid",
        },
      ];
      await uploadJobRepository.save(seedUploadJobs);

      // when
      const result = await qrService.createOne({
        requestorId: null,
        studyInstanceUID: seedUploadJobs[0].studyInstanceUID,
        patientId: null,
        patientName: null,
        instancesCount: 0,
        age: null,
        sex: null,
      });

      // then
      expect(result).toEqual({ uploadJobId: expect.any(Number), huId: expect.any(String) });
      const postUploadJob = await uploadJobRepository.findOne({ huId: result.huId });
      expect(postUploadJob).not.toBeUndefined();
    });
  });
});
