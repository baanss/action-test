export const Sex = {
  M: "M",
  F: "F",
  O: "O",
};

export enum AeMode {
  SCU = "scu",
  SCP = "scp",
}

export enum UploadJobStatus {
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
  REJECT = "REJECT",
}

export enum RusCaseStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
  REJECT = "REJECT",
}

export enum FileType {
  CT = "CT",
  HU3D = "HU3D",
  ETC = "ETC",
}

// 일반 사용자 서비스 > RusCase List
export enum RusCaseSortQuery {
  DELIVERY_DATE = "deliveryDate",
  CREATED_AT = "createdAt",
}

// 일반 사용자 서비스 > Storage Management
export enum StorageSortQuery {
  HU_ID = "huId",
  TARGET_DATE = "deliveryDate",
  CREATED_AT = "createdAt",
}

// 관리자 서비스 > RusCase List
export enum RusCaseStorageSortQuery {
  CREATED_AT = "createdAt",
  HU_ID = "huId",
  EMPLOYEE_ID = "employeeId",
  NAME = "name",
  DEPARTMENT = "department",
  OPERATION_TYPE = "operationType",
}

// Admin Settings > Storage Management
export enum StudyStorageSortQuery {
  CREATED_AT = "createdAt",
  DELIVERY_DATE = "deliveryDate",
  OPERATION_TYPE = "operationType",
}

// 일반 사용자 서비스 > Study List
export enum StudySortQuery {
  CREATED_AT = "createdAt",
  STUDY_DATE = "studyDate",
}

/**
 * 사용 위치
 * - GET /upload-jobs
 */
export enum UploadJobSortQuery {
  CREATED_AT = "createdAt",
  STUDY_DATE = "studyDate",
}

// 정렬
export enum OrderQuery {
  DESC = "desc",
  ASC = "asc",
}

/**
 * 로그 서비스 유형
 * APP: RUS Client
 * USER: h-Server 서비스
 * SYSTEM: 서버 내부 처리
 */
export enum ServiceType {
  RUS_CLIENT = "APP",
  USER = "HSERVER",
  SYSTEM = "HSERVER", // NOTE: 로그 처리 위치의 명시적(코드내부) 표기
}

// 로그 유형
export enum LogType {
  ADD_USER = "Account Creation",
  DELETE_USER = "Account Deletion",
  CHANGE_USER_PASSWORD = "Change Password",
  RESET_USER_PASSWORD = "Reset Password",
  LOG_IN = "Log in",
  LOG_OUT = "Log out",
  DOWNLOAD_FILE = "Download",
  DELETE_FILE = "File Deletion",
  DICOM_RETRIEVE = "DICOM Retrieve",
  DICOM_QUERY = "DICOM Query",
  VIEW_LIST = "View list",
  RUS_REGISTER = "RUS Register",
  CHANGE_OPERATION_DATE = "Change operation date",
  CHANGE_DELIVERY_DATE = "Change delivery date",
}
