import { Connection } from "typeorm";
import { HttpException, Injectable, Logger } from "@nestjs/common";

import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { CreditCategory } from "@src/common/entity/credit-history.entity";
import { UserRepository } from "@src/user/repository/user.repository";
import { CreditHistoryRepository } from "@src/credit-history/repository/credit-history.repository";
import { TotalCreditViewRepository } from "@src/credit-history/repository/total-credit-view.repository";
import { NotificationRepository } from "@src/notification/repository/notification.repository";
import { Category } from "@src/common/entity/notification.entity";

@Injectable()
export class CreditHistoryService {
  private readonly logger = new Logger(CreditHistoryService.name);
  constructor(
    private readonly connection: Connection,
    private readonly userRepository: UserRepository,
    private readonly creditHistoryRepository: CreditHistoryRepository,
    private readonly totalCreditViewRepository: TotalCreditViewRepository,
  ) {}

  async getTotalCredit(): Promise<number> {
    return await this.totalCreditViewRepository.getTotalCredit();
  }

  async createRusCancelByServer(huId: string, chr?: CreditHistoryRepository): Promise<{ id: number }> {
    const creditHistoryRepository = chr ? chr : this.creditHistoryRepository;
    const result = await creditHistoryRepository.createOne({
      category: CreditCategory.RUS_CANCEL,
      huId,
      quantity: 1,
      status: true,
      isUserRequest: false,
      employeeId: "hutom",
      name: "hutom",
    });
    return { id: result.id };
  }

  async createRusCancelByUser(dto: { userId: number; huId: string }, chr?: CreditHistoryRepository): Promise<{ id: number }> {
    const creditHistoryRepository = chr ? chr : this.creditHistoryRepository;
    const { userId, huId } = dto;
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new HttpException(HutomHttpException.NOT_FOUND_USER_WITH_ID, HutomHttpException.NOT_FOUND_USER_WITH_ID.statusCode);
    }
    const result = await creditHistoryRepository.createOne({
      category: CreditCategory.RUS_CANCEL,
      userId,
      huId,
      quantity: 1,
      status: true,
      isUserRequest: true,
      employeeId: user.employeeId,
      name: user.name,
    });
    return { id: result.id };
  }

  async createRusUse(dto: { userId: number; huId: string }): Promise<{ id: number }> {
    const { userId, huId } = dto;
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new HttpException(HutomHttpException.NOT_FOUND_USER_WITH_ID, HutomHttpException.NOT_FOUND_USER_WITH_ID.statusCode);
    }
    const totalCredit = await this.totalCreditViewRepository.getTotalCredit();
    // 크레딧이 부족한 경우
    if (totalCredit < 1) {
      throw new HttpException(HutomHttpException.INSUFFICIENT_CREDIT, HutomHttpException.INSUFFICIENT_CREDIT.statusCode);
    }

    const result = await this.creditHistoryRepository.createOne({
      huId,
      userId,
      category: CreditCategory.RUS_USE,
      quantity: -1,
      status: true,
      isUserRequest: true,
      employeeId: user.employeeId,
      name: user.name,
    });
    return { id: result.id };
  }

  async createAllocate(quantity: number): Promise<{ id: number; totalCredit: number }> {
    const admin = await this.userRepository.getAdmin();
    if (!admin) {
      throw new HttpException(
        { ...HutomHttpException.NOT_FOUND_DATA, message: "There is no admin to create notifications for." },
        HutomHttpException.NOT_FOUND_DATA.statusCode,
      );
    }

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const creditHistoryRepository = queryRunner.manager.getCustomRepository(CreditHistoryRepository);
    const totalCreditRepository = queryRunner.manager.getCustomRepository(TotalCreditViewRepository);
    const notificationRepository = queryRunner.manager.getCustomRepository(NotificationRepository);

    try {
      const result = await creditHistoryRepository.createOne({
        quantity,
        category: CreditCategory.ALLOCATE,
        huId: null,
        userId: null,
        isUserRequest: false,
        employeeId: "hutom",
        name: "hutom",
        status: true,
      });
      await notificationRepository.createOne({ userId: admin.id, category: Category.CREDIT_ALLOCATED, credits: quantity });

      const totalCredit = await totalCreditRepository.getTotalCredit();
      if (totalCredit < 0 || totalCredit > 9999) {
        throw new HttpException(HutomHttpException.LIMIT_EXCEEDED, HutomHttpException.LIMIT_EXCEEDED.statusCode);
      }

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return { id: result.id, totalCredit };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      throw error;
    }
  }

  async createRevoke(quantity: number): Promise<{ id: number; totalCredit: number }> {
    const admin = await this.userRepository.getAdmin();
    if (!admin) {
      throw new HttpException(
        { ...HutomHttpException.NOT_FOUND_DATA, message: "There is no admin to create notifications for." },
        HutomHttpException.NOT_FOUND_DATA.statusCode,
      );
    }

    const queryRunner = this.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const creditHistoryRepository = queryRunner.manager.getCustomRepository(CreditHistoryRepository);
    const totalCreditRepository = queryRunner.manager.getCustomRepository(TotalCreditViewRepository);
    const notificationRepository = queryRunner.manager.getCustomRepository(NotificationRepository);

    try {
      const result = await creditHistoryRepository.createOne({
        quantity: quantity * -1,
        category: CreditCategory.REVOKE,
        huId: null,
        userId: null,
        isUserRequest: false,
        employeeId: "hutom",
        name: "hutom",
        status: true,
      });
      await notificationRepository.createOne({ userId: admin.id, category: Category.CREDIT_REVOKED, credits: quantity });

      const totalCredit = await totalCreditRepository.getTotalCredit();
      if (totalCredit < 0 || totalCredit > 9999) {
        throw new HttpException(HutomHttpException.LIMIT_EXCEEDED, HutomHttpException.LIMIT_EXCEEDED.statusCode);
      }

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return { id: result.id, totalCredit };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      throw error;
    }
  }
}
