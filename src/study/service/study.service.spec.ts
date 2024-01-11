import * as fs from "fs";
import * as moment from "moment";
import { INestApplication } from "@nestjs/common";

import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { testStudies } from "@root/seeding/seeder/seed/study.seed";
import { generateNestApplication } from "@test/util/test.util";
import { testUsers } from "@root/seeding/seeder/seed/user.seed";
import { testUploadJobs } from "@root/seeding/seeder/seed/upload-job.seed";
import { testDicoms } from "@root/seeding/seeder/seed/dicom.seed";

import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { StudyService } from "@src/study/service/study.service";
import { StudyRepository } from "@src/study//repository/study.repository";
import { Study } from "@src/common/entity/study.entity";
import { UserRepository } from "@src/user/repository/user.repository";
import { UploadJobRepository } from "@src/upload-job/repository/upload-job.repository";
import { DicomRepository } from "@src/study/repository/dicom.repository";

let app: INestApplication;
let seederService: SeederService;
let studyService: StudyService;
let studyRepository: StudyRepository;
let userRepository: UserRepository;
let uploadJobRepository: UploadJobRepository;
let dicomRepository: DicomRepository;

beforeAll(async () => {
  app = await generateNestApplication();

  seederService = app.get(SeederService);
  studyService = app.get(StudyService);
  studyRepository = app.get(StudyRepository);
  userRepository = app.get(UserRepository);
  uploadJobRepository = app.get(UploadJobRepository);
  dicomRepository = app.get(DicomRepository);

  await app.init();
});

afterAll(async () => {
  await seederService.empty();
  await app.close();
});

