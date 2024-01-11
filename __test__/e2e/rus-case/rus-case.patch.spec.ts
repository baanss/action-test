import { of } from "rxjs";
import * as moment from "moment";
import * as supertest from "supertest";
import * as cookieParser from "cookie-parser";
import { INestApplication } from "@nestjs/common";
import { HttpService } from "@nestjs/axios";

import { generateNestApplication } from "@test/util/test.util";

import { testAdmins, testUsers } from "@root/seeding/seeder/seed/user.seed";
import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { testRusCases } from "@root/seeding/seeder/seed/rus-case.seed";

import { HutomHttpException } from "@src/common/constant/http-exception.constant";

import { RusCaseRepository } from "@src/rus-case/repository/rus-case.repository";
import { RusCaseStatus } from "@src/common/constant/enum.constant";
import { CreditHistoryRepository } from "@src/credit-history/repository/credit-history.repository";
import { CreditCategory } from "@src/common/entity/credit-history.entity";
import { StudyRepository } from "@src/study/repository/study.repository";
import { NotificationRepository } from "@src/notification/repository/notification.repository";
import { Category } from "@src/common/entity/notification.entity";
import { DicomRepository } from "@src/study/repository/dicom.repository";
import { UserRepository } from "@src/user/repository/user.repository";
import { ClinicalInfoRepository } from "@src/rus-case/repository/clinical-info.repository";
import { Role } from "@src/auth/interface/auth.interface";

let app: INestApplication;
let httpService: HttpService;
let seederService: SeederService;
let rusCaseRepository: RusCaseRepository;
let creditHistoryRepository: CreditHistoryRepository;
let studyRepository: StudyRepository;
let notificationRepository: NotificationRepository;
let dicomRepository: DicomRepository;
let userRepository: UserRepository;
let clinicalInfoRepository: ClinicalInfoRepository;

const customOriginHeaderKey = "x-origin";
const userServiceOrigin = "user";

beforeAll(async () => {
  app = await generateNestApplication();
  httpService = app.get<HttpService>(HttpService);

  app.use(cookieParser());
  seederService = app.get(SeederService);
  rusCaseRepository = app.get(RusCaseRepository);
  creditHistoryRepository = app.get(CreditHistoryRepository);
  studyRepository = app.get(StudyRepository);
  notificationRepository = app.get(NotificationRepository);
  dicomRepository = app.get(DicomRepository);
  userRepository = app.get(UserRepository);
  clinicalInfoRepository = app.get(ClinicalInfoRepository);

  await app.init();
});

afterAll(async () => {
  await app.close();
});

