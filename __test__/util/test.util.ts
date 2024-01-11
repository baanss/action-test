import { CACHE_MANAGER, INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { TestModule } from "@test/test.module";

export async function generateNestApplication() {
  const testingModule = await Test.createTestingModule({
    imports: [TestModule],
  })
    .overrideProvider(CACHE_MANAGER)
    .useValue({
      set: jest.fn(),
      get: jest.fn(),
    })
    .compile();

  const app: INestApplication = testingModule.createNestApplication();
  return app;
}

export const delayTime = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const expectNullableString = (value: string | null) => {
  if (value === null) {
    return expect(value).toBeNull();
  } else {
    return expect(value).toEqual(expect.any(String));
  }
};

export const expectNullableNumber = (value: number | null) => {
  if (value === null) {
    return expect(value).toBeNull();
  } else {
    return expect(value).toEqual(expect.any(Number));
  }
};

export const expectNullableObject = (value: any, expected: any) => {
  if (value === null) {
    return expect(value).toBeNull();
  } else {
    return expect(value).toEqual(expected);
  }
};
