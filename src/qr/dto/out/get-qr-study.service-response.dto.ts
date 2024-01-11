export class FindStudyDto {
  patientId: string;
  patientName: string | null;
  studyInstanceUID: string;
  modality: string | null;
  specificCharacterSet: string | null;
  studyDate: string | null;
  studyDescription: string | null;
  patientSex: string | null;
  patientAge: string | null;
  studyId: string | null;
  numberOfStudyRelatedSeries: string | null;
  numberOfStudyRelatedInstances: string | null;
}