describe("PATCH /rus-cases", () => {
  test("UNAUTHORIZED_AUTH_TOKEN, 헤더에 유효한 인증 정보가 없음", async () => {
    // given

    // when
    const res = await supertest.agent(app.getHttpServer()).patch(`/rus-cases`);

    // then
    expect(res.body.error).toBe(HutomHttpException.UNAUTHORIZED_AUTH_TOKEN.error);
  });

  describe("h-Space 요청", () => {
    let agent: supertest.SuperAgentTest;

    beforeAll(async () => {
      agent = supertest.agent(app.getHttpServer());

      const authToken = "hcloud-server";
      agent.set("x-auth-token", authToken);
    });

    beforeEach(async () => {
      await seederService.empty();
      await seederService.seedEncryption();
    });

    test("BAD_REQUEST - 잘못된 요청", async () => {
      // given

      // when
      const query = { foo: false };
      const res = await agent.patch(`/rus-cases`).query(query);

      // then
      expect(res.body.error).toBe(HutomHttpException.BAD_REQUEST.error);
    });

    test("NOT_FOUND_RUS_CASE_WITH_HUID - huId와 매칭되는 rusCase가 없는 경우", async () => {
      // given

      // when
      const query = { huId: "invalid" };
      const body = { status: RusCaseStatus.IN_PROGRESS };
      const res = await agent.patch(`/rus-cases`).query(query).send(body);

      // then
      expect(res.body.error).toBe(HutomHttpException.NOT_FOUND_RUS_CASE_WITH_HUID.error);
    });

    test("status(REJECT) 수정 요청 실패, INVALID_RUS_CASE_STATUS_UPDATE - 이미 REJECT 상태인 케이스는 수정할 수 없다.", async () => {
      // given
      const targetRusCase = testRusCases[0];
      await rusCaseRepository.update(targetRusCase.id, { status: RusCaseStatus.REJECT });

      // when
      const query = { huId: targetRusCase.study.huId };
      const body = { status: RusCaseStatus.REJECT };
      const res = await agent.patch(`/rus-cases`).query(query).send(body);

      // then
      expect(res.body.error).toBe(HutomHttpException.INVALID_RUS_CASE_STATUS_UPDATE.error);
    });

    test("status(REJECT) 수정 요청 실패, INVALID_RUS_CASE_STATUS_UPDATE - 이미 DONE 상태인 케이스는 수정할 수 없다.", async () => {
      // given
      const targetRusCase = testRusCases[0];
      await rusCaseRepository.update(targetRusCase.id, { status: RusCaseStatus.DONE });

      // when
      const query = { huId: targetRusCase.study.huId };
      const body = { status: RusCaseStatus.REJECT };
      const res = await agent.patch(`/rus-cases`).query(query).send(body);

      // then
      expect(res.body.error).toBe(HutomHttpException.INVALID_RUS_CASE_STATUS_UPDATE.error);
    });

    test("status(REJECT) 수정 요청 실패, NOT_FOUND_USER_WITH_ID - 사용자가 존재하지 않는 경우", async () => {
      // given
      const targetRusCase = testRusCases[0];
      await rusCaseRepository.update(targetRusCase.id, { user: null, status: RusCaseStatus.IN_PROGRESS });

      // when
      const query = { huId: targetRusCase.study.huId };
      const body = { status: RusCaseStatus.REJECT };
      const res = await agent.patch(`/rus-cases`).query(query).send(body);

      // then
      expect(res.body.error).toBe(HutomHttpException.NOT_FOUND_USER_WITH_ID.error);
    });

    test("status(REJECT) 수정 요청 성공 - 완료 상태가 아닌 케이스는 수정할 수 있다.", async () => {
      // given
      const targetRusCase = testRusCases[0];
      await rusCaseRepository.update(targetRusCase.id, { status: RusCaseStatus.TODO });
      const prevCreditHistory = await creditHistoryRepository.findLatestOne();

      // when
      const query = { huId: targetRusCase.study.huId };
      const body = { status: RusCaseStatus.REJECT };
      const res = await agent.patch(`/rus-cases`).query(query).send(body);

      // then
      const expectedResult = { id: expect.any(Number) };
      expect(res.body).toEqual(expectedResult);

      const postRusCase = await rusCaseRepository.findOne(targetRusCase.id);
      expect(postRusCase.status).toBe(RusCaseStatus.REJECT);

      const postCreditHistory = await creditHistoryRepository.findLatestOne();
      expect(postCreditHistory).not.toEqual(prevCreditHistory);
      const expectedCreditHistory = {
        id: expect.any(Number),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        userId: null,
        employeeId: "hutom",
        name: "hutom",
        category: CreditCategory.RUS_CANCEL,
        huId: targetRusCase.study.huId,
        quantity: 1,
        status: true,
        isUserRequest: false,
      };
      expect(postCreditHistory).toEqual(expectedCreditHistory);

      const postDicom = await dicomRepository.findOne({ studyId: targetRusCase.study.id });
      expect(postDicom.filePath).toBeNull();
      expect(postDicom.fileSize).toBe(0);
    });

    test("status(REJECT 이외) 수정 요청 실패, INVALID_RUS_CASE_STATUS_UPDATE - 이미 REJECT 상태인 케이스는 수정할 수 없다.", async () => {
      // given
      const targetRusCase = testRusCases[0];
      await rusCaseRepository.update(targetRusCase.id, { status: RusCaseStatus.REJECT });

      // when
      const query = { huId: targetRusCase.study.huId };
      const body = { status: RusCaseStatus.IN_PROGRESS };
      const res = await agent.patch(`/rus-cases`).query(query).send(body);

      // then
      expect(res.body.error).toBe(HutomHttpException.INVALID_RUS_CASE_STATUS_UPDATE.error);
    });

    test("status(REJECT 이외) 수정 요청 실패, INVALID_RUS_CASE_STATUS_UPDATE - 이미 DONE 상태인 케이스는 수정할 수 없다.", async () => {
      // given
      const targetRusCase = testRusCases[0];
      await rusCaseRepository.update(targetRusCase.id, { status: RusCaseStatus.DONE });

      // when
      const query = { huId: targetRusCase.study.huId };
      const body = { status: RusCaseStatus.IN_PROGRESS };
      const res = await agent.patch(`/rus-cases`).query(query).send(body);

      // then
      expect(res.body.error).toBe(HutomHttpException.INVALID_RUS_CASE_STATUS_UPDATE.error);
    });

    test("status(REJECT 이외) 수정 요청 성공 - 기존 값과 동일해도 수정할 수 있다.", async () => {
      // given
      const targetRusCase = testRusCases[0];
      await rusCaseRepository.update(targetRusCase.id, { status: RusCaseStatus.IN_PROGRESS });

      // when
      const query = { huId: targetRusCase.study.huId };
      const body = { status: RusCaseStatus.IN_PROGRESS };
      const res = await agent.patch(`/rus-cases`).query(query).send(body);

      // then
      const expectedResult = { id: expect.any(Number) };
      expect(res.body).toEqual(expectedResult);

      const postRusCase = await rusCaseRepository.findOne(targetRusCase.id);
      expect(postRusCase.status).toBe(body.status);
    });

    test("operationDate 수정 요청 성공 - 기존 값과 동일해도 수정할 수 있다.", async () => {
      // given
      const targetRusCase = testRusCases[0];
      const operationDate = moment("2020-01-01").toISOString();
      await clinicalInfoRepository.update({ rusCaseId: targetRusCase.id }, { operationDate });

      // when
      const query = { huId: targetRusCase.study.huId };
      const body = { operationDate };
      const res = await agent.patch(`/rus-cases`).query(query).send(body);

      // then
      const expectedResult = { id: expect.any(Number) };
      expect(res.body).toEqual(expectedResult);

      const postClinicalInfo = await clinicalInfoRepository.findOne({ rusCaseId: targetRusCase.id });
      expect(postClinicalInfo.operationDate.toISOString()).toBe(body.operationDate);
    });

    test("deliveryDate 수정 요청 성공 - 기존 값과 동일해도 수정할 수 있다.", async () => {
      // given
      const targetRusCase = testRusCases[0];
      const deliveryDate = moment("2020-01-01").toISOString();
      await clinicalInfoRepository.update({ rusCaseId: targetRusCase.id }, { deliveryDate });

      // when
      const query = { huId: targetRusCase.study.huId };
      const body = { deliveryDate };
      const res = await agent.patch(`/rus-cases`).query(query).send(body);

      // then
      const expectedResult = { id: expect.any(Number) };
      expect(res.body).toEqual(expectedResult);

      const postClinicalInfo = await clinicalInfoRepository.findOne({ rusCaseId: targetRusCase.id });
      expect(postClinicalInfo.deliveryDate.toISOString()).toBe(body.deliveryDate);
    });

    test("성공", async () => {
      // given
      const targetRusCase = testRusCases[0];
      await rusCaseRepository.update(targetRusCase.id, { status: RusCaseStatus.IN_PROGRESS });
      await clinicalInfoRepository.update(
        { rusCaseId: targetRusCase.id },
        { operationDate: moment("2020-12-01").toISOString(), deliveryDate: moment("2021-12-01").toISOString() },
      );

      // when
      const query = { huId: targetRusCase.study.huId };
      const body = { status: RusCaseStatus.DONE, operationDate: moment("2020-06-01").toISOString(), deliveryDate: moment("2021-06-01").toISOString() };
      const res = await agent.patch(`/rus-cases`).query(query).send(body);

      // then
      const expectedResult = { id: expect.any(Number) };
      expect(res.body).toEqual(expectedResult);

      const postRusCase = await rusCaseRepository.getOneByHuId(query.huId);
      expect(postRusCase.status).toBe(body.status);
      expect(postRusCase.clinicalInfo.operationDate?.toISOString()).toBe(body.operationDate);
      expect(postRusCase.clinicalInfo.deliveryDate.toISOString()).toBe(body.deliveryDate);
    });
  });
});

