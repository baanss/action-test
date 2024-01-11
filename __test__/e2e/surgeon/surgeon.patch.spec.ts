import * as supertest from "supertest";
import * as cookieParser from "cookie-parser";
import { INestApplication } from "@nestjs/common";
import { SurgeonRepository } from "@src/surgeon/repository/surgeon.repository";
import { generateNestApplication } from "@test/util/test.util";
import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { testAdmins, testUsers } from "@root/seeding/seeder/seed/user.seed";
import { testSurgeons } from "@root/seeding/seeder/seed/surgeon.seed";

let app: INestApplication;
let seederService: SeederService;
let surgeonRepository: SurgeonRepository;

const customOriginHeaderKey = "x-origin";
const userServiceOrigin = "user";

const currentUser = testUsers[0];
const currentAdmin = testAdmins[0];

beforeAll(async () => {
  app = await generateNestApplication();
  app.use(cookieParser());

  seederService = app.get(SeederService);
  surgeonRepository = app.get(SurgeonRepository);

  await app.init();
});

afterAll(async () => {
  await seederService.empty();
  await app.close();
});

describe("PATCH /surgeons/:id", () => {
  let agent: supertest.SuperAgentTest;

  test("UNAUTHORIZED_AUTH_TOKEN, 헤더에 유효한 인증 정보가 없음", async () => {
    // given
    // when-then
    await supertest.agent(app.getHttpServer()).patch("/surgeons").expect(401);
  });

  describe("일반 계정 요청", () => {
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

    test("FORBIDDEN_RESOURCE, 접근 권한 없음", async () => {
      //given

      // when
      const surgeonId = testSurgeons[0];
      const body = { name: "new-surgeon" };
      const res = await agent.patch(`/surgeons/${surgeonId}`).send(body);

      // then
      expect(res.body.error).toBe(HutomHttpException.FORBIDDEN_RESOURCE.error);
    });
  });

  describe("대표 계정 요청", () => {
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

    test("DUPLICATED_DATA, 이름 중복 등록 실패", async () => {
      //given
      const targetSurgeon = testSurgeons[0];
      const surgeonName = "prev-surgeon";
      await surgeonRepository.save({ name: surgeonName });

      // when
      const body = { name: surgeonName };
      const res = await agent.patch(`/surgeons/${targetSurgeon.id}`).send(body);

      // then
      expect(res.body.error).toBe(HutomHttpException.DUPLICATED_DATA.error);
    });

    test("UPDATE_DATA_ERROR, id 존재하지 않음", async () => {
      //given

      // when
      const body = { name: "new-surgeon" };
      const res = await agent.patch("/surgeons/999").send(body);

      // then
      expect(res.body.error).toBe(HutomHttpException.UPDATE_DATA_ERROR.error);
    });

    test("저장 성공", async () => {
      //given
      const targetSurgeon = testSurgeons[0];

      // when
      const body = { name: "new-surgeon" };
      const res = await agent.patch(`/surgeons/${targetSurgeon.id}`).send(body).expect(200);

      // then
      const expected = { id: expect.any(Number) };
      expect(res.body).toEqual(expected);
      const createdSurgeon = await surgeonRepository.findOne(res.body.id);
      expect(createdSurgeon.name).toBe(body.name);
    });
  });
});
