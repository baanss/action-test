// 숫자 타입을 number 타입으로 변환
export const numberTransformer = {
  to: (value) => value,
  from: (value) => (value == null ? null : Number(value)),
};

// 검색값에 특수문자가 포함된 경우, 역슬래시 포함
export const escapeSpecialChars = (value: string) => {
  if (!value) {
    return value;
  }
  // NOTE: ILIKE 예약 특수 문자(_, %)
  const specialChars = /[\_\%]/g;
  const replaced = value.replace(specialChars, (match) => `\\${match}`);
  return replaced;
};
