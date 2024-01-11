import * as moment from "moment";
import { testAdmins, testUsers } from "@root/seeding/seeder/seed/user.seed";
import { AeMode } from "@src/common/constant/enum.constant";

export const testPatientIdKeyword = "patient_id";
export const testPatientNameKeyword = "patient_name";
// 모든 자원 user 생성
export const testSCUUploadJobs = [
  {
    id: 1,
    huId: `${process.env.SERVER_CODE}_10`,
    studyInstanceUID: "1",
    instancesCount: 10,
    aeMode: AeMode.SCU,
    patientId: `${testPatientIdKeyword}_10`,
    patientName: `${testPatientNameKeyword}_10`,
    createdAt: moment().subtract(1, "month"),
    user: testUsers[0],
  },
  {
    id: 2,
    huId: `${process.env.SERVER_CODE}_20`,
    studyInstanceUID: "1",
    instancesCount: 10,
    aeMode: AeMode.SCU,
    patientId: `${testPatientIdKeyword}_20`,
    patientName: `${testPatientNameKeyword}_20`,
    createdAt: moment().subtract(1, "hour"),
    user: testUsers[1],
  },
  {
    id: 3,
    huId: `${process.env.SERVER_CODE}_30`,
    studyInstanceUID: "1",
    instancesCount: 10,
    aeMode: AeMode.SCU,
    patientId: `${testPatientIdKeyword}_30`,
    patientName: `${testPatientNameKeyword}_30`,
    createdAt: moment().subtract(1, "minute"),
    user: testUsers[2],
  },
];
// 모든 자원 user 없음
export const testSCPUploadJobs = [
  {
    id: 4,
    huId: `${process.env.SERVER_CODE}_100`,
    studyInstanceUID: "1",
    instancesCount: 10,
    aeMode: AeMode.SCP,
    patientId: `${testPatientIdKeyword}_100`,
    patientName: `${testPatientNameKeyword}_100`,
    createdAt: moment().subtract(1, "month"),
    user: null,
  },
  {
    id: 5,
    huId: `${process.env.SERVER_CODE}_200`,
    studyInstanceUID: "1",
    instancesCount: 10,
    aeMode: AeMode.SCP,
    patientId: `${testPatientIdKeyword}_200`,
    patientName: `${testPatientNameKeyword}_200`,
    createdAt: moment().subtract(1, "hour"),
    user: null,
  },
  {
    id: 6,
    huId: `${process.env.SERVER_CODE}_300`,
    studyInstanceUID: "1",
    instancesCount: 10,
    aeMode: AeMode.SCP,
    patientId: `${testPatientIdKeyword}_300`,
    patientName: `${testPatientNameKeyword}_300`,
    createdAt: moment().subtract(1, "minute"),
    user: null,
  },
];
// 모든 자원 admin 생성
export const testLocalUploadJobs = [
  {
    id: 7,
    huId: `${process.env.SERVER_CODE}_1000`,
    studyInstanceUID: "1",
    instancesCount: 10,
    aeMode: null,
    patientId: `${testPatientIdKeyword}_1000`,
    patientName: `${testPatientNameKeyword}_1000`,
    createdAt: moment().subtract(1, "month"),
    user: testAdmins[0],
  },
  {
    id: 8,
    huId: `${process.env.SERVER_CODE}_2000`,
    studyInstanceUID: "1",
    instancesCount: 10,
    aeMode: null,
    patientId: `${testPatientIdKeyword}_2000`,
    patientName: `${testPatientNameKeyword}_2000`,
    createdAt: moment().subtract(1, "hour"),
    user: testAdmins[1],
  },
  {
    id: 9,
    huId: `${process.env.SERVER_CODE}_3000`,
    studyInstanceUID: "1",
    instancesCount: 10,
    aeMode: null,
    patientId: `${testPatientIdKeyword}_3000`,
    patientName: `${testPatientNameKeyword}_3000`,
    createdAt: moment().subtract(1, "minute"),
    user: testAdmins[1],
  },
];
// study 저장되지 않음
export const testOnlyUploadJobs = [
  {
    id: 10,
    huId: `${process.env.SERVER_CODE}_123`,
    studyInstanceUID: "1",
    instancesCount: 10,
    aeMode: null,
    patientId: `${testPatientIdKeyword}_123`,
    patientName: `${testPatientNameKeyword}_123`,
    createdAt: moment().subtract(1, "minute"),
    user: testAdmins[0],
  },
];

export const testUploadJobs = [...testSCUUploadJobs, ...testSCPUploadJobs, ...testLocalUploadJobs, ...testOnlyUploadJobs];