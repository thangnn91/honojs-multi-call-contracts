import { serve } from "@hono/node-server";
import { Hono } from "hono";
import balances from "./apps/balances/routes";
import * as dotenv from "dotenv";
dotenv.config({ path: process.cwd() + "/.env" });
const app = new Hono();
app.get("/", (c) => c.text("Hello Node.js!"));
app.route("/balances", balances);
serve({ fetch: app.fetch, port: +(process.env.PORT || 3000) }, (info) => {
  console.log(`Listening on http://localhost:${info.port}`); // Listening on http://localhost:3000
});
