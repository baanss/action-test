import { Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";
import { RusCase } from "@src/common/entity/rus-case.entity";

@Entity()
export class Surgeon {
  @ApiProperty({ description: "DB id" })
  @PrimaryGeneratedColumn("increment")
  id: number;

  @ApiProperty({ description: "name", uniqueItems: true, maxLength: 64 })
  @Column({ name: "name", unique: true, length: 64 })
  name: string;

  @ApiProperty({ description: "생성 날짜" })
  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt: Date;

  @ApiProperty({ description: "수정 날짜" })
  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt: Date;

  @OneToMany(() => RusCase, (rusCase) => rusCase.surgeon, { nullable: true })
  rusCases?: RusCase[];
}
