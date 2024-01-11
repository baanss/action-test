export class CreateUploadJobRepositoryReq {
  huId: string;
  age: number | null;
  studyInstanceUID?: string;
  aeMode?: string;
  sex?: string;
  patientId?: string;
  patientName?: string;
  isAquired?: boolean;
  userId?: number;
  instancesCount?: number;
}
