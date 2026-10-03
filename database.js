"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { DatabaseSync } = require("node:sqlite");

const DATA_DIRECTORY = path.join(__dirname, "data");
const LEGACY_FILE = path.join(DATA_DIRECTORY, "clinic.json");
const DATABASE_FILE = process.env.CLINIC_DATABASE_PATH || path.join(DATA_DIRECTORY, "clinic.sqlite");

fs.mkdirSync(path.dirname(DATABASE_FILE), { recursive: true });

const database = new DatabaseSync(DATABASE_FILE, { timeout: 5000 });
database.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = FULL;

  CREATE TABLE IF NOT EXISTS clinic_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    payload TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS clinic_records (
    collection TEXT NOT NULL,
    id TEXT NOT NULL,
    ordinal INTEGER NOT NULL,
    payload TEXT NOT NULL,
    PRIMARY KEY (collection, id)
  );
  CREATE INDEX IF NOT EXISTS clinic_records_order
    ON clinic_records (collection, ordinal);

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    role TEXT NOT NULL,
    status TEXT NOT NULL,
    password_hash TEXT NOT NULL,
    payload TEXT NOT NULL
  );
  CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique ON users (lower(email));

  CREATE TABLE IF NOT EXISTS roles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    payload TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS permissions (
    name TEXT PRIMARY KEY
  );
  CREATE TABLE IF NOT EXISTS role_permissions (
    role_id TEXT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permission TEXT NOT NULL REFERENCES permissions(name) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission)
  );
  CREATE TABLE IF NOT EXISTS user_permissions (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission TEXT NOT NULL REFERENCES permissions(name) ON DELETE CASCADE,
    allowed INTEGER NOT NULL CHECK (allowed IN (0, 1)),
    PRIMARY KEY (user_id, permission)
  );

  CREATE TABLE IF NOT EXISTS appointments (
    id TEXT PRIMARY KEY,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    duration INTEGER NOT NULL,
    status TEXT NOT NULL,
    doctor_id TEXT NOT NULL DEFAULT '',
    payload TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS appointments_date_status
    ON appointments (date, status, time);
  CREATE UNIQUE INDEX IF NOT EXISTS appointments_active_exact_slot
    ON appointments (date, time)
    WHERE status NOT IN ('cancelled', 'no_show');

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS auth_attempts (
    key TEXT PRIMARY KEY,
    attempts INTEGER NOT NULL,
    window_started INTEGER NOT NULL,
    blocked_until INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    role TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_payload TEXT NOT NULL,
    expires_at INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS sessions_user_id ON sessions (user_id);
  DELETE FROM sessions WHERE expires_at <= ${Date.now()};

  CREATE TABLE IF NOT EXISTS email_tokens (
    token_hash TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    purpose TEXT NOT NULL CHECK (purpose IN ('verify_email', 'reset_password')),
    expires_at INTEGER NOT NULL,
    consumed_at INTEGER
  );
  CREATE INDEX IF NOT EXISTS email_tokens_account_purpose
    ON email_tokens (account_id, purpose, expires_at);
  DELETE FROM email_tokens WHERE expires_at <= ${Date.now()} OR consumed_at IS NOT NULL;
`);

const selectState = database.prepare("SELECT payload FROM clinic_state WHERE id = 1");
const upsertState = database.prepare(`
  INSERT INTO clinic_state (id, payload) VALUES (1, ?)
  ON CONFLICT(id) DO UPDATE SET payload = excluded.payload
`);

function loadState(defaults) {
  const stored = selectState.get();
  if (stored) return JSON.parse(stored.payload);

  if (!fs.existsSync(LEGACY_FILE)) {
    saveState(defaults);
    return structuredClone(defaults);
  }

  const imported = JSON.parse(fs.readFileSync(LEGACY_FILE, "utf8"));
  saveState({ ...defaults, ...imported });
  return { ...defaults, ...imported };
}

function writeState(data) {
  upsertState.run(JSON.stringify(data));

  database.exec(`
    DELETE FROM clinic_records;
    DELETE FROM user_permissions;
    DELETE FROM role_permissions;
    DELETE FROM roles;
    DELETE FROM permissions;
    DELETE FROM appointments;
    DELETE FROM users;
    DELETE FROM settings;
  `);

  const insertRecord = database.prepare(
    "INSERT INTO clinic_records (collection, id, ordinal, payload) VALUES (?, ?, ?, ?)"
  );
  const collections = Object.entries(data).filter(([, value]) => Array.isArray(value));
  for (const [collection, records] of collections) {
    records.forEach((record, ordinal) => {
      const id = String(record.id || `${collection}:${ordinal}`);
      insertRecord.run(collection, id, ordinal, JSON.stringify(record));
    });
  }

  const insertUser = database.prepare(
    "INSERT INTO users (id, email, role, status, password_hash, payload) VALUES (?, ?, ?, ?, ?, ?)"
  );
  for (const user of data.users || []) {
    if (!user.email || !user.passwordHash) continue;
    insertUser.run(
      String(user.id || user.email),
      user.email,
      String(user.role || "Customer"),
      user.banned ? "blocked" : "active",
      user.passwordHash,
      JSON.stringify({ ...user, id: String(user.id || user.email), __accountType: "user" })
    );
  }
  for (const user of data.staff || []) {
    if (!user.email || !user.passwordHash) continue;
    insertUser.run(
      String(user.id || user.email),
      user.email,
      String(user.role || "Staff"),
      user.disabled ? "suspended" : "active",
      user.passwordHash,
      JSON.stringify({ ...user, id: String(user.id || user.email), __accountType: "staff" })
    );
  }

  const insertPermission = database.prepare("INSERT OR IGNORE INTO permissions (name) VALUES (?)");
  const insertRole = database.prepare("INSERT INTO roles (id, name, payload) VALUES (?, ?, ?)");
  const insertRolePermission = database.prepare(
    "INSERT OR IGNORE INTO role_permissions (role_id, permission) VALUES (?, ?)"
  );
  const insertUserPermission = database.prepare(
    "INSERT OR IGNORE INTO user_permissions (user_id, permission, allowed) VALUES (?, ?, 1)"
  );
  for (const role of data.roles || []) {
    const id = String(role.id || role.name || "");
    if (!id || !role.name) continue;
    insertRole.run(id, role.name, JSON.stringify(role));
    for (const permission of role.permissions || []) {
      insertPermission.run(permission);
      insertRolePermission.run(id, permission);
    }
  }
  for (const user of data.staff || []) {
    const userId = String(user.id || user.email || "");
    for (const permission of user.permissions || []) {
      insertPermission.run(permission);
      insertUserPermission.run(userId, permission);
    }
  }

  const insertAppointment = database.prepare(`
    INSERT INTO appointments (id, date, time, end_time, duration, status, doctor_id, payload)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const appointment of data.appointments || []) {
    if (!appointment.id || !appointment.date || !appointment.time) continue;
    const [hours, minutes] = appointment.time.split(":").map(Number);
    const startMinute = hours * 60 + minutes;
    const endMinute = startMinute + Math.max(1, Number(appointment.duration) || 30);
    const endTime = `${String(Math.floor(endMinute / 60) % 24).padStart(2, "0")}:${String(endMinute % 60).padStart(2, "0")}`;
    insertAppointment.run(
      String(appointment.id),
      appointment.date,
      appointment.time,
      endTime,
      Math.max(1, Number(appointment.duration) || 30),
      String(appointment.status || "pending"),
      String(appointment.doctorId || ""),
      JSON.stringify(appointment)
    );
  }

  const insertSetting = database.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
  for (const [key, value] of Object.entries(data.settings || {})) {
    insertSetting.run(key, JSON.stringify(value));
  }
}

