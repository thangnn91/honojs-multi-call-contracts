import { serve } from "@hono/node-server";
import { Hono } from "hono";
import balances from "./apps/balances/routes";
import * as dotenv from "dotenv";
import rewards from "./apps/rewards/routes";
import { welcomeHtml } from "@libsconstants";
dotenv.config({ path: process.cwd() + "/.env" });
const app = new Hono();
app.get("/", (c) => c.html(welcomeHtml));
app.route("/balances", balances);
app.route("/rewards", rewards);
serve({ fetch: app.fetch, port: +(process.env.PORT || 3000) }, (info) => {
  console.log(`Listening on http://localhost:${info.port}`); // Listening on http://localhost:3000
});
