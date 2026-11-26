import { isLinkValid } from "../../src/modules/hyperlink";

describe("isLinkValid", () => {
  // isLinkValid reads only the language, for the tooltip.
  const ctx = { lang: "en" };

  test.each([
    "https://example.com",
    "http://example.com/path/page?a=1&b=2",
    "example.com/path",
  ])("accepts the web address %s", (address) => {
    expect(isLinkValid(ctx, "webpage", address).isValid).toBe(true);
  });

  test.each(["https://example.com/a b", "https://example.com/?a=1&amp;b=2"])(
    "rejects the web address %s",
    (address) => {
      expect(isLinkValid(ctx, "webpage", address).isValid).toBe(false);
    }
  );

  test("rejects an address with a long host without backtracking", () => {
    // The previous pattern took over 40 seconds on this address.
    const address =
      "https://intranet.example-company.com/sites/team?id=1&amp;view=2";
    const start = Date.now();

    const { isValid } = isLinkValid(ctx, "webpage", address);

    expect(isValid).toBe(false);
    expect(Date.now() - start).toBeLessThan(1000);
  });
});