function saveState(data) {
  database.exec("BEGIN IMMEDIATE");
  try {
    writeState(data);
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

function transactState(defaults, action) {
  database.exec("BEGIN IMMEDIATE");
  try {
    const stored = selectState.get();
    const current = stored ? JSON.parse(stored.payload) : structuredClone(defaults);
    const result = action(current);
    writeState(current);
    database.exec("COMMIT");
    return { data: current, result };
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

function findAppointmentConflict(date, start, end, excludedId = "") {
  return database.prepare(`
    SELECT id FROM appointments
    WHERE date = ?
      AND id != ?
      AND status NOT IN ('cancelled', 'no_show')
      AND time < ?
      AND end_time > ?
    LIMIT 1
  `).get(date, excludedId, end, start) || null;
}

function recordFailedLogin(key, now, windowMs, attemptLimit, lockoutMs) {
  database.exec("BEGIN IMMEDIATE");
  try {
    const row = database.prepare("SELECT * FROM auth_attempts WHERE key = ?").get(key);
    if (row?.blocked_until > now) {
      database.exec("COMMIT");
      return { allowed: false, retryAfter: Math.ceil((row.blocked_until - now) / 1000) };
    }
    const attempts = row && now - row.window_started < windowMs ? row.attempts + 1 : 1;
    const windowStarted = row && now - row.window_started < windowMs ? row.window_started : now;
    const blockedUntil = attempts >= attemptLimit ? now + lockoutMs : 0;
    database.prepare(`
      INSERT INTO auth_attempts (key, attempts, window_started, blocked_until)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET
        attempts = excluded.attempts,
        window_started = excluded.window_started,
        blocked_until = excluded.blocked_until
    `).run(key, attempts, windowStarted, blockedUntil);
    database.exec("COMMIT");
    return { allowed: !blockedUntil, retryAfter: blockedUntil ? Math.ceil((blockedUntil - now) / 1000) : 0 };
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

function getLoginLimit(key, now) {
  const row = database.prepare("SELECT blocked_until FROM auth_attempts WHERE key = ?").get(key);
  return row?.blocked_until > now ? Math.ceil((row.blocked_until - now) / 1000) : 0;
}

function clearLoginAttempts(key) {
  database.prepare("DELETE FROM auth_attempts WHERE key = ?").run(key);
}

function storeSession(tokenHash, role, user, expiresAt) {
  database.prepare(`
    INSERT INTO sessions (token_hash, role, user_id, user_payload, expires_at)
    VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(token_hash) DO UPDATE SET
      role = excluded.role,
      user_id = excluded.user_id,
      user_payload = excluded.user_payload,
      expires_at = excluded.expires_at
  `).run(tokenHash, role, String(user.id), JSON.stringify(user), expiresAt);
}

function findSession(tokenHash) {
  const row = database.prepare(`
    SELECT role, user_id, user_payload, expires_at
    FROM sessions WHERE token_hash = ?
  `).get(tokenHash);
  return row ? { role: row.role, userId: row.user_id, user: JSON.parse(row.user_payload), expires: row.expires_at } : null;
}

function deleteSession(tokenHash) {
  database.prepare("DELETE FROM sessions WHERE token_hash = ?").run(tokenHash);
}

function deleteSessionsForUser(userId) {
  database.prepare("DELETE FROM sessions WHERE user_id = ?").run(String(userId));
}

function findAccountByEmail(email) {
  const row = database.prepare("SELECT payload FROM users WHERE lower(email) = lower(?)").get(email);
  return row ? JSON.parse(row.payload) : null;
}

function findAccountById(id) {
  const row = database.prepare("SELECT payload FROM users WHERE id = ?").get(String(id));
  return row ? JSON.parse(row.payload) : null;
}

function createEmailToken(tokenHash, accountId, purpose, expiresAt) {
  database.exec("BEGIN IMMEDIATE");
  try {
    database.prepare("DELETE FROM email_tokens WHERE account_id = ? AND purpose = ?").run(String(accountId), purpose);
    database.prepare(`
      INSERT INTO email_tokens (token_hash, account_id, purpose, expires_at)
      VALUES (?, ?, ?, ?)
    `).run(tokenHash, String(accountId), purpose, expiresAt);
    database.exec("COMMIT");
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

function deleteEmailTokens(accountId, purpose) {
  database.prepare("DELETE FROM email_tokens WHERE account_id = ? AND purpose = ?").run(String(accountId), purpose);
}

function consumeEmailToken(defaults, tokenHash, purpose, now, action) {
  database.exec("BEGIN IMMEDIATE");
  try {
    const token = database.prepare(`
      SELECT account_id FROM email_tokens
      WHERE token_hash = ? AND purpose = ? AND expires_at > ? AND consumed_at IS NULL
    `).get(tokenHash, purpose, now);
    if (!token) {
      database.exec("COMMIT");
      return null;
    }

    const stored = selectState.get();
    const current = stored ? JSON.parse(stored.payload) : structuredClone(defaults);
    const result = action(current, token.account_id);
    if (result === false) {
      database.exec("COMMIT");
      return null;
    }

    writeState(current);
    if (purpose === "reset_password") {
      database.prepare("DELETE FROM sessions WHERE user_id = ?").run(token.account_id);
    }
    database.prepare("UPDATE email_tokens SET consumed_at = ? WHERE token_hash = ?").run(now, tokenHash);
    database.exec("COMMIT");
    return { data: current, result };
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

module.exports = {
  database,
  loadState,
  saveState,
  transactState,
  findAppointmentConflict,
  recordFailedLogin,
  getLoginLimit,
  clearLoginAttempts,
  storeSession,
  findSession,
  deleteSession,
  deleteSessionsForUser,
  findAccountByEmail,
  findAccountById,
  createEmailToken,
  deleteEmailTokens,
  consumeEmailToken
};
