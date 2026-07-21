import {
  addRecentContract,
  clearRecentContracts,
  getRecentContracts,
  removeRecentContract,
  updateRecentContractNickname,
} from "@/lib/recent-contracts";

const STORAGE_KEY = "soroban-explorer:recent-contracts";

// The module guards on `typeof window === "undefined"`, so a minimal window
// with a localStorage stub is enough to exercise it under the node environment.
function installLocalStorage() {
  const store = new Map<string, string>();
  const localStorage = {
    getItem: (key: string) => (store.has(key) ? store.get(key)! : null),
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
  };
  (globalThis as { window?: unknown }).window = { localStorage };
  return store;
}

describe("recent-contracts", () => {
  let store: Map<string, string>;

  beforeEach(() => {
    store = installLocalStorage();
  });

  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
  });

  it("returns an empty list when nothing has been stored", () => {
    expect(getRecentContracts()).toEqual([]);
  });

  it("adds a contract and reads it back", () => {
    addRecentContract("C1", "My Token");
    expect(getRecentContracts()).toEqual([{ id: "C1", nickname: "My Token" }]);
  });

  it("puts the most recently added contract first", () => {
    addRecentContract("C1");
    addRecentContract("C2");
    expect(getRecentContracts().map((c) => c.id)).toEqual(["C2", "C1"]);
  });

  it("moves an existing contract to the front instead of duplicating it", () => {
    addRecentContract("C1");
    addRecentContract("C2");
    addRecentContract("C1");
    expect(getRecentContracts().map((c) => c.id)).toEqual(["C1", "C2"]);
  });

  it("preserves an existing nickname when re-adding without one", () => {
    addRecentContract("C1", "My Token");
    addRecentContract("C1");
    expect(getRecentContracts()).toEqual([{ id: "C1", nickname: "My Token" }]);
  });

  it("caps the history at ten entries, dropping the oldest", () => {
    for (let i = 1; i <= 12; i++) addRecentContract(`C${i}`);
    const ids = getRecentContracts().map((c) => c.id);
    expect(ids).toHaveLength(10);
    expect(ids[0]).toBe("C12");
    expect(ids).not.toContain("C1");
    expect(ids).not.toContain("C2");
  });

  it("removes a contract", () => {
    addRecentContract("C1");
    addRecentContract("C2");
    removeRecentContract("C1");
    expect(getRecentContracts().map((c) => c.id)).toEqual(["C2"]);
  });

  it("updates a nickname", () => {
    addRecentContract("C1", "Old");
    updateRecentContractNickname("C1", "New");
    expect(getRecentContracts()).toEqual([{ id: "C1", nickname: "New" }]);
  });

  it("clears the history", () => {
    addRecentContract("C1");
    clearRecentContracts();
    expect(getRecentContracts()).toEqual([]);
  });

  it("migrates the legacy format of bare string IDs", () => {
    store.set(STORAGE_KEY, JSON.stringify(["C1", "C2"]));
    expect(getRecentContracts()).toEqual([{ id: "C1" }, { id: "C2" }]);
  });

  it("survives corrupt stored data instead of throwing", () => {
    store.set(STORAGE_KEY, "not json at all");
    expect(getRecentContracts()).toEqual([]);
  });

  it("discards malformed entries but keeps valid ones", () => {
    store.set(
      STORAGE_KEY,
      JSON.stringify([{ id: "C1" }, { nickname: "no id" }, null, 42])
    );
    expect(getRecentContracts()).toEqual([{ id: "C1" }]);
  });
});
