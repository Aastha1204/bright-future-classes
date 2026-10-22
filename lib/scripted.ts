import { z } from "zod";
import raw from "@/config/scripts.json";

const TurnSchema = z.object({ user: z.string().min(1), bot: z.record(z.string(), z.unknown()) });
const ScriptSchema = z.object({
  title: z.string(),
  badge: z.enum(["HOT", "WARM", "COLD"]),
  summary: z.string(),
  turns: z.array(TurnSchema).min(1),
});
const ScriptsSchema = z.object({ A: ScriptSchema, B: ScriptSchema, C: ScriptSchema });

export type ScriptId = "A" | "B" | "C";
export type Script = z.infer<typeof ScriptSchema>;

export const SCRIPT_IDS: ScriptId[] = ["A", "B", "C"];

let cached: z.infer<typeof ScriptsSchema> | null = null;

/** Validated scripts from config/scripts.json. */
export function getScripts() {
  if (!cached) cached = ScriptsSchema.parse(raw);
  return cached;
}

export function getScript(id: ScriptId): Script {
  return getScripts()[id];
}
