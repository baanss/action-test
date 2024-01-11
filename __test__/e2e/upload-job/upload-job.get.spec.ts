import * as fs from "fs";
import * as supertest from "supertest";
import * as cookieParser from "cookie-parser";
import * as moment from "moment";
import { INestApplication } from "@nestjs/common";

import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { testOnlyUploadJobs, testUploadJobs } from "@root/seeding/seeder/seed/upload-job.seed";
import { testStudies } from "@root/seeding/seeder/seed/study.seed";
import { generateNestApplication } from "@test/util/test.util";
import { testAdmins, testUsers } from "@root/seeding/seeder/seed/user.seed";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { UploadJobRepository } from "@src/upload-job/repository/upload-job.repository";
import { AeMode, OrderQuery, UploadJobStatus, UploadJobSortQuery } from "@src/common/constant/enum.constant";
import config from "@src/common/config/configuration";
import { StudyRepository } from "@src/study/repository/study.repository";
import { DicomRepository } from "@src/study/repository/dicom.repository";
import { UtilService } from "@src/util/util.service";
import { LoggerService } from "@src/logger/logger.service";

let app: INestApplication;
let seederService: SeederService;
let loggerService: LoggerService;
let utilService: UtilService;
let uploadJobRepository: UploadJobRepository;
let studyRepository: StudyRepository;
let dicomRepository: DicomRepository;

const customOriginHeaderKey = "x-origin";
const userServiceOrigin = "user";

const authTokenHeaderKey = "x-auth-token";
const authToken = process.env.SERVER_CODE;

beforeAll(async () => {
  app = await generateNestApplication();
  app.use(cookieParser());

  seederService = app.get(SeederService);
  loggerService = app.get(LoggerService);
  utilService = app.get(UtilService);
  uploadJobRepository = app.get(UploadJobRepository);
  studyRepository = app.get(StudyRepository);
  dicomRepository = app.get(DicomRepository);

  await app.init();

  await seederService.empty();
  await seederService.seedEncryption();
});

afterAll(async () => {
  await fs.promises.rm(config().core.dicomPath, { recursive: true, force: true }).catch((e) => {
    console.error(e);
  });
  await seederService.empty();
  await app.close();
});

