export class CreateClinicalInfoRepositoryReq {
  rusCaseId: number;
  operationType: string;
  deliveryDate: string;
  operationDate: string;
  age: number;
  sex: string;
  height: number;
  weight: number;
  childbirth: boolean;
  memo?: string;
  remark?: string;
}
