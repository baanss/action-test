import * as fs from "fs";
import * as pdfkit from "pdfkit";
import * as mkdirp from "mkdirp";
import * as path from "path";

export const convertTxtToPdf = async (logLocation: string, yearMonth: string, logType: string, outputLocation: string) => {
  const pdf = new pdfkit();
  mkdirp(`${outputLocation}`);
  const pdfFile = path.join(`${outputLocation}`, `${yearMonth}_hserver_${logType}_log.pdf`);
  const outputPdfStream = fs.createWriteStream(pdfFile);

  pdf.pipe(outputPdfStream);

  const textFiles = fs.readdirSync(logLocation).filter((file) => file.includes(yearMonth) && file.endsWith(".log"));
  for (const textFile of textFiles) {
    const text = fs.readFileSync(path.join(logLocation, textFile), "utf-8");
    pdf.text(text);
  }

  pdf.end();

  return new Promise<string>((resolve, reject) => {
    outputPdfStream.on("finish", () => {
      resolve(pdfFile);
    });

    outputPdfStream.on("error", (err) => {
      reject(err);
    });
  });
};
