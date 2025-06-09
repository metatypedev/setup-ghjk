export { sophon } from "@ghjk/ts";
import {
  $,
  file
} from "@ghjk/ts";
import * as ports from "@ghjk/ports_wip";

const { install } = file();

install(
  ports.node({
    version: "v" +
      (await $.path(import.meta.resolve("./.node-version")).readText()).trim(),
  }),
  ports.pnpm(),
);

if (!Deno.env.has("CI")) {
  install(
    ports.act(),
  );
}
