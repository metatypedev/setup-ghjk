export { ghjk } from "https://raw.github.com/metatypedev/ghjk/0666c3cc/mod.ts";
import {
  $,
  install,
} from "https://raw.github.com/metatypedev/ghjk/0666c3cc/mod.ts";
import node from "https://raw.github.com/metatypedev/ghjk/0666c3cc/ports/node.ts";
import pnpm from "https://raw.github.com/metatypedev/ghjk/0666c3cc/ports/pnpm.ts";
import act from "https://raw.github.com/metatypedev/ghjk/0666c3cc/ports/act.ts";

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
