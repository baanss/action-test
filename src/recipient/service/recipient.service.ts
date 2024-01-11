import { Connection } from "typeorm";
import { HttpException, Injectable } from "@nestjs/common";
import { Recipient } from "@src/common/entity/recipient.entity";
import { User } from "@src/common/entity/user.entity";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";

import { PostRecipientsServiceReq } from "@src/recipient/dto";

import { RecipientRepository } from "@src/recipient/repository/recipient.repository";
import { UserService } from "@src/user/service/user.service";

@Injectable()
export class RecipientService {
  constructor(private readonly connection: Connection, private readonly recipientRepisitory: RecipientRepository, private readonly userService: UserService) {}

  getOwnAllAndCount(userId: number): Promise<[Recipient[], number]> {
    return this.recipientRepisitory.getOwnAllAndCount(userId);
  }

  async updateOwnRecipients(user: User, postRecipientsServiceReq: PostRecipientsServiceReq): Promise<{ ids: number[]; enableEmail: boolean }> {
    const { enableEmail, recipients } = postRecipientsServiceReq;

    // 기존값 불러오기
    const [prevRecipients] = await this.recipientRepisitory.getOwnAllAndCount(user.id);

    // recipients가 입력되지 않은 경우 - 기존값 유지 및 enableEmail 정보만 변경
    if (!recipients) {
      await this.userService.updateOne(user, { enableEmail });
      return {
        ids: prevRecipients.map((prevRecipient) => prevRecipient.id),
        enableEmail,
      };
    }

    const emailList = recipients.map((recipient) => recipient.email);
    const hasDuplicatedData = emailList.length !== [...new Set(emailList)].length;

    // 입력받은 recipients unique 여부, 내 계정의 이메일 미포함 여부 검증
    if (hasDuplicatedData || emailList.includes(user.email)) {
      throw new HttpException(HutomHttpException.DUPLICATED_DATA, HutomHttpException.DUPLICATED_DATA.statusCode);
    }

    const queryRunner = this.connection.createQueryRunner();
    const recipientRepository = queryRunner.manager.getCustomRepository(RecipientRepository);

    let ids: number[];
    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      // 1. 기존의 Recipient 삭제
      await recipientRepository.deleteAllByUserId(user.id);

      // 2. Recipients 생성
      ids = await recipientRepository.createMany(user.id, recipients);

      await queryRunner.commitTransaction();
      await queryRunner.release();
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();
      throw error;
    }

    // 사용자 enableEmail Update
    await this.userService.updateOne(user, { enableEmail });

    return {
      ids,
      enableEmail,
    };
  }
}
