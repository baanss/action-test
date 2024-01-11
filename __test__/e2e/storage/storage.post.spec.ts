import * as fs from "fs";
import * as supertest from "supertest";
import * as cookieParser from "cookie-parser";
import { INestApplication } from "@nestjs/common";

import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { generateNestApplication } from "@test/util/test.util";
import { testAdmins, testUsers } from "@root/seeding/seeder/seed/user.seed";
import { testDicoms } from "@root/seeding/seeder/seed/dicom.seed";
import { testHu3ds } from "@root/seeding/seeder/seed/hu3d.seed";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import config from "@src/common/config/configuration";
import { SessionRepository } from "@src/auth/repository/session.repository";
import { FileType } from "@src/common/constant/enum.constant";
import { NotificationRepository } from "@src/notification/repository/notification.repository";
import { Category } from "@src/common/entity/notification.entity";
import { RusCaseRepository } from "@src/rus-case/repository/rus-case.repository";

let app: INestApplication;
let seederService: SeederService;

let sessionRepository: SessionRepository;
let notificationRepository: NotificationRepository;
let rusCaseRepository: RusCaseRepository;

const customOriginHeaderKey = "x-origin";
const userServiceOrigin = "user";

const currentAdmin = testAdmins[0];

// 파일 존재 검사
async function checkFileExists(file: string) {
  return fs.promises
    .access(file, fs.constants.F_OK)
    .then(() => true)
    .catch(() => false);
}

beforeAll(async () => {
  app = await generateNestApplication();
  app.use(cookieParser());

  seederService = app.get(SeederService);

  sessionRepository = app.get(SessionRepository);
  notificationRepository = app.get(NotificationRepository);
  rusCaseRepository = app.get(RusCaseRepository);

  await app.init();
  await seederService.empty();
  await seederService.seedEncryption();
});

afterAll(async () => {
  await seederService.empty();
  await app.close();
});

