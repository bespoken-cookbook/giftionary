const termGenerator = require("../src/term-generator");

test("Term Generator Test", () => {
    termGenerator.load();
    expect(termGenerator.terms.length).toBe(56);
});