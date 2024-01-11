import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { IsIn } from "class-validator";
import { Study } from "@src/common/entity/study.entity";
import { RusCaseStatus } from "@src/common/constant/enum.constant";
import { ClinicalInfo } from "@src/common/entity/clinical-info.entity";
import { Hu3d } from "@src/common/entity/hu3d.entity";
import { User } from "@src/common/entity/user.entity";
import { Feedback } from "@src/common/entity/feedback.entity";
import { Surgeon } from "@src/common/entity/surgeon.entity";

@Entity()
export class RusCase {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @ManyToOne(() => User, (user) => user.rusCases, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ name: "user_id", nullable: true })
  userId: number;

  @IsIn(Object.values(RusCaseStatus))
  @Column({ name: "status", default: RusCaseStatus.TODO })
  status: string;

  @OneToOne(() => Study, (study) => study.rusCase, { onDelete: "CASCADE" })
  @JoinColumn({ name: "study_id" })
  study: Study;

  @Column({ name: "study_id", unique: true })
  studyId: number;

  @OneToOne(() => Feedback, (feedback) => feedback.rusCase, { cascade: true, nullable: true })
  feedback: Feedback;

  @OneToOne(() => ClinicalInfo, (clinicalInfo) => clinicalInfo.rusCase, { cascade: true })
  clinicalInfo: ClinicalInfo;

  @OneToOne(() => Hu3d, (hu3d) => hu3d.rusCase, { cascade: true })
  hu3d: Hu3d;

  @ManyToOne(() => Surgeon, (surgeon) => surgeon.rusCases, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "surgeon_id" })
  surgeon: Surgeon | null;

  @Column({ name: "surgeon_id", nullable: true })
  surgeonId: number | null;
}
