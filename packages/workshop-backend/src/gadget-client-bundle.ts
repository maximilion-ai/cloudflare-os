const payloadImport = /import\(\s*(["'])(\.\/client-payload-\d+\.js)\1\s*\)/g;
const legacyBinaryImport = /let binary="";for\(let offset=0;offset<bytes\.length;offset\+=32768\)binary\+=String\.fromCharCode\(\.\.\.bytes\.subarray\(offset,offset\+32768\)\);\s*await import\("data:text\/javascript;base64,"\+btoa\(binary\)\);/;

function moduleUrl(source: string): string {
  return `data:text/javascript;charset=utf-8;base64,${new TextEncoder().encode(source).toBase64()}`;
}

/** Resolve deployment-owned compressed payload modules before client.js becomes a data URL. */
export function bundleGadgetClient(files: ReadonlyMap<string, string>): string {
  let client = files.get("client.js");
  if (client === undefined) throw new Error("Gadget has no client.js.");
  client = client.replace(payloadImport, (_match, _quote, specifier: string) => {
    let filename = specifier.slice(2);
    let payload = files.get(filename);
    if (payload === undefined) throw new Error(`Gadget is missing ${filename}.`);
    return `import(${JSON.stringify(moduleUrl(payload))})`;
  });
  return client.replace(
    legacyBinaryImport,
    'const moduleUrl=URL.createObjectURL(new Blob([bytes],{type:"text/javascript"}));' +
      'try{await import(moduleUrl)}finally{URL.revokeObjectURL(moduleUrl)}',
  );
}
