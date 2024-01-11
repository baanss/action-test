import * as moment from "moment";
import { testUploadJobs } from "@root/seeding/seeder/seed/upload-job.seed";

export const testStudies = [
  {
    id: 1,
    huId: `${process.env.SERVER_CODE}_0`,
    patientId: "patient_01",
    patientName: "kim",
    studyDate: moment().subtract(1, "year").toISOString(),
    studyDescription: "study01 description",
    seriesCount: 5,
    instancesCount: 100,
    age: 10,
    sex: null,
    createdAt: moment(new Date()).subtract(90, "days").format("YYYY-MM-DD"), //90일 전
    isRegistered: true,
    uploadJob: testUploadJobs[0],
  },
  {
    id: 2,
    huId: `${process.env.SERVER_CODE}_1`,
    patientId: "patient_02",
    patientName: "lee",
    studyDate: moment().subtract(1, "month").toISOString(),
    studyDescription: "study02 description",
    seriesCount: 7,
    instancesCount: 150,
    age: null,
    sex: "M",
    createdAt: moment(new Date()).subtract(120, "days").format("YYYY-MM-DD"), //120일 전
    isRegistered: true,
    uploadJob: testUploadJobs[1],
  },
  {
    id: 3,
    huId: `${process.env.SERVER_CODE}_2`,
    patientId: "patient_03",
    patientName: "park",
    studyDate: moment().subtract(1, "hour").toISOString(),
    studyDescription: "study03 description",
    seriesCount: 9,
    instancesCount: 200,
    age: 30,
    sex: "F",
    createdAt: moment(new Date()).subtract(150, "days").format("YYYY-MM-DD"), //150일 전
    isRegistered: true,
    uploadJob: testUploadJobs[2],
  },
  {
    id: 4,
    huId: `${process.env.SERVER_CODE}_3`,
    patientId: "patient_04",
    patientName: "hwang",
    studyDate: moment().subtract(1, "minute").toISOString(),
    studyDescription: "study04 description",
    seriesCount: 12,
    instancesCount: 350,
    age: 40,
    sex: "M",
    createdAt: moment(new Date()).subtract(180, "days").format("YYYY-MM-DD"), //180일 전
    isRegistered: true,
    uploadJob: testUploadJobs[3],
  },
  // rusCase 등록되지 않음
  {
    id: 5,
    huId: `${process.env.SERVER_CODE}_4`,
    patientId: "patient_05",
    patientName: "yoo",
    studyDate: moment().subtract(10, "year").toISOString(),
    studyDescription: "study05 description",
    seriesCount: 13,
    instancesCount: 1000,
    age: 40,
    sex: "F",
    createdAt: moment(new Date()).subtract(210, "days").format("YYYY-MM-DD"), //210일 전
    isRegistered: false,
    uploadJob: testUploadJobs[4],
  },
  // 케이스로 등록 + 파일이 삭제된 경우
  {
    id: 6,
    huId: `${process.env.SERVER_CODE}_5`,
    patientId: "patient_06",
    patientName: "song",
    studyDate: moment().subtract(20, "year").toISOString(),
    studyDescription: "study06 description",
    seriesCount: 17,
    instancesCount: 1350,
    age: 50,
    sex: "M",
    createdAt: moment(new Date()).subtract(240, "days").format("YYYY-MM-DD"), //240일 전
    isRegistered: false,
    uploadJob: testUploadJobs[5],
  },
  // 케이스로 등록 + reject
  {
    id: 7,
    huId: `${process.env.SERVER_CODE}_6`,
    patientId: "patient_07",
    patientName: "park",
    studyDate: moment().subtract(30, "year").toISOString(),
    studyDescription: "study06 description",
    seriesCount: 17,
    instancesCount: 1350,
    age: 50,
    sex: "M",
    createdAt: moment(new Date()).subtract(300, "days").format("YYYY-MM-DD"), //300일 전
    isRegistered: true,
    uploadJob: testUploadJobs[6],
  },
];
