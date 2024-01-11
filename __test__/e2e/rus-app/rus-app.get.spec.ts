import * as fs from "fs";
import * as supertest from "supertest";
import { INestApplication } from "@nestjs/common";
import { testAdmins, testUsers } from "@root/seeding/seeder/seed/user.seed";
import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { testInstallers } from "@root/seeding/seeder/seed/installer.seed";
import { testUpdateLogs } from "@root/seeding/seeder/seed/update-log.seed";
import { generateNestApplication } from "@test/util/test.util";
import { SERVICE_CODE } from "@src/common/middleware/server-auth.middleware";
import config from "@src/common/config/configuration";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { InstallerRepository } from "@src/installer/repository/installer.repository";
import { RusCaseRepository } from "@src/rus-case/repository/rus-case.repository";
import { UpdateLogRepository } from "@src/update-log/repository/update-log.repository";

let app: INestApplication;
let seederService: SeederService;
let installerRepository: InstallerRepository;
let updateLogRepository: UpdateLogRepository;
let rusCaseRepository: RusCaseRepository;

const originHeaderKey = "x-origin";
const rusClientOrigin = "rus-client";

const authTokenHeaderKey = "x-auth-token";
const authToken = SERVICE_CODE;

const currentUser = testUsers[0];
const currentAdmin = testAdmins[0];

const expectedRusCase = {
  id: expect.any(Number),
  huId: expect.any(String),
  patientId: expect.any(String),
  patientName: expect.any(String),
  hu3dURL: expect.any(String), // nullable
  version: expect.any(Number), // nullable
  operationType: expect.any(String),
};

const expectedInstaller = {
  id: expect.any(Number),
  fileName: expect.any(String),
  fileSize: expect.any(Number), // nullable
  fileURL: expect.any(String), // nullable
  createdAt: expect.any(String),
};

const expectedUpdateLog = {
  id: expect.any(Number),
  fileName: expect.any(String),
  fileSize: expect.any(Number), // nullable
  fileURL: expect.any(String), // nullable
  createdAt: expect.any(String),
};

beforeAll(async () => {
  app = await generateNestApplication();

  seederService = app.get(SeederService);
  installerRepository = app.get(InstallerRepository);
  updateLogRepository = app.get(UpdateLogRepository);
  rusCaseRepository = app.get(RusCaseRepository);

  await app.init();
});

beforeEach(async () => {
  await seederService.empty();
  await seederService.seedEncryption();
});

afterAll(async () => {
  await seederService.empty();
  await app.close();
});

