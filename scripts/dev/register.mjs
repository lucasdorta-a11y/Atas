import { register } from "node:module";
import { pathToFileURL } from "node:url";

// O stub do IndexedDB entra quando o script principal é o dry-run do panorama
// (ou quando ATAS_STUB_STORE=1 é definido explicitamente).
const stubStore = process.env.ATAS_STUB_STORE === "1" || process.argv.some((arg) => /panorama-dry-run\.m(ts)?$/.test(arg));
register(pathToFileURL("./scripts/dev/alias-loader.mjs").href, { data: { stubStore } });
