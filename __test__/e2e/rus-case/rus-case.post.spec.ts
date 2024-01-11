import * as moment from "moment";
import * as supertest from "supertest";
import * as fs from "fs";
import * as path from "path";
import { of } from "rxjs";
import * as cookieParser from "cookie-parser";
import { INestApplication } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";

import config from "@src/common/config/configuration";
import { PostRusCaseReq } from "@src/rus-case/dto";
import { RusCaseStatus } from "@src/common/constant/enum.constant";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { CreditCategory } from "@src/common/entity/credit-history.entity";

import { RusCaseRepository } from "@src/rus-case/repository/rus-case.repository";
import { ClinicalInfoRepository } from "@src/rus-case/repository/clinical-info.repository";
import { StudyRepository } from "@src/study/repository/study.repository";
import { Hu3dRepository } from "@src/rus-case/repository/hu3d.repository";
import { DicomRepository } from "@src/study/repository/dicom.repository";
import { BalanceViewRepository } from "@src/credit-history/repository/balance-view.repository";

import { NotificationRepository } from "@src/notification/repository/notification.repository";
import { Category } from "@src/common/entity/notification.entity";

import { testAdmins, testUsers } from "@root/seeding/seeder/seed/user.seed";
import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { testDicoms } from "@root/seeding/seeder/seed/dicom.seed";
import { testSurgeons } from "@root/seeding/seeder/seed/surgeon.seed";
import { testRecipients } from "@root/seeding/seeder/seed/recipient.seed";
import { generateNestApplication } from "@test/util/test.util";
import { testHu3ds } from "@root/seeding/seeder/seed/hu3d.seed";
import { testRusCases } from "@root/seeding/seeder/seed/rus-case.seed";
import { CreditHistoryRepository } from "@src/credit-history/repository/credit-history.repository";
import { testCreditHistories } from "@root/seeding/seeder/seed/credit-history.seed";

let app: INestApplication;
let seederService: SeederService;
let httpService: HttpService;

let rusCaseRepository: RusCaseRepository;
let clinicalInfoRepository: ClinicalInfoRepository;
let studyRepository: StudyRepository;
let hu3dRepository: Hu3dRepository;
let dicomRepository: DicomRepository;
let balanceViewRepository: BalanceViewRepository;
let notificationRepository: NotificationRepository;
let creditHistoryRepository: CreditHistoryRepository;

const customOriginHeaderKey = "x-origin";
const userServiceOrigin = "user";

const targetUser = testUsers[0];
const otherUser = testUsers[1];
const targetAdmin = testAdmins[0];

beforeAll(async () => {
  app = await generateNestApplication();
  httpService = app.get<HttpService>(HttpService);

  app.use(cookieParser());

  seederService = app.get(SeederService);
  rusCaseRepository = app.get(RusCaseRepository);
  clinicalInfoRepository = app.get(ClinicalInfoRepository);
  studyRepository = app.get(StudyRepository);
  hu3dRepository = app.get(Hu3dRepository);
  dicomRepository = app.get(DicomRepository);
  balanceViewRepository = app.get(BalanceViewRepository);
  notificationRepository = app.get(NotificationRepository);
  creditHistoryRepository = app.get(CreditHistoryRepository);

  await seederService.empty();
  await seederService.seedEncryption();

  await app.init();
});

afterAll(async () => {
  await seederService.empty();
  await app.close();
});

