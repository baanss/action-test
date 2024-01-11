import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { RusCase } from "@src/common/entity/rus-case.entity";
import { numberTransformer } from "@src/util/transformer.util";

@Entity()
export class ClinicalInfo {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @OneToOne(() => RusCase, (rusCase) => rusCase.clinicalInfo, { onDelete: "CASCADE" })
  @JoinColumn({ name: "rus_case_id" })
  rusCase: RusCase;

  @Column({ name: "rus_case_id", unique: true })
  rusCaseId: number;

  @Column({ name: "operation_type" })
  operationType: string;

  @Column({ name: "delivery_date", type: "timestamptz" })
  deliveryDate: Date;

  @Column({
    name: "age",
    type: "smallint",
    transformer: numberTransformer,
    default: 0,
  })
  age: number;

  @Column({
    name: "sex",
    type: "char",
    length: 1,
  })
  sex: string;

  @Column({ name: "height", type: "float" })
  height: number;

  @Column({ name: "weight", type: "float" })
  weight: number;

  @Column({ name: "childbirth", type: "boolean" })
  childbirth: boolean;

  @Column({ name: "operation_date", type: "timestamptz", nullable: true })
  operationDate: Date | null;

  @Column({ name: "memo", nullable: true })
  memo: string | null;

  @Column({ name: "remark", nullable: true })
  remark: string | null;
}
