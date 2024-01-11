import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

@Entity()
export class UpdateLog {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column({ name: "file_name" })
  fileName: string;

  @Column({ name: "file_path", nullable: true })
  filePath: string;

  @Column({ name: "file_size" })
  fileSize: number;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  // update-log 다운로드 URL
  getDownloadUrl(serverUrl: string): string {
    return `${serverUrl}/update-logs/latest/download`;
  }
}
