import { RusCaseStatus } from "@src/common/constant/enum.constant";
import { testAdmins, testUsers } from "@root/seeding/seeder/seed/user.seed";
import { testStudies } from "@root/seeding/seeder/seed/study.seed";
import { testSurgeons } from "@root/seeding/seeder/seed/surgeon.seed";

export const testRusCases = [
  {
    id: 1,
    status: RusCaseStatus.DONE,
    studyId: 1,
    study: testStudies[0],
    user: testUsers[0],
    surgeon: testSurgeons[0],
  },
  {
    id: 2,
    status: RusCaseStatus.IN_PROGRESS,
    studyId: 2,
    study: testStudies[1],
    user: testUsers[0],
    surgeon: testSurgeons[0],
  },
  // hu3D 파일이 삭제된 경우
  {
    id: 3,
    status: RusCaseStatus.IN_PROGRESS,
    studyId: 3,
    study: testStudies[2],
    user: testUsers[0],
  },
  // hu3D 파일이 등록되지 않은 경우
  {
    id: 4,
    status: RusCaseStatus.IN_PROGRESS,
    studyId: 4,
    study: testStudies[3],
    user: testAdmins[0],
  },
  // status가 reject인 경우
  {
    id: 5,
    status: RusCaseStatus.REJECT,
    studyId: 7,
    study: testStudies[6],
    user: testAdmins[0],
  },
];
