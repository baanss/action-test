// 서버 설정
process.env.NODE_ENV = "test";
process.env.SERVER_URL = "http://127.0.0.1:3000/api";
process.env.REDIRECT_URL = "http://127.0.0.1:3000";

// database 설정
process.env.DB_HOST = "127.0.0.1";
process.env.DB_PORT = 6543;
process.env.DB_USERNAME = "hutom";
process.env.DB_PASSWORD = "hserver";
process.env.DB_DATABASE = "hserver";

// 암호화 설정
process.env.SECRET_KEY = "hserver";

// 주요 서비스 설정
process.env.APP_VERSION = "v0.0.0";
process.env.SERVER_CODE = "00000ug";
process.env.SERVICE_CODE = "sto";
process.env.STORAGE_PATH = process.env.PWD + "/__test__";
process.env.HUID_START_INDEX = 100;

// h-Cloud 연동 설정
process.env.HCLOUD_SERVER_URL = "http://13.125.28.80";
process.env.SIGNED_CERT_PATH = process.env.PWD + "/localCA/localhost.crt";
process.env.SIGNED_KEY_PATH = process.env.PWD + "/localCA/localhost.key";

// qr 설정
process.env.QR_TIMEOUT_MS = 1 * 60 * 60 * 1000;
process.env.QR_MAX_COUNT = 2;

// 암호화 설정
process.env.ENCRYPTION = "on";

// qa 설정
process.env.DISK_FREE_SPACE = 9 * 1024 * 1024 * 1024; // 9GB
process.env.CRON_LOG_SCHEDULE = "0 7 1 * *";
