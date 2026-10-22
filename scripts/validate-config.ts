import raw from "../config/client.json";
import { ClientSchema } from "../config/schema";

const res = ClientSchema.safeParse(raw);
if (!res.success) {
  console.error("config/client.json is invalid:\n", JSON.stringify(res.error.issues, null, 2));
  process.exit(1);
}
console.log("config/client.json OK —", res.data.business.name);
