import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { Study } from "@src/common/entity/study.entity";

@Entity({ name: "dicom" })
export class Dicom {
  @ApiProperty({ description: "incremental id" })
  @PrimaryGeneratedColumn("increment")
  id: number;

  @ApiProperty({ description: "study 엔티티" })
  @OneToOne(() => Study, (study) => study.dicom, { onDelete: "CASCADE" })
  @JoinColumn({ name: "study_id" })
  study: Study;

  @ApiProperty({ description: "study FK" })
  @Column({ name: "study_id", unique: true })
  studyId: number;

  @ApiProperty({ description: "파일 경로", nullable: true })
  @Column({ name: "file_path", nullable: true })
  filePath: string;

  @ApiProperty({ description: "파일명", uniqueItems: true })
  @Column({ name: "file_name", unique: true })
  fileName: string;

  @ApiProperty({ description: "파일 용량" })
  @Column({ name: "file_size" })
  fileSize: number;

  @ApiProperty({ description: "생성 날짜" })
  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @ApiProperty({ description: "수정 날짜" })
  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;
}