describe("GET /upload-jobs", () => {
  const expectedUploadJobView = {
    id: expect.any(Number),
    huId: expect.any(String),
    status: expect.any(String),
    createdAt: expect.any(String),
    updatedAt: expect.any(String),
    sex: expect.any(Object), // nullable
    age: expect.any(Object), // nullable
    patientId: expect.any(String),
    patientName: expect.any(String),
    studyDate: expect.any(String),
    studyDescription: expect.any(String),
    seriesCount: expect.any(Number),
    instancesCount: expect.any(Number),
    isRegistered: expect.any(Boolean),
    userName: expect.any(Object), // nullable
    studyId: expect.any(Number), // nullable
    dicomId: expect.any(Number), // nullable
    dicomFilePath: expect.any(String), // nullable
  };

  test("UNAUTHORIZED_ORIGIN, 권한 없음", async () => {
    // given
    // when
    const res = await supertest.agent(app.getHttpServer()).get("/upload-jobs");

    //then
    expect(res.body.error).toEqual(HutomHttpException.UNAUTHORIZED_ORIGIN.error);
  });

  describe("일반 계정 요청", () => {
    let agent: supertest.SuperAgentTest;
    const currentUser = testUsers[0];

    beforeEach(async () => {
      await seederService.empty();
      await seederService.seedEncryption();

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

    test("자신이 생성한 리소스가 반환한다.", async () => {
      // given
      const targetUploadJob = await uploadJobRepository.findOne();
      await uploadJobRepository.update(targetUploadJob.id, { aeMode: AeMode.SCU, user: currentUser });

      // when
      const res = await agent.get("/upload-jobs").expect(200);

      // then
      const expectedUploadJob = res.body.data.find((uploadJob) => uploadJob.id === targetUploadJob.id);
      expect(expectedUploadJob).not.toBeUndefined();
      res.body.data.forEach((uploadJob) => {
        if (uploadJob.userName) {
          expect(uploadJob.userName).toBe(currentUser.name);
        }
      });
    });

    test("SCP 요청으로 생성한 리소스가 반환한다.", async () => {
      // given
      const targetUploadJob = await uploadJobRepository.findOne();
      await uploadJobRepository.update(targetUploadJob.id, { aeMode: AeMode.SCP });

      // when
      const res = await agent.get("/upload-jobs").expect(200);

      // then
      expect(res.body.count).toBeGreaterThan(0);
      const expectedUploadJob = res.body.data.find((uploadJob) => uploadJob.id === targetUploadJob.id);
      expect(expectedUploadJob).not.toBeUndefined();
      res.body.data.forEach((uploadJob) => {
        if (uploadJob.userName) {
          expect(uploadJob.userName).toBe(currentUser.name);
        }
      });
    });

    test("소유자가 존재하지 않는 리소스가 반환한다.", async () => {
      // given
      const targetUploadJob = await uploadJobRepository.findOne();
      await uploadJobRepository.update(targetUploadJob.id, { user: null });

      // when
      const res = await agent.get("/upload-jobs").expect(200);

      // then
      expect(res.body.count).toBeGreaterThan(0);
      const expectedUploadJob = res.body.data.find((uploadJob) => uploadJob.id === targetUploadJob.id);
      expect(expectedUploadJob).not.toBeUndefined();
      res.body.data.forEach((uploadJob) => {
        if (uploadJob.userName) {
          expect(uploadJob.userName).toBe(currentUser.name);
        }
      });
    });
  });

  describe("대표 계정 요청", () => {
    let agent: supertest.SuperAgentTest;
    const currentUser = testAdmins[0];

    beforeEach(async () => {
      await seederService.empty();
      await seederService.seedEncryption();

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

    test("대표 계정 권한이 있는 리소스가 반환한다.", async () => {
      // given
      // when
      const res = await agent.get("/upload-jobs").expect(200);

      // then
      expect(res.body.count).toBeGreaterThan(0);
      const uploadJobUsers = testUploadJobs.map((uploadJob) => uploadJob.user?.name ?? null);
      res.body.data.forEach((uploadJob) => {
        expect([null, ...uploadJobUsers]).toContain(uploadJob.userName);
      });
    });

    test("소유자가 존재하지 않는 리소스가 반환한다.", async () => {
      // given
      const targetUploadJob = await uploadJobRepository.findOne();
      await uploadJobRepository.update(targetUploadJob.id, { user: null });

      // when
      const res = await agent.get("/upload-jobs").expect(200);

      // then
      expect(res.body.count).toBeGreaterThan(0);
      const expectedUploadJob = res.body.data.find((uploadJob) => uploadJob.id === targetUploadJob.id);
      expect(expectedUploadJob).not.toBeUndefined();
    });

    test("응답 구조가 잘 나온다.", async () => {
      // given
      // when
      const res = await agent.get("/upload-jobs").expect(200);

      // then
      const expected = {
        count: expect.any(Number),
        data: expect.any(Array),
      };
      expect(res.body).toEqual(expected);
      expect(Object.keys(res.body.data[0])).toEqual(Object.keys(expectedUploadJobView));
    });

    test("다이콤이 등록되지 않은 uploadJob은 반환된다.", async () => {
      // given
      const dicom = await dicomRepository.findOne();
      await dicomRepository.delete(dicom.id);

      // when
      const res = await agent.get("/upload-jobs").expect(200);

      // then
      expect(res.body.count).toBeGreaterThan(0);
      res.body.data.forEach((uploadJob) => {
        if (uploadJob.studyId && uploadJob.dicomId) {
          expect(uploadJob.dicomFilePath).toBe("valid");
        } else {
          expect(uploadJob.dicomFilePath).toBeNull();
        }
      });
    });

    test("다이콤 파일이 제거된 uploadJob은 반환하지 않는다.", async () => {
      // given
      // when
      const res = await agent.get("/upload-jobs").expect(200);

      // then
      expect(res.body.count).toBeGreaterThan(0);
      res.body.data.forEach((uploadJob) => {
        if (uploadJob.studyId) {
          expect(uploadJob.dicomFilePath).toBe("valid");
        } else {
          expect(uploadJob.dicomFilePath).toBeNull();
        }
      });
    });

    test("startStudyDate 검색 - endStudyDate 현재를 기준으로 검색한다.", async () => {
      // given
      const query = { startStudyDate: moment().subtract(1, "year").toISOString() };

      // when
      const res = await agent.get("/upload-jobs").query(query).expect(200);

      // then
      expect(res.body.count).toBeGreaterThan(0);
      res.body.data.forEach((uploadJob) => {
        expect(Object.keys(uploadJob)).toEqual(Object.keys(expectedUploadJobView));
        expect(moment(uploadJob.studyDate).toDate().getTime()).toBeGreaterThanOrEqual(moment(query.startStudyDate).toDate().getTime());
        expect(moment(uploadJob.studyDate).toDate().getTime()).toBeLessThanOrEqual(moment().toDate().getTime());
      });
    });

    test("endStudyDate 검색 - startStudyDate 1년 전을 기준으로 검색한다.", async () => {
      // given
      const query = { endStudyDate: moment().subtract(1, "month").toISOString() };

      // when
      const res = await agent.get("/upload-jobs").query(query).expect(200);

      // then
      expect(res.body.count).toBeGreaterThan(0);
      res.body.data.forEach((uploadJob) => {
        expect(Object.keys(uploadJob)).toEqual(Object.keys(expectedUploadJobView));
        expect(moment(uploadJob.studyDate).toDate().getTime()).toBeGreaterThanOrEqual(moment(query.endStudyDate).subtract(1, "year").toDate().getTime());
        expect(moment(uploadJob.studyDate).toDate().getTime()).toBeLessThanOrEqual(moment(query.endStudyDate).toDate().getTime());
      });
    });

    test("startCreatedAt 검색 - endCreatedAt 현재를 기준으로 검색한다.", async () => {
      // given
      const query = { startCreatedAt: moment().subtract(1, "year").toISOString() };

      // when
      const res = await agent.get("/upload-jobs").query(query).expect(200);

      // then
      expect(res.body.count).toBeGreaterThan(0);
      res.body.data.forEach((uploadJob) => {
        expect(Object.keys(uploadJob)).toEqual(Object.keys(expectedUploadJobView));
        expect(moment(uploadJob.createdAt).toDate().getTime()).toBeGreaterThanOrEqual(moment(query.startCreatedAt).toDate().getTime());
        expect(moment(uploadJob.createdAt).toDate().getTime()).toBeLessThanOrEqual(moment().toDate().getTime());
      });
    });

    test("endCreatedAt 검색 - startCreatedAt 1년 전을 기준으로 검색한다.", async () => {
      // given
      const query = { endCreatedAt: moment().subtract(1, "month").toISOString() };

      // when
      const res = await agent.get("/upload-jobs").query(query).expect(200);

      // then
      expect(res.body.count).toBeGreaterThan(0);
      res.body.data.forEach((uploadJob) => {
        expect(Object.keys(uploadJob)).toEqual(Object.keys(expectedUploadJobView));
        expect(moment(uploadJob.createdAt).toDate().getTime()).toBeGreaterThanOrEqual(moment(query.endCreatedAt).subtract(1, "year").toDate().getTime());
        expect(moment(uploadJob.createdAt).toDate().getTime()).toBeLessThanOrEqual(moment(query.endCreatedAt).toDate().getTime());
      });
    });

    test("페이지네이션 성공", async () => {
      // given
      const query = { page: 2, limit: 3 };

      // when
      const res = await agent.get("/upload-jobs").query(query).expect(200);

      // then
      expect(res.body.count).toBeGreaterThan(0);
      expect(res.body.data.length).toBeLessThanOrEqual(query.limit);
    });

    test("페이지네이션 성공 - limit가 -1인 경우 전체 조회", async () => {
      // given

      // when
      const query = { limit: -1 };
      const res = await agent.get("/upload-jobs").query(query).expect(200);

      // then
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    test("정렬 - 두번째 정렬 조건 id로 설정한다.", async () => {
      // given
      const query = { sort: UploadJobSortQuery.STUDY_DATE, order: OrderQuery.ASC };

      // when
      const res = await agent.get("/upload-jobs").query(query).expect(200);

      // then
      expect(res.body.count).toBeGreaterThan(0);
      const expectedList = res.body.data;
      expectedList.sort((a, b) => {
        if (a.studyDate === b.StudyDate) {
          return a.id - b.id;
        }
        return a.studyDate - b.studyDate;
      });

      res.body.data.forEach((upoadJobView, i) => {
        expect(upoadJobView.studyDate).toBe(expectedList[i].studyDate);
      });
      expect(res.body.data).toBe(expectedList);
    });

    test("patientId 검색 - studyPatientId 존재하지 않은 경우, patientId 기준으로 검색한다.", async () => {
      // given
      const query = { patientId: testOnlyUploadJobs[0].patientId };

      // when
      const res = await agent.get("/upload-jobs").query(query).expect(200);

      // then
      expect(res.body.count).toBeGreaterThan(0);
      res.body.data.forEach((uploadJob) => {
        expect(Object.keys(uploadJob)).toEqual(Object.keys(expectedUploadJobView));
        expect(uploadJob.patientId).toBe(query.patientId);
      });
    });

    test("patientId 검색 - studyPatientId 존재하는 경우, studyPatientId 기준으로 검색한다.", async () => {
      // given
      const query = { patientId: testStudies[0].patientId };

      // when
      const res = await agent.get("/upload-jobs").query(query).expect(200);

      // then
      expect(res.body.count).toBeGreaterThan(0);
      res.body.data.forEach((uploadJob) => {
        expect(Object.keys(uploadJob)).toEqual(Object.keys(expectedUploadJobView));
        expect(uploadJob.patientId).toBe(query.patientId);
      });
    });

    test("patientName 검색 - studyPatientName 존재하지 않은 경우, patientName 기준으로 검색한다.", async () => {
      // given
      const query = { patientName: testOnlyUploadJobs[0].patientName };

      // when
      const res = await agent.get("/upload-jobs").query(query).expect(200);

      // then
      expect(res.body.count).toBeGreaterThan(0);
      res.body.data.forEach((uploadJob) => {
        expect(Object.keys(uploadJob)).toEqual(Object.keys(expectedUploadJobView));
        expect(uploadJob.patientName).toBe(query.patientName);
      });
    });

    test("patientName 검색 - studyPatientName 존재하는 경우, studyPatientName 기준으로 검색한다.", async () => {
      // given
      const query = { patientName: testStudies[0].patientName };

      // when
      const res = await agent.get("/upload-jobs").query(query).expect(200);

      // then
      expect(res.body.count).toBeGreaterThan(0);
      res.body.data.forEach((uploadJob) => {
        expect(Object.keys(uploadJob)).toEqual(Object.keys(expectedUploadJobView));
        expect(uploadJob.patientName).toBe(query.patientName);
      });
    });
  });

  describe("status 검증", () => {
    let agent: supertest.SuperAgentTest;
    const currentUser = testAdmins[0];

    beforeEach(async () => {
      await seederService.empty();
      await seederService.seedUsers();

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

    test("aeMode가 null인 경우, status를 그대로 반환한다.", async () => {
      // given
      const rejectedUploadJobs = Array(3)
        .fill({ aeMode: null, status: UploadJobStatus.REJECT })
        .map((uploadJob, i) => {
          return { ...uploadJob, huId: `rejected-${i}` };
        });
      const inProgressUploadJobs = Array(3)
        .fill({ aeMode: null, createdAt: moment().subtract(2, "h"), userId: currentUser.id, status: UploadJobStatus.IN_PROGRESS })
        .map((uploadJob, i) => {
          return { ...uploadJob, huId: `progress-${i}` };
        });
      const doneUploadJobs = Array(3)
        .fill({ aeMode: null, createdAt: moment().subtract(2, "h"), userId: currentUser.id, status: UploadJobStatus.DONE })
        .map((uploadJob, i) => {
          return { ...uploadJob, huId: `done-${i}` };
        });
      const uploadJobs = await uploadJobRepository.save([...rejectedUploadJobs, ...inProgressUploadJobs, ...doneUploadJobs]);

      // when
      const res = await agent.get("/upload-jobs").expect(200);

      // then
      expect(res.body.count).toBeGreaterThan(0);
      res.body.data.forEach((uploadJob) => {
        const matched = uploadJobs.find((el) => el.huId === uploadJob.huId);
        expect(matched.status).toBe(uploadJob.status);
      });
    });

    test("status가 REJECT이거나, 생성된 지 1시간이 경과된 status는 REJECT 반환한다.", async () => {
      // given
      const rejectedUploadJobs = Array(3)
        .fill({ status: UploadJobStatus.REJECT })
        .map((uploadJob, i) => {
          return { ...uploadJob, huId: `rejected-${i}` };
        });
      const expiresUploadJobs = Array(3)
        .fill({ aeMode: AeMode.SCU, createdAt: moment().subtract(2, "h"), userId: currentUser.id })
        .map((uploadJob, i) => {
          return { ...uploadJob, huId: `expired-${i}` };
        });
      await uploadJobRepository.save([...rejectedUploadJobs, ...expiresUploadJobs]);

      // when
      const res = await agent.get("/upload-jobs").expect(200);

      // then
      expect(res.body.count).toBeGreaterThan(0);
      res.body.data.forEach((uploadJob) => {
        if (!!uploadJob.studyId) {
          expect(uploadJob.status).toBe(UploadJobStatus.DONE);
          return;
        }
        if (uploadJob.status === UploadJobStatus.REJECT || moment(uploadJob.createdAt) < moment().subtract(1, "h")) {
          expect(uploadJob.status).toBe(UploadJobStatus.REJECT);
          return;
        }
        expect(uploadJob.status).toBe(UploadJobStatus.IN_PROGRESS);
      });
    });

    test("study가 저장된 status는 DONE 반환한다.", async () => {
      // given
      const randomStudies = Array(4)
        .fill({ patientId: "patientId", patientName: "patientName", studyDate: moment("1900-01-01"), seriesCount: 0, instancesCount: 0 })
        .map((study, i) => {
          return { ...study, huId: `study-${i}` };
        });
      const studies = await studyRepository.save(randomStudies);
      const rejectedUploadJobs = Array(2)
        .fill({ status: UploadJobStatus.REJECT })
        .map((uploadJob, i) => {
          return { ...uploadJob, huId: `rejected-${i}`, studyId: studies[i].id };
        });
      const expiresUploadJobs = Array(2)
        .fill({ aeMode: AeMode.SCU, createdAt: moment().subtract(2, "h"), userId: currentUser.id })
        .map((uploadJob, i) => {
          return { ...uploadJob, huId: `expired-${i}`, studyId: studies[i + 2].id };
        });
      await uploadJobRepository.save([...rejectedUploadJobs, ...expiresUploadJobs]);

      // when
      const res = await agent.get("/upload-jobs").expect(200);

      // then
      expect(res.body.count).toBeGreaterThan(0);
      res.body.data.forEach((uploadJob) => {
        if (!!uploadJob.studyId) {
          expect(uploadJob.status).toBe(UploadJobStatus.DONE);
          return;
        }
        if (uploadJob.status === UploadJobStatus.REJECT || moment(uploadJob.createdAt) < moment().subtract(1, "h")) {
          expect(uploadJob.status).toBe(UploadJobStatus.REJECT);
          return;
        }
        expect(uploadJob.status).toBe(UploadJobStatus.IN_PROGRESS);
      });
    });
  });

  describe("isRegistered 검증", () => {
    let agent: supertest.SuperAgentTest;
    const currentUser = testAdmins[0];

    beforeEach(async () => {
      await seederService.empty();
      await seederService.seedUsers();

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

    test("성공 - 로컬 업로드 요청이고, IN_PROGRESS인 Study는 null로 반환된다.", async () => {
      // given
      const uploadJob = await uploadJobRepository.save({
        ...testUploadJobs[0],
        patientId: null,
        patientName: null,
        aeMode: null,
        status: UploadJobStatus.IN_PROGRESS,
      });
      const encrypted = await utilService.encryptPromise({ patientId: testStudies[0].patientId, patientName: testStudies[0].patientName });
      await studyRepository.save({
        ...testStudies[0],
        uploadJob,
        huId: uploadJob.huId,
        patientId: encrypted.patientId,
        patientName: encrypted.patientName,
      });

      // when
      const res = await agent.get("/upload-jobs");

      // then
      expect(res.body.data[0].isRegistered).toBeNull();
    });

    test("성공 - QR 요청이고, DONE인 Study는 isRegistered 값(false)이 반환된다.", async () => {
      // given
      const uploadJob = await uploadJobRepository.save({
        ...testUploadJobs[0],
        patientId: null,
        patientName: null,
        aeMode: AeMode.SCU,
        status: UploadJobStatus.DONE,
      });
      const encrypted = await utilService.encryptPromise({ patientId: testStudies[0].patientId, patientName: testStudies[0].patientName });
      await studyRepository.save({
        ...testStudies[0],
        uploadJob,
        huId: uploadJob.huId,
        patientId: encrypted.patientId,
        patientName: encrypted.patientName,
        isRegistered: false,
      });

      // when
      const res = await agent.get("/upload-jobs");

      // then
      expect(res.body.data[0].isRegistered).toBeFalsy();
    });

    test("성공 - QR 요청으로 생성된 Study는 isRegistered 값(true)이 반환된다.", async () => {
      // given
      const uploadJob = await uploadJobRepository.save({ ...testUploadJobs[0], patientId: null, patientName: null, aeMode: AeMode.SCU });
      const encrypted = await utilService.encryptPromise({ patientId: testStudies[0].patientId, patientName: testStudies[0].patientName });
      await studyRepository.save({
        ...testStudies[0],
        uploadJob,
        huId: uploadJob.huId,
        patientId: encrypted.patientId,
        patientName: encrypted.patientName,
        isRegistered: true,
      });

      // when
      const res = await agent.get("/upload-jobs");

      // then
      expect(res.body.data[0].isRegistered).toBeTruthy();
    });

    test("성공 - dicom send 요청으로 생성된 Study는 isRegistered 값(false)이 반환된다.", async () => {
      // given
      const uploadJob = await uploadJobRepository.save({ ...testUploadJobs[0], patientId: null, patientName: null, aeMode: AeMode.SCP });
      const encrypted = await utilService.encryptPromise({ patientId: testStudies[0].patientId, patientName: testStudies[0].patientName });
      await studyRepository.save({
        ...testStudies[0],
        uploadJob,
        huId: uploadJob.huId,
        patientId: encrypted.patientId,
        patientName: encrypted.patientName,
        isRegistered: false,
      });

      // when
      const res = await agent.get("/upload-jobs");

      // then
      expect(res.body.data[0].isRegistered).toBeFalsy();
    });

    test("성공 - dicom send 요청으로 생성된 Study는 isRegistered 값(true)이 반환된다.", async () => {
      // given
      const uploadJob = await uploadJobRepository.save({ ...testUploadJobs[0], patientId: null, patientName: null, aeMode: AeMode.SCP });
      const encrypted = await utilService.encryptPromise({ patientId: testStudies[0].patientId, patientName: testStudies[0].patientName });
      await studyRepository.save({
        ...testStudies[0],
        uploadJob,
        huId: uploadJob.huId,
        patientId: encrypted.patientId,
        patientName: encrypted.patientName,
        isRegistered: true,
      });

      // when
      const res = await agent.get("/upload-jobs");

      // then
      expect(res.body.data[0].isRegistered).toBeTruthy();
    });
  });
});

describe("GET /upload-jobs/hu-id", () => {
  let logLoggerSpy: jest.SpyInstance;
  const instancesCount = null;
  const prevHuId = `${process.env.SERVER_CODE}_9999`;
  const newHuId = `${process.env.SERVER_CODE}_10000`;

  beforeEach(async () => {
    jest.restoreAllMocks();
    logLoggerSpy = jest.spyOn(loggerService, "log");

    await seederService.empty();
    await seederService.seedEncryption();
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  test("UNAUTHORIZED_AUTH_TOKEN, 요청 권한 없음", async () => {
    // given
    // when
    const res = await supertest.agent(app.getHttpServer()).get("/upload-jobs/hu-id").query({ studyInstanceUID: "1.2.3.4" });

    //then
    expect(res.body.error).toEqual(HutomHttpException.UNAUTHORIZED_AUTH_TOKEN.error);
  });

  describe("매칭 upload-job이 없을 때, 신규 huId 생성 후 반환(검사 항목: studyInstanceUID, createdAt, studyId, aeMode, status)", () => {
    test("1) studyInstanceUID - 결과 없음", async () => {
      // given
      const prevUploadJob = {
        huId: prevHuId,
        studyInstanceUID: "1.2.3.4",
        createdAt: new Date(),
        studyId: null,
        aeMode: AeMode.SCU,
        status: UploadJobStatus.IN_PROGRESS,
      };
      await uploadJobRepository.save(prevUploadJob);

      // when
      const studyInstanceUID = "not_found";
      const res = await supertest.agent(app.getHttpServer()).get("/upload-jobs/hu-id").query({ studyInstanceUID }).set(authTokenHeaderKey, authToken);

      //then: 응답 구성 점검
      const expectedUploadJob = {
        huId: newHuId,
        affected: 1,
        instancesCount,
      };
      expect(res.body).toEqual(expectedUploadJob);

      // then: 저장 데이터 점검
      const uploadJob = await uploadJobRepository.findOne({ huId: res.body.huId });
      expect(uploadJob.aeMode).toBe(AeMode.SCP);
      expect(uploadJob.isAquired).toBeTruthy();
      expect(uploadJob.studyInstanceUID).toBe(studyInstanceUID);

      // 로그
      expect(logLoggerSpy).toBeCalledTimes(1);
    });

    test("2) createdAt - 1시간 지남", async () => {
      // given
      const prevUploadJob = {
        huId: prevHuId,
        studyInstanceUID: "1.2.3.4",
        createdAt: moment().subtract(2, "h").toDate(),
        studyId: null,
        aeMode: AeMode.SCU,
        status: UploadJobStatus.IN_PROGRESS,
      };
      await uploadJobRepository.save(prevUploadJob);

      // when
      const res = await supertest
        .agent(app.getHttpServer())
        .get("/upload-jobs/hu-id")
        .query({ studyInstanceUID: prevUploadJob.studyInstanceUID })
        .set(authTokenHeaderKey, authToken);

      //then: 응답 구성 점검
      const expectedUploadJob = {
        huId: newHuId,
        affected: 1,
        instancesCount,
      };
      expect(res.body).toEqual(expectedUploadJob);

      // then: 저장 데이터 점검
      const uploadJob = await uploadJobRepository.findOne({ huId: res.body.huId });
      expect(uploadJob.aeMode).toBe(AeMode.SCP);
      expect(uploadJob.isAquired).toBeTruthy();
      expect(uploadJob.studyInstanceUID).toBe(prevUploadJob.studyInstanceUID);

      // 로그
      expect(logLoggerSpy).toBeCalledTimes(1);
    });

    test("3) studyId - study 등록됨", async () => {
      // given
      const prevUploadJob = {
        huId: prevHuId,
        studyInstanceUID: "1.2.3.4",
        createdAt: new Date(),
        studyId: 1,
        aeMode: AeMode.SCU,
        status: UploadJobStatus.IN_PROGRESS,
      };
      await uploadJobRepository.save(prevUploadJob);

      // when
      const res = await supertest
        .agent(app.getHttpServer())
        .get("/upload-jobs/hu-id")
        .query({ studyInstanceUID: prevUploadJob.studyInstanceUID })
        .set(authTokenHeaderKey, authToken);

      //then: 응답 구성 점검
      const expectedUploadJob = {
        huId: newHuId,
        affected: 1,
        instancesCount,
      };
      expect(res.body).toEqual(expectedUploadJob);

      // then: 저장 데이터 점검
      const uploadJob = await uploadJobRepository.findOne({ huId: res.body.huId });
      expect(uploadJob.aeMode).toBe(AeMode.SCP);
      expect(uploadJob.isAquired).toBeTruthy();
      expect(uploadJob.studyInstanceUID).toBe(prevUploadJob.studyInstanceUID);

      // 로그
      expect(logLoggerSpy).toBeCalledTimes(1);
    });

    test("4) aeMode - 로컬 업로드 요청", async () => {
      // given
      const prevUploadJob = {
        huId: prevHuId,
        studyInstanceUID: "1.2.3.4",
        createdAt: new Date(),
        studyId: null,
        aeMode: null,
        status: UploadJobStatus.IN_PROGRESS,
      };
      await uploadJobRepository.save(prevUploadJob);

      // when
      const res = await supertest
        .agent(app.getHttpServer())
        .get("/upload-jobs/hu-id")
        .query({ studyInstanceUID: prevUploadJob.studyInstanceUID })
        .set(authTokenHeaderKey, authToken);

      //then: 응답 구성 점검
      const expectedUploadJob = {
        huId: newHuId,
        affected: 1,
        instancesCount,
      };

      expect(res.body).toEqual(expectedUploadJob);

      // then: 저장 데이터 점검
      const uploadJob = await uploadJobRepository.findOne({ huId: res.body.huId });
      expect(uploadJob.aeMode).toBe(AeMode.SCP);
      expect(uploadJob.isAquired).toBeTruthy();
      expect(uploadJob.studyInstanceUID).toBe(prevUploadJob.studyInstanceUID);

      // 로그
      expect(logLoggerSpy).toBeCalledTimes(1);
    });

    test("5) status - REJECT", async () => {
      // given
      const prevUploadJob = {
        huId: prevHuId,
        studyInstanceUID: "1.2.3.4",
        createdAt: new Date(),
        studyId: null,
        aeMode: AeMode.SCP,
        status: UploadJobStatus.REJECT,
      };
      await uploadJobRepository.save(prevUploadJob);

      // when
      const res = await supertest
        .agent(app.getHttpServer())
        .get("/upload-jobs/hu-id")
        .query({ studyInstanceUID: prevUploadJob.studyInstanceUID })
        .set(authTokenHeaderKey, authToken);

      //then: 응답 구성 점검
      const expectedUploadJob = {
        huId: newHuId,
        affected: 1,
        instancesCount,
      };
      expect(res.body).toEqual(expectedUploadJob);

      // then: 저장 데이터 점검
      const uploadJob = await uploadJobRepository.findOne({ huId: res.body.huId });
      expect(uploadJob.aeMode).toBe(AeMode.SCP);
      expect(uploadJob.isAquired).toBeTruthy();
      expect(uploadJob.studyInstanceUID).toBe(prevUploadJob.studyInstanceUID);

      // 로그
      expect(logLoggerSpy).toBeCalledTimes(1);
    });
  });

  describe("매칭 upload-job 있을 때, huId 조회 후 반환", () => {
    const prevUploadJob = {
      huId: prevHuId,
      studyInstanceUID: "1.2.3.4",
      aeMode: AeMode.SCP,
      instancesCount: null,
      createdAt: new Date(),
    };

    beforeEach(async () => {
      await seederService.empty();
      await seederService.seedEncryption();
    });

    test("할당 전(isAquired=false)", async () => {
      // given
      await uploadJobRepository.save({ ...prevUploadJob, isAquired: false });

      // when
      const res = await supertest
        .agent(app.getHttpServer())
        .get("/upload-jobs/hu-id")
        .query({ studyInstanceUID: prevUploadJob.studyInstanceUID })
        .set(authTokenHeaderKey, authToken);

      //then: 응답 구성 점검
      const expectedUploadJob = {
        huId: prevHuId,
        instancesCount,
        affected: 1,
      };
      expect(res.body).toEqual(expectedUploadJob);

      // then: 저장 데이터 점검
      const uploadJob = await uploadJobRepository.findOne({ huId: res.body.huId });
      expect(uploadJob.isAquired).toBeTruthy();
      expect(uploadJob.studyInstanceUID).toBe(prevUploadJob.studyInstanceUID);

      // 로그
      expect(logLoggerSpy).toBeCalledTimes(1);
    });

    test("할당 후(isAquired=true)", async () => {
      // given
      await uploadJobRepository.save({ ...prevUploadJob, isAquired: true });

      // when
      const res = await supertest
        .agent(app.getHttpServer())
        .get("/upload-jobs/hu-id")
        .query({ studyInstanceUID: prevUploadJob.studyInstanceUID })
        .set(authTokenHeaderKey, authToken);

      //then: 응답 구성 점검
      const expectedUploadJob = {
        huId: prevHuId,
        instancesCount,
        affected: 0,
      };
      expect(res.body).toEqual(expectedUploadJob);

      // then: 저장 데이터 점검
      const uploadJob = await uploadJobRepository.findOne({ huId: res.body.huId });
      expect(uploadJob.isAquired).toBeTruthy();
      expect(uploadJob.studyInstanceUID).toBe(prevUploadJob.studyInstanceUID);

      // 로그
      expect(logLoggerSpy).toBeCalledTimes(1);
    });
  });
});
