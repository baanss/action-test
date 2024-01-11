import checkDiskSpace from "check-disk-space";
import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron, CronExpression } from "@nestjs/schedule";

import { QaConfig, CoreConfig } from "@src/common/config/configuration";
import { UserRepository } from "@src/user/repository/user.repository";
import { NotificationRepository } from "@src/notification/repository/notification.repository";
import { Category } from "@src/common/entity/notification.entity";
import { CronConfig, CronName } from "@src/batch/constant/enum.constant";
import { RedisService } from "@src/cache/service/redis.service";
import { RedisFlag } from "@src/cache/constant/enum.constant";
import { TotalCreditViewRepository } from "@src/credit-history/repository/total-credit-view.repository";

@Injectable()
export class CreateNotificationService {
  private readonly THRESHOLD_STORAGE_IN_GB = 10 * 1024 * 1024 * 1024;
  private readonly logger = new Logger(CreateNotificationService.name);
  private coreConfig: CoreConfig;
  private qaConfig: QaConfig;

  constructor(
    private cacheManager: RedisService,
    private readonly configService: ConfigService,
    private readonly userRepository: UserRepository,
    private readonly notificationRepository: NotificationRepository,
    private readonly totalCreditViewRepository: TotalCreditViewRepository,
  ) {
    this.coreConfig = this.configService.get<CoreConfig>("core");
    this.qaConfig = this.configService.get<QaConfig>("qa");
  }

  /**
   * 10GB 미만인 경우 대표 계정에게 알림 생성
   * - 주기: 일 1회 오전 1시
   * - 알림 종류: STORAGE_SPACE_SHORTAGE
   */
  @Cron(CronConfig.schedule, {
    name: CronName.CREATE_STORAGE_SHORTAGE_NOTIFICATION_JOB,
    timeZone: CronConfig.timezone,
  })
  async handleStorageNotiCronTask(): Promise<void> {
    const { free } = await checkDiskSpace(this.coreConfig.storagePath);
    const freeSpace = !!this.qaConfig.diskFreeSpace ? Number(this.qaConfig.diskFreeSpace) : free;
    if (freeSpace > this.THRESHOLD_STORAGE_IN_GB) {
      this.logger.log(`I: Storage Status (free: ${freeSpace} bytes, threshold: ${this.THRESHOLD_STORAGE_IN_GB} bytes)`);
      return;
    }
    const admin = await this.userRepository.getAdmin();
    if (!admin) {
      return this.logger.log(`E: Fail to create [STORAGE_SPACE_SHORTAGE] notification to admin, admin not found.`);
    }
    try {
      await this.notificationRepository.createOne({ userId: admin.id, category: Category.STORAGE_SPACE_SHORTAGE });
      return this.logger.log(`I: Create [STORAGE_SPACE_SHORTAGE] notification to admin.`);
    } catch (error) {
      return this.logger.log(`E: Fail to create [STORAGE_SPACE_SHORTAGE] notification to admin, ${JSON.stringify(error)}`);
    }
  }

  /**
   * 10GB 미만이 되었을 때, 대표 계정에게 알림 생성
   * - 주기: 1분
   * - 알림 종류: STORAGE_SPACE_SHORTAGE
   */
  @Cron(CronExpression.EVERY_MINUTE, {
    name: CronName.CREATE_STORAGE_SHORTAGE_NOTIFICATION_ONCE_JOB,
  })
  async handleNotiStorageShortage(): Promise<void> {
    const { free } = await checkDiskSpace(this.coreConfig.storagePath);
    const freeSpace = !!this.qaConfig.diskFreeSpace ? Number(this.qaConfig.diskFreeSpace) : free;
    if (freeSpace > this.THRESHOLD_STORAGE_IN_GB) {
      return await this.cacheManager.del(RedisFlag.STORAGE_SPACE);
    }
    const prevFreeSpace = await this.cacheManager.get(RedisFlag.STORAGE_SPACE);
    if (prevFreeSpace) {
      await this.cacheManager.set(RedisFlag.STORAGE_SPACE, free);
      return this.logger.log(`I: Already create [STORAGE_SPACE_SHORTAGE] notification`);
    }
    const admin = await this.userRepository.getAdmin();
    if (!admin) {
      return this.logger.log("E: Fail to create [STORAGE_SPACE_SHORTAGE] notification, admin not found");
    }
    await this.notificationRepository.createOne({ userId: admin.id, category: Category.STORAGE_SPACE_SHORTAGE });
    await this.cacheManager.set(RedisFlag.STORAGE_SPACE, free);
    return this.logger.log(`I: Create [STORAGE_SPACE_SHORTAGE] notification to admin.`);
  }

  /**
   * 보유 크레딧이 10개 미만인 경우 부족 알림(대표 계정)
   */
  @Cron(CronConfig.schedule, {
    name: CronName.CREATE_CREDIT_SHORTAGE_NOTIFICATION_JOB,
    timeZone: CronConfig.timezone,
  })
  async handleCreditNotiCronTask() {
    const thresholdCredits = 10;
    const totalCredit = await this.totalCreditViewRepository.getTotalCredit();
    if (totalCredit > thresholdCredits) {
      return this.logger.log(`I: Credit Status (remain: ${totalCredit}, threshold: ${thresholdCredits})`);
    }
    const admin = await this.userRepository.getAdmin();
    if (!admin) {
      return this.logger.log(`E: Fail to create [CREDIT_SHORTAGE] notification to admin, admin not found.`);
    }
    try {
      await this.notificationRepository.createOne({ userId: admin.id, category: Category.CREDIT_SHORTAGE, credits: totalCredit });
      return this.logger.log(`I: Create [CREDIT_SHORTAGE] notification to admin.`);
    } catch (error) {
      return this.logger.log(`E: Fail to create [CREDIT_SHORTAGE] notification to admin, ${JSON.stringify(error)}`);
    }
  }
}
