import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "@src/common/entity/user.entity";

@Entity()
export class Session {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @OneToOne(() => User, (user) => user.session, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ name: "user_id", unique: true, nullable: true })
  userId: number;

  @Column({ name: "session_token", nullable: true })
  sessionToken: string;

  @Column({
    name: "expires_in",
    type: "timestamp with time zone",
    nullable: true,
  })
  expiresIn: Date;

  @CreateDateColumn({
    name: "created_at",
    type: "timestamp with time zone",
  })
  createdAt: Date;

  @UpdateDateColumn({
    name: "updated_at",
    type: "timestamp with time zone",
    default: null,
  })
  updatedAt: Date;
}
