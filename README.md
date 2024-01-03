# h-server-setting

h-Server 설치 템플릿

- 설치 매뉴얼: [RUS Service Platform Install Guide](https://docs.google.com/document/d/16W5Rs36R9_e0G6-8bZG1phW2jVjDB5TLbsUTZFykddQ/edit?usp=sharing)
- 환경설정 규칙: [RUS h-Server Configuration](https://www.notion.so/RUS-h-Server-Configuration-4af7ef7949f2430eabec8fbbb3eb82f7)

## 시작하기

### 1. SSL 인증서를 준비합니다.

- 설치 매뉴얼을 참고하시어 인증서를 발급해주세요.
- 설치 매뉴얼: [RUS Service Platform Install Guide](https://docs.google.com/document/d/16W5Rs36R9_e0G6-8bZG1phW2jVjDB5TLbsUTZFykddQ/edit?usp=sharing), 3.3 SSL 인증서 생성
  <br>

### 2. `.env.template` 파일을 참고하여 `.env` 파일에 환경변수를 설정합니다.

> integration 기준 작성

| variable                       | default                                    | description                                                        |
| ------------------------------ | ------------------------------------------ | ------------------------------------------------------------------ |
| FE_IMAGE_TAG                   |                                            | 도커 이미지 버전(FE)                                               |
| BE_IMAGE_TAG                   |                                            | 도커 이미지 버전(BE)                                               |
| DICOM_IMAGE_TAG                |                                            | 도커 이미지 버전(h-dicom-server)                                   |
| SERVER_IP                      |                                            | IP                                                                 |
| PROXY_URL                      |                                            | h-Proxy URL                                                        |
| USER_PORT                      |                                            | 일반사용자 서비스 포트번호                                         |
| SCP_PORT                       |                                            | 도커 서비스 포트번호(SCP)                                          |
| BE_PORT                        |                                            | 도커 서비스 포트번호(BE)                                           |
| DB_PORT                        |                                            | 도커 서비스 포트번호(DB)                                           |
| REDIS_PORT                     |                                            | 도커 서비스 포트번호(REDIS)                                        |
| SCU_PORT                       |                                            | 도커 서비스 포트번호(SCU)                                          |
| CLIENT_TZ                      | Asia/Seoul                                 | 배치작업 타임존                                                    |
| ENCRYPTION                     | off                                        | 암호화 설정(oneOf: on, off)                                        |
| SEED_DATA                      | off                                        | 초기 데이터 삽입 설정(oneOf: on, off)                              |
| AET                            |                                            | AET                                                                |
| SERVER_ENV                     |                                            | 서버 실행 환경(oneOf: development, production)                     |
| SERVER_CODE                    |                                            | 서버 코드                                                          |
| SERVICE_CODE                   | sto                                        | 서비스 코드(oneOf: sto, kid)                                       |
| STORAGE_PATH                   | ./data                                     | 저장소 위치 설정(기존 저장소가 존재하는 경우, 설정 필요)           |
| HUID_START_INDEX               | 1                                          | huId 인덱스 시작값                                                 |
| ADMIN_EMAIL                    |                                            | 회사 어드민 계정의 이메일 주소                                     |
| CHANGE_PASSWORD_CYCLE_DAYS     | 90                                         | 비밀번호 변경 주기 날짜                                            |
| SURGERY_TYPE                   | 1                                          | hu3D 제작 가능한 수술 타입                                         |
|                                |                                            | (oneOf: [1] no option, [2] robot, [3] robot and lapa)              |
| LANGUAGE                       | ko                                         | hu3D 제작 요청 시 환불 정책에 표기될 언어 설정 (oneOf: ko, en, ja) |
| POSTGRES_DB                    |                                            | 데이터베이스 이름                                                  |
| POSTGRES_USER                  |                                            | 데이터베이스 사용자                                                |
| POSTGRES_PASSWORD              |                                            | 데이터베이스 암호                                                  |
| SECRET_KEY                     |                                            | 인증키(AUTH_SALT, JWT_SECRET, CRYPTO_KEY, CRYPTO_IV)               |
| JWT_EXPIRES_IN                 | 1800000                                    | JWT 만료시간 (기준: ms)                                            |
| QR_TIMEOUT_MS                  | 3600000                                    | QR Request 타임아웃 시간 (기준: ms)                                |
| QR_MAX_COUNT                   | 1                                          | QR Request 최대 요청 가능 수                                       |
| PACS_SERVER_HOST               |                                            | 병원 PACS IP                                                       |
| PACS_SERVER_PORT               |                                            | 병원 PACS PORT                                                     |
| PACS_SERVER_AET                |                                            | 병원 PACS AET                                                      |
| MAX_ASSOCIATIONS               | 5                                          | SCP 협상 가능 최대 수                                              |
| CRON_SCHEDULE                  | 0 01 \* \* \*(EVERY_DAY_AT_1AM)            | 배치작업 실행 주기                                                 |
| CRON_LOG_SCHEDULE              | 0 7 1 \* \*(EVERY_1ST_DAY_OF_MONTH_AT_7AM) | 배치작업 실행 주기(로그 파일 전송)                                 |
| CRON_DICOM_EXPIRED_DAYS        | 150                                        | 다이콤 파일 보관일                                                 |
| CRON_NOTIFICATION_EXPIRED_DAYS | 30                                         | 알림 보관일                                                        |
| CRON_SLEEP_USER_EXPIRED_DAYS   | 365                                        | 휴면계정 보관일                                                    |
| DISK_FREE_SPACE                |                                            | 디스크 잔여 공간 (기준: byte)                                      |

### 3. 서버 환경에 맞는 도커 구성 파일을 이용하여 도커 서비스를 실행합니다.

| 환경        | 설명                                                              |
| ----------- | ----------------------------------------------------------------- |
| integration | 개발용, 여러 개의 컴포넌트를 통합 및 테스트를 위한 통합 개발 환경 |
| production  | 배포용, 실제 서비스를 위한 운영 운영 환경                         |

(1) Integration Server

```shell
$ sudo docker-compose -f integration/docker-compose.yml up -d
```

(2) Production Server

```shell
$ sudo docker-compose -f production/docker-compose.yml up -d
```
