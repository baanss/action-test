import { Column, CreateDateColumn, DeleteDateColumn, Entity, PrimaryGeneratedColumn } from "typeorm";
import { CreateUserDto } from "@src/user/dto/in/post-user.dto";

@Entity()
export class Application {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column({
    name: "employee_id",
    unique: true,
    collation: "numeric",
  })
  employeeId: string;

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

  @CreateDateColumn({
    name: "created_at",
    type: "timestamp with time zone",
  })
  createdAt: Date;

  @DeleteDateColumn({
    type: "timestamp with time zone",
    default: null,
    name: "deleted_at",
    select: false,
  })
  deletedAt: Date;

  toCreateUserDto(): CreateUserDto {
    const createUserDto = new CreateUserDto();
    createUserDto.employeeId = this.employeeId;
    createUserDto.email = this.email;
    createUserDto.name = this.name;
    if (this.phoneNumber) {
      createUserDto.phoneNumber = this.phoneNumber;
    }
    return createUserDto;
  }
}
