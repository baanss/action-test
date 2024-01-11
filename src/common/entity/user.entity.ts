import { Column, CreateDateColumn, DeleteDateColumn, Entity, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";

import { Role } from "@src/auth/interface/auth.interface";

import { Notification } from "@src/common/entity/notification.entity";
import { RusCase } from "@src/common/entity/rus-case.entity";
import { CreditHistory } from "@src/common/entity/credit-history.entity";
import { Session } from "@src/common/entity/session.entity";
import { UploadJob } from "@src/common/entity/upload-job.entity";
import { OTP } from "@src/common/entity/otp.entity";
import { Recipient } from "@src/common/entity/recipient.entity";

@Entity()
export class User {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column({
    name: "employee_id",
    unique: true,
    collation: "numeric",
  })
  employeeId: string;

  @Column()
  password: string;

  @Column({
    name: "prev_password",
    nullable: true,
  })
  prevPassword: string;

  @Column({
    unique: true,
  })
  email: string;

  @Column({
    collation: "numeric",
  })
  name: string;

  @Column({
    name: "phone_number",
    nullable: true,
  })
  phoneNumber?: string;

  @Column({
    name: "profile_path",
    nullable: true,
  })
  profilePath?: string;

  @Column({
    name: "sign_in_failed",
    default: 0,
  })
  signInFailed: number;

  @Column({
    name: "show_guide",
    default: true,
  })
  showGuide: boolean;

  @Column()
  role: Role;

  @Column({
    type: "timestamp with time zone",
    default: null,
    name: "last_login",
  })
  lastLogin: Date;

  @Column({
    name: "enable_email",
    default: true,
  })
  enableEmail: boolean;

  @CreateDateColumn({
    name: "password_setting_at",
    type: "timestamptz",
    nullable: true,
  })
  passwordSettingAt: Date;

  @Column({
    name: "init_password",
    default: true,
  })
  initPassword: boolean;

  @DeleteDateColumn({
    type: "timestamp with time zone",
    default: null,
    name: "deleted_at",
    select: false,
  })
  deletedAt: Date;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamp with time zone",
  })
  createdAt: Date;

  @OneToMany(() => RusCase, (rusCase) => rusCase.user)
  rusCases?: RusCase[];

  @OneToMany(() => Notification, (notification) => notification.user, { nullable: true })
  notifications?: Notification[];

  @OneToMany(() => CreditHistory, (ch) => ch.user, { nullable: true })
  creditHistories?: CreditHistory[];

  @OneToOne(() => Session, (session) => session.user, { nullable: true })
  session?: Session;

  @OneToMany(() => UploadJob, (uploadJob) => uploadJob.user, { nullable: true })
  uploadJobs?: UploadJob[];

  @OneToOne(() => OTP, (otp) => otp.userId, { nullable: true })
  otp?: OTP;

  @OneToMany(() => Recipient, (recipient) => recipient.userId, { nullable: true })
  recipients?: Recipient[];
}
