import { Column, CreateDateColumn, UpdateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "@src/common/entity/user.entity";
import { ApiProperty } from "@nestjs/swagger";

export enum CreditCategory {
  /**
   * RUS 등록
   * - employeeId: 사용자 ID (h-Space 요청 : "hutom")
   */
  RUS_USE = "rus-use",
  /**
   * RUS 취소
   * - employeeId: 사용자 ID (h-Space 요청 : "hutom")
   */
  RUS_CANCEL = "rus-cancel",
  /**
   * Credit 할당 (h-Space > h-Server)
   * - employeeId: "hutom"
   * - huId: null
   */
  ALLOCATE = "allocate",
  /**
   * Credit 회수 (h-Space > h-Server)
   * - employeeId: "hutom"
   * - huId: null
   */
  REVOKE = "revoke",
}

@Entity()
export class CreditHistory {
  @ApiProperty({ description: "incremental id" })
  @PrimaryGeneratedColumn("increment")
  id: number;

  @ApiProperty({ description: "User 엔티티" })
  @ManyToOne(() => User, (user) => user.creditHistories, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "user_id" })
  user: User | null;

  @ApiProperty({ description: "User DB id" })
  @Column({ name: "user_id", nullable: true })
  userId: number | null;

  @ApiProperty({ description: "사용자 id" })
  @Column({
    name: "employee_id",
    collation: "numeric",
  })
  employeeId: string;

  @ApiProperty({ description: "사용자 이름" })
  @Column({
    collation: "numeric",
  })
  name: string;

  @ApiProperty({ description: "크레딧 내역 카테고리" })
  @Column()
  category: CreditCategory;

  @ApiProperty({ description: "크레딧 변동량" })
  @Column()
  quantity: number;

  @ApiProperty({
    description: "크레딧 내역 유효여부 (false: h-Space 응답이 필요)",
    default: false,
  })
  @Column({
    name: "status",
    default: false,
  })
  status: boolean;

  @ApiProperty({ description: "h-Server 요청 여부 (false: h-Space 요청)" })
  @Column({ name: "is_user_request" })
  isUserRequest: boolean;

  @ApiProperty({ description: "huID" })
  @Column({ name: "hu_id", collation: "numeric", nullable: true })
  huId: string | null;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
