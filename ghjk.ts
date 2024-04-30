export { ghjk } from "https://raw.github.com/metatypedev/ghjk/6a00967/mod.ts";
import {
  $,
  install,
} from "https://raw.github.com/metatypedev/ghjk/6a00967/mod.ts";
import * as ports from "https://raw.github.com/metatypedev/ghjk/6a00967/ports/mod.ts";

install(
  ports.node({
    version: (await $.path(import.meta.resolve("./.node-version")).readText())
      .trim(),
  }),
  ports.pnpm(),
);

if (!Deno.env.has("CI")) {
  install(
    ports.act(),
  );
}
