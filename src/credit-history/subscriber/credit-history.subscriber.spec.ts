import { INestApplication } from "@nestjs/common";

import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { testCreditHistories } from "@root/seeding/seeder/seed/credit-history.seed";
import { testAdmins } from "@root/seeding/seeder/seed/user.seed";
import { generateNestApplication } from "@test/util/test.util";

import { UserRepository } from "@src/user/repository/user.repository";
import { NotificationRepository } from "@src/notification/repository/notification.repository";
import { Category } from "@src/common/entity/notification.entity";
import { CreditHistoryRepository } from "@src/credit-history/repository/credit-history.repository";

let app: INestApplication;
let seederService: SeederService;
let userRepository: UserRepository;
let notificationRepository: NotificationRepository;
let creditHistoryRepository: CreditHistoryRepository;

beforeAll(async () => {
  app = await generateNestApplication();

  seederService = app.get(SeederService);
  userRepository = app.get(UserRepository);
  notificationRepository = app.get(NotificationRepository);
  creditHistoryRepository = app.get(CreditHistoryRepository);

  await app.init();
});

afterAll(async () => {
  await seederService.empty();
  await app.close();
});

describe("CreditHistorySubscriber", () => {
  describe("afterInsert", () => {
    beforeEach(async () => {
      await seederService.empty();
    });

    test("대표계정이 존재하지 않는 경우, 알림 생성되지 않음", async () => {
      // given
      await creditHistoryRepository.save({ ...testCreditHistories[0], id: 1, userId: null, quantity: 10 });

      // when
      await creditHistoryRepository.save({ ...testCreditHistories[0], id: 2, userId: null, quantity: -1 });

      // then
      const notification = await notificationRepository.findOne();
      expect(notification).toBeUndefined();
    });

    test("잔여 크레딧이 `9개`로 `감소`하는 경우 알림 생성됨", async () => {
      // given
      const admin = await userRepository.save(testAdmins[0]);
      await creditHistoryRepository.save({ ...testCreditHistories[0], id: 1, userId: null, quantity: 10 });

      // when
      await creditHistoryRepository.save({ ...testCreditHistories[0], id: 2, userId: null, quantity: -1 });

      // then
      const notification = await notificationRepository.findOne();
      const expectedNoti = {
        id: expect.any(Number),
        createdAt: expect.any(Date),
        userId: admin.id,
        category: Category.CREDIT_SHORTAGE,
        message: `You have 9 credits left. Please request credit allocation from the responsible distributor.`,
        read: false,
      };
      expect(notification).toEqual(expectedNoti);
    });

    test("잔여 크레딧이 `9개 초과`로 `감소`하는 경우 알림 생성되지 않음", async () => {
      // given
      await creditHistoryRepository.save({ ...testCreditHistories[0], id: 1, userId: null, quantity: 100 });

      // when
      await creditHistoryRepository.save({ ...testCreditHistories[0], id: 2, userId: null, quantity: -1 });

      // then
      const notification = await notificationRepository.findOne();
      expect(notification).toBeUndefined();
    });

    test("잔여 크레딧이 `9개 미만`으로 `감소`하는 경우 알림 생성되지 않음", async () => {
      // given
      await creditHistoryRepository.save({ ...testCreditHistories[0], id: 1, userId: null, quantity: 5 });

      // when
      await creditHistoryRepository.save({ ...testCreditHistories[0], id: 2, userId: null, quantity: -1 });

      // then
      const notification = await notificationRepository.findOne();
      expect(notification).toBeUndefined();
    });

    test("잔여 크레딧이 `9개`로 `증가`하는 경우 알림 생성되지 않음", async () => {
      // given
      await creditHistoryRepository.save({ ...testCreditHistories[0], id: 1, userId: null, quantity: 8 });

      // when
      await creditHistoryRepository.save({ ...testCreditHistories[0], id: 2, userId: null, quantity: 1 });

      // then
      const notification = await notificationRepository.findOne();
      expect(notification).toBeUndefined();
    });
  });
});
