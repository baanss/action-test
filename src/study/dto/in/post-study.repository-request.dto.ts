export class PostStudyRepositoryReq {
  uploadJobId: number;
  huId: string;
  patientId: string;
  patientName: string;
  seriesCount: number;
  instancesCount: number;
  studyDate: Date;

  studyDescription?: string;
  age?: number;
  sex?: string;
}