describe("PATCH /rus-cases/:id", () => {
  beforeAll(async () => {
    jest.restoreAllMocks();
    const mockAxiosResponse = {
      data: {
        message: "RusCase 취소 성공",
      },
      status: 200,
      statusText: "OK",
      headers: {},
      config: {},
    };
    jest.spyOn(httpService, "post").mockImplementation(() => of(mockAxiosResponse));
  });

  afterAll(async () => {
    jest.clearAllMocks();
  });

  test("401 response, 헤더에 유효한 인증 정보가 없음", (done) => {
    // given
    const rusCaseId = "1";

    // when-then
    supertest.agent(app.getHttpServer()).patch(`/rus-cases/${rusCaseId}`).expect(401, done);
  });

  describe("일반 계정 요청", () => {
    const currentUser = testUsers[0];
    let agent: supertest.SuperAgentTest;

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

    test("BAD_REQUEST - 잘못된 요청", async () => {
      // given

      // when
      const rusCaseId = 1;
      const body = { foo: false };
      const res = await agent.patch(`/rus-cases/${rusCaseId}`).send(body);

      // then
      expect(res.body.error).toBe(HutomHttpException.BAD_REQUEST.error);
    });

    test("INVALID_REQUEST_PARAMETER - 잘못된 요청", async () => {
      // given

      // when
      const rusCaseId = "invalid";
      const body = { isCancelled: true };
      const res = await agent.patch(`/rus-cases/${rusCaseId}`).send(body);

      // then
      expect(res.body.error).toBe(HutomHttpException.INVALID_REQUEST_PARAMETER.error);
    });

    test("NOT_FOUND_RUS_CASE_WITH_ID - 요청한 케이스 존재하지 않음", async () => {
      // given

      // when
      const rusCaseId = 9999;
      const body = { isCancelled: true };
      const res = await agent.patch(`/rus-cases/${rusCaseId}`).send(body);

      // then
      expect(res.body.error).toBe(HutomHttpException.NOT_FOUND_RUS_CASE_WITH_ID.error);
    });

    test("FORBIDDEN_RESOURCE - 자원에 접근 권한 없음", async () => {
      // given
      const targetRusCase = await rusCaseRepository.findOne();
      await rusCaseRepository.update(targetRusCase.id, { userId: testAdmins[0].id, status: RusCaseStatus.TODO });

      // when
      const body = { isCancelled: true };
      const res = await agent.patch(`/rus-cases/${targetRusCase.id}`).send(body);

      // then
      expect(res.body.error).toBe(HutomHttpException.FORBIDDEN_RESOURCE.error);
    });

    test("INVALID_RUS_CASE_REJECT_REQUEST_STATUS - rusCase 상태가 TODO가 아닌 경우", async () => {
      // given
      const targetRusCase = await rusCaseRepository.findOne();
      await rusCaseRepository.update(targetRusCase.id, { userId: currentUser.id, status: RusCaseStatus.IN_PROGRESS });

      // when
      const body = { isCancelled: true };
      const res = await agent.patch(`/rus-cases/${targetRusCase.id}`).send(body);

      // then
      expect(res.body.error).toBe(HutomHttpException.INVALID_RUS_CASE_REJECT_REQUEST_STATUS.error);
    });

    test("RusCase 작업 취소 성공", async () => {
      // given
      const targetRusCase = await rusCaseRepository.findOne();
      await rusCaseRepository.update(targetRusCase.id, { status: RusCaseStatus.TODO });
      const prevCeditHistory = await creditHistoryRepository.findLatestOne();

      // when
      const body = { isCancelled: true };
      const res = await agent.patch(`/rus-cases/${targetRusCase.id}`).send(body);

      // then: 응답 결과
      expect(res.body.id).toBe(targetRusCase.id);

      // then: rusCase 상태 변경
      const rusCase = await rusCaseRepository.findOne(targetRusCase.id);
      expect(rusCase.status).toBe(RusCaseStatus.REJECT);

      // then: 크레딧 환불(이력 생성)
      const study = await studyRepository.findOne(rusCase.studyId);
      const postCeditHistory = await creditHistoryRepository.findLatestOne();
      expect(postCeditHistory).not.toEqual(prevCeditHistory);
      const expectedCreditHistory = {
        id: expect.any(Number),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        userId: currentUser.id,
        employeeId: currentUser.employeeId,
        name: currentUser.name,
        category: CreditCategory.RUS_CANCEL,
        huId: study.huId,
        quantity: 1,
        status: true,
        isUserRequest: true,
      };
      expect(postCeditHistory).toEqual(expectedCreditHistory);

      // then: 크레딧 환불(알림 생성) - 요청 계정, 대표 계정
      const rusCanceledNotiToUser = await notificationRepository.findOne({ category: Category.RUS_CANCELED, userId: rusCase.userId });
      expect(rusCanceledNotiToUser).not.toBeUndefined();

      const admin = await userRepository.getAdmin();
      const rusCanceledNotiToAdmin = await notificationRepository.findOne({ category: Category.RUS_CANCELED, userId: admin.id });
      expect(rusCanceledNotiToAdmin).not.toBeUndefined();

      // then: 다이콤파일 제거
      const dicom = await dicomRepository.getOneByStudyId(rusCase.studyId);
      expect(dicom.filePath).toBeNull();
      expect(dicom.fileSize).toBe(0);

      // then: 다이콤파일 제거(알림 생성)
      const ctDeletedNotiToUser = await notificationRepository.findOne({ category: Category.CT_DELETED, userId: rusCase.userId });
      expect(ctDeletedNotiToUser).not.toBeUndefined();
    });
  });

  describe("대표 계정 요청", () => {
    let agent: supertest.SuperAgentTest;
    const currentAdmin = testAdmins[0];

    beforeEach(async () => {
      await seederService.empty();
      await seederService.seedEncryption();
      await userRepository.update({ role: Role.ADMIN }, { role: Role.USER });
      await userRepository.update(testAdmins[0].id, { role: Role.ADMIN });

      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentAdmin.employeeId,
        password: currentAdmin.password,
        isForced: true,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", res.get("Set-Cookie"));
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("NOT_FOUND_USER_WITH_ID - rusCase 소유자가 삭제된 경우", async () => {
      // given
      const targetRusCase = testRusCases[0];
      await rusCaseRepository.update(targetRusCase.id, { status: RusCaseStatus.TODO, user: null });

      // when
      const body = { isCancelled: true };
      const res = await agent.patch(`/rus-cases/${targetRusCase.id}`).send(body);

      // then
      expect(res.body.error).toBe(HutomHttpException.NOT_FOUND_USER_WITH_ID.error);
    });

    test("성공 - 자신이 생성한 케이스가 아닌 경우", async () => {
      // given
      const targetRusCase = await rusCaseRepository.findOne();
      await rusCaseRepository.update(targetRusCase.id, { status: RusCaseStatus.TODO, userId: testUsers[0].id });
      const prevCeditHistory = await creditHistoryRepository.findLatestOne();

      // when
      const body = { isCancelled: true };
      const res = await agent.patch(`/rus-cases/${targetRusCase.id}`).send(body);

      // then: 응답 결과
      expect(res.body.id).toBe(targetRusCase.id);

      // then: rusCase 상태 변경
      const rusCase = await rusCaseRepository.findOne(targetRusCase.id);
      expect(rusCase.status).toBe(RusCaseStatus.REJECT);

      // then: 크레딧 환불(이력 생성)
      const study = await studyRepository.findOne(rusCase.studyId);
      const postCeditHistory = await creditHistoryRepository.findLatestOne();
      expect(postCeditHistory).not.toEqual(prevCeditHistory);
      const expectedCreditHistory = {
        id: expect.any(Number),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        userId: currentAdmin.id,
        employeeId: currentAdmin.employeeId,
        name: currentAdmin.name,
        category: CreditCategory.RUS_CANCEL,
        huId: study.huId,
        quantity: 1,
        status: true,
        isUserRequest: true,
      };
      expect(postCeditHistory).toEqual(expectedCreditHistory);

      // then: 크레딧 환불(알림 생성)
      const rusCanceledNoti = await notificationRepository.find({ category: Category.RUS_CANCELED });
      expect(rusCanceledNoti).toHaveLength(2);

      // then: 다이콤파일 제거
      const dicom = await dicomRepository.getOneByStudyId(rusCase.studyId);
      expect(dicom.filePath).toBeNull();
      expect(dicom.fileSize).toBe(0);

      // then: 다이콤파일 제거(알림 생성)
      const ctDeletedNotiToUser = await notificationRepository.find({ category: Category.CT_DELETED, userId: rusCase.userId });
      expect(ctDeletedNotiToUser).toHaveLength(1);
    });

    test("성공 - 자신이 생성한 케이스인 경우", async () => {
      // given
      const targetRusCase = await rusCaseRepository.findOne();
      await rusCaseRepository.update(targetRusCase.id, { status: RusCaseStatus.TODO, userId: currentAdmin.id });
      const prevCeditHistory = await creditHistoryRepository.findLatestOne();

      // when
      const body = { isCancelled: true };
      const res = await agent.patch(`/rus-cases/${targetRusCase.id}`).send(body);

      // then: 응답 결과
      expect(res.body.id).toBe(targetRusCase.id);

      // then: rusCase 상태 변경
      const rusCase = await rusCaseRepository.findOne(targetRusCase.id);
      expect(rusCase.status).toBe(RusCaseStatus.REJECT);

      // then: 크레딧 환불(이력 생성)
      const study = await studyRepository.findOne(rusCase.studyId);
      const postCeditHistory = await creditHistoryRepository.findLatestOne();
      expect(postCeditHistory).not.toEqual(prevCeditHistory);
      const expectedCreditHistory = {
        id: expect.any(Number),
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
        userId: currentAdmin.id,
        employeeId: currentAdmin.employeeId,
        name: currentAdmin.name,
        category: CreditCategory.RUS_CANCEL,
        huId: study.huId,
        quantity: 1,
        status: true,
        isUserRequest: true,
      };
      expect(postCeditHistory).toEqual(expectedCreditHistory);

      // then: 크레딧 환불(알림 생성)
      const rusCanceledNoti = await notificationRepository.find({ category: Category.RUS_CANCELED });
      expect(rusCanceledNoti).toHaveLength(1);

      // then: 다이콤파일 제거
      const dicom = await dicomRepository.getOneByStudyId(rusCase.studyId);
      expect(dicom.filePath).toBeNull();
      expect(dicom.fileSize).toBe(0);

      // then: 다이콤파일 제거(알림 생성)
      const ctDeletedNotiToUser = await notificationRepository.find({ category: Category.CT_DELETED });
      expect(ctDeletedNotiToUser).toHaveLength(1);
    });

    test("h-Space 서버 에러 시, 롤백됨", async () => {
      // given
      jest.restoreAllMocks();

      const targetRusCase = await rusCaseRepository.findOne();
      await rusCaseRepository.update(targetRusCase.id, { status: RusCaseStatus.TODO });
      const prevRusCase = await rusCaseRepository.findOne(targetRusCase.id);
      const prevCreditHistory = await creditHistoryRepository.findLatestOne();
      const prevNotifications = await notificationRepository.find();
      const prevDicom = await dicomRepository.getOneByStudyId(targetRusCase.studyId);

      // when
      const body = { isCancelled: true };
      await agent.patch(`/rus-cases/${targetRusCase.id}`).send(body).expect(400);

      // then
      const postRusCase = await rusCaseRepository.findOne(targetRusCase.id);
      expect(postRusCase).toEqual(prevRusCase);

      const postCreditHistory = await creditHistoryRepository.findLatestOne();
      expect(postCreditHistory).toEqual(prevCreditHistory);

      const postNotifications = await notificationRepository.find();
      expect(postNotifications).toHaveLength(prevNotifications.length);

      const postDicom = await dicomRepository.getOneByStudyId(targetRusCase.studyId);
      expect(postDicom).toEqual(prevDicom);
    });
  });
});
