# h-server-backend

h-Server 서버(프로덕트 버전)  
Node.js version: 18.12.0

## REST API

### Client <-> Server

https://docs.google.com/document/d/19QJdE-Aaibz9sPEyrY9kPRpBMg2-WjauQxrx9iaP9UE/edit?pli=1#heading=h.cx34s4laocwt

### Server <-> Server(h-Cloud Server & Rus Annoymize Server)

https://docs.google.com/document/d/18JtO9SP0Yi73cWlVfPlJdC5Pbnur5KuAAF_EhH-Zdvg/edit#heading=h.jcc3imrwjx7l

## 프레임워크/라이브러리

- Nest.js version: 8
- Typescript
- TypeORM version: 0.2.45

## 데이터베이스

- PostgreSQL version: 13

## 시작하기(개발 버전)

1. `.env.local.template` 을 참고해 defualt값으로 사용하지 않을 변수를 `.env` 파일로 생성합니다.

| variable                       | default                                    | description                                                    |
| ------------------------------ | ------------------------------------------ | -------------------------------------------------------------- |
| NODE_ENV                       | development                                | 실행 환경                                                      |
| SERVER_HOST                    | localhost                                  | 호스트                                                         |
| SERVER_PORT                    | 3000                                       | 포트 번호                                                      |
| SERVER_URL                     | http://localhost:3000                      | 서버 주소 (BE 서비스로 프록시할 때 필요한 주소)                |
| REDIRECT_URL                   | http://localhost:3000                      | 서버 주소 (FE 서비스로 프록시할 때 필요한 주소)                |
| ORIGIN_DOMAIN                  | http://localhost:3000                      | 원본 도메인 주소 (cors origin)                                 |
| APP_VERSION                    | development                                | 어플리케이션 버전                                              |
| CLIENT_TZ                      | Asia/Seoul                                 | 배치작업 타임존                                                |
| ENCRYPTION                     | off                                        | 환자정보 암호화 상태 (oneOf: on, off)                          |
| SEED_DATA                      | off                                        | `npm run insert:prod` 실행 여부 (oneOf: on, off)               |
| DB_HOST                        | localhost                                  | 데이터베이스 호스트                                            |
| DB_PORT                        | 5432                                       | 데이터베이스 포트 번호                                         |
| DB_USERNAME                    | postgres                                   | 데이터베이스 사용자                                            |
| DB_DATABASE                    | hserver                                    | 데이터베이스 이름                                              |
| DB_PASSWORD                    | hserver                                    | 데이터베이스 암호                                              |
| REDIS_HOST                     | localhost                                  | redis 서버 주소                                                |
| SECRET_KEY                     | hserver                                    | 1) Auth Salt 2) JWT 암호 3)crypto key                          |
| JWT_EXPIRES_IN                 | 3h                                         | JWT 만료시간                                                   |
| SERVER_CODE                    | D00000ug_sto                               | 서버코드, (for: huID 접두사, HDICOM_API_KEY)                   |
| SERVICE_CODE                   | sto                                        | 서비스 코드, RUS Client 서비스 코드                            |
| LOG_PATH                       | 프로젝트\_경로/log                         | 로그 파일 저장소 경로                                          |
| STORAGE_PATH                   | 프로젝트\_경로/storage                     | 파일 저장소 경로                                               |
| HUID_START_INDEX               | 1                                          | huId 인덱스 시작값                                             |
| ADMIN_EMAIL                    |                                            | 어드민 계정의 이메일 주소                                      |
| HCLOUD_SERVER_URL              |                                            | h-Cloud 서버 주소                                              |
| SIGNED_CERT_PATH               |                                            | SSL 인증서 파일 경로(.cert)                                    |
| SIGNED_KEY_PATH                |                                            | SSL 인증서 파일 경로(.key)                                     |
| QR_SERVER_URL                  |                                            | 다이콤서버 주소                                                |
| QR_TIMEOUT_MS                  | 3600000                                    | QR C-Move 요청 타임아웃 시간 (단위: ms)                        |
| QR_MAX_COUNT                   | 1                                          | QR C-Move 요청 최대 횟수                                       |
| PACS_SERVER_HOST               |                                            | PACS IP                                                        |
| PACS_SERVER_PORT               |                                            | PACS Port                                                      |
| PACS_SERVER_AET                |                                            | PACS AET                                                       |
| CRON_STATUS                    | active                                     | 배치작업 활성 상태                                             |
| CRON_SCHEDULE                  | 0 01 \* \* \*(EVERY_DAY_AT_1AM)            | 배치작업 실행 주기                                             |
| CRON_LOG_SCHEDULE              | 0 7 1 \* \*(EVERY_1ST_DAY_OF_MONTH_AT_7AM) | 배치작업 실행 주기(로그 파일 전송)                             |
| CRON_DICOM_EXPIRED_DAYS        | 150                                        | 다이콤 파일 보관일                                             |
| CRON_NOTIFICATION_EXPIRED_DAYS | 30                                         | 알림 보관일                                                    |
| CRON_SLEEP_USER_EXPIRED_DAYS   | 365                                        | 사용자 휴면 처리일                                             |
| DB_MIGRATION_FROM              | init                                       | DB 마이그레이션 기준 버전 ("init", "inactive", or APP_VERSION) |
| DISK_FREE_SPACE                |                                            | 저장소 잔여 공간 설정                                          |
| SWAGGER_USER                   |                                            | Swagger API 사용자 이름                                        |
| SWAGGER_PASSWORD               |                                            | Swagger API 비밀번호                                           |

<br>

- `h-Cloud`와 연동을 위해 `HCLOUD_SERVER_URL`를 환경변수로 추가해주세요.
- 제품 버전으로 실행 시 `NODE_ENV`는 `production`으로 설정해주세요.

<br>

2. 의존 모듈을 설치합니다.

```shell
npm ci
```

<br>

3. 데이터베이스 컨테이너를 실행합니다.(로컬에 DB를 실행중이라면 생략)

```shell
npm run start:dev-database
```

<br>

4. 데이터베이스에 테스트 데이터를 넣습니다.

```shell
npm run insert:{실행 환경}
```

> 잠깐! 실행 환경에 따라 `NODE_ENV`를 적절히 변경 후 실행해주세요.
>
> `npm run insert:prod`를 실행하려는 경우, `NODE_ENV=production`으로 설정되어 있어야 합니다.

<br>

5. COLLATION 관련 에러 발생시 cmd 창에서 아래와 같이 실행해주세요.

```
> docker exec -i -t h-server-postgresgl bash;
> psql -U {DB_USERNAME} -d hserver
> postgres #= \c hserver
> CREATE COLLATION IF NOT EXISTS numeric (provider = icu, locale = 'en-u-kn-true');
```

<br>

6. 개발용 서버를 실행합니다.

```shell
npm run start:dev
```

<br>

7. API 문서를 확인합니다.

- 접속 url: `{SERVER_URL}/docs`
- ID/PW: {SWAGGER_USER}/{SWAGGER_PASSWORD}
