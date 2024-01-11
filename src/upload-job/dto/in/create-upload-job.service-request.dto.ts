export class CreateUploadJobServiceReq {
  aeMode: string;
  studyInstanceUID?: string;
  isAquired?: boolean;
  userId?: number;
  patientId?: string;
  patientName?: string;
  instancesCount?: number;
  age?: string;
  sex?: string;
}
