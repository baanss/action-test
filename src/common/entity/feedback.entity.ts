import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { RusCase } from "@src/common/entity/rus-case.entity";

@Entity()
export class Feedback {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @OneToOne(() => RusCase, (rusCase) => rusCase.feedback, { onDelete: "CASCADE" })
  @JoinColumn({ name: "rus_case_id" })
  rusCase: RusCase;

  @Column({ name: "rus_case_id", unique: true })
  rusCaseId: number;

  @Column({ name: "message" })
  message: string;

  @Column({ name: "writer_email" })
  writerEmail: string;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  update(message: string, writerEmail: string) {
    this.message = message;
    this.writerEmail = writerEmail;
  }
}