describe("StudyService", () => {
  beforeEach(async () => {
    // NOTE: DB 암호화에 관련된 테스트여서 data seed 각 케이스에서 진행
    await seederService.empty();
  });

  describe("encryptAll", () => {
    test("전체 암호화 성공", async () => {
      // given
      await seederService.seed();

      // when
      const result = await studyService.encryptAll();

      // then: 전체 수정 검사
      expect(result.affected).toBe(testStudies.length);

      // then: 복호화 처리 검사
      const [studies, count] = await studyRepository.getAllAndCount();
      studies.forEach((study: Study, i: number) => {
        expect(study.patientId).not.toBe(testStudies[i].patientId);
        expect(study.patientName).not.toBe(testStudies[i].patientName);
      });
    });

    test("BAD_REQUEST - 암호화 중복 요청 불가", async () => {
      // given
      await seederService.seed();
      await studyService.encryptAll();

      // when
      // then
      await studyService
        .encryptAll()
        .catch(({ response }) => {
          expect(response.error).toBe(HutomHttpException.BAD_REQUEST.error);
        })
        .then((response) => {
          expect(response).toBeUndefined();
        });
    });
  });

  describe("decryptAll", () => {
    test("전체 복호화 성공", async () => {
      // given
      await seederService.seedEncryption();

      // when
      const result = await studyService.decryptAll();

      // then: 전체 수정 검사
      expect(result.affected).toBe(testStudies.length);

      // then: 복호화 처리 검사
      const [studies, count] = await studyRepository.getAllAndCount();
      studies.forEach((study: Study, i: number) => {
        expect(study.patientId).toBe(testStudies[i].patientId);
        expect(study.patientName).toBe(testStudies[i].patientName);
      });
    });

    test("CRYPTO_ERROR, 평문 복호화 실패", async () => {
      // given: 평문 저장
      await seederService.seed();

      // when - then
      await studyService.decryptAll().catch(({ response }) => {
        expect(response.error).toBe(HutomHttpException.CRYPTO_ERROR.error);
      });
    });
  });

  describe("createOne", () => {
    const dto = {
      huId: testStudies[0].huId,
      seriesCount: 0,
      instancesCount: 0,
      patientId: "환자 ID",
      patientName: "환자 이름",
      studyDescription: "디스크립션",
      studyDate: "20230701",
      studyTime: "120000",
      age: "035Y",
      sex: "F",
    };

    test("Study 생성 성공", async () => {
      // given
      const user = await userRepository.save(testUsers[0]);
      const uploadJob = await uploadJobRepository.save({ ...testUploadJobs[0], user });
      const createDto = { ...dto, uploadJobId: uploadJob.id };

      // when
      const result = await studyService.createOne(createDto);

      // then: 응답 확인
      expect(result).toEqual({ id: expect.any(Number) });

      // then: 생성된 데이터 확인
      const createdStudy = await studyRepository.findOne(result);
      const expectedStudy = {
        id: result.id,
        huId: createDto.huId,
        patientId: expect.any(String),
        patientName: expect.any(String),
        studyDescription: createDto.studyDescription,
        studyDate: moment("2023-07-01T12:00:00").toDate(),
        age: 35,
        sex: "F",
        createdAt: expect.any(Date),
        seriesCount: 0,
        instancesCount: 0,
        uploadJobId: createDto.uploadJobId,
        isRegistered: false,
      };
      expect(createdStudy).toEqual(expectedStudy);
    });

    test("DTO nullable 가능 요소 포함했을 때, Study 생성 시 기본값이 설정된다.", async () => {
      // given
      const user = await userRepository.save(testUsers[0]);
      const uploadJob = await uploadJobRepository.save({ ...testUploadJobs[0], user });
      const createDto = {
        ...dto,
        uploadJobId: uploadJob.id,
        patientId: null,
        patientName: null,
        studyDescription: null,
        studyDate: null,
        studyTime: null,
        age: null,
        sex: null,
      };

      // when
      const result = await studyService.createOne(createDto);

      // then: 응답 확인
      expect(result).toEqual({ id: expect.any(Number) });

      // then: 생성된 데이터 확인
      const expectedStudy = {
        id: result.id,
        huId: createDto.huId,
        createdAt: expect.any(Date),
        studyDate: expect.any(Date),
        patientId: expect.any(String), // 암호화
        patientName: expect.any(String), // 암호화
        seriesCount: 0,
        instancesCount: 0,
        studyDescription: "UNKNOWN",
        age: null,
        sex: null,
        isRegistered: false,
        uploadJobId: uploadJob.id,
      };
      const createdStudy = await studyRepository.findOne(result.id);
      expect(createdStudy).toEqual(expectedStudy);
    });
  });

  describe("updateFile", () => {
    const targetStudy = testStudies[0];
    const targetDicom = testDicoms[0];
    const dto = {
      filePath: targetDicom.filePath,
      seriesCount: 4,
      instancesCount: 300,
    };

    beforeEach(async () => {
      await seederService.empty();

      jest.restoreAllMocks();
      jest.spyOn(fs.promises, "stat").mockImplementation(async () => Promise.resolve({ size: 100 } as fs.Stats));
    });

    afterEach(async () => {
      jest.clearAllMocks();
    });

    test("DUPLICATED_FILE_NAME_ON_DB, filePath가 이미 존재함", async () => {
      // given
      const user = await userRepository.save(testUsers[0]);
      const uploadJob = await uploadJobRepository.save({ ...testUploadJobs[0], user });
      const study = await studyRepository.save({ ...targetStudy, uploadJob });
      await dicomRepository.save(targetDicom);

      // when
      const createDto = dto;
      await studyService.updateFile(study.id, createDto).catch((err) => {
        const { error } = err.response;
        expect(error).toBe(HutomHttpException.DUPLICATED_FILE_NAME_ON_DB.error);
      });
    });

    test("NOT_FOUND_DICOM_ON_DISK, filePath를 읽을 수 없음", async () => {
      // given
      jest.clearAllMocks();
      const user = await userRepository.save(testUsers[0]);
      const uploadJob = await uploadJobRepository.save({ ...testUploadJobs[0], user });
      const study = await studyRepository.save({ ...targetStudy, uploadJob });

      // when
      const createDto = dto;
      await studyService.updateFile(study.id, createDto).catch((err) => {
        const { error } = err.response;
        expect(error).toBe(HutomHttpException.NOT_FOUND_DICOM_ON_DISK.error);
      });
    });

    test("성공", async () => {
      // given
      const user = await userRepository.save(testUsers[0]);
      const uploadJob = await uploadJobRepository.save({ ...testUploadJobs[0], user });
      const study = await studyRepository.save({ ...targetStudy, uploadJob });

      // when
      const createDto = dto;
      const result = await studyService.updateFile(study.id, createDto);

      // then: 응답 확인
      expect(result).toBeUndefined();

      // then: dicom 생성
      const createdDicom = await dicomRepository.findOne({ studyId: study.id });
      expect(createdDicom.filePath).toBe(createDto.filePath);

      // then: study 수정
      const updatedStudy = await studyRepository.findOne(study.id);
      expect(updatedStudy.seriesCount).toEqual(createDto.seriesCount);
      expect(updatedStudy.instancesCount).toEqual(createDto.instancesCount);
    });
  });
});
