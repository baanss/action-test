import * as fs from "fs";
import * as path from "path";
import * as supertest from "supertest";
import * as cookieParser from "cookie-parser";
import { INestApplication } from "@nestjs/common";

import { generateNestApplication } from "@test/util/test.util";
import { testAdmins, testUsers } from "@root/seeding/seeder/seed/user.seed";
import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import config from "@src/common/config/configuration";

import { SessionRepository } from "@src/auth/repository/session.repository";
import { InstallerRepository } from "@src/installer/repository/installer.repository";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";

let app: INestApplication;
let seederService: SeederService;
let installerRepository: InstallerRepository;
let sessionRepository: SessionRepository;

const customOriginHeaderKey = "x-origin";
const userServiceOrigin = "user";

const currentAdmin = testAdmins[0];
const currentUser = testUsers[0];

beforeAll(async () => {
  app = await generateNestApplication();
  app.use(cookieParser());

  seederService = app.get(SeederService);
  installerRepository = app.get(InstallerRepository);
  sessionRepository = app.get(SessionRepository);

  await seederService.empty();
  await seederService.seedEncryption();
  await app.init();
});

afterAll(async () => {
  await seederService.empty();
  await app.close();
});

describe("POST /installers", () => {
  let agent: supertest.SuperAgentTest;

  const duplicateFilePath = "__test__/dummy/RUS_v1.1.0.0.exe";
  const newFilePath = "__test__/dummy/RUS_v2.0.0.0.exe";

  beforeAll(async () => {
    await fs.promises.mkdir("__test__/dummy").catch((error) => error);
  });

  afterAll(async () => {
    await fs.promises.rm("__test__/dummy", { recursive: true, force: true });
    await fs.promises.rm(config().core.etcPath, { recursive: true, force: true }).catch(() => false);
  });

  beforeEach(async () => {
    const content = Buffer.from("example");
    await fs.promises.writeFile(duplicateFilePath, content).catch((error) => false);
    await fs.promises.writeFile(newFilePath, content).catch((error) => false);
  });

  test("401 response, 헤더에 유효한 인증 정보가 없음", async () => {
    // when-then
    supertest.agent(app.getHttpServer()).post("/installers").expect(401);
  });

  describe("일반 계정 요청", () => {
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

    test("UNAUTHORIZED_AUTH_TOKEN, h-Space 요청이 아님", async () => {
      // given
      // when
      const res = await agent.post("/installers").set("Content-Type", "multipart/form-data").attach("file", newFilePath);

      // then
      expect(res.body.error).toBe(HutomHttpException.UNAUTHORIZED_AUTH_TOKEN.error);
    });
  });

  describe("대표 계정 요청", () => {
    beforeEach(async () => {
      await sessionRepository.clear();

      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentAdmin.employeeId,
        password: currentAdmin.password,
      });

      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", res.get("Set-Cookie"));
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("UNAUTHORIZED_AUTH_TOKEN, h-Space 요청이 아님", async () => {
      // given
      // when
      const res = await agent.post("/installers").set("Content-Type", "multipart/form-data").attach("file", newFilePath);

      // then
      expect(res.body.error).toBe(HutomHttpException.UNAUTHORIZED_AUTH_TOKEN.error);
    });
  });

  describe("h-Space 요청", () => {
    let agent: supertest.SuperAgentTest;

    beforeAll(async () => {
      agent = supertest.agent(app.getHttpServer());

      const authToken = "hcloud-server";
      agent.set("x-auth-token", authToken);
    });

    test("201 repsonse, 이미 등록되어 있는 버전", async () => {
      // given
      const prevInstaller = await installerRepository.save({ filePath: duplicateFilePath, fileName: path.basename(duplicateFilePath), fileSize: 10 });
      const attachFile = duplicateFilePath;

      // when
      const res = await agent.post("/installers").set("Content-Type", "multipart/form-data").attach("file", attachFile).expect(201);

      // then: 응답이 적절함
      const expectedResult = { id: expect.any(Number) };
      expect(res.body).toEqual(expectedResult);
      // then: 이전 installer가 삭제된 상태로 저장됨
      const deletedInstaller = await installerRepository.findOne(prevInstaller.id);
      expect(deletedInstaller.filePath).toBeNull();
      expect(deletedInstaller.fileSize).toBe(0);
    });

    test("201 response, 처음 등록하는 버전", async () => {
      // given
      const prevInstaller = await installerRepository.save({ filePath: newFilePath, fileName: path.basename(newFilePath), fileSize: 10 });
      const attachFile = newFilePath;

      // when
      const res = await agent.post("/installers").set("Content-Type", "multipart/form-data").attach("file", attachFile).expect(201);

      // then: 응답이 적절함
      const expectedResult = { id: expect.any(Number) };
      expect(res.body).toEqual(expectedResult);
      // then: 이전 installer가 삭제된 상태로 저장됨
      const deletedInstaller = await installerRepository.findOne(prevInstaller.id);
      expect(deletedInstaller.filePath).toBeNull();
      expect(deletedInstaller.fileSize).toEqual(0);
    });
  });
});
