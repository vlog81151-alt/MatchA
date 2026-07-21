import { execFileSync } from "node:child_process";

const commands = [
  ["corepack", ["pnpm", "format:check"]],
  ["corepack", ["pnpm", "-r", "--if-present", "typecheck"]],
  ["corepack", ["pnpm", "-r", "--if-present", "build"]]
];

for (const [command, args] of commands) {
  console.log(`\n> ${command} ${args.join(" ")}`);
  execFileSync(command, args, { stdio: "inherit" });
}
