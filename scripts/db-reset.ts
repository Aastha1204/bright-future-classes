import { spawnSync } from "node:child_process";

/**
 * npm run db:reset — re-applies migration + seed.
 * Uses the Supabase CLI (`supabase db reset`) against your local/linked project.
 * Without the CLI it prints how to apply the SQL manually in the Supabase SQL editor.
 */
spawnSync("npx", ["tsx", "scripts/seed.ts"], { stdio: "inherit", shell: true });

const probe = spawnSync("supabase", ["--version"], { shell: true, encoding: "utf8" });
if (probe.status !== 0) {
  console.log(
    [
      "",
      "Supabase CLI not found. To reset the database manually:",
      "  1. Open your Supabase project -> SQL editor",
      "  2. Run supabase/migrations/001_init.sql (first time only)",
      "  3. Run supabase/seed.sql (re-run any time to refresh the 40 demo leads)",
      "Install the CLI later with: npm i -g supabase",
    ].join("\n"),
  );
  process.exit(0);
}
const r = spawnSync("supabase", ["db", "reset"], { stdio: "inherit", shell: true });
process.exit(r.status ?? 1);
