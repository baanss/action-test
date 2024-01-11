import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { numberTransformer } from "@src/util/transformer.util";
import { Dicom } from "@src/common/entity/dicom.entity";
import { RusCase } from "@src/common/entity/rus-case.entity";
import { UploadJob } from "@src/common/entity/upload-job.entity";

@Entity({ name: "study" })
export class Study {
  @ApiProperty({ description: "incremental id" })
  @PrimaryGeneratedColumn("increment")
  id: number;

  @ApiProperty({ description: "huID" })
  @Column({
    name: "hu_id",
    unique: true,
    collation: "numeric",
  })
  huId: string;

  @ApiProperty({ description: "환자 ID" })
  @Column({ name: "patient_id" })
  patientId: string;

  @ApiProperty({ description: "환자 이름" })
  @Column({ name: "patient_name" })
  patientName: string;

  @ApiProperty({ description: "Study Date" })
  @Column({
    name: "study_date",
    type: "timestamptz",
  })
  studyDate: Date;

  @ApiProperty({ description: "Study Description", maxLength: 64, nullable: true })
  @Column({
    name: "study_description",
    width: 64,
    nullable: true,
  })
  studyDescription: string | null;

  @ApiProperty({ description: "시리즈 수(폴더)" })
  @Column({
    name: "series_count",
    type: "smallint",
    transformer: numberTransformer,
  })
  seriesCount: number;

  @ApiProperty({ description: "인스턴스 수(파일)" })
  @Column({
    name: "instances_count",
    type: "smallint",
    transformer: numberTransformer,
  })
  instancesCount: number;

  @ApiProperty({ description: "환자 나이", type: "int2", default: null })
  @Column({
    name: "age",
    type: "smallint",
    transformer: numberTransformer,
    nullable: true,
  })
  age: number;

  @ApiProperty({ description: "환자 성별", default: null })
  @Column({
    name: "sex",
    type: "char",
    length: 1,
    nullable: true,
  })
  sex: string;

  @ApiProperty({ description: "생성 날짜" })
  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @ApiProperty({ description: "케이스 등록 여부", default: false })
  @Column({ name: "is_registerd", type: "boolean", default: false })
  isRegistered: boolean;

  @ApiProperty({ description: "uploadJob 엔티티" })
  @OneToOne(() => UploadJob, (uploadJob) => uploadJob.study, { nullable: true })
  @JoinColumn({ name: "upload_job_id" })
  uploadJob: UploadJob;

  @ApiProperty({ description: "uploadJob DB id" })
  @Column({ name: "upload_job_id", nullable: true })
  uploadJobId: number;

  @ApiProperty({ description: "다이콤 엔티티" })
  @OneToOne(() => Dicom, (dicom) => dicom.study, { cascade: true })
  dicom: Dicom;

  @ApiProperty({ description: "RUS Case 엔티티" })
  @OneToOne(() => RusCase, (rusCase) => rusCase.study, { cascade: true })
  rusCase: RusCase;
}
