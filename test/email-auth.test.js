"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const http = require("node:http");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const { setTimeout: delay } = require("node:timers/promises");
const { test } = require("node:test");

const projectDirectory = path.resolve(__dirname, "..");

async function availablePort() {
  const server = http.createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const { port } = server.address();
  await new Promise((resolve) => server.close(resolve));
  return port;
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let text = "";
    request.setEncoding("utf8");
    request.on("data", (part) => { text += part; });
    request.on("end", () => {
      try { resolve(JSON.parse(text)); } catch (error) { reject(error); }
    });
    request.on("error", reject);
  });
}

test("Resend verification and password recovery use expiring, single-use tokens", async (context) => {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "smilex-email-test-"));
  const mailRequests = [];
  const mailServer = http.createServer(async (request, response) => {
    const message = await readJson(request);
    mailRequests.push({ authorization: request.headers.authorization, message });
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ id: "test-email-id" }));
  });
  await new Promise((resolve, reject) => {
    mailServer.once("error", reject);
    mailServer.listen(0, "127.0.0.1", resolve);
  });

  const appPort = await availablePort();
  const mailPort = mailServer.address().port;
  const baseUrl = `http://127.0.0.1:${appPort}`;
  const application = spawn(process.execPath, ["server.js"], {
    cwd: projectDirectory,
    env: {
      ...process.env,
      NODE_ENV: "test",
      HOST: "127.0.0.1",
      PORT: String(appPort),
      ADMIN_EMAIL: "admin@example.test",
      ADMIN_PASSWORD: "Integration-Test-Admin-2026!",
      CLINIC_DATABASE_PATH: path.join(temporaryDirectory, "clinic.sqlite"),
      RESEND_API_KEY: "local-test-key",
      RESEND_API_URL: `http://127.0.0.1:${mailPort}/emails`,
      MAIL_FROM: "Smilex <test@example.test>",
      APP_BASE_URL: baseUrl
    },
    stdio: ["ignore", "ignore", "pipe"]
  });
  let serverErrors = "";
  application.stderr.setEncoding("utf8");
  application.stderr.on("data", (chunk) => { serverErrors += chunk; });

  context.after(async () => {
    if (application.exitCode === null) {
      application.kill();
      await new Promise((resolve) => application.once("exit", resolve));
    }
    await new Promise((resolve) => mailServer.close(resolve));
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  });

  let ready = false;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (application.exitCode !== null) break;
    try {
      const response = await fetch(`${baseUrl}/api/state`);
      if (response.ok) {
        ready = true;
        break;
      }
    } catch {}
    await delay(250);
  }
  assert.ok(ready, `application failed to start: ${serverErrors}`);

  const post = async (route, body, cookie) => fetch(`${baseUrl}${route}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {})
    },
    body: JSON.stringify(body)
  });
  const registration = await post("/api/auth/register", {
    name: "Mail Test",
    phone: "962790123456",
    email: "mail-test@example.test",
    password: "Integration-Test-Member-2026!",
    confirmPassword: "Integration-Test-Member-2026!"
  });
  assert.equal(registration.status, 201);
  assert.equal(mailRequests.length, 1);
  assert.equal(mailRequests[0].authorization, "Bearer local-test-key");

  const verificationUrl = mailRequests[0].message.text.match(/https?:\/\/\S+/)?.[0];
  assert.ok(verificationUrl);
  const verificationToken = new URL(verificationUrl).searchParams.get("verify");
  assert.ok(verificationToken);
  const unverifiedLogin = await post("/api/auth/login", {
    email: "mail-test@example.test",
    password: "Integration-Test-Member-2026!"
  });
  assert.equal(unverifiedLogin.status, 403);
  assert.equal((await post("/api/auth/verify-email", { token: verificationToken })).status, 200);
  assert.equal((await post("/api/auth/verify-email", { token: verificationToken })).status, 400);

  const resetRequest = await post("/api/auth/password-reset", { email: "mail-test@example.test" });
  assert.equal(resetRequest.status, 200);
  assert.equal(mailRequests.length, 2);
  const resetUrl = mailRequests[1].message.text.match(/https?:\/\/\S+/)?.[0];
  assert.ok(resetUrl);
  const resetToken = new URL(resetUrl).searchParams.get("reset");
  assert.ok(resetToken);

  const login = await post("/api/auth/login", {
    email: "mail-test@example.test",
    password: "Integration-Test-Member-2026!"
  });
  assert.equal(login.status, 200);
  const cookie = login.headers.get("set-cookie").split(";")[0];
  const reset = await post("/api/auth/password-reset/confirm", {
    token: resetToken,
    password: "New-Integration-Password-2026!",
    confirmPassword: "New-Integration-Password-2026!"
  });
  assert.equal(reset.status, 200);
  const revokedSession = await fetch(`${baseUrl}/api/auth/me`, { headers: { Cookie: cookie } });
  assert.equal(revokedSession.status, 200);
  assert.equal((await revokedSession.json()).role, null);
  assert.equal((await post("/api/auth/password-reset/confirm", {
    token: resetToken,
    password: "New-Integration-Password-2026!",
    confirmPassword: "New-Integration-Password-2026!"
  })).status, 400);
  assert.equal((await post("/api/auth/login", {
    email: "mail-test@example.test",
    password: "Integration-Test-Member-2026!"
  })).status, 401);
  assert.equal((await post("/api/auth/login", {
    email: "mail-test@example.test",
    password: "New-Integration-Password-2026!"
  })).status, 200);
});
