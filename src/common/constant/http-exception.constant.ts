export const HutomHttpException = {
  /**
   * 요청 바디가 적절하지 않은 경우
   * - 발생 시나리오
   * 1. Recipient 생성/수정: 중복되는 email값으로 생성/수정 불가
   * 2. OTP 생성: employeeId와 email이 매칭되지 않음
   * 3. POST /admins/delete: 입력된 정보가 대표 계정의 정보와 일치하지 않음
   */
  INVALID_REQUEST_BODY: {
    statusCode: 400,
    error: "INVALID_REQUEST_BODY",
    _description: "요청 바디가 적절하지 않은 경우",
  },
  /**
   * 요청 바디(비밀번호)가 적절하지 않은 경우
   * - 발생 시나리오
   * 1. 특정 사용자 비밀번호 변경 : 현재 비밀번호와 동일한 비밀번호로 변경 불가
   */
  INVALID_REQUEST_CURRENT_PASSWORD: {
    statusCode: 400,
    error: "INVALID_REQUEST_CURRENT_PASSWORD",
    _description: "현재 비밀번호와 동일한 비밀번호로 변경 불가",
  },
  /**
   * 요청 바디(비밀번호)가 적절하지 않은 경우
   * - 발생 시나리오
   * 1. 특정 사용자 비밀번호 변경 : 직전 비밀번호와 동일한 비밀번호로 변경 불가
   */
  INVALID_REQUEST_PREV_PASSWORD: {
    statusCode: 400,
    error: "INVALID_REQUEST_PREV_PASSWORD",
    _description: "직전 비밀번호와 동일한 비밀번호로 변경 불가",
  },
  /**
   * 요청 파라미터가 적절하지 않는 경우
   * - 발생 시나리오: RUS Case id 타입이 숫자가 아닌 경우
   */
  INVALID_REQUEST_PARAMETER: {
    statusCode: 400,
    error: "INVALID_REQUEST_PARAMETER",
    _description: "요청 파라미터가 적절하지 않는 경우",
  },
  /**
   * 요청에 유효한 파일이 존재하지 않는 경우
   * - 예시: 요청 바디에 파일이 존재하지 않는 경우
   * - 발생 시나리오: 파일 업로드
   * - 파일 대상: dicom, hu3d, installer, update-log
   */
  INVALID_REQUEST_FILE: {
    statusCode: 400,
    error: "INVALID_REQUEST_FILE",
    _description: "요청에 유효한 파일이 존재하지 않는 경우",
  },
  /**
   * 파일 확장자가 잘못된 경우
   * - 발생 시나리오: 파일 업로드
   * - 파일 대상: dicom, hu3d, installer, update-log
   */
  INVALID_REQUEST_FILE_EXTENSION: {
    statusCode: 400,
    error: "INVALID_REQUEST_FILE_EXTENSION",
    _description: "파일 확장자가 잘못된 경우",
  },
  /**
   * 파일 이름이 잘못된 경우
   * - 예시: 파일 이름이 규칙에 맞지 않음(버전, huId 규칙)
   * - 발생 시나리오: 파일 업로드
   * - 파일 대상: hu3d
   */
  INVALID_REQUEST_FILE_NAME: {
    statusCode: 400,
    error: "INVALID_REQUEST_FILE_NAME",
    _description: "파일 이름이 잘못된 경우",
  },
  /**
   * 다이콤 파일이 잘못된 경우
   * - 예시: 압축 파일 내 읽을 수 있는 다이콤 파일이 없음
   * - 발생 시나리오: 파일 업로드
   * - 파일 대상: dicom
   */
  INVALID_REQUEST_FILE_DICOM: {
    statusCode: 400,
    error: "INVALID_REQUEST_FILE_DICOM",
    _description: "다이콤 파일이 잘못된 경우",
  },
  /**
   * hu3d가 이미 등록되어서 케이스 작업을 취소할 수 없음
   * - 발생 시나리오: 등록 취소
   */
  INVALID_RUS_CASE_REJECT_REQUEST_HU3D: {
    statusCode: 400,
    error: "INVALID_RUS_CASE_REJECT_REQUEST_HU3D",
    _description: "hu3d가 이미 등록되어서 케이스 작업을 취소할 수 없음",
  },
  /**
   * RUS Case 작업 취소 불가
   * - 발생 시나리오
   * 1. PATCH /rus-cases/:id - 작업 취소(h-Server 요청, 케이스 작업 상태가 TODO인 경우에 취소할 수 있음)
   * 2. PATCH /rus-cases - 작업 취소(h-Space 요청)
   */
  INVALID_RUS_CASE_REJECT_REQUEST_STATUS: {
    statusCode: 400,
    error: "INVALID_RUS_CASE_REJECT_REQUEST_STATUS",
    _description:
      "rusCase의 status를 변경할 수 없음(h-Server 요청: 기존 Status가 TODO인 경우에만 취소 가능, h-Space 요청: 기존 Status가 DONE, REJECT가 아닌 경우에만 취소 가능)",
  },
  /**
   * RUS Case 작업 상태 변경 불가
   * - 발생 시나리오
   * 1. PATCH /rus-cases - 작업 취소(h-Space 요청)
   */
  INVALID_RUS_CASE_STATUS_UPDATE: {
    statusCode: 400,
    error: "INVALID_RUS_CASE_STATUS_UPDATE",
    _description:
      "rusCase의 status를 변경할 수 없음(h-Server 요청: 기존 Status가 TODO인 경우에만 취소 가능, h-Space 요청: 기존 Status가 DONE, REJECT가 아닌 경우에만 취소 가능)",
  },
  /**
   * INVALID_DELETE_ADMIN_BY_CREDIT
   * - 발생 시나리오: 크레딧이 남아있을 때, 대표 계정을 삭제할 수 없음.
   * 1. 대표 계정 삭제: POST /admins/delete
   */
  INVALID_DELETE_ADMIN_BY_CREDIT: {
    statusCode: 400,
    error: "INVALID_DELETE_ADMIN_BY_CREDIT",
    _description: "h-Server에 크레딧이 남아있을 경우, 대표 계정을 삭제할 수 없음",
  },
  /**
   * 사용자가 요청한 RUS Case가 작업중이기 때문에 계정을 삭제할 수 없음
   * - 발생 시나리오: 사용자 삭제
   */
  INVALID_DELETE_USERS_RUS_CASE_IN_PROGRESS: {
    statusCode: 400,
    error: "INVALID_DELETE_USERS_RUS_CASE_IN_PROGRESS",
    _description: "사용자가 요청한 RUS Case가 작업중이기 때문에 계정을 삭제할 수 없음",
  },
  /**
   * 본인 계정은 삭제할 수 없음
   * - 발생 시나리오
   * 1. 사용자 삭제
   */
  INVALID_USER_DELETE_OWN_ACCOUNT: {
    statusCode: 400,
    error: "INVALID_USER_DELETE_OWN_ACCOUNT",
    _description: "본인 계정은 삭제할 수 없음",
  },
  /**
   * 자원에 접근 권한이 없음
   * - 발생 시나리오
   * 1. 권한 없음(role gaurd)
   * 2. 접근 권한이 없는 케이스를 조회
   * 3. 접근 권한이 없는 계정 삭제
   * 4. 생성 권한이 없는 계정 생성
   * 5. 특정 사용자 정보 변경
   * 6. 특정 사용자 프로필 이미지 업로드: 자신의 프로필 이미지는 변경할 수 없음
   * 7. 일반 사용자 크레딧 할당 및 회수
   * 8. 권한 요청 삭제
   * 9. 비밀번호 초기화 요청 승인
   */
  FORBIDDEN_RESOURCE: {
    statusCode: 403,
    error: "FORBIDDEN_RESOURCE",
    _description: "자원에 접근 권한이 없음",
  },
  /**
   * 자원에 접근 권한이 없음(비밀번호 틀림)
   * - 발생 시나리오
   * 1. 관리자 케이스 작업 취소: 비밀번호 틀림
   * 2. 사용자 삭제
   */
  FORBIDDEN_RESOURCE_INCORRECT_PASSWORD: {
    statusCode: 403,
    error: "FORBIDDEN_RESOURCE_INCORRECT_PASSWORD",
    _description: "자원에 접근 권한이 없음(비밀번호 틀림)",
  },
  /**
   * 발생 시나리오
   * 1. 일반사용자 로그인: 비밀번호 오류 5회 이상 누적
   */
  LOCKED_PASSWORD_USER: {
    statusCode: 400,
    error: "LOCKED_PASSWORD_USER",
    _description: "비밀번호 오류 5회 이상 누적",
  },
  /**
   * 스터디가 존재하지 않음
   * - 예시: StudyId로 조회가 불가함
   * - 발생 시나리오: 케이스 등록 시, 스터디 조회
   */
  NOT_FOUND_STUDY_WITH_ID: {
    statusCode: 404,
    error: "NOT_FOUND_STUDY_WITH_ID",
    _description: "스터디를 존재하지 않음",
  },
  /**
   * 사용자가 존재하지 않음
   * - 예시: UserId로 조회가 불가함
   * - 발생 시나리오
   * 1. 케이스 등록 시, 사용자 조회
   * 2. 로그인 시, 사용자 조회
   * 3. 특정 사용자 정보 변경: 수정할 사용자가 존재하지 않음
   * 4. 현재 사용자 정보 변경
   * 5. 현재 사용자 비밀번호 변경
   * 6. 현재 사용자 프로필 이미지 업로드
   * 7. 특정 사용자 프로필 이미지 업로드
   * 8. 일반 사용자 크레딧 할당 및 회수
   * 9. 권한 요청 생성
   * 10. 비밀번호 초기화 요청 생성
   * 11. PATCH /rus-cases/:id - 작업 취소
   */
  NOT_FOUND_USER_WITH_ID: {
    statusCode: 404,
    error: "NOT_FOUND_USER_WITH_ID",
    _description: "사용자가 존재하지 않음",
  },
  /**
   * RusCase 존재하지 않음
   * - 예시: id로 등록된 RusCase가 없는 경우
   * - 발생 시나리오
   * 1. PATCH /rus-cases - 매칭된 케이스 작업 취소
   */
  NOT_FOUND_RUS_CASE_WITH_ID: {
    statusCode: 404,
    error: "NOT_FOUND_RUS_CASE_WITH_ID",
    _description: "RusCase 존재하지 않음",
  },
  /**
   * RusCase 존재하지 않음
   * - 예시: huId와 매칭되는 RusCase가 없는 경우
   * - 발생 시나리오
   * 1. PATCH /rus-cases - 매칭된 케이스 작업 취소
   */
  NOT_FOUND_RUS_CASE_WITH_HUID: {
    statusCode: 404,
    error: "NOT_FOUND_RUS_CASE_WITH_HUID",
    _description: "RusCase 존재하지 않음",
  },
  /**
   * Dicom 존재하지 않음
   * - 예시: study로 등록된 다이콤이 없는 경우
   * - 발생 시나리오: hu3d 업로드
   * 1. PATCH /rus-cases/:id - 작업 취소
   * 2. PATCH /rus-cases - 매칭된 케이스 작업 취소
   */
  NOT_FOUND_DICOM_WITH_STUDY_ID: {
    statusCode: 404,
    error: "NOT_FOUND_DICOM_WITH_STUDY_ID",
    _description: "Dicom 존재하지 않음",
  },
  /**
   * hu3d를 조회할 수 없는 경우
   * - 예시: 케이스에 등록된 hu3d가 없는 경우
   * - 발생 시나리오: hu3d 파일 삭제
   */
  NOT_FOUND_HU3D_WITH_STUDY_ID: {
    statusCode: 404,
    error: "NOT_FOUND_HU3D_WITH_STUDY_ID",
    _description: "hu3d를 조회할 수 없는 경우",
  },
  /**
   * 다이콤 파일이 DB에 존재하지 않음
   * - 예시: 다이콤 파일이 제거됨
   * - 발생 시나리오: h-Cloud에 케이스 전달
   */
  NOT_FOUND_DICOM_ON_DB: {
    statusCode: 404,
    error: "NOT_FOUND_DICOM_ON_DB",
    _description: "다이콤 파일이 DB에 존재하지 않음",
  },
  /**
   * 다이콤 파일이 디스크에 존재하지 않음
   * - 예시: 다이콤 파일에 접근할 수 없음
   * - 발생 시나리오
   * 1. h-Cloud에 케이스 전달: POST /cloud
   * 2. Study 생성: POST /studies
   */
  NOT_FOUND_DICOM_ON_DISK: {
    statusCode: 404,
    error: "NOT_FOUND_DICOM_ON_DISK",
    _description: "다이콤 파일이 디스크에 존재하지 않음",
  },
  /**
   * hu3d 파일이 DB에 존재하지 않음
   * - 예시: hu3d 파일이 제거됨
   * - 발생 시나리오: h-Cloud에 케이스 전달
   */
  NOT_FOUND_HU3D_ON_DB: {
    statusCode: 404,
    error: "NOT_FOUND_HU3D_ON_DB",
    _description: "hu3d 파일이 DB에 존재하지 않음",
  },
  /**
   * hu3d 파일이 디스크에 존재하지 않음
   * - 예시: hu3d 파일에 접근할 수 없음
   * - 발생 시나리오
   * 1. h-Cloud에 케이스 전달
   */
  NOT_FOUND_HU3D_ON_DISK: {
    statusCode: 404,
    error: "NOT_FOUND_HU3D_ON_DISK",
    _description: "hu3d 파일이 디스크에 존재하지 않음",
  },
  /**
   * installer 파일이 DB에 존재하지 않음
   * - 예시: installer 파일이 제거됨
   * - 발생 시나리오: installer 파일 다운로드
   */
  NOT_FOUND_INSTALLER_ON_DB: {
    statusCode: 404,
    error: "NOT_FOUND_INSTALLER_ON_DB",
    _description: "installer 파일이 DB에 존재하지 않음",
  },
  /**
   * installer 파일이 디스크에 존재하지 않음
   * - 예시: installer 파일에 접근할 수 없음
   * - 발생 시나리오: installer 파일 다운로드
   */
  NOT_FOUND_INSTALLER_ON_DISK: {
    statusCode: 404,
    error: "NOT_FOUND_INSTALLER_ON_DISK",
    _description: "installer 파일이 디스크에 존재하지 않음",
  },
  /**
   * update-log 파일이 DB에 존재하지 않음
   * - 예시: update-log 파일이 제거됨
   * - 발생 시나리오: update-log 파일 다운로드
   */
  NOT_FOUND_UPDATE_LOG_ON_DB: {
    statusCode: 404,
    error: "NOT_FOUND_UPDATE_LOG_ON_DB",
    _description: "update-log 파일이 DB에 존재하지 않음",
  },
  /**
   * update-log 파일이 디스크에 존재하지 않음
   * - 예시: update-log 파일에 접근할 수 없음
   * - 발생 시나리오: update-log 파일 다운로드
   */
  NOT_FOUND_UPDATE_LOG_ON_DISK: {
    statusCode: 404,
    error: "NOT_FOUND_UPDATE_LOG_ON_DISK",
    _description: "update-log 파일이 디스크에 존재하지 않음",
  },
  /**
   * reset-password-request 존재하지 않음
   * - 발생 시나리오
   * 1. 비밀번호 초기화 요청 승인
   */
  NOT_FOUND_RESET_PASSWORD_REQUEST_WITH_ID: {
    statusCode: 400,
    error: "NOT_FOUND_RESET_PASSWORD_REQUEST_WITH_ID",
    _description: "reset-password-request 존재하지 않음",
  },
  /**
   * feedback 존재하지 않음
   * - 발생 시나리오
   * 1. 특정 케이스의 피드백 조회
   */
  NOT_FOUND_FEEDBACK_WITH_ID: {
    statusCode: 400,
    error: "NOT_FOUND_FEEDBACK_WITH_ID",
    _description: "feedback 존재하지 않음",
  },
  /**
   * 요청이 타임아웃된 경우
   * - 발생 시나리오: 파일 업로드, h-Cloud 서버로 요청
   */
  REQUEST_TIMEOUT: {
    statusCode: 408,
    error: "REQUEST_TIMEOUT",
    _description: "요청이 타임아웃된 경우",
  },
  /**
   * 파일이 디스크에서 중복되는 경우
   * - 발생 시나리오: 파일 업로드
   * - 파일 대상: update-log
   */
  DUPLICATED_FILE_NAME_ON_DISK: {
    statusCode: 409,
    error: "DUPLICATED_FILE_NAME_ON_DISK",
    _description: "파일이 디스크에서 중복되는 경우",
  },
  /**
   * 파일이 DB에서 중복되는 경우
   * - 발생 시나리오
   * 1. 파일 업로드
   * 2. 스터디 등록: POST /studies
   * - 파일 대상: dicom, hu3d, installer, update-log
   */
  DUPLICATED_FILE_NAME_ON_DB: {
    statusCode: 409,
    error: "DUPLICATED_FILE_NAME_ON_DB",
    _description: "파일이 DB에서 중복되는 경우",
  },
  /**
   * RUS Case가 DB에서 중복되는 경우
   * - 발생 시나리오: 케이스 등록
   */
  DUPLICATED_RUS_CASE_ON_DB: {
    statusCode: 409,
    error: "DUPLICATED_RUS_CASE_ON_DB",
    _description: "RUS Case가 DB에서 중복되는 경우",
  },
  /**
   * 사용자 정보가 중복되는 경우(email)
   * - 발생 시나리오
   * 1. 특정 사용자 정보 수정: PATCH /users/:id
   * 2. 현재 사용자 정보 수정: PATCH /users/me
   * 3. 일반 계정 생성: POST /users
   * 4. 가입 신청서 생성: POST /applications
   * 5. 가입 신청서 승인: POST /applications/approve
   */
  DUPLICATED_USER_EMAIL: {
    statusCode: 400,
    error: "DUPLICATED_USER_EMAIL",
    _description: "사용자 정보가 중복되는 경우(email)",
  },
  /**
   * 사용자 정보가 중복되는 경우(employeeId)
   * - 발생 시나리오
   * 1. 특정 사용자 정보 수정: PATCH /users/:id
   * 2. 일반 계정 생성: POST /users
   * 3. 가입 신청서 생성: POST /applications
   * 4. 가입 신청서 승인: POST /applications/approve
   * 5. 대표 계정 생성: POST /admins
   */
  DUPLICATED_USER_EMPLOYEE_ID: {
    statusCode: 400,
    error: "DUPLICATED_USER_EMPLOYEE_ID",
    _description: "사용자 정보가 중복되는 경우(employeeId)",
  },
  /**
   * 사용자 정보가 중복되는 경우(phoneNumber)
   * - 발생 시나리오
   * 1. 가입 신청서 생성: POST /applications
   * 2. 가입 신청서 승인: POST /applications/approve
   * 3. 특정 사용자 정보 수정: PATCH /users/:id
   * 4. 내 사용자 정보 수정: PATCH /users/me
   * 5. 일반 계정 생성: POST /users
   * 6. 대표 계정 생성: POST /admins
   */
  DUPLICATED_USER_PHONE_NUMBER: {
    statusCode: 400,
    error: "DUPLICATED_USER_PHONE_NUMBER",
    _description: "사용자 정보가 중복되는 경우(phoneNumber)",
  },
  /**
   * qr-job 요청이 DB에서 중복되는 경우(기준: studyInstanceUID)
   * - 발생 시나리오: qr-job 생성 요청
   */
  DUPLICATED_QR_REQUEST_ON_DB: {
    statusCode: 400,
    error: "DUPLICATED_QR_REQUEST_ON_DB",
    _description: "qr-job 요청이 DB에서 중복되는 경우(기준: studyInstanceUID)",
  },
  /**
   * huId가 중복되는 경우
   * - 발생 시나리오
   * 1. 스터디 등록: POST /studies
   */
  DUPLICATED_STUDY_WITH_HUID: {
    statusCode: 400,
    error: "DUPLICATED_STUDY_WITH_HUID",
    _description: "study의 huId가 중복되는 경우",
  },
  /**
   * 값이 중복되는 경우
   * - 발생 시나리오
   * 1. Surgeon 생성: POST /surgeons
   * 2. Recipient 생성: POST /recipients - email값 unique
   * 3. Surgeon 수정: PATCH /surgeons/:id
   */
  DUPLICATED_DATA: {
    statusCode: 400,
    error: "DUPLICATED_DATA",
    _description: "값이 중복되는 경우",
  },
  /**
   * qr-job 요청 횟수를 초과한 경우
   * - 발생 시나리오: qr-job 생성 요청
   */
  EXCEEDED_QR_REQUEST_MAX_COUNT: {
    statusCode: 400,
    error: "EXCEEDED_QR_REQUEST_MAX_COUNT",
    _description: "qr-job 요청 횟수를 초과한 경우",
  },
  /**
   * 최대 요청 개수를 초과한 경우
   * - 발생 시나리오
   * 1. POST /credits/allocate - 크레딧 할당
   * 2. POST /credits/revoke - 크레딧 회수
   * 4. POST /admins - 이미 대표 계정이 있는 경우 (대표 계정 한도 : 1)
   */
  LIMIT_EXCEEDED: {
    statusCode: 400,
    error: "LIMIT_EXCEEDED",
    _description: "최대 요청 개수를 초과한 경우",
  },
  /**
   * 크레딧이 불충분한 경우
   * - 발생 시나리오
   * 1. POST /rus-cases - 케이스 등록
   * 2. 일반 사용자 크레딧 할당 및 회수
   * 3. 매니저 크레딧 발행 및 회수
   */
  INSUFFICIENT_CREDIT: {
    statusCode: 409,
    error: "INSUFFICIENT_CREDIT",
    _description: "크레딧이 불충분한 경우",
  },
  /**
   * 파일 용량이 제한 용량보다 큰 경우
   * - 발생 시나리오: 파일 업로드
   * - 파일 대상: dicom, hu3d, installer, update-log
   */
  PAYLOAD_TOO_LARGE: {
    statusCode: 413,
    error: "PAYLOAD_TOO_LARGE",
    _description: "파일 용량이 제한 용량보다 큰 경우",
  },
  /**
   * 디스크에 저장소 공간이 없는 경우
   * - 발생 시나리오: 파일 업로드
   * - 파일 대상: dicom, hu3d, installer, update-log
   */
  INSUFFICIENT_STORAGE: {
    statusCode: 507,
    error: "INSUFFICIENT_STORAGE",
    _description: "디스크에 저장소 공간이 없는 경우",
  },
  /**
   * 예기치 못한 에러
   */
  UNEXPECTED_ERROR: {
    statusCode: 500,
    error: "UNEXPECTED_ERROR",
    _description: "예기치 못한 에러",
  },
  /**
   * h-Cloud 서버에 케이스가 존재하지 않음
   * - 발생 시나리오
   * 1. PATCH /rus-cases/:id - 작업 취소
   */
  NOT_FOUND_RUS_CASE_HCLOUD: {
    statusCode: 400,
    error: "NOT_FOUND_RUS_CASE_HCLOUD",
    _description: "h-Space 서버에 RusCase 존재하지 않음",
  },
  /**
   * h-Cloud 서버에 h-Server IP 접근이 허용되지 않음(화이트리스트 등록 필요)
   * - 발생 시나리오
   * 1. PATCH /rus-cases/:id - 작업 취소
   * 2. RUS Case 등록 요청: POST /rus-cases
   * 3. 비밀번호 재설정 Email 발송 요청: POST /email/password-reset
   */
  FORBIDDEN_RESOURCE_HCLOUD: {
    statusCode: 400,
    error: "FORBIDDEN_RESOURCE_HCLOUD",
    _description: "h-Space 서버에 h-Server IP 접근이 허용되지 않음(화이트리스트 등록 필요)",
  },
  /**
   * h-Space 서버에서 발생한 예기치 못한 에러
   * - 발생 시나리오
   * 1. RUS Case 등록 요청: POST /rus-cases
   * 2. 비밀번호 재설정 Email 발송 요청: POST /email/password-reset
   */
  UNEXPECTED_ERROR_HCLOUD: {
    statusCode: 500,
    error: "UNEXPECTED_ERROR_HCLOUD",
    _description: "h-Cloud 서버로부터 전달받은 예기치 못한 에러",
  },

  /**
   * h-dicom 서버에서 발생한 예기치 못한 에러
   * - 발생 시나리오
   * 1. QR 조회 요청: GET /qr/studies
   */
  UNEXPECTED_ERROR_DICOM_SERVER: {
    statusCode: 500,
    error: "UNEXPECTED_ERROR_DICOM_SERVER",
    _description: "h-dicom 서버로부터 전달받은 예기치 못한 에러",
  },
  /**
   * h-Space 서버가 동작하지 않음
   * - 발생 시나리오
   * 1. POST /rus-cases - 케이스 등록 요청
   */
  HCLOUD_NOT_WORKING: {
    statusCode: 503,
    error: "HCLOUD_NOT_WORKING",
    _description: "h-Space 서버가 동작하지 않음",
  },
  //h-dicom-server 예외
  /**
   * 사용자가 잘못된 요청을 보낸 경우
   * 발생 위치
   * 1. ValidationPipe
   * 2. GET /qr/studies(h-dicom-server)
   * 3. 일반 사용자 크레딧 할당 및 회수
   * 4. POST /studies: huId에 매칭된 uploadJob이 없거나, 이미 study로 등록된 경우
   */
  BAD_REQUEST: {
    statusCode: 400,
    error: "BAD_REQUEST",
    _description: "사용자가 잘못된 요청을 보낸 경우",
  },
  /**
   * TIMEOUT
   */
  TIMEOUT: {
    statusCode: 400,
    error: "TIMEOUT",
    _description: "(h-dicom-server)시간 초과",
  },
  /**
   * SERVICE_UNAVAILABLE
   */
  SERVICE_UNAVAILABLE: {
    statusCode: 400,
    error: "SERVICE_UNAVAILABLE",
    _description: "(h-dicom-server)서비스 이용 불가",
  },
  /**
   * UNAUTHORIZED_HDICOM_APIKEY
   */
  UNAUTHORIZED_HDICOM_APIKEY: {
    statusCode: 400,
    error: "UNAUTHORIZED_HDICOM_APIKEY",
    _description: "(h-dicom-server)키 오류",
  },
  /**
   * UNAUTHORIZED_AUTH_TOKEN
   * - 발생 시나리오
   * 1. RUS Client 요청: RusServiceAuthMiddleware
   * 2. h-Cloud 요청: HCloudServerAuthMiddleware
   * 3. 다이콤서버 요청: ServerAuthMiddleware
   */
  UNAUTHORIZED_AUTH_TOKEN: {
    statusCode: 400,
    error: "UNAUTHORIZED_AUTH_TOKEN",
    _description: "키 오류",
  },
  /**
   * UNAUTHORIZED_ORIGIN
   * - 발생 시나리오: 계정 권한이 필요한 API에 요청
   */
  UNAUTHORIZED_ORIGIN: {
    statusCode: 401,
    error: "UNAUTHORIZED_ORIGIN",
    _description: "키 오류",
  },
  /**
   * UNAUTHORIZED_NOT_FOUND_EMPLOYEE_ID
   * - 발생 시나리오
   * 1. RUS Client 로그인: 요청한 employeeId 계정이 존재하지 않음
   * 2. 일반사용자 로그인: employeeId가 없거나 비활성화 처리됐거나 role이 user가 아닌 경우
   * 3. 관리자 로그인: employeeId가 없거나 role이 user인 경우
   */
  UNAUTHORIZED_NOT_FOUND_EMPLOYEE_ID: {
    statusCode: 401,
    error: "UNAUTHORIZED_NOT_FOUND_EMPLOYEE_ID",
    _description: "계정 ID가 유효하지 않음",
  },
  /**
   * UNAUTHORIZED_INVALID_PASSWORD
   * - 발생 시나리오: 비밀번호 틀림
   * 1. RUS Client 로그인
   * 2. 일반사용자 로그인
   * 3. 관리자 로그인
   * 4. 현재 사용자 비밀번호 변경
   */
  UNAUTHORIZED_INVALID_PASSWORD: {
    statusCode: 401,
    error: "UNAUTHORIZED_INVALID_PASSWORD",
    _description: "계정 암호가 유효하지 않음",
  },
  /**
   * UNAUTHORIZED
   * - 발생 시나리오: 계정 권한이 필요한 API에 요청
   * 1. userAuthMiddleware
   * 2. PATCH /users/:id/password: 토큰이 유효하지 않음
   */
  UNAUTHORIZED: {
    statusCode: 401,
    error: "UNAUTHORIZED",
    _description: "API 접근 권한 없음",
  },
  /**
   * UPDATE_DATA_ERROR
   * - 발생 시나리오: 데이터가 갱신되지 않은 경우
   * 1. GET /upload-job/hu-id: upload-job 수정
   * 2. PATCH /rus-cases: 매칭된 케이스 작업 취소
   * 3. PATCH /surgeons/:id: 특정 Surgeon 수정
   * 4. POST /admins: 대표 계정 승격
   */
  UPDATE_DATA_ERROR: {
    statusCode: 400,
    error: "UPDATE_DATA_ERROR",
    _description: "데이터 갱신 에러",
  },
  /**
   * INTERNAL_SERVER_ERROR
   */
  INTERNAL_SERVER_ERROR: {
    statusCode: 500,
    error: "INTERNAL_SERVER_ERROR",
    _description: "예기치 못한 에러",
  },
  /**
   * CRYPTO_ERROR
   * - 발생시나리오
   * 1. 암호화/복호화 배치작업
   */
  CRYPTO_ERROR: {
    statusCode: 500,
    error: "CRYPTO_ERROR",
    _description: "암호화 처리 에러",
  },
  /**
   * DUPLICATED_SESSION_DETECTED
   * - 발생 시나리오: 중복된 세션 접근 발견 - 다중 로그인 시도
   * 1. 일반사용자 로그인
   * 2. 관리자 로그인
   */
  DUPLICATED_SESSION_DETECTED: {
    statusCode: 400,
    error: "DUPLICATED_SESSION_DETECTED",
    _description: "중복된 세션 접근 발견",
  },
  /**
   * UNAUTHORIZED_SESSION_DUPLICATED
   * - 발생 시나리오: 사용자의 토큰과 세션의 토큰이 불일치
   * 1. 강제 로그인 실행 시, 기존 계정을 사용중인 사용자
   */
  UNAUTHORIZED_SESSION_DUPLICATED: {
    statusCode: 400,
    error: "UNAUTHORIZED_SESSION_DUPLICATED",
    _description: "사용자의 토큰이 세션의 토큰과 불일치",
  },
  /**
   * UNAUTHORIZED_SESSION_DELETED
   * - 발생 시나리오: 접속 중, 이메일 토큰을 통해 계정 비밀번호가 교체됨
   * 1. 토큰을 통한 계정 비밀번호 교체 시, 기존 계정을 사용중인 사용자
   */
  UNAUTHORIZED_SESSION_DELETED: {
    statusCode: 400,
    error: "UNAUTHORIZED_SESSION_DELETED",
    _description: "사용자의 세션이 삭제됨",
  },
  /**
   * NOT_FOUND_DATA
   * - 발생 시나리오 : 데이터를 찾을 수 없음
   * 1. userId로 Session을 찾을 수 없음
   * 2. PATCH /users/:id/password: 유효한 토큰을 찾을 수 없음
   * 3. POST /otps: user를 찾을 수 없음
   * 4. GET /otps: otp를 찾을 수 없음
   * 5. POST /credits/allocate: 대표 계정을 찾을 수 없음
   * 6. POST /credits/revoke: 대표 계정을 찾을 수 없음
   * 7. POST /admins/delete: 대표 계정을 찾을 수 없음
   */
  NOT_FOUND_DATA: {
    statusCode: 400,
    error: "NOT_FOUND_DATA",
    _description: "데이터를 찾을 수 없음",
  },
  /**
   * PASSWORD_INIT_REQUIRED
   * - 발생 시나리오 : 계정 생성 후 사용자가 비밀번호를 설정하지 않음.
   * 1. 계정 생성 후, 비밀번호 설정하기 전의 로그인 시도
   */
  PASSWORD_INIT_REQUIRED: {
    statusCode: 400,
    error: "PASSWORD_INIT_REQUIRED",
    _description: "비밀번호 초기 설정이 필요함",
  },
  /**
   * CREATE_DATA_ERROR
   * - 발생 시나리오: 데이터가 생성되지 않은 경우
   * 1. 사용자 생성: POST /users
   * 2. hu3d 업로드: POST /rus-cases/:id/hu3d
   */
  CREATE_DATA_ERROR: {
    statusCode: 400,
    error: "CREATE_DATA_ERROR",
    _description: "데이터 생성 에러",
  },
};
