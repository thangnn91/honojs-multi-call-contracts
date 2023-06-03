import { serve } from "@hono/node-server";
import { Hono } from "hono";
import balances from "./apps/balances/routes";
const app = new Hono();
app.get("/", (c) => c.text("Hello Node.js!"));
app.route("/balances", balances);
serve(app, (info) => {
  console.log(`Listening on http://localhost:${info.port}`); // Listening on http://localhost:3000
});
