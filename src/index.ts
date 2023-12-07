import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { HTTPException } from 'hono/http-exception'
import balances from "./apps/balances/routes";
import * as dotenv from "dotenv";
import rewards from "./apps/rewards/routes";
import { welcomeHtml } from "@libs/constants";
import { logger } from "@libs/logger";
dotenv.config({ path: process.cwd() + "/.env" });
const app = new Hono();
app.get("/", (c) => c.html(welcomeHtml));
app.route("/balances", balances);
app.route("/rewards", rewards);
app.onError((err, c) => {
  logger.error(err?.stack ? err.stack.toString() : err.toString());
  if (err instanceof HTTPException) {
    // Get the custom response
    return err.getResponse()
  }
  return c.text('Internal Server Error', 500)
})
serve({ fetch: app.fetch, port: +(process.env.PORT || 3000) }, (info) => {
  console.log(`Listening on http://localhost:${info.port}`); // Listening on http://localhost:3000
});
