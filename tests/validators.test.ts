import { validateValue } from "@/lib/validators";

// A real, checksum-valid Ed25519 public key and contract ID. Hand-written
// strings that merely look right will fail StrKey's checksum, so these are
// generated values.
const VALID_G_ADDRESS =
  "GAX6NTIL5BHNYSZWERSVYF4OYN3CEQKZQC2BWBG5QDBUSNZKVTLCO6VJ";
const VALID_C_ADDRESS =
  "CADQOBYHA4DQOBYHA4DQOBYHA4DQOBYHA4DQOBYHA4DQOBYHA4DQP5KR";

describe("validateValue: integer types", () => {
  it("accepts the exact boundaries of each unsigned type", () => {
    expect(validateValue("0", "U32")).toBeNull();
    expect(validateValue("4294967295", "U32")).toBeNull();
    expect(validateValue("18446744073709551615", "U64")).toBeNull();
    expect(
      validateValue("340282366920938463463374607431768211455", "U128")
    ).toBeNull();
  });

  it("rejects values one past the upper bound", () => {
    expect(validateValue("4294967296", "U32")).toBe("U32 out of range");
    expect(validateValue("18446744073709551616", "U64")).toBe(
      "U64 out of range"
    );
  });

  it("rejects negative values for unsigned types", () => {
    expect(validateValue("-1", "U32")).toBe("U32 out of range");
    expect(validateValue("-1", "U64")).toBe("U64 out of range");
  });

  it("accepts the exact boundaries of each signed type", () => {
    expect(validateValue("-2147483648", "I32")).toBeNull();
    expect(validateValue("2147483647", "I32")).toBeNull();
    expect(validateValue("-9223372036854775808", "I64")).toBeNull();
    expect(validateValue("9223372036854775807", "I64")).toBeNull();
  });

  it("rejects values one past a signed lower bound", () => {
    expect(validateValue("-2147483649", "I32")).toBe("I32 out of range");
  });

  it("handles 256-bit values without precision loss", () => {
    const u256Max =
      "115792089237316195423570985008687907853269984665640564039457584007913129639935";
    expect(validateValue(u256Max, "U256")).toBeNull();
    expect(validateValue(u256Max + "0", "U256")).toBe("U256 out of range");
  });

  it("rejects non-numeric and fractional input", () => {
    expect(validateValue("abc", "U32")).toBe("U32 must be a whole number");
    expect(validateValue("1.5", "U32")).toBe("U32 must be a whole number");
  });

  it("rejects empty input as required", () => {
    expect(validateValue("", "U32")).toBe("U32 is required");
    expect(validateValue("   ", "U32")).toBe("U32 is required");
  });

  it("validates Timepoint and Duration as unsigned 64-bit seconds", () => {
    expect(validateValue("0", "Timepoint")).toBeNull();
    expect(validateValue("-1", "Duration")).toBe("Duration (seconds) out of range");
  });
});

describe("validateValue: Bool", () => {
  it("accepts true and false in any casing", () => {
    expect(validateValue("true", "Bool")).toBeNull();
    expect(validateValue("FALSE", "Bool")).toBeNull();
  });

  it("rejects anything else", () => {
    expect(validateValue("1", "Bool")).toBe("Must be true or false");
    expect(validateValue("yes", "Bool")).toBe("Must be true or false");
  });
});

describe("validateValue: Bytes", () => {
  it("accepts even-length hex", () => {
    expect(validateValue("deadbeef", "Bytes")).toBeNull();
    expect(validateValue("00FF", "Bytes")).toBeNull();
  });

  it("rejects odd-length hex", () => {
    expect(validateValue("abc", "Bytes")).toBe(
      "Hex string must have an even length"
    );
  });

  it("rejects non-hex characters", () => {
    expect(validateValue("zz", "Bytes")).toBe(
      "Only hex characters (0-9, a-f) allowed"
    );
  });
});

describe("validateValue: Address", () => {
  it("accepts a valid account address and a valid contract ID", () => {
    expect(validateValue(VALID_G_ADDRESS, "Address")).toBeNull();
    expect(validateValue(VALID_C_ADDRESS, "Address")).toBeNull();
  });

  it("rejects a string that looks like an address but fails the checksum", () => {
    const tampered = VALID_G_ADDRESS.slice(0, -1) + "A";
    expect(validateValue(tampered, "Address")).toBe(
      "Must be a valid Stellar address (G...) or contract ID (C...)"
    );
  });

  it("rejects empty input", () => {
    expect(validateValue("", "Address")).toBe("Address is required");
  });
});

describe("validateValue: Symbol and String", () => {
  it("accepts alphanumerics and underscores up to 32 characters", () => {
    expect(validateValue("transfer", "Symbol")).toBeNull();
    expect(validateValue("a_1", "Symbol")).toBeNull();
    expect(validateValue("a".repeat(32), "Symbol")).toBeNull();
  });

  it("rejects symbols over 32 characters or with illegal characters", () => {
    const tooLong = "a".repeat(33);
    expect(validateValue(tooLong, "Symbol")).toBe(
      "Letters, numbers, and underscores only (max 32 chars)"
    );
    expect(validateValue("has space", "Symbol")).toBe(
      "Letters, numbers, and underscores only (max 32 chars)"
    );
  });

  it("requires a non-empty String", () => {
    expect(validateValue("hello", "String")).toBeNull();
    expect(validateValue("  ", "String")).toBe("String is required");
  });
});

describe("validateValue: Option", () => {
  it("treats an empty value as an absent option", () => {
    expect(validateValue("", "Option", "U32")).toBeNull();
  });

  it("validates the inner type when a value is present", () => {
    expect(validateValue("42", "Option", "U32")).toBeNull();
    expect(validateValue("-1", "Option", "U32")).toBe("U32 out of range");
  });
});

describe("validateValue: Vec", () => {
  it("accepts a comma-separated list whose items all satisfy the inner type", () => {
    expect(validateValue("1,2,3", "Vec", "U32")).toBeNull();
    expect(validateValue(" 1 , 2 ", "Vec", "U32")).toBeNull();
  });

  it("requires at least one item", () => {
    expect(validateValue("", "Vec", "U32")).toBe("At least one item required");
    expect(validateValue(" , , ", "Vec", "U32")).toBe(
      "At least one item required"
    );
  });

  it("reports which item failed and why", () => {
    expect(validateValue("1,-2,3", "Vec", "U32")).toBe(
      'Item "-2": U32 out of range'
    );
  });
});

describe("validateValue: unconstrained types", () => {
  it("does not reject values of an Unknown type", () => {
    expect(validateValue("anything", "Unknown")).toBeNull();
  });
});
