import { Exclude, Expose, plainToInstance } from "class-transformer";
import { ApiProperty } from "@nestjs/swagger";

import { Recipient } from "@src/common/entity/recipient.entity";

@Exclude()
export class GetAllRecipientViewDto {
  @Expose()
  @ApiProperty({ description: "Recipient의 DB ID" })
  id: number;

  @Expose()
  @ApiProperty({ description: "메일 알림을 받을 이메일 주소" })
  email: string;

  @Expose()
  @ApiProperty({ description: "메일 알림 Default 설정 여부" })
  isDefault: boolean;

  static fromMany(recipients: Recipient[]): GetAllRecipientViewDto[] {
    return recipients.map((recipient) => {
      const getAllRecipientViewDto = plainToInstance(GetAllRecipientViewDto, recipient);

      getAllRecipientViewDto.id = recipient.id;
      getAllRecipientViewDto.email = recipient.email;
      getAllRecipientViewDto.isDefault = recipient.isDefault;

      return getAllRecipientViewDto;
    });
  }
}
