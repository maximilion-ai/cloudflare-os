import { describe, expect, it } from "vitest";
import { bundleGadgetClient } from "../src/gadget-client-bundle";

describe("bundleGadgetClient", () => {
  it("embeds archived client payload modules into the standalone client", () => {
    let files = new Map([
      ["client.js", `globalThis.__gadgetBundleResult = (await import("./client-payload-1.js")).default;`],
      ["client-payload-1.js", `export default "rendered";`],
    ]);

    let client = bundleGadgetClient(files);
    expect(client).not.toContain("./client-payload-1.js");
    let encoded = client.match(/base64,([A-Za-z\d+/=]+)/)?.[1];
    expect(encoded).toBeDefined();
    expect(new TextDecoder().decode(Uint8Array.fromBase64(encoded!)))
      .toBe(`export default "rendered";`);
  });

  it("rejects a missing archived payload", () => {
    expect(() => bundleGadgetClient(new Map([
      ["client.js", `await import("./client-payload-1.js");`],
    ]))).toThrow(/client-payload-1\.js/);
  });

  it("removes the legacy binary and base64 copy chain", () => {
    let client = bundleGadgetClient(new Map([
      ["client.js", 'const bytes=new Uint8Array();\n' +
        'let binary="";for(let offset=0;offset<bytes.length;offset+=32768)' +
        'binary+=String.fromCharCode(...bytes.subarray(offset,offset+32768));\n' +
        'await import("data:text/javascript;base64,"+btoa(binary));'],
    ]));

    expect(client).toContain("URL.createObjectURL");
    expect(client).not.toContain("btoa(binary)");
  });
});
