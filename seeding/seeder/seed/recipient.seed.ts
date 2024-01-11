export const testRecipients = [
  // testAdmins[0] 의 Recipients
  {
    id: 1,
    userId: 1,
    email: "test1@hutom.co.kr",
    isDefault: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 10).toISOString(), //10일 전
  },
  {
    id: 2,
    userId: 1,
    email: "test2@hutom.co.kr",
    isDefault: false,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 5).toISOString(), //5일 전
  },
  // testAdmins[1] 의 Recipients
  {
    id: 3,
    userId: 2,
    email: "test3@hutom.co.kr",
    isDefault: false,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), //1일 전
  },
  // testUser[0] 의 Recipients
  {
    id: 4,
    userId: 9,
    email: "test1@hutom.co.kr",
    isDefault: false,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000 * 5).toISOString(), //5일 전
  },
  {
    id: 5,
    userId: 9,
    email: "test2@hutom.co.kr",
    isDefault: false,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), //1일 전
  },
];