// TODO: huCT 구조 확인 테스트케이스 추가
describe("POST /rus-cases", () => {
  let agent: supertest.SuperAgentTest;
  const targetDicom = testDicoms[4];
  const targetStudy = targetDicom.study;

  const validRusCaseDto: PostRusCaseReq = {
    studyId: targetStudy.id,
    patientName: "new-patient-name",
    operationType: "Gastrectomy",
    deliveryDate: moment("2022-01-01", "YYYY-MM-DD").toISOString(),
    operationDate: moment("2022-02-01", "YYYY-MM-DD").toISOString(),
    age: 10,
    sex: "F",
    height: 140,
    weight: 40,
    childbirth: false,
    surgeonId: testSurgeons[0].id,
    recipientIds: [testRecipients[0].id, testRecipients[1].id],
  };

  beforeEach(async () => {
    // 다이콤 파일 생성
    await fs.promises.mkdir(path.dirname(targetDicom.filePath), { recursive: true }).catch((error) => error);
    await fs.promises.writeFile(targetDicom.filePath, "").catch((error) => error);

    // h-Space 요청
    jest.restoreAllMocks();
    const mockAxiosResponse = {
      data: {
        message: "RusCase 저장 성공",
      },
      status: 201,
      statusText: "Created",
      headers: {},
      config: {},
    };
    jest.spyOn(httpService, "post").mockImplementation(() => of(mockAxiosResponse));
  });

  afterEach(async () => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await fs.promises.rm(path.dirname(targetDicom.filePath), { recursive: true, force: true });
  });

  test("401 response, 헤더에 유효한 인증 정보가 없음", async () => {
    // when-then
    supertest.agent(app.getHttpServer()).post("/rus-cases").expect(401);
  });

  describe("일반 계정 요청", () => {
    const currentUser = targetUser;

    beforeEach(async () => {
      await seederService.empty();
      await seederService.seedEncryption();

      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentUser.employeeId,
        password: currentUser.password,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", res.get("Set-Cookie"));
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("201 response, 케이스 등록", async () => {
      // given
      const prevCreditBalance = await balanceViewRepository.getBalance();

      // when
      const res = await agent.post("/rus-cases").send(validRusCaseDto).expect(201);

      // then
      const expectedResult = { id: expect.any(Number), isCompleted: true };
      expect(res.body).toEqual(expectedResult);

      // then: study
      const study = await studyRepository.findOne({
        id: validRusCaseDto.studyId,
      });
      expect(study.patientName).not.toBe(validRusCaseDto.patientName);
      expect(study.isRegistered).toBeTruthy();

      // then: rusCase
      const expectedRusCase = {
        id: res.body.id,
        status: RusCaseStatus.TODO,
        studyId: study.id,
        userId: currentUser.id,
        surgeonId: validRusCaseDto.surgeonId,
      };
      const rusCase = await rusCaseRepository.findOne({
        studyId: validRusCaseDto.studyId,
      });
      expect(rusCase).toEqual(expectedRusCase);

      // then: clinicalInfo
      const clinicalInfo = await clinicalInfoRepository.findOne({
        rusCaseId: rusCase.id,
      });
      expect(clinicalInfo).not.toBeNull();

      // then: 크레딧 이력 생성
      const postCreditBalance = await balanceViewRepository.getBalance();
      const expectedCreditHistory = {
        id: expect.any(Number),
        category: CreditCategory.RUS_USE,
        quantity: -1,
        huId: targetStudy.huId,
        userId: currentUser.id,
        employeeId: currentUser.employeeId,
        name: currentUser.name,
        isUserRequest: true,
        balance: String(prevCreditBalance.balance - 1),
        status: true,
        createdAt: expect.any(Date),
      };
      expect(postCreditBalance).toEqual(expectedCreditHistory);
    });
  });

  describe("대표 계정 요청", () => {
    const currentUser = targetAdmin;

    beforeEach(async () => {
      await seederService.empty();
      await seederService.seedEncryption();

      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentUser.employeeId,
        password: currentUser.password,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", res.get("Set-Cookie"));
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("BAD_REQUEST, body 누락", async () => {
      // given
      // when
      const res = await agent.post("/rus-cases");

      // then
      expect(res.body.error).toBe(HutomHttpException.BAD_REQUEST.error);
    });

    test("BAD_REQUEST, body 타입 에러 - age, height, weight", async () => {
      // given
      // when
      const invalidTypeBody = {
        ...validRusCaseDto,
        age: "10",
        height: "140",
        weight: "40",
      };
      const res = await agent.post("/rus-cases").send(invalidTypeBody);

      // then
      expect(res.body.error).toBe(HutomHttpException.BAD_REQUEST.error);
    });

    test("BAD_REQUEST, body 타입 에러 - sex", async () => {
      // given
      // when
      const invalidSexTypeBody = { ...validRusCaseDto, sex: "invalid" };
      const res = await agent.post("/rus-cases").send(invalidSexTypeBody);

      // then
      expect(res.body.error).toBe(HutomHttpException.BAD_REQUEST.error);
    });

    test("INSUFFICIENT_CREDIT, 크레딧이 부족한 경우", async () => {
      // given
      await creditHistoryRepository.save({ ...testCreditHistories[0], quantity: -1000 });

      // when
      const res = await agent.post("/rus-cases").send(validRusCaseDto);

      // then
      expect(res.body.error).toBe(HutomHttpException.INSUFFICIENT_CREDIT.error);
    });

    test("NOT_FOUND_STUDY_WITH_ID, studyId를 가지는 스터디가 없음", async () => {
      // given
      // when
      const notFoundStudyBody = { ...validRusCaseDto, studyId: 999 };
      const res = await agent.post("/rus-cases").send(notFoundStudyBody);

      // then
      expect(res.body.error).toMatch(HutomHttpException.NOT_FOUND_STUDY_WITH_ID.error);
    });

    test("NOT_FOUND_DICOM_ON_DB, 다이콤 파일이 존재하지 않음", async () => {
      // given
      await dicomRepository.update({ id: targetDicom.id }, { filePath: null });

      // when
      const res = await agent.post("/rus-cases").send(validRusCaseDto);

      // then
      expect(res.body.error).toBe(HutomHttpException.NOT_FOUND_DICOM_ON_DB.error);
    });

    test("NOT_FOUND_DICOM_ON_DISK, 다이콤 파일이 존재하지 않음", async () => {
      // given
      await fs.promises.rm(targetDicom.filePath);

      // when
      const res = await agent.post("/rus-cases").send(validRusCaseDto);

      // then
      expect(res.body.error).toBe(HutomHttpException.NOT_FOUND_DICOM_ON_DISK.error);
    });

    test("DUPLICATED_RUS_CASE_ON_DB, RUS Case가 이미 등록됨", async () => {
      // given
      await studyRepository.update(targetStudy.id, { isRegistered: true });

      // when
      const res = await agent.post("/rus-cases").send(validRusCaseDto);

      // then
      expect(res.body.error).toBe(HutomHttpException.DUPLICATED_RUS_CASE_ON_DB.error);
    });

    test("DUPLICATED_RUS_CASE_ON_DB, studyId를 가지는 케이스가 이미 존재함", async () => {
      // given
      const rusCase = await rusCaseRepository.save({ studyId: targetStudy.id });

      // when
      const duplicateStudyBody = { ...validRusCaseDto, studyId: rusCase.studyId };
      const res = await agent.post("/rus-cases").send(duplicateStudyBody);

      // then
      expect(res.body.error).toMatch(HutomHttpException.DUPLICATED_RUS_CASE_ON_DB.error);
    });

    test("성공, 케이스 등록", async () => {
      // given
      const prevCreditBalance = await balanceViewRepository.getBalance();

      // when
      const res = await agent.post("/rus-cases").send(validRusCaseDto).expect(201);

      // then
      const expectedResult = { id: expect.any(Number), isCompleted: true };
      expect(res.body).toEqual(expectedResult);

      // then: study
      const study = await studyRepository.findOne({
        id: validRusCaseDto.studyId,
      });
      expect(study.isRegistered).toBeTruthy();
      expect(study.patientName).not.toBe(validRusCaseDto.patientName);

      // then: rusCase
      const expectedRusCase = {
        id: res.body.id,
        status: RusCaseStatus.TODO,
        studyId: study.id,
        userId: currentUser.id,
        surgeonId: validRusCaseDto.surgeonId,
      };
      const rusCase = await rusCaseRepository.findOne({
        studyId: validRusCaseDto.studyId,
      });
      expect(rusCase).toEqual(expectedRusCase);

      // then: clinicalInfo
      const clinicalInfo = await clinicalInfoRepository.findOne({
        rusCaseId: rusCase.id,
      });
      expect(clinicalInfo).not.toBeNull();

      // then: 크레딧 이력 생성
      const postCreditBalance = await balanceViewRepository.getBalance();
      const expectedCreditHistory = {
        id: expect.any(Number),
        category: CreditCategory.RUS_USE,
        quantity: -1,
        huId: targetStudy.huId,
        userId: currentUser.id,
        employeeId: currentUser.employeeId,
        name: currentUser.name,
        isUserRequest: true,
        balance: String(prevCreditBalance.balance - 1),
        status: true,
        createdAt: expect.any(Date),
      };
      expect(postCreditBalance).toEqual(expectedCreditHistory);
    });

    test("성공, h-Space 전송 실패 시 크레딧 이력 생성되지 않음", async () => {
      // given
      jest.restoreAllMocks();
      httpService.post = jest.fn().mockImplementationOnce(() => "error");
      const prevCreditBalance = await balanceViewRepository.getBalance();

      // when
      const res = await agent.post("/rus-cases").send(validRusCaseDto);
      if (!res) {
        return;
      }

      // then
      const expectedResult = { id: expect.any(Number), isCompleted: false };
      expect(res.body).toEqual(expectedResult);

      // then: study
      const study = await studyRepository.findOne({
        id: validRusCaseDto.studyId,
      });
      expect(study.isRegistered).toBeTruthy();
      expect(study.patientName).not.toBe(validRusCaseDto.patientName);

      // then: rusCase
      const rusCase = await rusCaseRepository.findOne({
        studyId: validRusCaseDto.studyId,
      });
      expect(rusCase).not.toBeNull();

      // then: clinicalInfo
      const clinicalInfo = await clinicalInfoRepository.findOne({
        rusCaseId: rusCase.id,
      });
      expect(clinicalInfo).not.toBeNull();

      // then: 크레딧 이력 생성되지 않음
      const postCreditBalance = await balanceViewRepository.getBalance();
      expect(prevCreditBalance).toEqual(postCreditBalance);
    });
  });
});

describe("POST /rus-cases/:id/hu3d", () => {
  let agent: supertest.SuperAgentTest;
  const targetHu3d = testHu3ds[0];
  const targetRusCase = targetHu3d.rusCase;
  const rusCaseId = targetRusCase.id;
  const attachFile = `__test__/dummy/${targetRusCase.study.huId}-1.hu3d`;
  const rusCaseDir = config().core.hu3dPath;

  beforeAll(async () => {
    await fs.promises.mkdir("__test__/dummy").catch(() => false);
    await fs.promises.mkdir(rusCaseDir).catch(() => false);
  });

  beforeEach(async () => {
    await seederService.empty();
    await seederService.seedEncryption();
  });

  afterAll(async () => {
    await fs.promises.rm("__test__/dummy", { recursive: true, force: true });
    await fs.promises.rm(rusCaseDir, { recursive: true, force: true }).catch(() => false);
  });

  test("401 response, 헤더에 유효한 인증 정보가 없음", async () => {
    // given

    // when-then
    supertest.agent(app.getHttpServer()).post(`/rus-cases/${rusCaseId}/hu3d`).set("Content-Type", "multipart/form-data").attach("file", attachFile).expect(401);
  });

  describe("OwnRusCaseGuard 검사 통과하지 못함", () => {
    beforeEach(async () => {
      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: otherUser.employeeId,
        password: otherUser.password,
        isForced: true,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", res.get("Set-Cookie"));
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("FORBIDDEN_RESOURCE, 케이스의 userId와 유저 ID가 일치하지 않음", async () => {
      // given
      await fs.promises.writeFile(attachFile, "");

      // when
      const response = await agent.post(`/rus-cases/${rusCaseId}/hu3d`).set("Content-Type", "multipart/form-data").attach("file", attachFile);

      // then
      expect(response.body.error).toMatch(HutomHttpException.FORBIDDEN_RESOURCE.error);
    });

    test("INVALID_REQUEST_PARAMETER, 파라미터가 유효하지 않음", async () => {
      // given
      await fs.promises.writeFile(attachFile, "");

      // when
      const invalidParameter = "invalid";
      const response = await agent.post(`/rus-cases/${invalidParameter}/hu3d`).set("Content-Type", "multipart/form-data").attach("file", attachFile);

      // then
      expect(response.body.error).toMatch(HutomHttpException.INVALID_REQUEST_PARAMETER.error);
    });

    test("NOT_FOUND_RUS_CASE_WITH_ID, 케이스가 존재하지 않음", async () => {
      // given
      await fs.promises.writeFile(attachFile, "");

      // when
      const invalidParameter = "999";
      const response = await agent.post(`/rus-cases/${invalidParameter}/hu3d`).set("Content-Type", "multipart/form-data").attach("file", attachFile);

      // then
      expect(response.body.error).toMatch(HutomHttpException.NOT_FOUND_RUS_CASE_WITH_ID.error);
    });
  });

  describe("일반 계정 요청", () => {
    const currentUser = targetUser;

    beforeEach(async () => {
      agent = supertest.agent(app.getHttpServer());
      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentUser.employeeId,
        password: currentUser.password,
        isForced: true,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", res.get("Set-Cookie"));
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("INVALID_REQUEST_FILE_EXTENSION, 파일 확장자가 유효하지 않음", async () => {
      // given
      const invalidExtFile = `__test__/dummy/${process.env.SERVER_CODE}_0-1.zip`;
      await fs.promises.writeFile(invalidExtFile, "").catch(() => false);

      // when
      const response = await agent.post(`/rus-cases/${rusCaseId}/hu3d`).set("Content-Type", "multipart/form-data").attach("file", invalidExtFile);

      // then
      expect(response.body.error).toMatch(HutomHttpException.INVALID_REQUEST_FILE_EXTENSION.error);
    });

    test("INVALID_REQUEST_FILE_NAME, huId-버전 으로 시작해야 함 1)버전이 존재하지 않음", async () => {
      // given
      const invalidFileName = `__test__/dummy/${process.env.SERVER_CODE}_123.hu3d`;
      await fs.promises.writeFile(invalidFileName, "").catch(() => false);

      // when
      const response = await agent.post(`/rus-cases/${rusCaseId}/hu3d`).set("Content-Type", "multipart/form-data").attach("file", invalidFileName);

      // then
      expect(response.body.error).toMatch(HutomHttpException.INVALID_REQUEST_FILE_NAME.error);
    });

    test("INVALID_REQUEST_FILE_NAME, huId-버전 으로 시작해야 함 2)버전이 숫자가 아님", async () => {
      // given
      const invalidFileName = `__test__/dummy/${process.env.SERVER_CODE}_123-invalid.hu3d`;
      await fs.promises.writeFile(invalidFileName, "");

      // when
      const response = await agent.post(`/rus-cases/${rusCaseId}/hu3d`).set("Content-Type", "multipart/form-data").attach("file", invalidFileName);

      // then
      expect(response.body.error).toMatch(HutomHttpException.INVALID_REQUEST_FILE_NAME.error);
    });

    test("INVALID_REQUEST_FILE_NAME, huId-버전 으로 시작해야 함 3)request parameter id와 huId가 맞지 않음", async () => {
      // given
      await fs.promises.writeFile(attachFile, "");

      // when
      const otherRusCaseId = 2;
      const response = await agent.post(`/rus-cases/${otherRusCaseId}/hu3d`).set("Content-Type", "multipart/form-data").attach("file", attachFile);

      // then
      expect(response.body.error).toMatch(HutomHttpException.INVALID_REQUEST_FILE_NAME.error);
    });

    test("성공 - 신규 업로드", async () => {
      // given
      await fs.promises.writeFile(attachFile, "");
      await notificationRepository.delete({});
      await hu3dRepository.delete({ id: targetHu3d.id });

      // when
      const res = await agent.post(`/rus-cases/${rusCaseId}/hu3d`).set("Content-Type", "multipart/form-data").attach("file", attachFile);

      // then
      const expected = { id: expect.any(Number) };
      expect(res.body).toEqual(expected);

      const updatedRusCase = await rusCaseRepository.findOne(rusCaseId);
      expect(updatedRusCase.status).toBe(RusCaseStatus.DONE);

      const createdHu3d = await hu3dRepository.findOne({ rusCaseId: Number(rusCaseId) });
      const expectedHu3d = {
        id: expect.any(Number),
        filePath: expect.any(String),
        fileName: expect.any(String),
        fileSize: expect.any(Number),
        rusCaseId: updatedRusCase.id,
        version: 1,
      };
      expect(createdHu3d).toEqual(expectedHu3d);

      // then: notification 생성되지 않음
      const notification = await notificationRepository.findOne({ userId: updatedRusCase.userId, category: Category.HU3D_COMPLETED });
      expect(notification).toBeUndefined();
    });

    test("성공 - 재업로드", async () => {
      // given
      await fs.promises.writeFile(attachFile, "");
      const prevRusCase = await rusCaseRepository.getOneById(rusCaseId);

      // when
      const res = await agent.post(`/rus-cases/${rusCaseId}/hu3d`).set("Content-Type", "multipart/form-data").attach("file", attachFile);

      // then
      const expected = { id: expect.any(Number) };
      expect(res.body).toEqual(expected);

      const updatedRusCase = await rusCaseRepository.findOne(rusCaseId);
      expect(updatedRusCase.status).toBe(RusCaseStatus.DONE);

      const createdHu3d = await hu3dRepository.findOne({ rusCaseId: Number(rusCaseId) });
      const expectedHu3d = {
        id: expect.any(Number),
        filePath: expect.any(String),
        fileName: expect.any(String),
        fileSize: expect.any(Number),
        rusCaseId: updatedRusCase.id,
        version: prevRusCase.hu3d.version + 1,
      };
      expect(createdHu3d).toEqual(expectedHu3d);
      const fstat = await fs.promises.stat(createdHu3d.filePath);
      expect(fstat.size).toBe(createdHu3d.fileSize);

      // then: notification 생성되지 않음
      const notification = await notificationRepository.findOne({ userId: updatedRusCase.userId, category: Category.HU3D_UPDATED });
      expect(notification).toBeUndefined();
    });
  });

  describe("대표 계정 요청", () => {
    const currentUser = targetAdmin;

    beforeEach(async () => {
      agent = supertest.agent(app.getHttpServer());
      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentUser.employeeId,
        password: currentUser.password,
        isForced: true,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", res.get("Set-Cookie"));
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("성공 - 신규 업로드", async () => {
      // given
      await fs.promises.writeFile(attachFile, "");
      await notificationRepository.delete({});
      await hu3dRepository.delete({ id: targetHu3d.id });

      // when
      const res = await agent.post(`/rus-cases/${rusCaseId}/hu3d`).set("Content-Type", "multipart/form-data").attach("file", attachFile);

      // then
      const expected = { id: expect.any(Number) };
      expect(res.body).toEqual(expected);

      const updatedRusCase = await rusCaseRepository.findOne(rusCaseId);
      expect(updatedRusCase.status).toBe(RusCaseStatus.DONE);

      const createdHu3d = await hu3dRepository.findOne({ rusCaseId: Number(rusCaseId) });
      const expectedHu3d = {
        id: expect.any(Number),
        filePath: expect.any(String),
        fileName: expect.any(String),
        fileSize: expect.any(Number),
        rusCaseId: updatedRusCase.id,
        version: 1,
      };
      expect(createdHu3d).toEqual(expectedHu3d);

      // then: notification 생성됨
      const notification = await notificationRepository.findOne({ userId: updatedRusCase.userId, category: Category.HU3D_COMPLETED });
      expect(notification).not.toBeUndefined();
    });

    test("성공 - 재업로드", async () => {
      // given
      await fs.promises.writeFile(attachFile, "");
      const prevRusCase = await rusCaseRepository.getOneById(rusCaseId);

      // when
      const res = await agent.post(`/rus-cases/${rusCaseId}/hu3d`).set("Content-Type", "multipart/form-data").attach("file", attachFile);

      // then
      const expected = { id: expect.any(Number) };
      expect(res.body).toEqual(expected);

      const updatedRusCase = await rusCaseRepository.findOne(rusCaseId);
      expect(updatedRusCase.status).toBe(RusCaseStatus.DONE);

      const createdHu3d = await hu3dRepository.findOne({ rusCaseId: Number(rusCaseId) });
      const expectedHu3d = {
        id: expect.any(Number),
        filePath: expect.any(String),
        fileName: expect.any(String),
        fileSize: expect.any(Number),
        rusCaseId: updatedRusCase.id,
        version: prevRusCase.hu3d.version + 1,
      };
      expect(createdHu3d).toEqual(expectedHu3d);
      const fstat = await fs.promises.stat(createdHu3d.filePath);
      expect(fstat.size).toBe(createdHu3d.fileSize);

      // then: notification 생성됨
      const notification = await notificationRepository.findOne({ userId: updatedRusCase.userId, category: Category.HU3D_UPDATED });
      expect(notification).not.toBeUndefined();
    });
  });
});

describe("POST /rus-cases/hu3d", () => {
  let agent: supertest.SuperAgentTest;
  const targetHu3d = testHu3ds[0];
  const targetRusCase = targetHu3d.rusCase;
  const rusCaseId = targetRusCase.id;
  const attachFile = `__test__/dummy/${targetRusCase.study.huId}-1.hu3d`;
  const rusCaseDir = config().core.hu3dPath;

  const otherRusCase = testRusCases[1];

  beforeAll(async () => {
    await fs.promises.mkdir("__test__/dummy").catch(() => false);
    await fs.promises.mkdir(rusCaseDir).catch(() => false);
  });

  beforeEach(async () => {
    await seederService.empty();
    await seederService.seedEncryption();
  });

  afterAll(async () => {
    await fs.promises.rm("__test__/dummy", { recursive: true, force: true });
    await fs.promises.rm(rusCaseDir, { recursive: true, force: true }).catch(() => false);
  });

  test("401 response, 헤더에 유효한 인증 정보가 없음", async () => {
    // given

    // when-then
    supertest.agent(app.getHttpServer()).post(`/rus-cases/hu3d`).set("Content-Type", "multipart/form-data").attach("file", attachFile).expect(401);
  });

  describe("h-Space 요청", () => {
    beforeEach(async () => {
      agent = supertest.agent(app.getHttpServer());

      const authToken = "hcloud-server";
      agent.set("x-auth-token", authToken);
    });

    test("BAD_REQUEST, 쿼리로 huId가 포함되지 않음", async () => {
      // given
      await fs.promises.writeFile(attachFile, "");

      // when
      const res = await agent.post(`/rus-cases/hu3d`).set("Content-Type", "multipart/form-data").attach("file", attachFile);

      // then
      expect(res.body.error).toBe(HutomHttpException.BAD_REQUEST.error);
    });

    test("INVALID_REQUEST_FILE_EXTENSION, 파일 확장자가 유효하지 않음", async () => {
      // given
      const invalidExtFile = `__test__/dummy/${process.env.SERVER_CODE}_0-1.zip`;
      await fs.promises.writeFile(invalidExtFile, "").catch(() => false);

      // when
      const query = { huId: otherRusCase.study.huId };
      const res = await agent.post(`/rus-cases/hu3d`).set("Content-Type", "multipart/form-data").query(query).attach("file", invalidExtFile);

      // then
      expect(res.body.error).toMatch(HutomHttpException.INVALID_REQUEST_FILE_EXTENSION.error);
    });

    test("INVALID_REQUEST_FILE_NAME, huId-버전 으로 시작해야 함 1)버전이 존재하지 않음", async () => {
      // given
      const invalidFileName = `__test__/dummy/${process.env.SERVER_CODE}_123.hu3d`;
      await fs.promises.writeFile(invalidFileName, "").catch(() => false);

      // when
      const query = { huId: otherRusCase.study.huId };
      const res = await agent.post(`/rus-cases/hu3d`).set("Content-Type", "multipart/form-data").query(query).attach("file", invalidFileName);

      // then
      expect(res.body.error).toMatch(HutomHttpException.INVALID_REQUEST_FILE_NAME.error);
    });

    test("INVALID_REQUEST_FILE_NAME, huId-버전 으로 시작해야 함 2)버전이 숫자가 아님", async () => {
      // given
      const invalidFileName = `__test__/dummy/${process.env.SERVER_CODE}_123-invalid.hu3d`;
      await fs.promises.writeFile(invalidFileName, "");

      // when
      const query = { huId: otherRusCase.study.huId };
      const res = await agent.post(`/rus-cases/hu3d`).set("Content-Type", "multipart/form-data").query(query).attach("file", invalidFileName);

      // then
      expect(res.body.error).toMatch(HutomHttpException.INVALID_REQUEST_FILE_NAME.error);
    });

    test("INVALID_REQUEST_FILE_NAME, huId-버전 으로 시작해야 함 3)huId와 파일명이 맞지 않음", async () => {
      // given
      await fs.promises.writeFile(attachFile, "");

      // when
      const query = { huId: otherRusCase.study.huId };
      const res = await agent.post(`/rus-cases/hu3d`).set("Content-Type", "multipart/form-data").query(query).attach("file", attachFile);

      // then
      expect(res.body.error).toMatch(HutomHttpException.INVALID_REQUEST_FILE_NAME.error);
    });

    test("성공 - 신규 업로드", async () => {
      // given
      await fs.promises.writeFile(attachFile, "");
      await notificationRepository.delete({});
      await hu3dRepository.delete({ id: targetHu3d.id });

      // when
      const query = { huId: targetRusCase.study.huId };
      const res = await agent.post(`/rus-cases/hu3d`).set("Content-Type", "multipart/form-data").query(query).attach("file", attachFile);

      // then
      const expected = { id: expect.any(Number) };
      expect(res.body).toEqual(expected);

      const updatedRusCase = await rusCaseRepository.findOne(rusCaseId);
      expect(updatedRusCase.status).toBe(RusCaseStatus.DONE);

      const createdHu3d = await hu3dRepository.findOne({ rusCaseId: Number(rusCaseId) });
      const expectedHu3d = {
        id: expect.any(Number),
        filePath: expect.any(String),
        fileName: expect.any(String),
        fileSize: expect.any(Number),
        rusCaseId: updatedRusCase.id,
        version: 1,
      };
      expect(createdHu3d).toEqual(expectedHu3d);

      // then: notification 생성됨
      const notification = await notificationRepository.findOne({ userId: updatedRusCase.userId, category: Category.HU3D_COMPLETED });
      expect(notification).not.toBeUndefined();
    });

    test("성공 - 재업로드", async () => {
      // given
      await fs.promises.writeFile(attachFile, "");
      const prevRusCase = await rusCaseRepository.getOneById(rusCaseId);

      // when
      const query = { huId: targetRusCase.study.huId };
      const res = await agent.post(`/rus-cases/hu3d`).set("Content-Type", "multipart/form-data").query(query).attach("file", attachFile);

      // then
      const expected = { id: expect.any(Number) };
      expect(res.body).toEqual(expected);

      const updatedRusCase = await rusCaseRepository.findOne(rusCaseId);
      expect(updatedRusCase.status).toBe(RusCaseStatus.DONE);

      const createdHu3d = await hu3dRepository.findOne({ rusCaseId: Number(rusCaseId) });
      const expectedHu3d = {
        id: expect.any(Number),
        filePath: expect.any(String),
        fileName: expect.any(String),
        fileSize: expect.any(Number),
        rusCaseId: updatedRusCase.id,
        version: prevRusCase.hu3d.version + 1,
      };
      expect(createdHu3d).toEqual(expectedHu3d);
      const fstat = await fs.promises.stat(createdHu3d.filePath);
      expect(fstat.size).toBe(createdHu3d.fileSize);

      // then: notification 생성됨
      const notification = await notificationRepository.findOne({ userId: updatedRusCase.userId, category: Category.HU3D_UPDATED });
      expect(notification).not.toBeUndefined();
    });
  });
});
