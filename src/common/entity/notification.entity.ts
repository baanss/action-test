import { Column, CreateDateColumn, DeleteDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "@src/common/entity/user.entity";

export enum Category {
  /**
   * 본인 크레딧 부족
   * - 일반 사용자, 매니저
   */
  CREDIT_SHORTAGE = "credit-shortage",
  /**
   * 크레딧 할당됨
   * - 일반 사용자
   */
  CREDIT_ALLOCATED = "credit-allocated",
  /**
   * 크레딧 회수됨
   * - 일반 사용자
   */
  CREDIT_REVOKED = "credit-revoked",
  /**
   * RUS 취소로 크레딧 환불됨
   * - 일반 사용자
   */
  RUS_CANCELED = "rus-canceled",
  /**
   * 저장 공간 부족
   * - 일반 사용자, 매니저, 어드민
   */
  STORAGE_SPACE_SHORTAGE = "storage-space-shortage",
  /**
   * hu3D 제작 완료됨
   * - 대상: RUS Case 신청 계정
   */
  HU3D_COMPLETED = "hu3d-completed",
  /**
   * hu3D 재업로드됨
   * - 대상: RUS Case 신청 계정
   */
  HU3D_UPDATED = "hu3d-updated",
  /**
   * hu3D 삭제됨
   * - 대상: RUS Case 신청 계정
   */
  HU3D_DELETED = "hu3d-deleted",
  /**
   * 매니저한테 크레딧 발행됨
   * - 매니저
   */
  CREDIT_ISSUED = "credit-issued",
  /**
   * 새로운 가입 신청 생성됨
   * - 대상: 대표 계정
   */
  NEW_APPLICATION = "new-application",
  /**
   * 새로운 비밀번호 초기화 요청 들어옴
   * - 매니저, 어드민
   */
  NEW_RESET_PASSWORD_REQUEST = "new-reset-password-request",
  /**
   * 일반 사용자 크레딧 부족
   * - 매니저, 어드민
   */
  USER_CREDIT_SHORTAGE = "user-credit-shortage",
  /**
   * CT 삭제됨
   * - 대상: RUS Case 신청 계정
   */
  CT_DELETED = "ct-deleted",
}

@Entity()
export class Notification {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @ManyToOne(() => User, (user) => user.notifications, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ name: "user_id" })
  userId: number;

  @Column({
    type: "varchar",
  })
  category: Category;

  @Column()
  message: string;

  @Column({
    default: false,
  })
  read: boolean;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamp with time zone",
  })
  createdAt: Date;

  @DeleteDateColumn({
    type: "timestamp with time zone",
    default: null,
    name: "deleted_at",
    select: false,
  })
  deletedAt: Date;
}
