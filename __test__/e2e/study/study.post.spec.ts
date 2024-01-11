import * as fs from "fs";
import * as path from "path";
import * as supertest from "supertest";
import * as cookieParser from "cookie-parser";
import { INestApplication } from "@nestjs/common";

import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { testStudies } from "@root/seeding/seeder/seed/study.seed";
import { testDicoms } from "@root/seeding/seeder/seed/dicom.seed";
import { generateNestApplication } from "@test/util/test.util";
import { StudyRepository } from "@src/study/repository/study.repository";
import { DicomRepository } from "@src/study/repository/dicom.repository";
import { PostStudyReq } from "@src/study/dto";
import config from "@src/common/config/configuration";
import { UploadJobRepository } from "@src/upload-job/repository/upload-job.repository";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { UploadJobStatus } from "@src/common/constant/enum.constant";

let app: INestApplication;
let seederService: SeederService;
let studyRepository: StudyRepository;
let dicomRepository: DicomRepository;
let uploadJobRepository: UploadJobRepository;

const authToken = process.env.SERVER_CODE;

beforeAll(async () => {
  app = await generateNestApplication();
  app.use(cookieParser());

  seederService = app.get(SeederService);
  studyRepository = app.get(StudyRepository);
  dicomRepository = app.get(DicomRepository);
  uploadJobRepository = app.get(UploadJobRepository);

  await app.init();

  await seederService.empty();
  await seederService.seedEncryption();
});

afterAll(async () => {
  await seederService.empty();
  await app.close();
});

