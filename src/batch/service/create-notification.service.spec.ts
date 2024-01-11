import { INestApplication } from "@nestjs/common";
import { CreateNotificationService } from "@src/batch/service/create-notification.service";
import { SeederService } from "@root/seeding/seeder/services/seeder.service";
import { generateNestApplication } from "@test/util/test.util";
import { UserRepository } from "@src/user/repository/user.repository";
import { NotificationRepository } from "@src/notification/repository/notification.repository";
import { testAdmins } from "@root/seeding/seeder/seed/user.seed";
import { Category } from "@src/common/entity/notification.entity";
import { CreditHistoryRepository } from "@src/credit-history/repository/credit-history.repository";
import { CreditCategory } from "@src/common/entity/credit-history.entity";

let app: INestApplication;
let seederService: SeederService;
let userRepository: UserRepository;
let notificationRepository: NotificationRepository;
let createNotificationService: CreateNotificationService;
let creditHistoryRepository: CreditHistoryRepository;

beforeAll(async () => {
  app = await generateNestApplication();

  seederService = app.get(SeederService);
  createNotificationService = app.get(CreateNotificationService);
  userRepository = app.get(UserRepository);
  notificationRepository = app.get(NotificationRepository);
  creditHistoryRepository = app.get(CreditHistoryRepository);

  await app.init();
});

afterAll(async () => {
  await seederService.empty();
  await app.close();
});

describe("CreateNotificationService", () => {
  describe("handleStorageNotiCronTask", () => {
    beforeEach(async () => {
      await seederService.empty();
    });

    test("실패 - admin 없을 때, 알림 생성 실패", async () => {
      // given

      // when
      await createNotificationService.handleStorageNotiCronTask();

      // then
      const notification = await notificationRepository.findOne();
      expect(notification).toBeUndefined();
    });

    test("성공 - admin 있을 때, 알림 생성 성공", async () => {
      // given
      const admin = await userRepository.save(testAdmins[0]);

      // when
      await createNotificationService.handleStorageNotiCronTask();

      // then
      const notification = await notificationRepository.findOne();
      const expectedNoti = {
        id: expect.any(Number),
        userId: admin.id,
        category: Category.STORAGE_SPACE_SHORTAGE,
        message: "The storage space is less than 10GB. Please delete the file.",
        read: false,
        createdAt: expect.any(Date),
      };
      expect(notification).toEqual(expectedNoti);
    });
  });

  describe("handleCreditNotiCronTask", () => {
    beforeEach(async () => {
      await seederService.empty();
    });

    test("실패 - admin 없을 때, 알림 생성 실패", async () => {
      // given

      // when
      await createNotificationService.handleCreditNotiCronTask();

      // then
      const notification = await notificationRepository.findOne();
      expect(notification).toBeUndefined();
    });

    test("성공 - admin 있을 때, 알림 생성 성공", async () => {
      // given
      const admin = await userRepository.save(testAdmins[0]);

      // when
      await createNotificationService.handleCreditNotiCronTask();

      // then
      const notification = await notificationRepository.findOne();
      const expectedNoti = {
        id: expect.any(Number),
        userId: admin.id,
        category: Category.CREDIT_SHORTAGE,
        message: `You have 0 credit left. Please request credit allocation from the responsible distributor.`,
        read: false,
        createdAt: expect.any(Date),
      };
      expect(notification).toEqual(expectedNoti);
    });

    test("성공 - credit 남은 양이 10 이상일 때, 알림 생성되지 않음", async () => {
      // given
      await userRepository.save(testAdmins[0]);
      await creditHistoryRepository.save({
        category: CreditCategory.ALLOCATE,
        quantity: 100,
        status: true,
        employeeId: "hutom",
        name: "hutom",
        isUserRequest: false,
      });

      // when
      await createNotificationService.handleCreditNotiCronTask();

      // then
      const notification = await notificationRepository.findOne();
      expect(notification).toBeUndefined();
    });
  });
});
