import * as fs from "fs";
import * as path from "path";
import * as xlsx from "xlsx";
import * as moment from "moment-timezone";
import { INestApplication } from "@nestjs/common";

import { generateNestApplication } from "@test/util/test.util";
import { SeederService } from "@root/seeding/seeder/services/seeder.service";

import { BalanceViewRepository } from "@src/credit-history/repository/balance-view.repository";
import { ExportCreditHistoryService } from "@src/credit-history/service/export-credit-history.service";
import { CreditCategory } from "@src/common/entity/credit-history.entity";

let app: INestApplication;
let seederService: SeederService;
let exportCreditHistoryService: ExportCreditHistoryService;
let balanceViewRepository: BalanceViewRepository;

beforeAll(async () => {
  app = await generateNestApplication();
  seederService = app.get(SeederService);

  exportCreditHistoryService = app.get<ExportCreditHistoryService>(ExportCreditHistoryService);
  balanceViewRepository = app.get<BalanceViewRepository>(BalanceViewRepository);

  await seederService.seedEncryption();
  await app.init();
});

afterAll(async () => {
  await seederService.empty();
  await app.close();
});

describe("ExportCreditHistoryService", () => {
  const filePath = path.join("__test__", "dummy", "Export_Credit_History_Data.xlsx");

  beforeAll(async () => {
    await fs.promises.mkdir(path.join("__test__", "dummy")).catch((error) => error);
  });
  afterAll(async () => {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    await fs.promises.rm(path.join("__test__", "dummy"), { recursive: true, force: true });
  });

  test("convertToXlsx, 데이터 XLSX형식으로 변환 확인", async () => {
    // given: 테스트 데이터 및 옵션 설정
    const xlsxOptions = { timezone: "Asia/Seoul" };
    const creditHistories = await balanceViewRepository.find({ where: { status: true } });

    // when: 함수 실행 및 결과 파일 저장
    const convertedData = exportCreditHistoryService.convertToXlsx(creditHistories, xlsxOptions);
    await fs.promises.writeFile(filePath, convertedData, "binary");

    // then: 저장된 파일 json Convert후 검증
    const xlsxData = await fs.promises.readFile(filePath);
    const wb = xlsx.read(xlsxData, { type: "buffer" });
    const jsonDataFromXlsx = xlsx.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);

    expect(jsonDataFromXlsx.length).toBeGreaterThan(0);
    jsonDataFromXlsx.forEach((convertedBalanceView, idx) => {
      expect(convertedBalanceView["Date/Time"]).toEqual(moment(creditHistories[idx].createdAt).tz(xlsxOptions.timezone).format("YYYY.MM.DD HH.mm"));
      expect(convertedBalanceView["Category"]).toEqual(exportCreditHistoryService.transformCategory(creditHistories[idx].category));
      expect(convertedBalanceView["huID"]).toEqual(creditHistories[idx].huId ?? "-");
      expect(convertedBalanceView["ID"]).toEqual(creditHistories[idx].employeeId);
      expect(convertedBalanceView["Name"]).toEqual(creditHistories[idx].name);

      const stringToAbs = convertedBalanceView["Change"].replace(/[^0-9]/g, "");
      expect(Math.abs(stringToAbs)).toEqual(Math.abs(creditHistories[idx].quantity));

      expect(convertedBalanceView["Balance"]).toEqual(Number(creditHistories[idx].balance));
    });
  });

  test("transformCategory, 카테고리 이름 TransForm 검증", () => {
    // given
    const testCategory = CreditCategory.ALLOCATE;

    // when
    const transFormedCategory = exportCreditHistoryService.transformCategory(testCategory);

    // then
    expect(transFormedCategory).toEqual("Allocate");
  });

  test("createFileName, 파일 이름 생성 검증", () => {
    // given
    const transformedDate = moment().format("YYYYMMDD");

    // when
    const fileName = exportCreditHistoryService.createFileName();

    // then
    expect(fileName).toContain(transformedDate);
  });
});
