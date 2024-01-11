import { Connection, ViewColumn, ViewEntity } from "typeorm";
import { RusCase } from "@src/common/entity/rus-case.entity";
import { Surgeon } from "@src/common/entity/surgeon.entity";
import { User } from "@src/common/entity/user.entity";
import { Study } from "@src/common/entity/study.entity";
import { Dicom } from "@src/common/entity/dicom.entity";
import { ClinicalInfo } from "@src/common/entity/clinical-info.entity";
import { Hu3d } from "@src/common/entity/hu3d.entity";
import { Feedback } from "@src/common/entity/feedback.entity";

@ViewEntity({
  expression: (connection: Connection) =>
    connection
      .createQueryBuilder()
      .select("rus_case.id", "id")
      .addSelect("rus_case.status", "status")
      .from(RusCase, "rus_case")
      .leftJoin(Study, "study", "rus_case.study_id = study.id")
      .addSelect("study.huId", "hu_id")
      .addSelect("study.patient_id", "patient_id")
      .addSelect("study.patient_name", "patient_name")
      .leftJoin(ClinicalInfo, "clinical_info", "rus_case.id = clinical_info.rus_case_id")
      .addSelect("clinical_info.operation_type", "operation_type")
      .addSelect("clinical_info.delivery_date", "delivery_date")
      .addSelect("clinical_info.age", "age")
      .addSelect("clinical_info.sex", "sex")
      .addSelect("clinical_info.height", "height")
      .addSelect("clinical_info.weight", "weight")
      .addSelect("clinical_info.childbirth", "childbirth")
      .addSelect("clinical_info.operation_date", "operation_date")
      .addSelect("clinical_info.memo", "memo")
      .addSelect("clinical_info.remark", "remark")
      .leftJoin(Surgeon, "surgeon", "rus_case.surgeon_id = surgeon.id")
      .addSelect("surgeon.name", "srugeon_name")
      .leftJoin(User, "user", "rus_case.user_id = user.id")
      .addSelect("user.id", "user_id")
      .addSelect("user.name", "user_name")
      .leftJoin(Feedback, "feedback", "rus_case.id = feedback.rus_case_id")
      .addSelect("feedback.id", "feedback_id")
      .leftJoin(Hu3d, "hu3d", "rus_case.id = hu3d.rus_case_id")
      .addSelect("hu3d.file_path", "hu3d_file_path")
      .leftJoin(Dicom, "dicom", "study.id = dicom.study_id")
      .addSelect("dicom.file_path", "dicom_file_path"),
})
export class RusCaseView {
  @ViewColumn({ name: "id" })
  id: number;

  @ViewColumn({ name: "status" })
  status: string;

  @ViewColumn({ name: "hu_id" })
  huId: string;

  @ViewColumn({ name: "patient_id" })
  patientId: string;

  @ViewColumn({ name: "patient_name" })
  patientName: string;

  @ViewColumn({ name: "operation_type" })
  operationType: string;

  @ViewColumn({ name: "delivery_date" })
  deliveryDate: Date;

  @ViewColumn({ name: "age" })
  age: number;

  @ViewColumn({ name: "sex" })
  sex: string;

  @ViewColumn({ name: "height" })
  height: number;

  @ViewColumn({ name: "weight" })
  weight: number;

  @ViewColumn({ name: "childbirth" })
  childbirth: boolean;

  @ViewColumn({ name: "operation_date" })
  operationDate: Date;

  @ViewColumn({ name: "memo" })
  memo: string | null;

  @ViewColumn({ name: "remark" })
  remark: string | null;

  @ViewColumn({ name: "surgeon_name" })
  surgeonName: string | null;

  @ViewColumn({ name: "user_id" })
  userId: number | null;

  @ViewColumn({ name: "user_name" })
  userName: string | null;

  @ViewColumn({ name: "feedback_id" })
  feedbackId: number | null;

  @ViewColumn({ name: "hu3d_file_path" })
  hu3dFilePath: string | null;

  @ViewColumn({ name: "dicom_file_path" })
  dicomFilePath: string | null;
}
