import * as path from "path";
import config from "@src/common/config/configuration";

const generateUpdateLogDir = (filename: string) => {
  return path.join(config().core.etcPath, filename);
};

export const testUpdateLogs = [
  {
    fileName: "RUS_v1.1.0.0.txt",
    filePath: generateUpdateLogDir("RUS_v1.1.0.0.txt"),
    fileSize: 10,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 100).toISOString(), //100일 전
  },
];
