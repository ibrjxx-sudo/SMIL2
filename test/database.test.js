"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { after, test } = require("node:test");

const temporaryDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "smilex-db-test-"));
process.env.CLINIC_DATABASE_PATH = path.join(temporaryDirectory, "clinic.sqlite");
const {
  database,
  saveState,
  transactState,
  findAppointmentConflict,
  findAccountByEmail,
  storeSession,
  findSession,
  deleteSession,
  recordFailedLogin,
  getLoginLimit,
  clearLoginAttempts
} = require("../database");

const defaults = {
  settings: { clinicName: "Test" },
  services: [],
  appointments: [],
  users: [],
  staff: [],
  roles: []
};

after(() => {
  database.close();
  fs.rmSync(temporaryDirectory, { recursive: true, force: true });
});

test("SQLite state writes are transactional and detects overlapping appointments", () => {
  const existing = {
    id: "appointment-1",
    date: "2030-04-05",
    time: "10:00",
    duration: 45,
    status: "confirmed"
  };
  saveState({ ...defaults, appointments: [existing] });

  assert.ok(findAppointmentConflict("2030-04-05", "10:30", "11:00"));
  assert.equal(findAppointmentConflict("2030-04-05", "10:45", "11:15"), null);

  assert.throws(() => saveState({
    ...defaults,
    appointments: [existing, { ...existing, id: "appointment-2" }]
  }));

  const saved = JSON.parse(database.prepare("SELECT payload FROM clinic_state WHERE id = 1").get().payload);
  assert.deepEqual(saved.appointments, [existing]);
});

test("state transactions reload the latest snapshot and commit changes", () => {
  const result = transactState(defaults, (current) => {
    current.services.push({ id: "service-1", name: "Checkup" });
    return current.services.length;
  });

  assert.equal(result.result, 1);
  assert.deepEqual(result.data.services, [{ id: "service-1", name: "Checkup" }]);
  assert.equal(JSON.parse(database.prepare("SELECT payload FROM clinic_state WHERE id = 1").get().payload).services.length, 1);
});

test("normalized accounts support case-insensitive lookup and revocable sessions", () => {
  saveState({
    ...defaults,
    users: [{ id: "member-1", name: "Member", email: "member@example.test", passwordHash: "salt:hash" }]
  });
  assert.equal(findAccountByEmail("MEMBER@example.test").id, "member-1");

  storeSession("opaque-token-hash", "user", { id: "member-1", name: "Member" }, Date.now() + 60_000);
  assert.equal(findSession("opaque-token-hash").user.name, "Member");
  deleteSession("opaque-token-hash");
  assert.equal(findSession("opaque-token-hash"), null);
});

test("failed login limits persist and expire", () => {
  const key = "test-ip";
  const now = Date.now();
  for (let attempt = 0; attempt < 3; attempt += 1) {
    recordFailedLogin(key, now + attempt, 60_000, 3, 30_000);
  }
  assert.ok(getLoginLimit(key, now + 4) > 0);
  clearLoginAttempts(key);
  assert.equal(getLoginLimit(key, now + 4), 0);
});
