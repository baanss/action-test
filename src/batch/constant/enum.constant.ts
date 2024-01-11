import * as dotenv from "dotenv";

export enum CronName {
  DELETE_NOTIFICATION_JOB = "Delete notification job",
  DELETE_SOFT_DELETED_USER_JOB = "Delete soft deleted user job",
  DELETE_SLEEP_USER_JOB = "Delete sleep user job",
  DELETE_DICOM_JOB = "Delete dicom job",
  CREATE_STORAGE_SHORTAGE_NOTIFICATION_JOB = "Create storage shortage notification job",
  CREATE_STORAGE_SHORTAGE_NOTIFICATION_ONCE_JOB = "Create storage shortage notification once job",
  CREATE_CREDIT_SHORTAGE_NOTIFICATION_JOB = "Create credit shortage notification job",
  CREATE_AND_SEND_MONTHLY_LOG_JOB = "Create and send monthly access log job",
  SEND_EMAIL_INACTIVE_USER_JOB = "Send email to Inactive user job",
}

export enum CronStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export enum EncryptionStatus {
  ON = "on",
  OFF = "off",
}

dotenv.config();
export const CronConfig = {
  timezone: process.env.CLIENT_TZ || "Asia/Seoul",
  status: process.env.CRON_STATUS || CronStatus.ACTIVE,
  encryption: process.env.ENCRYPTION || EncryptionStatus.OFF,
  schedule: process.env.CRON_SCHEDULE || "0 01 * * *", // NOTE: EVERY_DAY_AT_1AM => 0 01 * * *
  logSchedule: process.env.CRON_LOG_SCHEDULE || "0 7 1 * *", // NOTE: EVERY_1ST_DAY_OF_MONTH_AT_7AM => 0 7 1 * *
  dicomExpiredDays: process.env.CRON_DICOM_EXPIRED_DAYS || 150,
  notificationExpiredDays: process.env.CRON_NOTIFICATION_EXPIRED_DAYS || 30,
  sleepUserExpiredDays: process.env.CRON_SLEEP_USER_EXPIRED_DAYS || 365,
};
