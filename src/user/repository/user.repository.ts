import { EntityRepository, In, Repository, Between, LessThan } from "typeorm";

import { HttpException } from "@nestjs/common";
import { HutomHttpException } from "@src/common/constant/http-exception.constant";
import { OrderQuery } from "@src/common/constant/enum.constant";

import { Role } from "@src/auth/interface/auth.interface";
import { User } from "@src/common/entity/user.entity";

import { GetAllUserRepositoryReq, GetAllUserSortQuery } from "@src/user/dto/in/get-all-user.repository-request.dto";
import { PostUserRepositoryReq } from "@src/user/dto/in/post-user.repository-request.dto";

@EntityRepository(User)
export class UserRepository extends Repository<User> {
  findById(id: number) {
    return this.findOne(id);
  }

  findByEmployeeId(employeeId: string) {
    return this.findOne({ employeeId });
  }

  findByEmployeeIds(employeeIds: string[]) {
    return this.find({ where: { employeeId: In(employeeIds) } });
  }

  findByEmails(emails: string[]) {
    return this.find({ where: { email: In(emails) } });
  }

  async getManyLastLoggedInBefore(date: Date): Promise<User[]> {
    return this.find({ lastLogin: LessThan(date), role: Role.USER });
  }

  async getManyByLastLoginBetween(from: Date, to: Date): Promise<User[]> {
    return this.find({ lastLogin: Between(from, to), role: Role.USER });
  }

  async isEmailUsed(email: string) {
    const user = await this.findOne({ email });
    return !!user;
  }

  async isEmployeeIdUsed(employeeId: string) {
    const user = await this.findOne({ employeeId });
    return !!user;
  }

  findUsersByIds(ids: number[]) {
    return this.createQueryBuilder("user").select("user").whereInIds(ids).andWhere("user.role = :role", { role: Role.USER }).getMany();
  }

  getAllUsers(): Promise<User[]> {
    return this.createQueryBuilder("user").select("user").getMany();
  }

  getManyAndCount(conditions: GetAllUserRepositoryReq): Promise<[User[], number]> {
    const { employeeId, name, page, limit, sort, order } = conditions;

    const queryBuilder = this.createQueryBuilder("user");

    // Search Field(검색 필드)에 입력된 검색어(문자열) 쿼리
    if (employeeId) {
      queryBuilder.andWhere("user.employeeId ILIKE :employeeId", { employeeId: `%${employeeId}%` });
    }
    if (name) {
      queryBuilder.andWhere("user.name ILIKE :name", { name: `%${name}%` });
    }

    // 입력받은 sort, order 우선 적용
    switch (sort + order) {
      case GetAllUserSortQuery.USER_ROLE + OrderQuery.ASC:
        queryBuilder.orderBy("user.role", "ASC");
        break;
    }

    // 페이지네이션 제외 조건
    if (limit === -1) {
      return queryBuilder.addOrderBy("user.id", "ASC").getManyAndCount();
    }

    return queryBuilder
      .addOrderBy("user.createdAt", "ASC")
      .offset((page - 1) * limit)
      .limit(limit)
      .getManyAndCount();
  }

  getAdmin(): Promise<User> {
    return this.findOne({ role: Role.ADMIN });
  }

  async createOne(postUserRepositoryReq: PostUserRepositoryReq): Promise<number> {
    try {
      const inserted = await this.insert({
        employeeId: postUserRepositoryReq.employeeId,
        email: postUserRepositoryReq.email,
        name: postUserRepositoryReq.name,
        role: postUserRepositoryReq.role,
        password: postUserRepositoryReq.password,
        phoneNumber: postUserRepositoryReq.phoneNumber ?? null,
        profilePath: postUserRepositoryReq.profilePath ?? null,
        prevPassword: null,
        initPassword: false,
        signInFailed: 0,
        lastLogin: null,
        enableEmail: true,
        showGuide: true,
        passwordSettingAt: null,
      });
      return inserted.identifiers[0].id;
    } catch (error) {
      throw new HttpException(HutomHttpException.CREATE_DATA_ERROR, HutomHttpException.CREATE_DATA_ERROR.statusCode);
    }
  }

  async updateToAdmin(id: number, dto: Partial<User>): Promise<{ id: number }> {
    const updateDto = { ...dto, role: Role.ADMIN };
    return this.update(id, updateDto).then((updateResult) => {
      if (updateResult.affected) {
        return { id };
      }
      throw new HttpException(HutomHttpException.UPDATE_DATA_ERROR, HutomHttpException.UPDATE_DATA_ERROR.statusCode);
    });
  }
}
