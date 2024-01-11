import { EntityRepository, Repository } from "typeorm";

import { BalanceView } from "@src/common/entity/balance.view.entity";

import { GetAllCreditHistoryBalanceViewRepositoryReq } from "@src/credit-history/dto/in/get-all-credit-history-balance.view.repository-request.dto";
import { CreditHistoryCategoryQuery, CreditHistorySortQuery } from "@src/credit-history/dto/in/get-many-credit-history-query.request.dto";

@EntityRepository(BalanceView)
export class BalanceViewRepository extends Repository<BalanceView> {
  async getBalance(): Promise<BalanceView> {
    const query = this.createQueryBuilder("balanceView").select("balanceView");

    return query.addOrderBy("balanceView.createdAt", "DESC").getOne();
  }

  async getManyAndCount(conditions: GetAllCreditHistoryBalanceViewRepositoryReq): Promise<[BalanceView[], number]> {
    const { page, limit, categories, employeeId, name, startDate, endDate, sort } = conditions;

    const queryBuilder = this.createQueryBuilder("balance_view");

    // 카테고리 필터링
    if (categories && !categories.includes(CreditHistoryCategoryQuery.ALL)) {
      queryBuilder.andWhere("balance_view.category IN (:...categories)", { categories });
    }

    // employeeId & name 필터링
    if (employeeId) {
      queryBuilder.andWhere("balance_view.employeeId ILIKE :employeeId", { employeeId: `%${employeeId}%` });
    }
    if (name) {
      queryBuilder.andWhere("balance_view.name ILIKE :name", { name: `%${name}%` });
    }

    // startDate와 endDate 필터링
    if (startDate && endDate) {
      // NOTE: ISO String => TIMESTAMPTZ(PostgreSQL에 설정된 타임존으로 변환)
      queryBuilder.andWhere("balance_view.createdAt >= :startDate::TIMESTAMPTZ AND balance_view.createdAt < :endDate::TIMESTAMPTZ + INTERVAL '1 day'", {
        startDate,
        endDate,
      });
    }

    // 정렬
    switch (sort) {
      case CreditHistorySortQuery.CREATED_AT_ASC:
        queryBuilder.orderBy("balance_view.createdAt", "ASC");
        break;
      default:
        queryBuilder.orderBy("balance_view.createdAt", "DESC");
        break;
    }
    // status가 true인 값만 필터링
    queryBuilder.andWhere("balance_view.status = :status", { status: true });

    // 페이지네이션 제외 조건
    if (limit === -1) {
      return queryBuilder.addOrderBy("balance_view.id", "ASC").getManyAndCount();
    }

    return queryBuilder
      .addOrderBy("balance_view.id", "ASC")
      .offset((page - 1) * limit)
      .limit(limit)
      .getManyAndCount();
  }
}
