export { ghjk } from "https://raw.github.com/metatypedev/ghjk/6040bb3/mod.ts";
import {
  $,
  install,
} from "https://raw.github.com/metatypedev/ghjk/6040bb3/mod.ts";
import node from "https://raw.github.com/metatypedev/ghjk/6040bb3/ports/node.ts";
import pnpm from "https://raw.github.com/metatypedev/ghjk/6040bb3/ports/pnpm.ts";
import act from "https://raw.github.com/metatypedev/ghjk/6040bb3/ports/act.ts";

install(
  node({
    version: "v" +
      await $.path(import.meta.resolve("./.node-version")).readText(),
  }),
  pnpm(),
);

if (!Deno.env.has("CI")) {
  install(
    act(),
  );
}
