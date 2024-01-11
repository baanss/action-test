import * as path from "path";
import config from "@src/common/config/configuration";
import { testRusCases } from "@root/seeding/seeder/seed/rus-case.seed";

const generateHu3dDir = (dirname: string, filename: string) => {
  return path.join(config().core.hu3dPath, filename);
};

export const testHu3ds = [
  {
    id: 1,
    rusCase: testRusCases[0],
    filePath: generateHu3dDir(`${process.env.SERVER_CODE}_0`, `${process.env.SERVER_CODE}_0-1.hu3d`),
    fileName: `${process.env.SERVER_CODE}_0-1.hu3d`,
    fileSize: 10,
    version: 1,
  },
  {
    id: 2,
    rusCase: testRusCases[1],
    filePath: generateHu3dDir(`${process.env.SERVER_CODE}_1`, `${process.env.SERVER_CODE}_1-1.hu3d`),
    fileName: `${process.env.SERVER_CODE}_1-3.hu3d`,
    fileSize: 20,
    version: 1,
  },
  {
    id: 3,
    rusCase: testRusCases[2],
    filePath: null,
    fileName: `${process.env.SERVER_CODE}_2-1.hu3d`,
    fileSize: 0,
    version: 1,
  },
];
