import { Networks } from "@stellar/stellar-sdk";
import { getNetworkPassphrase } from "@/lib/stellar-client";

describe("getNetworkPassphrase", () => {
  it("returns the public network passphrase for mainnet", () => {
    expect(getNetworkPassphrase("mainnet")).toBe(Networks.PUBLIC);
  });

  it("returns the testnet passphrase for testnet", () => {
    expect(getNetworkPassphrase("testnet")).toBe(Networks.TESTNET);
  });

  it("never returns the same passphrase for both networks", () => {
    // A transaction signed with the wrong passphrase is invalid on the target
    // network, so these must not collapse into one another.
    expect(getNetworkPassphrase("mainnet")).not.toBe(
      getNetworkPassphrase("testnet")
    );
  });
});
