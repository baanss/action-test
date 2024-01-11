import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { RusCase } from "@src/common/entity/rus-case.entity";

@Entity()
export class Hu3d {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @OneToOne(() => RusCase, (rusCase) => rusCase.hu3d, { onUpdate: "CASCADE" })
  @JoinColumn({ name: "rus_case_id" })
  rusCase: RusCase;

  @Column({ name: "rus_case_id", unique: true })
  rusCaseId: number;

  @Column({ name: "file_path", nullable: true })
  filePath: string;

  @Column({ name: "file_name", unique: true })
  fileName: string;

  @Column({ name: "file_size" })
  fileSize: number;

  @Column({ name: "version", nullable: true })
  version: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz", select: false })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz", select: false })
  updatedAt: Date;
}
