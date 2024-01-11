import { IsIn } from "class-validator";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";

import { UploadJobStatus } from "@src/common/constant/enum.constant";
import { Study } from "@src/common/entity/study.entity";
import { User } from "@src/common/entity/user.entity";
import { numberTransformer } from "@src/util/transformer.util";

@Entity()
export class UploadJob {
  @ApiProperty({ description: "incremental id" })
  @PrimaryGeneratedColumn("increment")
  id: number;

  @ApiProperty({ description: "huId" })
  @Column({ name: "hu_id", unique: true, collation: "numeric" })
  huId: string;

  @ApiProperty({ description: "AE mode", nullable: true, examples: { scu: "C-MOVE request", scp: "dicom-send request", null: "local upload request" } })
  @Column({ name: "ae_mode", nullable: true })
  aeMode: string;

  @ApiProperty({ description: "upload-job 작업 진행 상태", enum: UploadJobStatus, default: UploadJobStatus.IN_PROGRESS })
  @IsIn(Object.values(UploadJobStatus))
  @Column({ name: "status", default: UploadJobStatus.IN_PROGRESS })
  status: string;

  @ApiProperty({ description: "upload-job 작업 결과 메시지", nullable: true })
  @Column({ name: "message", nullable: true })
  message: string;

  // FIXME: 제거
  @ApiProperty({ description: "study DB id", nullable: true })
  @Column({ name: "study_id", nullable: true })
  studyId: number;

  @ApiProperty({ description: "huId 할당 여부", default: false })
  @Column({ name: "is_aquired", default: false })
  isAquired: boolean;

  @ApiProperty({ description: "StudyInstanceUID", nullable: true })
  @Column({ name: "study_instance_uid", nullable: true })
  studyInstanceUID: string;

  @ApiProperty({ description: "요청 파일 개수", nullable: true })
  @Column({ name: "instances_count", nullable: true })
  instancesCount: number;

  @ApiProperty({ description: "study 엔티티" })
  @OneToOne(() => Study, (study) => study.uploadJob, { nullable: true })
  study: Study;

  @ApiProperty({ description: "생성 날짜" })
  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @ApiProperty({ description: "수정 날짜" })
  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @ApiProperty({ description: "환자 ID", nullable: true })
  @Column({ name: "patient_id", nullable: true })
  patientId: string | null;

  @ApiProperty({ description: "환자 이름", nullable: true })
  @Column({ name: "patient_name", nullable: true })
  patientName: string | null;

  @ApiProperty({ description: "환자 나이", type: "int2", default: null, nullable: true })
  @Column({
    name: "age",
    type: "smallint",
    transformer: numberTransformer,
    nullable: true,
  })
  age: number | null;

  @ApiProperty({ description: "환자 성별", default: null, nullable: true })
  @Column({
    name: "sex",
    type: "char",
    length: 1,
    nullable: true,
  })
  sex: string | null;

  @ApiProperty({ description: "user 엔티티" })
  @ManyToOne(() => User, (user) => user.uploadJobs, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "user_id" })
  user: User | null;

  @ApiProperty({ description: "user DB id" })
  @Column({ name: "user_id", nullable: true })
  userId: number | null;
}
