import { isValidContractId } from "@/lib/validation";

const VALID_CONTRACT_ID =
  "CADQOBYHA4DQOBYHA4DQOBYHA4DQOBYHA4DQOBYHA4DQOBYHA4DQP5KR";

describe("isValidContractId", () => {
  it("accepts a well-formed contract ID", () => {
    expect(isValidContractId(VALID_CONTRACT_ID)).toBe(true);
  });

  it("requires the leading C", () => {
    expect(isValidContractId("G" + VALID_CONTRACT_ID.slice(1))).toBe(false);
  });

  it("requires exactly 56 characters", () => {
    expect(isValidContractId(VALID_CONTRACT_ID.slice(0, -1))).toBe(false);
    expect(isValidContractId(VALID_CONTRACT_ID + "A")).toBe(false);
  });

  it("rejects characters outside the base32 alphabet", () => {
    // 0, 1, 8 and 9 are not valid base32 characters.
    expect(isValidContractId("C" + "0".repeat(55))).toBe(false);
    expect(isValidContractId("C" + "1".repeat(55))).toBe(false);
  });

  it("rejects lowercase input", () => {
    expect(isValidContractId(VALID_CONTRACT_ID.toLowerCase())).toBe(false);
  });

  it("rejects empty input and whitespace", () => {
    expect(isValidContractId("")).toBe(false);
    expect(isValidContractId(" " + VALID_CONTRACT_ID)).toBe(false);
  });
});
