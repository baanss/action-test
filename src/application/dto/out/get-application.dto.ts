import { Expose, plainToInstance } from "class-transformer";
import { Application } from "@src/common/entity/application.entity";

export class GetApplicationDto {
  @Expose()
  id: number;

  @Expose()
  employeeId: string;

  @Expose()
  email: string;

  @Expose()
  name: string;

  @Expose()
  phoneNumber: string | null;

  @Expose()
  createdAt: string;

  static fromMany(applications: Application[]): GetApplicationDto[] {
    return applications.map((application) => {
      const getApplicationDto = plainToInstance(GetApplicationDto, application);
      getApplicationDto.id = application.id;
      getApplicationDto.employeeId = application.employeeId;
      getApplicationDto.email = application.email;
      getApplicationDto.name = application.name;
      getApplicationDto.phoneNumber = application.phoneNumber ?? null;
      getApplicationDto.createdAt = application.createdAt.toISOString();

      return getApplicationDto;
    });
  }
}