describe("GET /rus-app/rus-cases", () => {
  test("401 response, 헤더에 유효한 인증 정보가 없음", (done) => {
    // when~then
    supertest.agent(app.getHttpServer()).get("/rus-app/rus-cases").expect(401, done);
  });

  test("UNAUTHORIZED_AUTH_TOKEN, 헤더 토큰이 잘못됨", async () => {
    // given
    const loginRes = await supertest(app.getHttpServer()).post("/auth/rus-client/login").set(authTokenHeaderKey, authToken).send({
      employeeId: currentUser.employeeId,
      password: currentUser.password,
    });

    const agent = supertest.agent(app.getHttpServer());
    agent.set("Authorization", "Bearer " + loginRes.body.accessToken);
    agent.set(originHeaderKey, rusClientOrigin);

    // when
    const res = await agent.get("/rus-app/rus-cases").set(authTokenHeaderKey, "Invalid").expect(HutomHttpException.UNAUTHORIZED_AUTH_TOKEN.statusCode);

    // then
    expect(res.body.error).toBe(HutomHttpException.UNAUTHORIZED_AUTH_TOKEN.error);
  });

  describe("일반 계정 요청", () => {
    let agent: supertest.SuperAgentTest;
    const targetUser = currentUser;

    beforeAll(async () => {
      const res = await supertest(app.getHttpServer()).post("/auth/rus-client/login").set(authTokenHeaderKey, authToken).send({
        employeeId: targetUser.employeeId,
        password: targetUser.password,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Authorization", "Bearer " + res.body.accessToken);
      agent.set(originHeaderKey, rusClientOrigin);
    });

    test("성공, hu3d 파일이 존재하는 케이스 조회", async () => {
      // given
      // when
      const res = await agent.get("/rus-app/rus-cases").set(authTokenHeaderKey, authToken).expect(200);

      // then
      expect(res.body.count).toBeGreaterThan(0);
      res.body.rusCases.forEach((rusCase) => {
        expect(rusCase).toEqual(expectedRusCase);
        expect(rusCase.hu3dURL).toMatch(/rus-app\/rus-cases\/\d\/download-hu3d/);
      });
    });

    test("성공, patientId, patientName 복호화되어 조회됨", async () => {
      // given
      const rusCases = await rusCaseRepository.find({ relations: ["study", "hu3d"] });
      const filteredRusCases = rusCases.filter((rusCase) => rusCase.userId === targetUser.id && rusCase.hu3d.filePath !== null);

      // when
      const res = await agent.get("/rus-app/rus-cases").set(authTokenHeaderKey, authToken).expect(200);

      // then
      expect(res.body.count).toBeGreaterThan(0);
      res.body.rusCases.forEach((rusCase, i) => {
        expect(rusCase.patientId).not.toBe(filteredRusCases[i].study.patientId);
        expect(rusCase.patientName).not.toBe(filteredRusCases[i].study.patientName);
      });
    });

    test("성공, huId 기준 오름차순 정렬", async () => {
      // given
      const rusCases = await rusCaseRepository.find({ relations: ["study", "hu3d"] });
      const filteredRusCases = rusCases.filter((rusCase) => rusCase.userId === targetUser.id && rusCase.hu3d.filePath !== null);
      filteredRusCases.sort(
        (a, b) => parseInt(a.study.huId.replace(`${config().core.serverCode}_`, "")) - parseInt(b.study.huId.replace(`${config().core.serverCode}_`, "")),
      );

      // when
      const res = await agent.get("/rus-app/rus-cases").set(authTokenHeaderKey, authToken).expect(200);

      // then
      expect(res.body.count).toBeGreaterThan(0);
      res.body.rusCases.forEach((rusCase, i) => {
        expect(rusCase.huId).toBe(filteredRusCases[i].study.huId);
      });
    });

    test("성공, 본인이 생성한 케이스 조회", async () => {
      // given
      const rusCases = await rusCaseRepository.find();
      rusCases.forEach(async (rusCase) => {
        await rusCaseRepository.update(rusCase.id, { userId: null });
      });

      // when
      const res = await agent.get("/rus-app/rus-cases").set(authTokenHeaderKey, authToken).expect(200);

      // then
      expect(res.body.count).toBe(0);
    });
  });

  describe("대표 계정 요청", () => {
    let agent: supertest.SuperAgentTest;

    beforeAll(async () => {
      const res = await supertest(app.getHttpServer()).post("/auth/rus-client/login").set(authTokenHeaderKey, authToken).send({
        employeeId: currentAdmin.employeeId,
        password: currentAdmin.password,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Authorization", "Bearer " + res.body.accessToken);
      agent.set(originHeaderKey, rusClientOrigin);
    });

    test("성공, huId 기준 오름차순 정렬", async () => {
      // given
      const rusCases = await rusCaseRepository.find({ relations: ["study", "hu3d"] });
      const filteredRusCases = rusCases.filter((rusCase) => rusCase.hu3d && rusCase.hu3d.filePath !== null);
      filteredRusCases.sort(
        (a, b) => parseInt(a.study.huId.replace(`${config().core.serverCode}_`, "")) - parseInt(b.study.huId.replace(`${config().core.serverCode}_`, "")),
      );

      // when
      const res = await agent.get("/rus-app/rus-cases").set(authTokenHeaderKey, authToken).expect(200);

      // then
      expect(res.body.count).toBeGreaterThan(0);
      res.body.rusCases.forEach((rusCase, i) => {
        expect(rusCase.huId).toBe(filteredRusCases[i].study.huId);
      });
    });

    test("성공, 전체 케이스 조회", async () => {
      // given
      const rusCases = await rusCaseRepository.find();
      rusCases.forEach(async (rusCase) => {
        await rusCaseRepository.update(rusCase.id, { userId: null });
      });

      // when
      const res = await agent.get("/rus-app/rus-cases").set(authTokenHeaderKey, authToken).expect(200);

      // then
      expect(res.body.count).not.toBe(0);
    });
  });
});

describe("GET /rus-app/rus-cases/:id/download-hu3d", () => {
  test("401 response, 헤더에 유효한 인증 정보가 없음", (done) => {
    // when~then
    supertest.agent(app.getHttpServer()).get("/rus-app/rus-cases/:id/download-hu3d").set(authTokenHeaderKey, authToken).expect(401, done);
  });

  describe("일반 계정 요청", () => {
    let agent: supertest.SuperAgentTest;
    const targetUser = currentUser;

    beforeAll(async () => {
      const res = await supertest(app.getHttpServer()).post("/auth/rus-client/login").set(authTokenHeaderKey, authToken).send({
        employeeId: targetUser.employeeId,
        password: targetUser.password,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Authorization", "Bearer " + res.body.accessToken);
      agent.set(originHeaderKey, rusClientOrigin);
    });

    test("FORBIDDEN_RESOURCE, 본인이 생성하지 않은 케이스 조회 실패", async () => {
      // given
      const rusCases = await rusCaseRepository.find({ where: { userId: targetUser.id }, relations: ["hu3d"] });
      await fs.promises.mkdir(config().core.hu3dPath, { recursive: true }).catch((error) => {
        console.log(error);
      });
      const targetRusCase = rusCases[0];
      await rusCaseRepository.update(targetRusCase.id, { userId: null });
      await fs.promises.writeFile(rusCases[0].hu3d.filePath, "");

      // when
      const res = await agent.get(`/rus-app/rus-cases/${targetRusCase.id}/download-hu3d`).set(authTokenHeaderKey, authToken);

      // then
      expect(res.body.error).toBe(HutomHttpException.FORBIDDEN_RESOURCE.error);

      await fs.promises.rm(config().core.hu3dPath, { recursive: true, force: true });
    });

    test("성공, 본인이 생성한 케이스 조회", async () => {
      // given
      const rusCases = await rusCaseRepository.find({ where: { userId: targetUser.id }, relations: ["hu3d"] });
      await fs.promises.mkdir(config().core.hu3dPath, { recursive: true }).catch((error) => {
        console.log(error);
      });
      const targetRusCase = rusCases[0];
      await fs.promises.writeFile(rusCases[0].hu3d.filePath, "");

      // when
      const res = await agent.get(`/rus-app/rus-cases/${targetRusCase.id}/download-hu3d`).set(authTokenHeaderKey, authToken).expect(200);

      // then
      expect(res.header["content-disposition"]).toMatch(/^attachment; filename=/);

      await fs.promises.rm(config().core.hu3dPath, { recursive: true, force: true });
    });
  });

  describe("대표 계정 요청", () => {
    let agent: supertest.SuperAgentTest;

    beforeAll(async () => {
      const res = await supertest(app.getHttpServer()).post("/auth/rus-client/login").set(authTokenHeaderKey, authToken).send({
        employeeId: currentAdmin.employeeId,
        password: currentAdmin.password,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Authorization", "Bearer " + res.body.accessToken);
      agent.set(originHeaderKey, rusClientOrigin);
    });

    test("성공", async () => {
      //given
      // when
      const res = await agent.get("/rus-app/rus-cases").set(authTokenHeaderKey, authToken).expect(200);

      // then
      res.body.rusCases.forEach((rusCase) => {
        expect(rusCase).toEqual(expectedRusCase);
      });
    });

    test("성공, 본인이 생성하지 않은 케이스 조회", async () => {
      // given
      const rusCases = await rusCaseRepository.find({ relations: ["hu3d"] });
      await fs.promises.mkdir(config().core.hu3dPath, { recursive: true }).catch((error) => {
        console.log(error);
      });
      const targetRusCase = rusCases[0];
      await rusCaseRepository.update(targetRusCase.id, { userId: null });
      await fs.promises.writeFile(rusCases[0].hu3d.filePath, "");

      // when
      const res = await agent.get(`/rus-app/rus-cases/${targetRusCase.id}/download-hu3d`).set(authTokenHeaderKey, authToken).expect(200);

      // then
      expect(res.header["content-disposition"]).toMatch(/^attachment; filename=/);

      await fs.promises.rm(config().core.hu3dPath, { recursive: true, force: true });
    });
  });
});

describe("GET /rus-app/installers/latest", () => {
  let agent: supertest.SuperAgentTest;
  test("401 response, 헤더에 유효한 인증 정보가 없음", (done) => {
    // when~then
    supertest.agent(app.getHttpServer()).get("/rus-app/installers/latest").set(authTokenHeaderKey, authToken).expect(401, done);
  });

  test("UNAUTHORIZED_AUTH_TOKEN, 토큰이 존재하지 않음", async () => {
    // given
    const loginRes = await supertest(app.getHttpServer()).post("/auth/rus-client/login").set(authTokenHeaderKey, authToken).send({
      employeeId: currentUser.employeeId,
      password: currentUser.password,
    });

    agent = supertest.agent(app.getHttpServer());
    agent.set("Authorization", "Bearer " + loginRes.body.accessToken);
    agent.set(originHeaderKey, rusClientOrigin);

    // when
    const res = await agent.get("/rus-app/installers/latest").set(authTokenHeaderKey, "Invalid").expect(HutomHttpException.UNAUTHORIZED_AUTH_TOKEN.statusCode);

    // then
    expect(res.body.error).toBe(HutomHttpException.UNAUTHORIZED_AUTH_TOKEN.error);
  });

  describe("일반 계정 요청", () => {
    beforeAll(async () => {
      const res = await supertest(app.getHttpServer()).post("/auth/rus-client/login").set(authTokenHeaderKey, authToken).send({
        employeeId: currentUser.employeeId,
        password: currentUser.password,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Authorization", "Bearer " + res.body.accessToken);
      agent.set(originHeaderKey, rusClientOrigin);
    });

    test("200 response", async () => {
      // given
      // when
      const res = await agent.get("/rus-app/installers/latest").set(authTokenHeaderKey, authToken).expect(200);

      // then
      expect(res.body).toEqual(expectedInstaller);
    });
  });

  describe("대표 계정 요청", () => {
    beforeAll(async () => {
      const res = await supertest(app.getHttpServer()).post("/auth/rus-client/login").set(authTokenHeaderKey, authToken).send({
        employeeId: currentAdmin.employeeId,
        password: currentAdmin.password,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Authorization", "Bearer " + res.body.accessToken);
      agent.set(originHeaderKey, rusClientOrigin);
    });

    test("200 response", async () => {
      // given
      // when
      const res = await agent.get("/rus-app/installers/latest").set(authTokenHeaderKey, authToken).expect(200);

      // then
      expect(res.body).toEqual(expectedInstaller);
    });
  });
});

describe("GET /rus-app/installers/latest/download", () => {
  test("401 response, 헤더에 유효한 인증 정보가 없음", (done) => {
    // when~then
    supertest.agent(app.getHttpServer()).get("/rus-app/installers/latest/download").set(authTokenHeaderKey, authToken).expect(401, done);
  });

  describe("일반 계정 요청", () => {
    let agent: supertest.SuperAgentTest;

    beforeAll(async () => {
      const res = await supertest(app.getHttpServer()).post("/auth/rus-client/login").set(authTokenHeaderKey, authToken).send({
        employeeId: currentUser.employeeId,
        password: currentUser.password,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Authorization", "Bearer " + res.body.accessToken);
      agent.set(originHeaderKey, rusClientOrigin);
    });

    test("NOT_FOUND_INSTALLER_ON_DB, 파일이 DB에 존재하지 않음", async () => {
      // given
      await installerRepository.delete({});

      // when
      const res = await agent.get("/rus-app/installers/latest/download").set(authTokenHeaderKey, authToken);

      // then
      expect(res.body.error).toBe(HutomHttpException.NOT_FOUND_INSTALLER_ON_DB.error);
    });

    test("NOT_FOUND_INSTALLER_ON_DISK, 파일이 DB에 존재하지 않음", async () => {
      // given
      await installerRepository.save(testInstallers);

      // when
      const res = await agent.get("/rus-app/installers/latest/download").set(authTokenHeaderKey, authToken);

      // then
      expect(res.body.error).toBe(HutomHttpException.NOT_FOUND_INSTALLER_ON_DISK.error);
    });

    test("200 response", async () => {
      // given
      const targetInstaller = testInstallers[0];
      await fs.promises.mkdir(config().core.etcPath, { recursive: true }).catch((error) => {
        console.log(error);
      });
      await fs.promises.writeFile(targetInstaller.filePath, "");

      // when
      const res = await agent.get("/rus-app/installers/latest/download").set(authTokenHeaderKey, authToken).expect(200);

      // then
      expect(res.header["content-disposition"]).toMatch(/^attachment; filename=/);

      await fs.promises.rm(config().core.etcPath, { recursive: true, force: true });
    });
  });

  describe("대표 계정 요청", () => {
    let agent: supertest.SuperAgentTest;

    beforeAll(async () => {
      const res = await supertest(app.getHttpServer()).post("/auth/rus-client/login").set(authTokenHeaderKey, authToken).send({
        employeeId: currentAdmin.employeeId,
        password: currentAdmin.password,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Authorization", "Bearer " + res.body.accessToken);
      agent.set(originHeaderKey, rusClientOrigin);
    });

    test("200 response", async () => {
      // given
      const targetInstaller = testInstallers[0];
      await fs.promises.mkdir(config().core.etcPath, { recursive: true }).catch((error) => {
        console.log(error);
      });
      await fs.promises.writeFile(targetInstaller.filePath, "");

      // when
      const res = await agent.get("/rus-app/installers/latest/download").set(authTokenHeaderKey, authToken).expect(200);

      // then
      expect(res.header["content-disposition"]).toMatch(/^attachment; filename=/);

      await fs.promises.rm(config().core.etcPath, { recursive: true, force: true });
    });
  });
});

describe("GET /rus-app/update-logs/latest", () => {
  test("401 response, 헤더에 유효한 인증 정보가 없음", (done) => {
    // when~then
    supertest.agent(app.getHttpServer()).get("/rus-app/update-logs/latest").set(authTokenHeaderKey, authToken).expect(401, done);
  });

  describe("HutomHttpException", () => {
    let agent: supertest.SuperAgentTest;
    beforeAll(async () => {
      const res = await supertest(app.getHttpServer()).post("/auth/rus-client/login").set(authTokenHeaderKey, authToken).send({
        employeeId: currentUser.employeeId,
        password: currentUser.password,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Authorization", "Bearer " + res.body.accessToken);
      agent.set(originHeaderKey, rusClientOrigin);
    });

    test("UNAUTHORIZED_AUTH_TOKEN", async () => {
      // given
      // when
      const res = await agent
        .get("/rus-app/update-logs/latest")
        .set(authTokenHeaderKey, "Invalid")
        .expect(HutomHttpException.UNAUTHORIZED_AUTH_TOKEN.statusCode);

      // then
      expect(res.body.error).toBe(HutomHttpException.UNAUTHORIZED_AUTH_TOKEN.error);
    });
  });

  describe("일반 계정 요청", () => {
    let agent: supertest.SuperAgentTest;

    beforeAll(async () => {
      const res = await supertest(app.getHttpServer()).post("/auth/rus-client/login").set(authTokenHeaderKey, authToken).send({
        employeeId: currentUser.employeeId,
        password: currentUser.password,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Authorization", "Bearer " + res.body.accessToken);
      agent.set(originHeaderKey, rusClientOrigin);
    });

    test("200 response", async () => {
      // given
      // when
      const res = await agent.get("/rus-app/update-logs/latest").set(authTokenHeaderKey, authToken).expect(200);

      // then
      expect(res.body).toEqual(expectedUpdateLog);
    });

    describe("대표 계정 요청", () => {
      let agent: supertest.SuperAgentTest;

      beforeAll(async () => {
        const res = await supertest(app.getHttpServer()).post("/auth/rus-client/login").set(authTokenHeaderKey, authToken).send({
          employeeId: currentAdmin.employeeId,
          password: currentAdmin.password,
        });

        agent = supertest.agent(app.getHttpServer());
        agent.set("Authorization", "Bearer " + res.body.accessToken);
        agent.set(originHeaderKey, rusClientOrigin);
      });

      test("200 response", async () => {
        // given
        // when
        const res = await agent.get("/rus-app/update-logs/latest").set(authTokenHeaderKey, authToken).expect(200);

        // then
        expect(res.body).toEqual(expectedUpdateLog);
      });
    });
  });
});

describe("GET /rus-app/update-logs/latest/download", () => {
  test("401 response, 헤더에 유효한 인증 정보가 없음", (done) => {
    // when~then
    supertest.agent(app.getHttpServer()).get("/rus-app/update-logs/latest/download").set(authTokenHeaderKey, authToken).expect(401, done);
  });

  describe("일반 계정 요청", () => {
    let agent: supertest.SuperAgentTest;

    beforeAll(async () => {
      const res = await supertest(app.getHttpServer()).post("/auth/rus-client/login").set(authTokenHeaderKey, authToken).send({
        employeeId: currentUser.employeeId,
        password: currentUser.password,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Authorization", "Bearer " + res.body.accessToken);
      agent.set(originHeaderKey, rusClientOrigin);
    });

    test("NOT_FOUND_UPDATE_LOG_ON_DB, 파일이 DB에 존재하지 않음", async () => {
      // given
      await updateLogRepository.delete({});

      // when
      const res = await agent.get("/rus-app/update-logs/latest/download").set(authTokenHeaderKey, authToken);

      // then
      expect(res.body.error).toBe(HutomHttpException.NOT_FOUND_UPDATE_LOG_ON_DB.error);
    });

    test("NOT_FOUND_UPDATE_LOG_ON_DISK, 파일이 DB에 존재하지 않음", async () => {
      // given
      await updateLogRepository.save(testUpdateLogs);

      // when
      const res = await agent.get("/rus-app/update-logs/latest/download").set(authTokenHeaderKey, authToken);

      // then
      expect(res.body.error).toBe(HutomHttpException.NOT_FOUND_UPDATE_LOG_ON_DISK.error);
    });

    test("200 response", async () => {
      // given
      const targetUpdateLog = testUpdateLogs[0];
      await fs.promises.mkdir(config().core.etcPath, { recursive: true }).catch((error) => {
        console.log(error);
      });
      await fs.promises.writeFile(targetUpdateLog.filePath, "");

      // when
      const res = await agent.get("/rus-app/update-logs/latest/download").set(authTokenHeaderKey, authToken).expect(200);

      // then
      expect(res.header["content-disposition"]).toMatch(/^attachment; filename=/);

      await fs.promises.rm(config().core.etcPath, { recursive: true, force: true });
    });
  });

  describe("대표 계정 요청", () => {
    let agent: supertest.SuperAgentTest;

    beforeAll(async () => {
      const res = await supertest(app.getHttpServer()).post("/auth/rus-client/login").set(authTokenHeaderKey, authToken).send({
        employeeId: currentAdmin.employeeId,
        password: currentAdmin.password,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Authorization", "Bearer " + res.body.accessToken);
      agent.set(originHeaderKey, rusClientOrigin);
    });

    test("200 response", async () => {
      // given
      const targetUpdateLog = testUpdateLogs[0];
      await fs.promises.mkdir(config().core.etcPath, { recursive: true }).catch((error) => {
        console.log(error);
      });
      await fs.promises.writeFile(targetUpdateLog.filePath, "");

      // when
      const res = await agent.get("/rus-app/update-logs/latest/download").set(authTokenHeaderKey, authToken).expect(200);

      // then
      expect(res.header["content-disposition"]).toMatch(/^attachment; filename=/);

      await fs.promises.rm(config().core.etcPath, { recursive: true, force: true });
    });
  });
});
