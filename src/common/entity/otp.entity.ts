import { Column, CreateDateColumn, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "@src/common/entity/user.entity";

@Entity()
export class OTP {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @OneToOne(() => User, (user) => user.id, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ name: "user_id", unique: true })
  userId: number;

  @Column({ name: "token" })
  token: string;

  @Column({ name: "expires_in", type: "timestamptz" })
  expiresIn: Date;

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;
}
