import * as path from "path";
import * as moment from "moment";
import { testStudies } from "@root/seeding/seeder/seed/study.seed";
import configuration from "@src/common/config/configuration";

const generateDir = (dirname: string, filename: string) => {
  return path.join(configuration().core.dicomPath, dirname, filename);
};

export const testDicoms = [
  {
    id: 1,
    study: testStudies[0],
    filePath: generateDir(`${process.env.SERVER_CODE}_0`, `${process.env.SERVER_CODE}_0.zip`),
    fileName: `${process.env.SERVER_CODE}_0.zip`,
    fileSize: 10,
    createdAt: moment(new Date()).subtract(200, "days").toDate(), //200일 전
  },
  {
    id: 2,
    study: testStudies[1],
    filePath: generateDir(`${process.env.SERVER_CODE}_1`, `${process.env.SERVER_CODE}_1.zip`),
    fileName: `${process.env.SERVER_CODE}_1.zip`,
    fileSize: 20,
    createdAt: moment(new Date()).subtract(160, "days").toDate(), //160일 전
  },
  {
    id: 3,
    study: testStudies[2],
    filePath: generateDir(`${process.env.SERVER_CODE}_2`, `${process.env.SERVER_CODE}_2.zip`),
    fileName: `${process.env.SERVER_CODE}_2.zip`,
    fileSize: 30,
    createdAt: moment(new Date()).subtract(100, "days").toDate(), //100일 전
  },
  {
    id: 4,
    study: testStudies[3],
    filePath: generateDir(`${process.env.SERVER_CODE}_3`, `${process.env.SERVER_CODE}_3.zip`),
    fileName: `${process.env.SERVER_CODE}_3.zip`,
    fileSize: 40,
    createdAt: moment(new Date()).subtract(60, "days").toDate(), //60일 전
  },
  {
    id: 5,
    study: testStudies[4],
    filePath: generateDir(`${process.env.SERVER_CODE}_4`, `${process.env.SERVER_CODE}_4.zip`),
    fileName: `${process.env.SERVER_CODE}_4.zip`,
    fileSize: 50,
    createdAt: moment(new Date()).subtract(30, "days").toDate(), //30일 전
  },
  // 케이스로 등록 + 파일이 삭제된 경우
  {
    id: 6,
    study: testStudies[5],
    filePath: null,
    fileName: `${process.env.SERVER_CODE}_5.zip`,
    fileSize: 0,
    createdAt: moment(new Date()).subtract(10, "days").toDate(), //10일 전
  },
  // 케이스로 등록 + rusCase reject
  {
    id: 7,
    study: testStudies[6],
    filePath: null,
    fileName: `${process.env.SERVER_CODE}_6.zip`,
    fileSize: 0,
    createdAt: moment(new Date()).subtract(10, "days").toDate(), //10일 전
  },
];
