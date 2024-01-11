import * as supertest from "supertest";
import * as cookieParser from "cookie-parser";
import { INestApplication } from "@nestjs/common";

import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { generateNestApplication } from "@test/util/test.util";
import { RusCaseRepository } from "@src/rus-case/repository/rus-case.repository";
import { testStudies } from "@root/seeding/seeder/seed/study.seed";

let app: INestApplication;
let seederService: SeederService;
let rusCaseRepository: RusCaseRepository;

beforeAll(async () => {
  app = await generateNestApplication();
  app.use(cookieParser());

  seederService = app.get(SeederService);
  rusCaseRepository = app.get(RusCaseRepository);

  await seederService.empty();
  await seederService.seedEncryption();
  await app.init();
});

afterAll(async () => {
  await seederService.empty();
  await app.close();
});

describe("POST /feedbacks", () => {
  let agent: supertest.SuperAgentTest;

  test("401 response, 헤더에 유효한 인증 정보가 없음", async () => {
    // when-then
    supertest.agent(app.getHttpServer()).post("/feedbacks").expect(401);
  });

  describe("헤더에 유효한 인증 정보가 있음", () => {
    beforeAll(async () => {
      agent = supertest.agent(app.getHttpServer());

      // h-Cloud 헤더
      const authToken = "hcloud-server";
      agent.set("x-auth-token", authToken);
    });

    test("NOT_FOUND_RUS_CASE_WITH_HUID, 전달받은 huId의 케이스가 존재하지 않음", async () => {
      // given
      const invalidHuId = "invalid";
      const postBody = { huId: invalidHuId, message: "some message...", writerEmail: "cloudUser01" };

      // when
      const res = await agent.post("/feedbacks").send(postBody);

      // then
      expect(res.body.error).toMatch("NOT_FOUND_RUS_CASE_WITH_HUID");
    });

    test("200 response, 이미 등록되어 있는 경우", async () => {
      // given
      const huId = testStudies[0].huId; // feedback이 등록되어있는 케이스
      const postBody = { huId, message: "some message...", writerEmail: "cloudUser01" };
      const rusCase = await rusCaseRepository.getOneByHuId(huId);

      // when
      const res = await agent.post("/feedbacks").send(postBody).expect(200);

      // then
      const updatedRusCase = await rusCaseRepository.getOneByHuId(huId);
      expect(res.body).toEqual({ id: rusCase.feedback.id });
      expect(rusCase.feedback.id).toEqual(updatedRusCase.feedback.id);
    });

    test("200 response, 새로 등록하는 경우", async () => {
      // given
      const huId = `${process.env.SERVER_CODE}_3`; // feedback이 등록된 적 없는 케이스
      const postBody = { huId: huId, message: "some message...", writerEmail: "cloudUser01" };

      // when
      const res = await agent.post("/feedbacks").send(postBody).expect(200);

      // then
      const rusCase = await rusCaseRepository.getOneByHuId(huId);
      expect(res.body).toEqual({ id: rusCase.feedback.id });
    });
  });
});