describe("POST /studies", () => {
  beforeAll(async () => {
    await fs.promises.mkdir("__test__/dummy").catch((error) => error);
  });

  afterAll(async () => {
    await fs.promises.rm("__test__/dummy", { recursive: true, force: true });
    await fs.promises.rm(config().core.dicomPath).catch(() => false);
  });

  test("UNAUTHORIZED_AUTH_TOKEN, 헤더에 유효한 인증 정보가 없음", async () => {
    // given
    // when
    const res = await supertest.agent(app.getHttpServer()).post("/studies");

    // then
    expect(res.body.error).toBe(HutomHttpException.UNAUTHORIZED_AUTH_TOKEN.error);
  });

  describe("요청 권한 있음(서버 요청) - 요청 실패", () => {
    let agent: supertest.SuperAgentTest;

    const filePath = `__test__/dummy/${process.env.SERVER_CODE}_9999.zip`;
    const huId = `${process.env.SERVER_CODE}_9999`;
    const validPostStudyDto: PostStudyReq = {
      filePath,
      huId,
      patientId: "patient10",
      patientName: "kim",
      studyDate: "19000110",
      studyTime: "000000",
      studyDescription: "study10 description",
      seriesCount: 7,
      instancesCount: 100,
      age: null,
      sex: null,
    };

    beforeAll(async () => {
      agent = supertest.agent(app.getHttpServer());
      agent.set("X-Auth-Token", authToken);
    });

    beforeEach(async () => {
      await fs.promises.writeFile(filePath, "").catch((error) => {
        return;
      });
    });

    test("BAD_REQUEST, body 누락", async () => {
      // when
      const res = await agent.post("/studies");

      // then
      expect(res.body.error).toBe(HutomHttpException.BAD_REQUEST.error);
    });

    test("BAD_REQUEST, 타입 에러(seriesCount, instancesCount)", async () => {
      // given
      const invalidTypeBody = {
        ...validPostStudyDto,
        seriesCount: "invalid",
        instancesCount: "invalid",
      };

      // when
      const res = await agent.post("/studies").send(invalidTypeBody);

      // then
      expect(res.body.error).toBe(HutomHttpException.BAD_REQUEST.error);
    });

    test("BAD_REQUEST, 타입 에러(sex)", async () => {
      // given
      const invalidTypeBody = { ...validPostStudyDto, sex: "invalid" };

      // when
      const res = await agent.post("/studies").send(invalidTypeBody);

      // then
      expect(res.body.error).toBe(HutomHttpException.BAD_REQUEST.error);
    });

    test("BAD_REQUEST, huId로 매칭된 uploadJob이 없음", async () => {
      // given
      // when
      const res = await agent.post("/studies").send(validPostStudyDto);

      // then
      expect(res.body.error).toBe(HutomHttpException.BAD_REQUEST.error);
    });

    test("BAD_REQUEST, huId로 매칭된 uploadJob이 있지만, studyId가 이미 등록되어 있음", async () => {
      // given
      await uploadJobRepository.save({ huId: validPostStudyDto.huId, studyId: 1 });

      // when
      const res = await agent.post("/studies").send(validPostStudyDto);

      // then
      expect(res.body.error).toBe(HutomHttpException.BAD_REQUEST.error);
    });
  });

  describe("요청 권한 있음(서버 요청) - 요청 성공, 생성 실패", () => {
    let agent: supertest.SuperAgentTest;

    const filePath = `__test__/dummy/${process.env.SERVER_CODE}_9999.zip`;
    const huId = `${process.env.SERVER_CODE}_9999`;
    const validPostStudyDto: PostStudyReq = {
      filePath,
      huId,
      patientId: "patient10",
      patientName: "kim",
      studyDate: "19000110",
      studyTime: "000000",
      studyDescription: "study10 description",
      seriesCount: 7,
      instancesCount: 100,
      age: null,
      sex: null,
    };

    beforeAll(async () => {
      agent = supertest.agent(app.getHttpServer());
      agent.set("X-Auth-Token", authToken);
    });

    beforeEach(async () => {
      await fs.promises.writeFile(filePath, "").catch((error) => {
        return;
      });
      await seederService.empty();
      await seederService.seedEncryption();
    });

    test("DUPLICATED_STUDY_WITH_HUID, huId를 가진 study가 이미 존재함", async () => {
      // given
      const uploadJob = await uploadJobRepository.save({ huId: validPostStudyDto.huId });
      await studyRepository.save({ ...testStudies[0], huId: validPostStudyDto.huId, uploadJob });

      // when
      const res = await agent.post("/studies").send(validPostStudyDto);

      // then
      expect(res.body.error).toBe(HutomHttpException.DUPLICATED_STUDY_WITH_HUID.error);

      const uploadJobResult = await uploadJobRepository.findOne({ huId: validPostStudyDto.huId });
      expect(uploadJobResult.status).toBe(UploadJobStatus.REJECT);
    });

    test("NOT_FOUND_DICOM_ON_DISK, 파일이 로컬에 존재하지 않음", async () => {
      // given
      await uploadJobRepository.save({ huId: validPostStudyDto.huId });
      await fs.promises.rm(filePath);
      // when
      const res = await agent.post("/studies").send(validPostStudyDto);

      // then
      expect(res.body.error).toBe(HutomHttpException.NOT_FOUND_DICOM_ON_DISK.error);

      const uploadJobResult = await uploadJobRepository.findOne({ huId: validPostStudyDto.huId });
      expect(uploadJobResult.status).toBe(UploadJobStatus.REJECT);
    });

    test("DUPLICATED_FILE_NAME_ON_DB, 파일명이 중복됨", async () => {
      // given
      await dicomRepository.save({ ...testDicoms[0], filePath: validPostStudyDto.filePath, fileName: path.basename(filePath) });
      await uploadJobRepository.save({ huId: validPostStudyDto.huId });

      // when
      const res = await agent.post("/studies").send(validPostStudyDto);

      // then
      expect(res.body.error).toBe(HutomHttpException.DUPLICATED_FILE_NAME_ON_DB.error);

      const uploadJobResult = await uploadJobRepository.findOne({ huId: validPostStudyDto.huId });
      expect(uploadJobResult.status).toBe(UploadJobStatus.REJECT);
    });
  });

  describe("요청 권한 있음(서버 요청) - 요청 성공, 생성 성공", () => {
    let agent: supertest.SuperAgentTest;

    const filePath = `__test__/dummy/${process.env.SERVER_CODE}_9999.zip`;
    const huId = `${process.env.SERVER_CODE}_9999`;
    const validPostStudyDto: PostStudyReq = {
      filePath,
      huId,
      patientId: "patient10",
      patientName: "kim",
      studyDate: "19000110",
      studyTime: "000000",
      studyDescription: "study10 description",
      seriesCount: 7,
      instancesCount: 100,
      age: null,
      sex: null,
    };

    beforeAll(async () => {
      agent = supertest.agent(app.getHttpServer());
      agent.set("X-Auth-Token", authToken);
    });

    beforeEach(async () => {
      await fs.promises.writeFile(filePath, "").catch((error) => {
        return;
      });
      await seederService.empty();
      await seederService.seedEncryption();
    });

    test("성공", async () => {
      // given
      const uploadJob = await uploadJobRepository.save({ huId: validPostStudyDto.huId });

      // when
      const res = await agent.post("/studies").send(validPostStudyDto);

      // then
      const expected = { id: expect.any(Number) };
      expect(res.body).toEqual(expected);

      // then: study
      const studyResult = await studyRepository.findOne({
        huId: validPostStudyDto.huId,
      });
      expect(studyResult?.uploadJobId).toBe(uploadJob.id);
      expect(studyResult?.patientId).not.toBe(validPostStudyDto.patientId);
      expect(studyResult?.patientName).not.toBe(validPostStudyDto.patientName);

      // then: dicom
      const dicomResult = await dicomRepository.findOne({ filePath: validPostStudyDto.filePath });
      expect(dicomResult?.studyId).toBe(res.body.id);
      expect(dicomResult?.fileName).not.toBeNull();
      expect(dicomResult?.fileSize).not.toBeNull();

      // then: uploadJob
      const uploadJobResult = await uploadJobRepository.findOne(uploadJob.id);
      expect(uploadJobResult.studyId).toBe(res.body.id);
      expect(uploadJobResult.status).toBe(UploadJobStatus.DONE);
    });

    test("성공 - sex 값이 있지만, F, M, O 중 하나가 아닌 경우, null로 저장됨", async () => {
      // given
      const uploadJob = await uploadJobRepository.save({ huId: validPostStudyDto.huId });

      // when
      const res = await agent.post("/studies").send({ ...validPostStudyDto, sex: "X" });

      // then
      const expected = { id: expect.any(Number) };
      expect(res.body).toEqual(expected);

      // then: study
      const studyResult = await studyRepository.findOne({
        huId: validPostStudyDto.huId,
      });
      expect(studyResult?.uploadJobId).toBe(uploadJob.id);
      expect(studyResult.sex).toBeNull();
    });

    test("성공 - 값이 없으면, 기본값으로 설정됨(patientId, patientName)", async () => {
      // given
      await uploadJobRepository.save({ huId: validPostStudyDto.huId });

      // when
      const res = await agent.post("/studies").send({ ...validPostStudyDto, patientId: null, patientName: null });

      // then
      const expected = { id: expect.any(Number) };
      expect(res.body).toEqual(expected);

      // then: study
      const studyResult = await studyRepository.findOne({
        huId: validPostStudyDto.huId,
      });
      expect(studyResult.patientId).not.toBeNull();
      expect(studyResult.patientName).not.toBeNull();
    });

    test("성공 - 값이 없으면, 기본값으로 설정됨(age, sex, studyDescription)", async () => {
      // given
      await uploadJobRepository.save({ huId: validPostStudyDto.huId });

      // when
      const res = await agent.post("/studies").send({ ...validPostStudyDto, age: null, sex: null, studyDescription: null });

      // then
      const expected = { id: expect.any(Number) };
      expect(res.body).toEqual(expected);

      // then: study
      const studyResult = await studyRepository.findOne({
        huId: validPostStudyDto.huId,
      });
      expect(studyResult.age).toBeNull();
      expect(studyResult.sex).toBeNull();
      expect(studyResult.studyDescription).toBe("UNKNOWN");
    });
  });
});
