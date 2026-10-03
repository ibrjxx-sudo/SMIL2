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

test("custom roles are assigned to staff and enforce operation-level permissions", async (context) => {
  const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "smilex-rbac-test-"));
  const port = await availablePort();
  const baseUrl = `http://127.0.0.1:${port}`;
  const application = spawn(process.execPath, ["server.js"], {
    cwd: projectDirectory,
    env: {
      ...process.env,
      NODE_ENV: "test",
      HOST: "127.0.0.1",
      PORT: String(port),
      ADMIN_EMAIL: "admin@example.test",
      ADMIN_PASSWORD: "Integration-Test-Admin-2026!",
      CLINIC_DATABASE_PATH: path.join(temporaryDirectory, "clinic.sqlite"),
      RESEND_API_KEY: "",
      MAIL_FROM: "",
      APP_BASE_URL: ""
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
    fs.rmSync(temporaryDirectory, { recursive: true, force: true });
  });

  let ready = false;
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (application.exitCode !== null) break;
    try {
      if ((await fetch(`${baseUrl}/api/state`)).ok) {
        ready = true;
        break;
      }
    } catch {}
    await delay(250);
  }
  assert.ok(ready, `application failed to start: ${serverErrors}`);

  const request = async (route, method = "GET", body, cookie) => fetch(`${baseUrl}${route}`, {
    method,
    headers: {
      ...(body ? { "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {})
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const adminLogin = await request("/api/auth/login", "POST", {
    email: "admin@example.test",
    password: "Integration-Test-Admin-2026!"
  });
  assert.equal(adminLogin.status, 200);
  const adminCookie = adminLogin.headers.get("set-cookie").split(";")[0];
  const role = await request("/api/admin/roles", "POST", {
    name: "Appointment reader",
    permissions: ["appointments.view"]
  }, adminCookie);
  assert.equal(role.status, 201);
  const createdUser = await request("/api/admin/users", "POST", {
    name: "Read Only",
    email: "reader@example.test",
    password: "Integration-Test-Staff-2026!",
    role: "Appointment reader"
  }, adminCookie);
  assert.equal(createdUser.status, 201);
  assert.deepEqual((await createdUser.json()).user.permissions, ["appointments.view"]);

  const staffLogin = await request("/api/auth/login", "POST", {
    email: "reader@example.test",
    password: "Integration-Test-Staff-2026!"
  });
  assert.equal(staffLogin.status, 200);
  const staffCookie = staffLogin.headers.get("set-cookie").split(";")[0];
  const staffMe = await request("/api/auth/me", "GET", undefined, staffCookie);
  assert.deepEqual((await staffMe.json()).user.permissions, ["appointments.view"]);
  assert.equal((await request("/api/admin/appointments", "GET", undefined, staffCookie)).status, 200);
  assert.equal((await request("/api/admin/appointments", "POST", {}, staffCookie)).status, 403);
  assert.equal((await request("/api/admin/appointments/missing", "PATCH", {}, staffCookie)).status, 403);
  assert.equal((await request("/api/admin/appointments/missing", "DELETE", undefined, staffCookie)).status, 403);
  assert.equal((await request("/api/admin/users", "GET", undefined, staffCookie)).status, 403);
  const managerRole = await request("/api/admin/roles", "POST", {
    name: "Limited user manager",
    permissions: ["users.view", "users.create", "users.edit", "appointments.view"]
  }, adminCookie);
  assert.equal(managerRole.status, 201);
  const managerCreation = await request("/api/admin/users", "POST", {
    name: "Limited Manager",
    email: "manager@example.test",
    password: "Integration-Test-Manager-2026!",
    role: "Limited user manager"
  }, adminCookie);
  assert.equal(managerCreation.status, 201);
  const managerLogin = await request("/api/auth/login", "POST", {
    email: "manager@example.test",
    password: "Integration-Test-Manager-2026!"
  });
  assert.equal(managerLogin.status, 200);
  const managerCookie = managerLogin.headers.get("set-cookie").split(";")[0];
  assert.equal((await request("/api/admin/roles", "POST", {
    name: "Escalation",
    permissions: ["appointments.view", "users.delete"]
  }, managerCookie)).status, 403);
  assert.equal((await request("/api/admin/users", "POST", {
    name: "Admin Escalation",
    email: "escalated@example.test",
    password: "Integration-Test-Escalated-2026!",
    role: "Admin"
  }, managerCookie)).status, 403);
});
