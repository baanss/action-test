export const testOtps = [
  {
    userId: 1,
    token: "test",
    expiresIn: new Date(Date.now() - 24 * 60 * 60 * 1000 * 9).toISOString(), //9일 전
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 10).toISOString(), //10일 전
  },
  {
    userId: 2,
    token: "test",
    expiresIn: new Date(Date.now() - 24 * 60 * 60 * 1000 * 4).toISOString(), //4일 전
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 5).toISOString(), //5일 전
  },
  {
    userId: 3,
    token: "test",
    expiresIn: new Date(Date.now()).toISOString(), //0일 전
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), //1일 전
  },
];