describe("POST /storage/delete-files", () => {
  test("401 response, 헤더에 유효한 인증 정보가 없음", (done) => {
    supertest.agent(app.getHttpServer()).post("/storage/delete-files").expect(401, done);
  });

  describe("일반 계정 요청", () => {
    let agent: supertest.SuperAgentTest;
    const currentUser = testUsers[0];

    beforeEach(async () => {
      await sessionRepository.clear();

      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentUser.employeeId,
        password: currentUser.password,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", res.get("Set-Cookie"));
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("접근 권한 없음", async () => {
      //given
      const studyIds = [1, 2];
      const types = [FileType.CT, FileType.HU3D];
      const password = currentUser.password;

      // when
      const res = await agent.post("/storage/delete-files").send({ studyIds, types, password });

      // then
      expect(res.body.error).toBe(HutomHttpException.FORBIDDEN_RESOURCE.error);
    });
  });

  describe("대표 계정 요청", () => {
    let agent: supertest.SuperAgentTest;
    const currentUser = testAdmins[0];

    beforeEach(async () => {
      await sessionRepository.clear();

      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentUser.employeeId,
        password: currentUser.password,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", res.get("Set-Cookie"));
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("FORBIDDEN_RESOURCE_INCORRECT_PASSWORD - 비밀번호 틀림", async () => {
      //given
      const studyIds = [5]; // 케이스 등록 안됨
      const types = [FileType.CT];
      const password = "invalid";

      // when
      const res = await agent.post("/storage/delete-files").send({ studyIds, types, password });

      // then, 응답이 제대로 들어온다.
      expect(res.body.error).toMatch(HutomHttpException.FORBIDDEN_RESOURCE_INCORRECT_PASSWORD.error);
    });

    describe("200 response - failed", () => {
      test("study가 등록되지 않음", async () => {
        //given
        const studyIds = [0]; // study 존재하지 않음
        const types = [FileType.HU3D, FileType.CT];
        const password = currentUser.password;

        // when
        const res = await agent.post("/storage/delete-files").send({ studyIds, types, password }).expect(200);

        // then
        const expectedResponse = { ids: expect.any(Array), meta: { failed: expect.any(Array) } };
        expect(res.body).toEqual(expectedResponse);
        expect(res.body.ids).toHaveLength(0);
        expect(res.body.meta.failed).toHaveLength(2);
        const expectedFailedCT = {
          id: studyIds[0],
          type: FileType.CT,
          fileName: null,
          error: HutomHttpException.NOT_FOUND_DICOM_WITH_STUDY_ID.error,
        };
        expect(res.body.meta.failed[0]).toEqual(expectedFailedCT);
        const expectedFailedHu3d = {
          id: studyIds[0],
          type: FileType.HU3D,
          fileName: null,
          error: HutomHttpException.NOT_FOUND_HU3D_WITH_STUDY_ID.error,
        };
        expect(res.body.meta.failed[1]).toEqual(expectedFailedHu3d);
      });

      test("NOT_FOUND_HU3D_WITH_STUDY_ID, hu3d 파일을 조회할 수 없음", async () => {
        //given
        const studyIds = [4]; // hu3d 파일 등록되지 않음
        const types = [FileType.HU3D];
        const password = currentUser.password;

        // when
        const res = await agent.post("/storage/delete-files").send({ studyIds, types, password }).expect(200);

        // then, 응답이 제대로 들어온다.
        expect(res.body.ids).toHaveLength(0);
        expect(res.body.meta.failed).toHaveLength(1);
        const expectedFailedHu3d = {
          id: studyIds[0],
          type: FileType.HU3D,
          fileName: null,
          error: HutomHttpException.NOT_FOUND_HU3D_WITH_STUDY_ID.error,
        };
        expect(res.body.meta.failed[0]).toEqual(expectedFailedHu3d);
      });

      test("NOT_FOUND_DICOM_WITH_STUDY_ID, 다이콤 파일을 조회할 수 없음", async () => {
        //given
        const studyIds = [0]; // study 존재하지 않음
        const types = [FileType.CT];
        const password = currentUser.password;

        // when
        const res = await agent.post("/storage/delete-files").send({ studyIds, types, password }).expect(200);

        // then, 응답이 제대로 들어온다.
        expect(res.body.ids).toHaveLength(0);
        expect(res.body.meta.failed).toHaveLength(1);
        const expectedFailedCT = {
          id: studyIds[0],
          type: FileType.CT,
          fileName: null,
          error: HutomHttpException.NOT_FOUND_DICOM_WITH_STUDY_ID.error,
        };
        expect(res.body.meta.failed[0]).toEqual(expectedFailedCT);
      });

      test("파일 삭제 실패 시, 알림 생성되지 않음", async () => {
        //given
        await notificationRepository.delete({});
        const studyIds = [0]; // study 존재하지 않음
        const types = [FileType.CT];
        const password = currentUser.password;

        // when
        const res = await agent.post("/storage/delete-files").send({ studyIds, types, password }).expect(200);

        // then, 응답이 제대로 들어온다.
        expect(res.body.ids).toHaveLength(0);
        expect(res.body.meta.failed).toHaveLength(1);

        // then: notification 생성되지 않음
        const noti = await notificationRepository.findOne({ category: Category.CT_DELETED });
        expect(noti).toBeUndefined();
      });
    });

    describe("200 response - success", () => {
      beforeEach(async () => {
        await seederService.empty();
        await seederService.seedEncryption();

        const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
          employeeId: currentAdmin.employeeId,
          password: currentAdmin.password,
        });

        agent = supertest.agent(app.getHttpServer());
        agent.set("Cookie", res.get("Set-Cookie"));
        agent.set(customOriginHeaderKey, userServiceOrigin);
      });

      afterAll(async () => {
        await fs.promises.rm(config().core.dicomPath, { recursive: true, force: true }).catch(() => false);
        await fs.promises.rm(config().core.hu3dPath, { recursive: true, force: true }).catch(() => false);
      });

      test("CT 파일 삭제", async () => {
        //given
        await notificationRepository.delete({});
        const targetDicom1 = testDicoms[0];
        const targetDicom2 = testDicoms[1];

        const studyIds = [targetDicom1.study.id, targetDicom2.study.id];
        const types = [FileType.CT];
        const password = currentUser.password;

        // when
        const res = await agent.post("/storage/delete-files").send({ studyIds, types, password }).expect(200);

        // then
        const expectedResult = {
          ids: [studyIds[0], studyIds[1]],
          meta: {
            failed: [],
          },
        };
        expect(res.body).toEqual(expectedResult);

        // then
        const rusCase1 = await rusCaseRepository.getOneByStudyId(targetDicom1.study.id);
        const noti1 = await notificationRepository.findOne({ userId: rusCase1.userId });
        expect(noti1.category).toBe(Category.CT_DELETED);

        const rusCase2 = await rusCaseRepository.getOneByStudyId(targetDicom2.study.id);
        const noti2 = await notificationRepository.findOne({ userId: rusCase2.userId });
        expect(noti2.category).toBe(Category.CT_DELETED);
      });

      test("RUS Case 존재하지 않는 경우, 알림 생성 무시됨", async () => {
        //given
        const studyIds = [1, 5]; // 1: 케이스 등록됨 + 5: 케이스 등록되지 않음
        const types = [FileType.CT];
        const password = currentUser.password;

        // when
        const res = await agent.post("/storage/delete-files").send({ studyIds, types, password }).expect(200);

        // then
        const expectedResult = {
          ids: [studyIds[0], studyIds[1]],
          meta: {
            failed: [],
          },
        };
        expect(res.body).toEqual(expectedResult);

        // then
        const notis = await notificationRepository.find({ category: Category.CT_DELETED });
        expect(notis).toHaveLength(1);

        const rusCase1 = await rusCaseRepository.getOneByStudyId(studyIds[0]);
        expect(notis[0].userId).toBe(rusCase1.userId);
      });

      test("CT 타입", async () => {
        //given
        await notificationRepository.delete({});
        const targetDicom1 = testDicoms[0];
        const targetdicom2 = testDicoms[1];
        const studyIds = [targetDicom1.study.id, targetdicom2.study.id];
        const types = [FileType.CT];
        const password = currentUser.password;

        // when
        const res = await agent.post("/storage/delete-files").send({ studyIds, types, password }).expect(200);

        // then, 응답이 제대로 들어온다.
        expect(res.body.ids).toHaveLength(studyIds.length * types.length);

        // then, DICOM 파일이 지워졌다
        const isExistDicom1 = await checkFileExists(targetDicom1.filePath);
        expect(isExistDicom1).toBeFalsy();

        const isExistDicom2 = await checkFileExists(targetdicom2.filePath);
        expect(isExistDicom2).toBeFalsy();

        // then: RUS Case 요청 계정에게 알림 생성됨
        const notis = await notificationRepository.find({ category: Category.CT_DELETED, read: false });
        expect(notis).toHaveLength(2);
      });

      test("HU3D 타입", async () => {
        //given
        const studyIds = [1, 2]; // 1: 케이스 등록됨 + 2: 케이스 등록됨
        const types = [FileType.HU3D];
        const password = currentUser.password;

        // when
        const res = await agent.post("/storage/delete-files").send({ studyIds, types, password }).expect(200);

        // then, 응답이 제대로 들어온다.
        expect(res.body.ids).toHaveLength(studyIds.length * types.length);

        // then, HU3D 파일이 지워졌다
        const isExistHu3d1 = await checkFileExists(testHu3ds[0].filePath);
        expect(isExistHu3d1).toBeFalsy();

        const isExistHu3d2 = await checkFileExists(testHu3ds[1].filePath);
        expect(isExistHu3d2).toBeFalsy();

        // then: RUS Case 요청 계정에게 알림 생성됨
        const notis = await notificationRepository.find({ category: Category.HU3D_DELETED, read: false });
        expect(notis).toHaveLength(2);
      });

      test("CT, HU3D 타입", async () => {
        //given
        const studyIds = [1, 2];
        const types = [FileType.CT, FileType.HU3D];
        const password = currentUser.password;

        // when
        const res = await agent.post("/storage/delete-files").send({ studyIds, types, password }).expect(200);

        // then, 응답이 제대로 들어온다.
        expect(res.body.ids).toHaveLength(studyIds.length * types.length);

        // then, DICOM 파일이 지워졌다
        const isExistDicom1 = await checkFileExists(testDicoms[0].filePath);
        expect(isExistDicom1).toBeFalsy();

        const isExistDicom2 = await checkFileExists(testDicoms[1].filePath);
        expect(isExistDicom2).toBeFalsy();

        // then, HU3D 파일이 지워졌다
        const isExistHu3d1 = await checkFileExists(testHu3ds[0].filePath);
        expect(isExistHu3d1).toBeFalsy();

        const isExistHu3d2 = await checkFileExists(testHu3ds[1].filePath);
        expect(isExistHu3d2).toBeFalsy();

        // then: RUS Case 요청 계정에게 알림 생성됨
        const notisWithHu3d = await notificationRepository.find({ category: Category.HU3D_DELETED, read: false });
        expect(notisWithHu3d).toHaveLength(2);

        const notisWithDicom = await notificationRepository.find({ category: Category.CT_DELETED, read: false });
        expect(notisWithDicom).toHaveLength(2);
      });
    });
  });
});
