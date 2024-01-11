import * as faker from "faker";
import * as supertest from "supertest";
import * as cookieParser from "cookie-parser";
import { INestApplication } from "@nestjs/common";

import { generateNestApplication } from "@test/util/test.util";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";

import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { testAdmins, testUsers } from "@root/seeding/seeder/seed/user.seed";
import { RecipientRepository } from "@src/recipient/repository/recipient.repository";

let app: INestApplication;
let seederService: SeederService;

let recipientRepository: RecipientRepository;

const customOriginHeaderKey = "x-origin";
const userServiceOrigin = "user";

const currentAdmin = testAdmins[0];
const currentUser = testUsers[0];
const expectedBody = {
  ids: expect.any(Array),
  meta: expect.any(Object),
};

beforeAll(async () => {
  app = await generateNestApplication();
  app.use(cookieParser());

  seederService = app.get(SeederService);

  recipientRepository = app.get(RecipientRepository);

  await app.init();
  await seederService.empty();
  await seederService.seedEncryption();
});

afterAll(async () => {
  await seederService.empty();
  await app.close();
});

describe("POST /recipients", () => {
  test("401 response, 헤더에 유효한 인증 정보가 없음", (done) => {
    // when~then
    supertest.agent(app.getHttpServer()).post("/recipients").expect(401, done);
  });

  describe("대표 계정 요청", () => {
    let agent: supertest.SuperAgentTest;
    let cookies: string[];

    beforeEach(async () => {
      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentAdmin.employeeId,
        password: currentAdmin.password,
        isForced: true,
      });

      cookies = res.header["set-cookie"];
      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", cookies);
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("BAD_REQUEST - 이메일 수신자의 입력 한도 초과. (ValidationPipe)", async () => {
      // given
      const randomRecipients = Array(10)
        .fill(null)
        .map(() => {
          const email = faker.internet.email();
          const isDefault = faker.datatype.boolean();
          return { email, isDefault };
        });

      // when
      const postRecipientDto = {
        enableEmail: true,
        recipients: randomRecipients,
      };
      const res = await agent.post("/recipients").send(postRecipientDto);

      // then
      expect(res.body.error).toEqual(HutomHttpException.BAD_REQUEST.error);
    });

    test("DUPLICATED_DATA - 중복된 emailList 입력.", async () => {
      // given

      // when
      const postRecipientDto = {
        enableEmail: true,
        recipients: [
          {
            email: "test@test.com",
            isDefault: true,
          },
          {
            email: "test@test.com",
            isDefault: true,
          },
        ],
      };
      const res = await agent.post("/recipients").send(postRecipientDto);

      // then
      expect(res.body.error).toEqual(HutomHttpException.DUPLICATED_DATA.error);
    });

    test("DUPLICATED_DATA - 사용자의 email 입력.", async () => {
      // given

      // when
      const postRecipientDto = {
        enableEmail: true,
        recipients: [
          {
            email: currentAdmin.email,
            isDefault: true,
          },
        ],
      };
      const res = await agent.post("/recipients").send(postRecipientDto);

      // then
      expect(res.body.error).toEqual(HutomHttpException.DUPLICATED_DATA.error);
    });

    test("성공 - 빈 값의 recipients 입력. Recipient 전부 삭제", async () => {
      // given
      const prevRecipients = await recipientRepository.find({ where: { userId: currentAdmin.id } });

      // when
      const postRecipientDto = {
        enableEmail: true,
        recipients: [],
      };
      const res = await agent.post("/recipients").send(postRecipientDto);
      const currRecipients = await recipientRepository.find({ where: { userId: currentAdmin.id } });

      // then
      expect(res.body).toEqual(expectedBody);
      expect(prevRecipients.length).toBeGreaterThan(0);
      expect(currRecipients.length).toEqual(0);
    });

    test("성공 - enableEmail만 입력된 경우", async () => {
      // given
      const prevRecipients = await recipientRepository.find({ where: { userId: currentAdmin.id } });

      // when
      const postRecipientDto = {
        enableEmail: false,
      };
      const res = await agent.post("/recipients").send(postRecipientDto);
      const currRecipients = await recipientRepository.find({ where: { userId: currentAdmin.id } });

      // then
      expect(res.body).toEqual(expectedBody);
      expect(res.body.meta.enableEmail).toEqual(postRecipientDto.enableEmail);
      expect(prevRecipients).toEqual(currRecipients);
    });

    test("성공 - Recipient 업데이트(삭제 후 생성)", async () => {
      // given
      const prevRecipients = await recipientRepository.find({ where: { userId: currentAdmin.id } });
      const randomRecipients = Array(9)
        .fill(null)
        .map(() => {
          const email = faker.internet.email();
          const isDefault = faker.datatype.boolean();
          return { email, isDefault };
        });

      // when
      const postRecipientDto = {
        enableEmail: true,
        recipients: randomRecipients,
      };
      const res = await agent.post("/recipients").send(postRecipientDto);
      const currRecipients = await recipientRepository.find({ where: { userId: currentAdmin.id } });

      // then
      expect(res.body).toEqual(expectedBody);
      expect(res.body.meta.enableEmail).toEqual(postRecipientDto.enableEmail);
      expect(prevRecipients).not.toEqual(currRecipients);

      // 저장된 데이터의 순서와 입력된 데이터의 순서 일치 검증
      currRecipients.forEach((recipient, index) => {
        expect(recipient.email).toEqual(randomRecipients[index].email);
      });
    });
  });

  describe("일반 계정 요청", () => {
    let agent: supertest.SuperAgentTest;
    let cookies: string[];

    beforeEach(async () => {
      const res = await supertest(app.getHttpServer()).post("/auth/user/login").send({
        employeeId: currentUser.employeeId,
        password: currentUser.password,
        isForced: true,
      });

      cookies = res.header["set-cookie"];
      agent = supertest.agent(app.getHttpServer());
      agent.set("Cookie", cookies);
      agent.set(customOriginHeaderKey, userServiceOrigin);
    });

    test("성공 - Recipient 업데이트(삭제 후 생성)", async () => {
      // given
      const prevRecipients = await recipientRepository.find({ where: { userId: currentUser.id } });
      const randomRecipients = Array(9)
        .fill(null)
        .map(() => {
          const email = faker.internet.email();
          const isDefault = faker.datatype.boolean();
          return { email, isDefault };
        });

      // when
      const postRecipientDto = {
        enableEmail: true,
        recipients: randomRecipients,
      };
      const res = await agent.post("/recipients").send(postRecipientDto);
      const currRecipients = await recipientRepository.find({ where: { userId: currentUser.id } });

      // then
      expect(res.body).toEqual(expectedBody);
      expect(res.body.meta.enableEmail).toEqual(postRecipientDto.enableEmail);
      expect(prevRecipients).not.toEqual(currRecipients);

      // 저장된 데이터의 순서와 입력된 데이터의 순서 일치 검증
      currRecipients.forEach((recipient, index) => {
        expect(recipient.email).toEqual(randomRecipients[index].email);
      });
    });
  });
});
