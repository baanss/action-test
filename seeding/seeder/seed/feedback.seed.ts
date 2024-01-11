import { testRusCases } from "@root/seeding/seeder/seed/rus-case.seed";

export const testFeedbacks = [
  {
    rusCaseId: testRusCases[0].id,
    message: "not invalid file. try again",
    writerEmail: "writer01",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 10).toISOString(), //10일 전
  },
  {
    rusCaseId: testRusCases[1].id,
    message: "done",
    writerEmail: "writer01",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 5).toISOString(), //5일 전
  },
  {
    rusCaseId: testRusCases[2].id,
    message: "cannot create hu3d file",
    writerEmail: "writer02",
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 1).toISOString(), //1일 전
  },
];
