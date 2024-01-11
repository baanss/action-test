import * as supertest from "supertest";
import * as cookieParser from "cookie-parser";
import { INestApplication } from "@nestjs/common";
import { SurgeonRepository } from "@src/surgeon/repository/surgeon.repository";
import { generateNestApplication } from "@test/util/test.util";
import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { testAdmins, testUsers } from "@root/seeding/seeder/seed/user.seed";

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

describe("POST /surgeons", () => {
  let agent: supertest.SuperAgentTest;

  test("UNAUTHORIZED_AUTH_TOKEN, 헤더에 유효한 인증 정보가 없음", async () => {
    // given
    // when-then
    await supertest.agent(app.getHttpServer()).post("/surgeons").expect(401);
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
      const body = { name: "new-surgeon" };
      const res = await agent.post("/surgeons").send(body);

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
      const surgeonName = "prev-surgeon";
      await surgeonRepository.save({ name: surgeonName });

      // when
      const body = { name: surgeonName };
      const res = await agent.post("/surgeons").send(body);

      // then
      expect(res.body.error).toBe(HutomHttpException.DUPLICATED_DATA.error);
    });

    test("저장 성공", async () => {
      //given

      // when
      const body = { name: "new-surgeon" };
      const res = await agent.post("/surgeons").send(body).expect(201);

      // then
      const expected = { id: expect.any(Number) };
      expect(res.body).toEqual(expected);
      const createdSurgeon = await surgeonRepository.findOne(res.body.id);
      expect(createdSurgeon).not.toBeUndefined();
    });
  });
});

describe("POST /surgeons/delete", () => {
  let agent: supertest.SuperAgentTest;

  test("UNAUTHORIZED_AUTH_TOKEN, 헤더에 유효한 인증 정보가 없음", async () => {
    // given
    // when-then
    await supertest.agent(app.getHttpServer()).post("/surgeons/delete").expect(401);
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
      const res = await agent.post("/surgeons/delete");

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

    test("BAD_REQUEST, ids 타입이 number가 아님", async () => {
      //given

      // when
      const body = { ids: ["invalid"] };
      const res = await agent.post("/surgeons/delete").send(body);

      // then
      expect(res.body.error).toBe(HutomHttpException.BAD_REQUEST.error);
    });

    test("삭제 성공", async () => {
      //given
      const randomSurgeons = Array(10)
        .fill(null)
        .map((value, i) => {
          return { name: `surgeon${i}` };
        });
      await surgeonRepository.delete({});
      const surgeons = await surgeonRepository.save(randomSurgeons);

      // when
      const body = { ids: [surgeons[0].id, surgeons[1].id] };
      const res = await agent.post("/surgeons/delete").send(body);

      // then
      const expectedResult = { affected: body.ids.length };
      expect(res.body).toEqual(expectedResult);
    });
  });
});
