const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const {
  loadState,
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
} = require("./database");

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const UPLOAD_DIR = path.join(ROOT, "uploads");
const MAX_UPLOAD_BYTES = 80 * 1024 * 1024;
const MAX_UPLOAD_BODY = 112 * 1024 * 1024;
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const ADMIN_EMAIL = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
const ADMIN_PASSWORD = String(process.env.ADMIN_PASSWORD || "");
const RESEND_API_KEY = String(process.env.RESEND_API_KEY || "");
const MAIL_FROM = String(process.env.MAIL_FROM || "").trim();
const APP_BASE_URL = String(process.env.APP_BASE_URL || "").trim().replace(/\/+$/, "");
const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_ATTEMPT_LIMIT = 10;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;
const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()"
};
const PERMISSION_ACTIONS = {
  appointments: ["view", "create", "edit", "delete"],
  patients: ["view", "create", "edit", "delete"],
  doctors: ["view", "create", "edit", "delete"],
  services: ["view", "create", "edit", "delete"],
  media: ["view", "upload", "delete"],
  content: ["view", "create", "edit", "delete"],
  appearance: ["view", "edit"],
  users: ["view", "create", "edit", "delete"],
  reports: ["view", "export"],
  settings: ["view", "edit", "export"]
};
const LEGACY_PERMISSIONS = new Set(Object.keys(PERMISSION_ACTIONS));
const VALID_PERMISSIONS = new Set([
  ...Object.entries(PERMISSION_ACTIONS).flatMap(([area, actions]) => actions.map((action) => `${area}.${action}`)),
  ...LEGACY_PERMISSIONS
]);
const SUPER_ADMIN_PERMISSIONS = Object.keys(PERMISSION_ACTIONS).flatMap((area) =>
  PERMISSION_ACTIONS[area].map((action) => `${area}.${action}`)
);
const defaults = {
  settings: { clinicName: "سِنان", doctorName: "فريق سِنان", whatsapp: "00962780471734", clinicEmail: "", phone: "", address: "", adminAvatarUrl: "", siteDescription: "", heroLead: "موعدك لابتسامة", heroAccent: "أكثر صحة.", heroDescription: "رعاية أسنان متكاملة تبدأ بالاستماع إليك. اختر الخدمة والوقت المناسب، وسنكون بانتظارك.", copy: { servicesTitle: "اهتمام شامل، بكل تفاصيل ابتسامتك.", servicesDescription: "من الفحص الدوري إلى العناية التجميلية، نختار لك رعاية مدروسة وخطة واضحة تناسب احتياجك.", bookingTitle: "الخطوة الأولى تبدأ من هنا.", bookingDescription: "اختر الخدمة والموعد، وأكّد حجزك عبر واتساب. ستظهر الأوقات المحجوزة بوضوح.", aboutTitle: "الاهتمام الحقيقي يبدأ بالاستماع.", aboutDescription: "نؤمن أن زيارة طبيب الأسنان يجب أن تكون تجربة مطمئنة. لذلك نمنحك وقتًا لفهم احتياجاتك، ونشرح خياراتك بوضوح، ونتابع معك كل خطوة.", closingTitle: "ابتسامتك تستحق أن نعتني بها." }, seoTitle: "", seoDescription: "", openTime: "09:00", closeTime: "20:00", slotDuration: 30, workingDays: [0, 1, 2, 3, 4, 6], logoUrl: "", badgeUrl: "", verified: false, colors: { primary: "#286b57", secondary: "#d3e9a5", background: "#f7f8f5", text: "#172722" }, sections: { header: true, footer: true, services: true, doctors: true, gallery: true, testimonials: true, faq: true, about: true, articles: true }, fontFamily: "IBM Plex Sans Arabic", fontSize: 14, headingSize: 38, buttonSize: 12, footerDescription: "رعاية تبدأ بابتسامة", socialLinks: {} },
  services: [
    { id: "checkup", name: "الفحص والاستشارة", description: "فحص شامل وخطة عناية تناسب احتياجك.", duration: 30, price: "يحدد بعد الفحص", icon: "⌕" },
    { id: "cleaning", name: "تنظيف الأسنان", description: "عناية دورية لأسنان أكثر صحة ونظافة.", duration: 45, price: "يحدد بعد الفحص", icon: "✳" },
    { id: "cosmetic", name: "تجميل الأسنان", description: "خيارات تجميلية مدروسة لابتسامة واثقة.", duration: 45, price: "يحدد بعد الفحص", icon: "◇" },
    { id: "treatment", name: "علاج الأسنان", description: "رعاية علاجية بخطوات واضحة ومريحة.", duration: 45, price: "يحدد بعد الفحص", icon: "＋" }
  ], appointments: [], users: [], gallery: [], doctors: [], patients: [], pages: [], posts: [],
  testimonials: [], faqs: [], messages: [], categories: [], tags: [], staff: [], roles: [], activity: [], notifications: [], backups: []
};

fs.mkdirSync(UPLOAD_DIR, { recursive: true });
let data = { ...defaults, ...loadState(defaults) };
data.settings = { ...defaults.settings, ...data.settings };
data.services ||= defaults.services;
data.appointments ||= [];
data.users ||= [];
data.gallery ||= [];
for (const key of ["doctors", "patients", "pages", "posts", "testimonials", "faqs", "messages", "categories", "tags", "staff", "roles", "activity", "notifications", "backups"]) data[key] ||= [];
let dataSnapshot = structuredClone(data);

function mergeRecords(latest, before, updated) {
  const identity = (record, index) => String(record.id || record.email || `${index}`);
  const beforeMap = new Map(before.map((record, index) => [identity(record, index), record]));
  const updatedMap = new Map(updated.map((record, index) => [identity(record, index), record]));
  const result = [...latest];

  for (const [id, oldRecord] of beforeMap) {
    const nextRecord = updatedMap.get(id);
    const currentIndex = result.findIndex((record, index) => identity(record, index) === id);
    if (!nextRecord) {
      if (currentIndex >= 0) result.splice(currentIndex, 1);
    } else if (JSON.stringify(oldRecord) !== JSON.stringify(nextRecord) && currentIndex >= 0) {
      result[currentIndex] = nextRecord;
    }
  }

  for (let index = 0; index < updated.length; index += 1) {
    const record = updated[index];
    const id = identity(record, index);
    if (beforeMap.has(id) || result.some((item, position) => identity(item, position) === id)) continue;
    const nextId = updated.slice(index + 1).map((item, offset) => identity(item, index + offset + 1))
      .find((candidate) => result.some((item, position) => identity(item, position) === candidate));
    const insertAt = nextId === undefined ? -1 : result.findIndex((item, position) => identity(item, position) === nextId);
    if (insertAt < 0) result.push(record);
    else result.splice(insertAt, 0, record);
  }
  return result;
}

function saveData() {
  const previous = dataSnapshot;
  const updated = structuredClone(data);
  const transaction = transactState(defaults, (latest) => {
    for (const [key, value] of Object.entries(updated)) {
      const before = previous[key];
      if (JSON.stringify(before) === JSON.stringify(value)) continue;
      if (Array.isArray(before) && Array.isArray(value) && Array.isArray(latest[key])) {
        latest[key] = mergeRecords(latest[key], before, value);
      } else if (key === "settings" && before && value && latest[key]) {
        const merged = { ...latest[key] };
        for (const setting of new Set([...Object.keys(before), ...Object.keys(value)])) {
          if (JSON.stringify(before[setting]) === JSON.stringify(value[setting])) continue;
          if (Object.hasOwn(value, setting)) merged[setting] = value[setting];
          else delete merged[setting];
        }
        latest[key] = merged;
      } else {
        latest[key] = value;
      }
    }
  });
  data = transaction.data;
  dataSnapshot = structuredClone(data);
}
function transactData(action) {
  const previous = data;
  try {
    const transaction = transactState(defaults, (current) => {
      data = current;
      return action(current);
    });
    data = transaction.data;
    dataSnapshot = structuredClone(data);
    return transaction.result;
  } catch (error) {
    data = previous;
    throw error;
  }
}
function reply(res, status, body, headers = {}) {
  res.writeHead(status, { ...SECURITY_HEADERS, "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers });
  res.end(JSON.stringify(body));
}
function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || "").split(";").map((part) => part.trim().split(/=(.*)/s).slice(0, 2)).filter(([key, value]) => key && value !== undefined));
}
function session(req) {
  const token = parseCookies(req).sinan_session;
  if (!/^[a-f\d]{64}$/i.test(token || "")) return null;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const current = findSession(tokenHash);
  if (!current) return null;
  if (current.expires <= Date.now()) {
    deleteSession(tokenHash);
    return null;
  }
  const account = findAccountById(current.userId);
  if (!account) {
    deleteSession(tokenHash);
    return null;
  }
  if (current.role === "admin") {
    const administrator = ADMIN_EMAIL && account.email.toLowerCase() === ADMIN_EMAIL && account.isSuperAdmin && !account.disabled ? account : null;
    if (!administrator) {
      deleteSession(tokenHash);
      return null;
    }
    current.user = { id: administrator.id, name: administrator.name, email: administrator.email, role: "admin", permissions: administrator.permissions || [], avatarUrl: administrator.avatarUrl || "" };
  }
  if (current.role === "user") {
    if (account.__accountType !== "user" || account.banned) {
      deleteSession(tokenHash);
      return null;
    }
    current.user = { id: account.id, name: account.name, age: account.age, email: account.email, phone: account.phone, avatarUrl: account.avatarUrl || "", verified: Boolean(account.verified) };
  }
  if (current.role === "staff") {
    const employee = account.__accountType === "staff" && !account.disabled ? account : null;
    if (!employee || employee.isSuperAdmin) {
      deleteSession(tokenHash);
      return null;
    }
    current.user = { id: employee.id, name: employee.name, email: employee.email, role: employee.role, permissions: rolePermissionsFor(employee), avatarUrl: employee.avatarUrl || "" };
  }
  return current;
}
function adminOnly(req, res) {
  const current = session(req);
  if (current?.role === "admin") return true;
  reply(res, current ? 403 : 401, { error: "يلزم تسجيل دخول الإدارة." });
  return false;
}
function normalizePermissions(permissions) {
  return Array.isArray(permissions) ? [...new Set(permissions.filter((item) => VALID_PERMISSIONS.has(item)))] : [];
}
function rolePermissionsFor(employee) {
  const role = data.roles.find((item) => item.id === employee.role || item.name === employee.role);
  return role ? normalizePermissions(role.permissions) : normalizePermissions(employee.permissions);
}
function permissionFor(pathname, method) {
  let area = "";
  if (/\/api\/admin\/overview$/.test(pathname)) area = "reports";
  else if (/appointments|calendar|bookings/.test(pathname)) area = "appointments";
  else if (/patients/.test(pathname)) area = "patients";
  else if (/doctors/.test(pathname)) area = "doctors";
  else if (/services/.test(pathname)) area = "services";
  else if (/media/.test(pathname)) area = "media";
  else if (/branding|customization/.test(pathname)) area = "appearance";
  else if (/members|users|roles/.test(pathname)) area = "users";
  else if (/reports/.test(pathname)) area = "reports";
  else if (/settings|backup|export|activity|notifications/.test(pathname)) area = "settings";
  else if (/collections/.test(pathname)) area = "content";
  if (!area) return null;

  if (method === "GET") return `${area}.view`;
  if (method === "PATCH") return `${area}.edit`;
  if (method === "DELETE" || /bulk-delete/.test(pathname)) return `${area}.delete`;
  if (method === "POST") {
    if (area === "media") return `${area}.upload`;
    if (area === "appearance" || /\/api\/admin\/(roles|settings)$/.test(pathname) ||
      /\/api\/admin\/customization$/.test(pathname)) return `${area}.edit`;
    return `${area}.create`;
  }
  return null;
}
function canAccess(req, res, permission) {
  const current = session(req);
  const [area, action] = String(permission || "").split(".");
  const permissions = current?.user?.permissions || [];
  const hasPermission = permissions.includes(permission) || action === "view" && permissions.includes(area);
  if (current?.role === "admin" || permission && current?.role === "staff" && hasPermission) return true;
  reply(res, current ? 403 : 401, { error: current ? "لا تملك صلاحية الوصول إلى هذا القسم." : "يلزم تسجيل الدخول." });
  return false;
}
function canGrantPermissions(req, permissions) {
  const current = session(req);
  return current?.role === "admin" || current?.role === "staff" &&
    permissions.every((permission) => current.user.permissions.includes(permission));
}
function logActivity(action, target, actor = "مدير النظام") {
  data.activity.unshift({ id: crypto.randomUUID(), action, target, actor, createdAt: new Date().toISOString() });
  data.activity = data.activity.slice(0, 500);
}
function upsertPatient(appointment) {
  let patient = data.patients.find((item) => item.phone === appointment.phone);
  if (!patient) {
    patient = { id: crypto.randomUUID(), name: appointment.name, phone: appointment.phone, email: appointment.email || "", visits: 0, status: "active", notes: "", createdAt: new Date().toISOString() };
    data.patients.unshift(patient);
  }
  patient.name = appointment.name || patient.name;
  patient.email = appointment.email || patient.email;
  patient.visits = Number(patient.visits || 0) + 1;
  patient.lastAppointment = appointment.date;
  return patient;
}
function body(req, maxBytes = 1_000_000) {
  return new Promise((resolve, reject) => {
    let text = "";
    req.on("data", (part) => {
      text += part;
      if (text.length > maxBytes) { reject(new Error("حجم الطلب كبير.")); req.destroy(); }
    });
    req.on("end", () => { try { resolve(text ? JSON.parse(text) : {}); } catch { reject(new Error("بيانات JSON غير صالحة.")); } });
    req.on("error", reject);
  });
}
function minutes(value) {
  if (!/^\d{2}:\d{2}$/.test(value || "")) return NaN;
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}
function timeFromMinutes(value) {
  return `${String(Math.floor(value / 60) % 24).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}
function normalizedPhone(value) {
  const phone = String(value || "").replace(/\D/g, "");
  return phone.startsWith("00") ? phone.slice(2) : phone;
}
function passwordHash(password, salt = crypto.randomBytes(16).toString("hex")) {
  return `${salt}:${crypto.scryptSync(password, salt, 64).toString("hex")}`;
}
function passwordMatches(password, saved) {
  const [salt, hex] = String(saved).split(":");
  if (!salt || !/^[a-f\d]{128}$/i.test(hex || "")) return false;
  const actual = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hex, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
function setSession(res, role, user = null) {
  const token = crypto.randomBytes(32).toString("hex");
  const maxAge = role === "user" ? 7 * 86400000 : 8 * 60 * 60 * 1000;
  const expiresAt = Date.now() + maxAge;
  storeSession(crypto.createHash("sha256").update(token).digest("hex"), role, user, expiresAt);
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `sinan_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${Math.floor(maxAge / 1000)}${secure}`);
}

function loginLimitKey(req) {
  return crypto.createHash("sha256").update(req.socket.remoteAddress || "unknown").digest("hex");
}

function refreshData() {
  data = { ...defaults, ...loadState(defaults) };
  data.settings = { ...defaults.settings, ...data.settings };
  data.services ||= defaults.services;
  data.appointments ||= [];
  data.users ||= [];
  data.gallery ||= [];
  for (const key of ["doctors", "patients", "pages", "posts", "testimonials", "faqs", "messages", "categories", "tags", "staff", "roles", "activity", "notifications", "backups"]) data[key] ||= [];
  dataSnapshot = structuredClone(data);
}

function emailServiceConfigured() {
  if (!RESEND_API_KEY || !MAIL_FROM || /[\r\n]/.test(MAIL_FROM) || !APP_BASE_URL) return false;
  try {
    const base = new URL(APP_BASE_URL);
    return process.env.NODE_ENV === "production" ? base.protocol === "https:" : ["http:", "https:"].includes(base.protocol);
  } catch {
    return false;
  }
}

async function sendEmail(to, subject, text, html) {
  const endpoint = process.env.NODE_ENV === "test" && process.env.RESEND_API_URL
    ? process.env.RESEND_API_URL
    : "https://api.resend.com/emails";
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ from: MAIL_FROM, to: [to], subject, text, html })
  });
  if (!response.ok) throw new Error(`Resend rejected the email (${response.status}).`);
}

async function sendAccountToken(account, purpose) {
  if (!emailServiceConfigured()) throw new Error("خدمة البريد غير مهيأة.");
  const token = crypto.randomBytes(32).toString("base64url");
  const accountId = String(account.id || account.email);
  const purposeKey = purpose === "verify_email" ? "verify" : "reset";
  const url = new URL(`${APP_BASE_URL}/`);
  url.searchParams.set(purposeKey, token);
  const verification = purpose === "verify_email";
  const subject = verification ? "تأكيد بريدك الإلكتروني — سِنان" : "رابط إعادة تعيين كلمة المرور — سِنان";
  const instruction = verification
    ? "اضغط الرابط أدناه لتأكيد بريدك الإلكتروني."
    : "اضغط الرابط أدناه لإعادة تعيين كلمة المرور. ينتهي الرابط خلال 30 دقيقة.";
  const html = `<p dir="rtl">${instruction}</p><p dir="rtl"><a href="${url.href}">${verification ? "تأكيد البريد الإلكتروني" : "إعادة تعيين كلمة المرور"}</a></p><p dir="rtl">إذا لم تطلب هذا الإجراء، فتجاهل الرسالة.</p>`;
  const text = `${instruction}\n${url.href}\nإذا لم تطلب هذا الإجراء، فتجاهل الرسالة.`;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  createEmailToken(tokenHash, accountId, purpose, Date.now() + (verification ? 24 : 0.5) * 60 * 60 * 1000);
  try {
    await sendEmail(account.email, subject, text, html);
  } catch (error) {
    deleteEmailTokens(accountId, purpose);
    throw error;
  }
}

function consumeAccountToken(token, purpose, action) {
  if (!/^[A-Za-z0-9_-]{32,128}$/.test(String(token || ""))) return false;
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const transaction = consumeEmailToken(defaults, tokenHash, purpose, Date.now(), action);
  if (!transaction) return false;
  data = transaction.data;
  dataSnapshot = structuredClone(data);
  return transaction.result;
}

function recoveryLimitKey(req, purpose) {
  return crypto.createHash("sha256").update(`${purpose}:${req.socket.remoteAddress || "unknown"}`).digest("hex");
}

function consumeRequestLimit(req, purpose, limit = 5) {
  const key = recoveryLimitKey(req, purpose);
  const now = Date.now();
  const retryAfter = getLoginLimit(key, now);
  if (retryAfter) return retryAfter;
  const result = recordFailedLogin(key, now, LOGIN_WINDOW_MS, limit, LOGIN_LOCKOUT_MS);
  return result.allowed ? 0 : result.retryAfter;
}

function initializeAdministrator() {
  const configured = Boolean(ADMIN_EMAIL || ADMIN_PASSWORD);
  if (!configured) {
    if (process.env.NODE_ENV === "production") throw new Error("Configure ADMIN_EMAIL and a strong ADMIN_PASSWORD before production startup.");
    console.warn("Admin login is disabled until ADMIN_EMAIL and a strong ADMIN_PASSWORD are configured.");
    return;
  }
  if (!/^\S+@\S+\.\S+$/.test(ADMIN_EMAIL) || ADMIN_PASSWORD.length < 12) {
    throw new Error("ADMIN_EMAIL must be valid and ADMIN_PASSWORD must contain at least 12 characters.");
  }

  if (data.users.some((user) => user.email.toLowerCase() === ADMIN_EMAIL)) {
    throw new Error("Configured ADMIN_EMAIL already belongs to a customer account.");
  }
  const existing = data.staff.find((user) => user.email.toLowerCase() === ADMIN_EMAIL);
  if (existing && !existing.isSuperAdmin) {
    throw new Error("Configured ADMIN_EMAIL belongs to a non-administrator account.");
  }

  if (existing) {
    existing.passwordHash = passwordHash(ADMIN_PASSWORD, existing.passwordHash.split(":")[0]);
    existing.disabled = false;
    existing.isSuperAdmin = true;
    existing.role = "Super Admin";
    existing.permissions = ["appointments", "patients", "doctors", "services", "media", "appearance", "users", "reports", "settings", "content"];
    saveData();
    return;
  }
  data.staff.push({
    id: crypto.randomUUID(),
    name: "مدير النظام",
    email: ADMIN_EMAIL,
    role: "Super Admin",
    permissions: ["appointments", "patients", "doctors", "services", "media", "appearance", "users", "reports", "settings", "content"],
    disabled: false,
    isSuperAdmin: true,
    passwordHash: passwordHash(ADMIN_PASSWORD),
    createdAt: new Date().toISOString()
  });
  saveData();
}

function storeUpload(input, allowedTypes, maxBytes) {
  const mimeType = String(input.mimeType || "").toLowerCase();
  const encoded = String(input.content || "");
  if (!allowedTypes.includes(mimeType) || !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) throw new Error("صيغة الملف غير مدعومة.");
  const buffer = Buffer.from(encoded, "base64");
  if (!buffer.length || buffer.length > maxBytes) throw new Error("حجم الملف يتجاوز الحد المسموح.");
  const signatures = {
    "image/jpeg": buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
    "image/png": buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    "image/webp": buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP",
    "image/gif": buffer.toString("ascii", 0, 3) === "GIF",
    "image/x-icon": buffer.length > 8 && buffer[0] === 0 && buffer[1] === 0 && buffer[2] === 1 && buffer[3] === 0,
    "image/vnd.microsoft.icon": buffer.length > 8 && buffer[0] === 0 && buffer[1] === 0 && buffer[2] === 1 && buffer[3] === 0,
    "video/mp4": buffer.length > 12 && buffer.toString("ascii", 4, 8) === "ftyp",
    "video/webm": buffer.length > 4 && buffer.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3])),
    "application/pdf": buffer.toString("ascii", 0, 5) === "%PDF-"
  };
  if (!signatures[mimeType]) throw new Error("محتوى الملف لا يطابق نوعه.");
  const extensions = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif", "image/x-icon": "ico", "image/vnd.microsoft.icon": "ico", "video/mp4": "mp4", "video/webm": "webm", "application/pdf": "pdf" };
  const filename = `${crypto.randomUUID()}.${extensions[mimeType]}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, filename), buffer, { flag: "wx" });
  return { filename, url: `/uploads/${filename}`, mimeType, size: buffer.length };
}

async function api(req, res, pathname) {
  refreshData();
  const method = req.method;
  if (method === "GET" && pathname === "/api/state") {
    return reply(res, 200, { settings: data.settings, services: data.services, gallery: data.gallery, bookedSlots: data.appointments.filter((item) => item.status !== "cancelled").map(({ date, time, duration, serviceId }) => ({ date, time, duration, serviceId })) });
  }
  if (method === "GET" && pathname === "/api/public/content") {
    return reply(res, 200, {
      doctors: data.doctors.filter((item) => item.status !== "hidden").map(({ id, name, specialty, description, experience, imageUrl }) => ({ id, name, specialty, description, experience, imageUrl })),
      testimonials: data.testimonials.filter((item) => item.status === "published").map(({ id, name, quote, rating }) => ({ id, name, quote, rating })),
      faqs: data.faqs.filter((item) => item.status === "published").map(({ id, question, answer, category }) => ({ id, question, answer, category })),
      pages: data.pages.filter((item) => item.status === "published").map(({ id, title, slug }) => ({ id, title, slug })),
      posts: data.posts.filter((item) => item.status === "published").map(({ id, title, slug, excerpt, heroImage }) => ({ id, title, slug, excerpt, heroImage }))
    });
  }
  if (method === "GET" && pathname.startsWith("/api/public/pages/")) {
    const slug = decodeURIComponent(pathname.slice("/api/public/pages/".length));
    const page = data.pages.find((item) => item.slug === slug && item.status === "published");
    return page ? reply(res, 200, { page: { title: page.title, content: page.content, heroImage: page.heroImage, sections: page.sections || [], seoTitle: page.seoTitle, seoDescription: page.seoDescription } }) : reply(res, 404, { error: "الصفحة غير موجودة أو غير منشورة." });
  }
  if (method === "GET" && pathname.startsWith("/api/public/posts/")) {
    const slug = decodeURIComponent(pathname.slice("/api/public/posts/".length));
    const post = data.posts.find((item) => item.slug === slug && item.status === "published");
    return post ? reply(res, 200, { post: { title: post.title, content: post.content, excerpt: post.excerpt, heroImage: post.heroImage, seoTitle: post.seoTitle } }) : reply(res, 404, { error: "المقال غير موجود أو غير منشور." });
  }
  if (method === "GET" && pathname === "/api/auth/me") {
    const current = session(req);
    return reply(res, 200, { role: current?.role || null, user: current?.user || null });
  }
  if (method === "POST" && pathname === "/api/auth/logout") {
    const token = parseCookies(req).sinan_session;
    if (/^[a-f\d]{64}$/i.test(token || "")) {
      deleteSession(crypto.createHash("sha256").update(token).digest("hex"));
    }
    const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
    return reply(res, 200, { ok: true }, { "Set-Cookie": `sinan_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secure}` });
  }
  if (method === "POST" && pathname === "/api/auth/password-reset") {
    if (!emailServiceConfigured()) return reply(res, 503, { error: "خدمة البريد الإلكتروني غير مهيأة بعد." });
    const retryAfter = consumeRequestLimit(req, "password-reset");
    if (retryAfter) return reply(res, 429, { error: "طلبات كثيرة. حاول لاحقًا." }, { "Retry-After": String(retryAfter) });
    const input = await body(req);
    const email = String(input.email || "").trim().toLowerCase();
    if (email.length <= 160) {
      const account = findAccountByEmail(email);
      if (account?.__accountType === "user") {
        try {
          await sendAccountToken(account, "reset_password");
        } catch (error) {
          console.error("Password-reset email delivery failed:", error.message);
          return reply(res, 503, { error: "تعذر إرسال البريد الآن. حاول لاحقًا." });
        }
      }
    }
    return reply(res, 200, { message: "إذا كان البريد مسجلًا، فستصلك رسالة بخطوات إعادة التعيين." });
  }
  if (method === "POST" && pathname === "/api/auth/resend-verification") {
    if (!emailServiceConfigured()) return reply(res, 503, { error: "خدمة البريد الإلكتروني غير مهيأة بعد." });
    const retryAfter = consumeRequestLimit(req, "resend-verification");
    if (retryAfter) return reply(res, 429, { error: "طلبات كثيرة. حاول لاحقًا." }, { "Retry-After": String(retryAfter) });
    const input = await body(req);
    const email = String(input.email || "").trim().toLowerCase();
    if (email.length <= 160) {
      const account = findAccountByEmail(email);
      if (account?.__accountType === "user" && account.requiresVerification && !account.verified) {
        try {
          await sendAccountToken(account, "verify_email");
        } catch (error) {
          console.error("Verification email delivery failed:", error.message);
          return reply(res, 503, { error: "تعذر إرسال البريد الآن. حاول لاحقًا." });
        }
      }
    }
    return reply(res, 200, { message: "إذا كان الحساب بحاجة إلى تأكيد، فستصلك رسالة جديدة." });
  }
  if (method === "POST" && pathname === "/api/auth/verify-email") {
    const retryAfter = consumeRequestLimit(req, "verify-email");
    if (retryAfter) return reply(res, 429, { error: "طلبات كثيرة. حاول لاحقًا." }, { "Retry-After": String(retryAfter) });
    const input = await body(req);
    const verified = consumeAccountToken(input.token, "verify_email", (current, accountId) => {
      const account = current.users.find((user) => String(user.id || user.email) === accountId);
      if (!account) return false;
      account.verified = true;
      account.requiresVerification = false;
      return true;
    });
    return verified
      ? reply(res, 200, { ok: true, message: "تم تأكيد بريدك الإلكتروني. يمكنك تسجيل الدخول الآن." })
      : reply(res, 400, { error: "رابط التأكيد غير صالح أو منتهي الصلاحية." });
  }
  if (method === "POST" && pathname === "/api/auth/password-reset/confirm") {
    const retryAfter = consumeRequestLimit(req, "password-reset-confirm");
    if (retryAfter) return reply(res, 429, { error: "طلبات كثيرة. حاول لاحقًا." }, { "Retry-After": String(retryAfter) });
    const input = await body(req);
    const password = String(input.password || "");
    if (password.length < 12 || password.length > 1024 || password !== String(input.confirmPassword || "")) {
      return reply(res, 400, { error: "أدخل كلمة مرور جديدة قوية وأكدها بشكل مطابق." });
    }
    const savedHash = passwordHash(password);
    const reset = consumeAccountToken(input.token, "reset_password", (current, accountId) => {
      const account = current.users.find((user) => String(user.id || user.email) === accountId);
      if (!account) return false;
      account.passwordHash = savedHash;
      account.verified = true;
      account.requiresVerification = false;
      return true;
    });
    return reset
      ? reply(res, 200, { ok: true, message: "تم تحديث كلمة المرور. سجّل الدخول بالكلمة الجديدة." })
      : reply(res, 400, { error: "رابط إعادة التعيين غير صالح أو منتهي الصلاحية." });
  }
  if (method === "POST" && pathname === "/api/auth/login") {
    const input = await body(req);
    const email = String(input.email || "").trim().toLowerCase();
    const password = String(input.password || "");
    const limitKey = loginLimitKey(req);
    if (email.length > 160 || password.length > 1024) return reply(res, 400, { error: "بيانات الدخول غير صالحة." });
    const retryAfter = getLoginLimit(limitKey, Date.now());
    if (retryAfter) return reply(res, 429, { error: "محاولات تسجيل الدخول كثيرة. حاول لاحقًا." }, { "Retry-After": String(retryAfter) });
    const account = findAccountByEmail(email);
    if (ADMIN_EMAIL && account?.__accountType === "staff" && account.email.toLowerCase() === ADMIN_EMAIL &&
      account.isSuperAdmin && !account.disabled && passwordMatches(password, account.passwordHash)) {
      clearLoginAttempts(limitKey);
      const user = { id: account.id, name: account.name, email, role: "admin", permissions: account.permissions || [], avatarUrl: account.avatarUrl || "" };
      setSession(res, "admin", user);
      return reply(res, 200, { role: "admin", user });
    }
    if (account?.__accountType === "user" && !account.banned && passwordMatches(password, account.passwordHash)) {
      if (account.requiresVerification && !account.verified) {
        return reply(res, 403, { error: "أكد بريدك الإلكتروني قبل تسجيل الدخول، أو أعد إرسال رسالة التأكيد." });
      }
      clearLoginAttempts(limitKey);
      const user = { id: account.id, name: account.name, age: account.age, email: account.email, phone: account.phone, avatarUrl: account.avatarUrl || "", verified: Boolean(account.verified) };
      setSession(res, "user", user);
      return reply(res, 200, { role: "user", user });
    }
    if (account?.__accountType === "staff" && !account.disabled && !account.isSuperAdmin && passwordMatches(password, account.passwordHash)) {
      clearLoginAttempts(limitKey);
      const user = { id: account.id, name: account.name, email, role: account.role, permissions: rolePermissionsFor(account), avatarUrl: account.avatarUrl || "" };
      setSession(res, "staff", user);
      return reply(res, 200, { role: "staff", user });
    }
    const limit = recordFailedLogin(limitKey, Date.now(), LOGIN_WINDOW_MS, LOGIN_ATTEMPT_LIMIT, LOGIN_LOCKOUT_MS);
    if (!limit.allowed) {
      return reply(res, 429, { error: "محاولات تسجيل الدخول كثيرة. حاول لاحقًا." }, { "Retry-After": String(limit.retryAfter) });
    }
    return reply(res, 401, { error: "بيانات الدخول غير صحيحة أو أن الحساب موقوف." });
  }
  if (method === "POST" && pathname === "/api/auth/register") {
    if (!emailServiceConfigured()) return reply(res, 503, { error: "التسجيل يتطلب تهيئة خدمة البريد الإلكتروني أولًا." });
    const retryAfter = consumeRequestLimit(req, "register", 8);
    if (retryAfter) return reply(res, 429, { error: "طلبات إنشاء الحسابات كثيرة. حاول لاحقًا." }, { "Retry-After": String(retryAfter) });
    const input = await body(req);
    const name = String(input.name || "").trim();
    const email = String(input.email || "").trim().toLowerCase();
    const phone = String(input.phone || "").trim();
    const age = input.age === undefined || input.age === null || input.age === "" ? null : Number(input.age);
    const password = String(input.password || "");
    if (!name || name.length > 100 || !/^\S+@\S+\.\S+$/.test(email) || email.length > 160 ||
      normalizedPhone(phone).length < 8 || age !== null && (!Number.isFinite(age) || age < 1 || age > 120) ||
      password.length < 12 || password !== String(input.confirmPassword || "")) {
      return reply(res, 400, { error: "تحقق من الاسم والهاتف والبريد، واستخدم كلمة مرور قوية وأكدها." });
    }
    const account = {
      id: crypto.randomUUID(),
      name,
      age,
      email,
      phone: normalizedPhone(phone),
      banned: false,
      verified: false,
      requiresVerification: true,
      createdAt: new Date().toISOString(),
      passwordHash: passwordHash(password)
    };
    const conflict = transactData((current) => {
      if (current.staff.some((user) => user.email.toLowerCase() === email) ||
        current.users.some((user) => user.email.toLowerCase() === email || user.phone && normalizedPhone(user.phone) === account.phone)) {
        return true;
      }
      current.users.push(account);
      return false;
    });
    if (conflict) return reply(res, 409, { error: "يوجد حساب بهذا البريد الإلكتروني أو الهاتف بالفعل." });
    try {
      await sendAccountToken(account, "verify_email");
    } catch (error) {
      console.error("Verification email delivery failed:", error.message);
      return reply(res, 503, { error: "أُنشئ الحساب لكن تعذر إرسال رسالة التأكيد. استخدم خيار إعادة الإرسال." });
    }
    return reply(res, 201, {
      role: "user",
      verificationRequired: true,
      message: "أُنشئ الحساب. افتح رسالة التأكيد المرسلة إلى بريدك قبل تسجيل الدخول."
    });
  }
  if (method === "POST" && pathname === "/api/user/avatar") {
    const current = session(req);
    if (!current || !["user", "admin"].includes(current.role)) return reply(res, 401, { error: "سجّل الدخول لتغيير صورة الحساب." });
    const input = await body(req, 4 * 1024 * 1024);
    try {
      const upload = storeUpload(input, ["image/jpeg", "image/png", "image/webp"], 2 * 1024 * 1024);
      if (current.role === "admin") {
        data.settings.adminAvatarUrl = upload.url;
        saveData();
        current.user = { name: "مدير النظام", avatarUrl: upload.url };
        return reply(res, 200, { user: { name: "مدير النظام", avatarUrl: upload.url, role: "admin" } });
      }
      const member = data.users.find((user) => user.email === current.user.email);
      if (!member) return reply(res, 404, { error: "الحساب غير موجود." });
      member.avatarUrl = upload.url;
      saveData();
      current.user.avatarUrl = upload.url;
      return reply(res, 200, { user: current.user });
    } catch (error) { return reply(res, 400, { error: error.message }); }
  }
  if (method === "POST" && pathname === "/api/appointments") {
    const input = await body(req);
    const outcome = transactData((current) => {
      const service = current.services.find((item) => item.id === input.serviceId);
      const date = String(input.date || "");
      const time = String(input.time || "");
      const name = String(input.name || "").trim();
      const phone = String(input.phone || "").trim();
      const day = new Date(`${date}T12:00:00`);
      const now = new Date();
      const start = minutes(current.settings.openTime);
      const close = minutes(current.settings.closeTime);
      const at = minutes(time);
      const duration = Math.max(10, Number(service?.duration) || Number(current.settings.slotDuration));
      const isDate = /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(day.getTime()) && day >= new Date(new Date().setHours(0, 0, 0, 0));
      if (!service || service.status === "hidden" || !isDate || !/^\d{2}:\d{2}$/.test(time) || !name || name.length > 100 || normalizedPhone(phone).length < 8) {
        return { status: 400, body: { error: "بيانات الحجز غير مكتملة أو الخدمة غير متاحة." } };
      }
      if (!current.settings.workingDays.includes(day.getDay()) || at < start || at + duration > close || (at - start) % Number(current.settings.slotDuration) !== 0) {
        return { status: 400, body: { error: "هذا الموعد خارج أوقات العمل." } };
      }
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      if (date === today && at <= now.getHours() * 60 + now.getMinutes()) {
        return { status: 400, body: { error: "وقت الموعد المحدد قد مضى." } };
      }
      if (findAppointmentConflict(date, time, timeFromMinutes(at + duration))) {
        return { status: 409, body: { error: "يتعارض هذا الوقت مع حجز قائم. اختر وقتًا آخر." } };
      }
      const appointment = { id: crypto.randomUUID(), name, phone, age: String(input.age || "").slice(0, 3), email: String(input.email || "").trim().slice(0, 160), serviceId: service.id, serviceName: service.name, duration, date, time, status: "pending", createdAt: new Date().toISOString() };
      current.appointments.push(appointment);
      upsertPatient(appointment);
      current.notifications.unshift({ id: crypto.randomUUID(), type: "booking", title: "حجز جديد", detail: `${name} · ${service.name}`, createdAt: appointment.createdAt });
      logActivity("حجز جديد", `${name} · ${date} ${time}`, "مراجع الموقع");
      return { status: 201, body: { appointment } };
    });
    return reply(res, outcome.status, outcome.body);
  }
  if (pathname.startsWith("/api/admin/")) {
    if (!canAccess(req, res, permissionFor(pathname, method))) return;
    if (method === "GET" && pathname === "/api/admin/overview") {
      const today = new Date().toISOString().slice(0, 10);
      const patients = new Map();
      data.appointments.forEach((item) => patients.set(item.phone, item));
      const todaysAppointments = data.appointments.filter((item) => item.date === today).sort((a, b) => a.time.localeCompare(b.time));
      return reply(res, 200, {
        totalBookings: data.appointments.length,
        todayBookings: todaysAppointments.length,
        confirmedBookings: data.appointments.filter((item) => item.status === "confirmed").length,
        newBookings: data.appointments.filter((item) => ["pending", "new", "review"].includes(item.status)).length,
        patients: Math.max(patients.size, data.patients.length),
        doctors: data.doctors.length,
        services: data.services.length,
        revenue: data.appointments.filter((item) => ["completed", "arrived"].includes(item.status)).reduce((sum, item) => sum + (Number(item.price) || 0), 0),
        todaysAppointments,
        monthlyBookings: Array.from({ length: 12 }, (_, index) => {
          const date = new Date();
          date.setMonth(date.getMonth() - (11 - index), 1);
          const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
          return { month, count: data.appointments.filter((item) => item.date.startsWith(month)).length };
        })
      });
    }
    if (method === "GET" && pathname === "/api/admin/reports") {
      const period = new URL(req.url, "http://localhost").searchParams.get("period") || "month";
      const now = new Date();
      const from = new Date(now);
      if (period === "day") from.setDate(now.getDate() - 1);
      else if (period === "year") from.setFullYear(now.getFullYear() - 1);
      else from.setMonth(now.getMonth() - 1);
      const rows = data.appointments.filter((item) => new Date(`${item.date}T23:59:59`) >= from);
      const byService = Object.values(rows.reduce((result, item) => {
        const name = item.serviceName || "غير محدد";
        result[name] ||= { name, count: 0, revenue: 0 };
        result[name].count += 1;
        result[name].revenue += Number(item.price) || 0;
        return result;
      }, {}));
      return reply(res, 200, { period, bookings: rows.length, completed: rows.filter((item) => item.status === "completed").length, revenue: rows.reduce((sum, item) => sum + (Number(item.price) || 0), 0), byService });
    }
    if (method === "GET" && pathname === "/api/admin/activity") return reply(res, 200, { activity: data.activity });
    if (method === "GET" && pathname === "/api/admin/notifications") {
      const recent = data.appointments.filter((item) => ["pending", "new"].includes(item.status)).slice(0, 8).map((item) => ({ id: `booking-${item.id}`, type: "booking", title: "حجز جديد", detail: `${item.name} · ${item.serviceName}`, createdAt: item.createdAt }));
      return reply(res, 200, { notifications: [...recent, ...data.notifications].slice(0, 30) });
    }
    if (method === "POST" && pathname === "/api/admin/backup") {
      if (!adminOnly(req, res)) return;
      const folder = path.join(DATA_DIR, "backups");
      fs.mkdirSync(folder, { recursive: true });
      const filename = `clinic-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
      fs.writeFileSync(path.join(folder, filename), JSON.stringify(data, null, 2), "utf8");
      data.backups.unshift({ filename, createdAt: new Date().toISOString(), size: fs.statSync(path.join(folder, filename)).size });
      saveData();
      return reply(res, 201, { backup: data.backups[0], backups: data.backups });
    }
    if (method === "GET" && pathname === "/api/admin/backups") {
      if (!adminOnly(req, res)) return;
      return reply(res, 200, { backups: data.backups });
    }
    if (method === "GET" && pathname === "/api/admin/export") {
      if (!adminOnly(req, res)) return;
      return reply(res, 200, { exportedAt: new Date().toISOString(), data });
    }
    const collectionMatch = pathname.match(/^\/api\/admin\/collections\/([a-z-]+)(?:\/([^/]+))?$/);
    if (collectionMatch) {
      const collectionKey = collectionMatch[1];
      const recordId = collectionMatch[2] ? decodeURIComponent(collectionMatch[2]) : "";
      const allowedCollections = new Set(["doctors", "patients", "pages", "posts", "testimonials", "faqs", "messages", "categories", "tags"]);
      if (!allowedCollections.has(collectionKey)) return reply(res, 404, { error: "نوع المحتوى غير موجود." });
      const collection = data[collectionKey];
      if (method === "GET" && !recordId) return reply(res, 200, { items: collection });
      if (method === "POST" && !recordId) {
        const input = await body(req);
        const item = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
        delete item.password;
        collection.unshift(item);
        logActivity("إضافة", `${collectionKey}: ${item.title || item.name || item.email || item.id}`, session(req)?.user?.name);
        saveData();
        return reply(res, 201, { item, items: collection });
      }
      if (method === "PATCH" && recordId) {
        const item = collection.find((record) => record.id === recordId);
        if (!item) return reply(res, 404, { error: "العنصر غير موجود." });
        const input = await body(req);
        Object.assign(item, input, { id: item.id, updatedAt: new Date().toISOString() });
        delete item.password;
        logActivity("تعديل", `${collectionKey}: ${item.title || item.name || item.id}`, session(req)?.user?.name);
        saveData();
        return reply(res, 200, { item });
      }
      if (method === "DELETE" && recordId) {
        const index = collection.findIndex((record) => record.id === recordId);
        if (index < 0) return reply(res, 404, { error: "العنصر غير موجود." });
        const [item] = collection.splice(index, 1);
        logActivity("حذف", `${collectionKey}: ${item.title || item.name || item.id}`, session(req)?.user?.name);
        saveData();
        return reply(res, 200, { ok: true });
      }
    }
    if (pathname === "/api/admin/users" && method === "GET") {
      const staff = data.staff.filter((employee) => !employee.isSuperAdmin).map((employee) => ({ id: employee.id, name: employee.name, email: employee.email, role: employee.role, permissions: rolePermissionsFor(employee), disabled: Boolean(employee.disabled), createdAt: employee.createdAt, type: "staff" }));
      const members = data.users.map(({ id, name, email, role, banned, verified, createdAt }) => ({ id, name, email, role: role || "member", permissions: [], disabled: Boolean(banned), verified: Boolean(verified), createdAt, type: "member" }));
      return reply(res, 200, { users: [...staff, ...members] });
    }
    if (pathname === "/api/admin/users" && method === "POST") {
      if (!canAccess(req, res, "users.view")) return;
      const input = await body(req);
      const email = String(input.email || "").trim().toLowerCase();
      const name = String(input.name || "").trim();
      const role = String(input.role || "Receptionist");
      const rolePermissions = {
        Admin: SUPER_ADMIN_PERMISSIONS,
        Doctor: ["appointments.view", "appointments.edit", "patients.view", "patients.edit"],
        Receptionist: ["appointments.view", "appointments.create", "appointments.edit", "patients.view", "patients.create", "patients.edit"],
        Editor: ["content.view", "content.create", "content.edit", "media.view", "media.upload", "appearance.view", "appearance.edit"]
      };
      const customRole = data.roles.find((item) => item.id === role || item.name === role);
      const permissions = Array.isArray(input.permissions) ? normalizePermissions(input.permissions) :
        customRole ? normalizePermissions(customRole.permissions) : rolePermissions[role];
      if (!name || name.length > 100 || email.length > 160 || !/^\S+@\S+\.\S+$/.test(email) ||
        String(input.password || "").length < 12 || !permissions || email === ADMIN_EMAIL ||
        !customRole && !rolePermissions[role] ||
        data.staff.some((user) => user.email.toLowerCase() === email) || data.users.some((user) => user.email.toLowerCase() === email)) {
        return reply(res, 400, { error: "تحقق من الاسم والبريد وكلمة المرور القوية والدور." });
      }
      if (!canGrantPermissions(req, permissions)) return reply(res, 403, { error: "لا يمكنك منح صلاحيات لا تملكها." });
      const employee = { id: crypto.randomUUID(), name, email, role, permissions, disabled: false, createdAt: new Date().toISOString(), passwordHash: passwordHash(input.password) };
      data.staff.push(employee);
      logActivity("إضافة مستخدم", `${name} (${role})`);
      saveData();
      return reply(res, 201, { user: { id: employee.id, name, email, role, permissions, disabled: false, type: "staff" } });
    }
    if (pathname === "/api/admin/roles" && method === "GET") return reply(res, 200, { roles: data.roles });
    if (pathname === "/api/admin/roles" && method === "POST") {
      if (!canAccess(req, res, "users.view")) return;
      const input = await body(req);
      const name = String(input.name || "").trim();
      const permissions = normalizePermissions(input.permissions);
      if (!name || name.length > 40 || !permissions.length) return reply(res, 400, { error: "أدخل اسم الدور وصلاحية واحدة على الأقل." });
      if (["Admin", "Doctor", "Receptionist", "Editor"].includes(name) ||
        data.roles.some((item) => item.name.toLowerCase() === name.toLowerCase())) {
        return reply(res, 409, { error: "اسم الدور مستخدم بالفعل." });
      }
      if (!canGrantPermissions(req, permissions)) return reply(res, 403, { error: "لا يمكنك منح صلاحيات لا تملكها." });
      const role = { id: crypto.randomUUID(), name, permissions };
      data.roles.push(role);
      saveData();
      return reply(res, 201, { role, roles: data.roles });
    }
    const userMatch = pathname.match(/^\/api\/admin\/users\/([^/]+)$/);
    if (userMatch && method === "PATCH") {
      const userId = decodeURIComponent(userMatch[1]);
      const employee = data.staff.find((user) => user.id === userId);
      if (!employee) return reply(res, 404, { error: "المستخدم غير موجود." });
      if (employee.isSuperAdmin) return reply(res, 403, { error: "لا يمكن تعديل مدير النظام الأعلى." });
      const input = await body(req);
      if (typeof input.password === "string" && input.password.length < 12) {
        return reply(res, 400, { error: "يجب ألا تقل كلمة المرور الجديدة عن 12 محرفًا." });
      }
      if (typeof input.role === "string") {
        const builtInRoles = ["Admin", "Doctor", "Receptionist", "Editor"];
        const assignedRole = data.roles.find((item) => item.id === input.role || item.name === input.role);
        const assignedPermissions = assignedRole ? normalizePermissions(assignedRole.permissions) : {
          Admin: SUPER_ADMIN_PERMISSIONS,
          Doctor: ["appointments.view", "appointments.edit", "patients.view", "patients.edit"],
          Receptionist: ["appointments.view", "appointments.create", "appointments.edit", "patients.view", "patients.create", "patients.edit"],
          Editor: ["content.view", "content.create", "content.edit", "media.view", "media.upload", "appearance.view", "appearance.edit"]
        }[input.role];
        if ((!assignedRole && !builtInRoles.includes(input.role)) || !canGrantPermissions(req, assignedPermissions || [])) {
          return reply(res, 403, { error: "لا يمكنك تعيين هذا الدور." });
        }
      }
      if (Array.isArray(input.permissions) && !canGrantPermissions(req, normalizePermissions(input.permissions))) {
        return reply(res, 403, { error: "لا يمكنك منح صلاحيات لا تملكها." });
      }
      if (typeof input.name === "string") employee.name = input.name.trim().slice(0, 100);
      if (typeof input.role === "string") employee.role = input.role.slice(0, 40);
      if (Array.isArray(input.permissions)) employee.permissions = normalizePermissions(input.permissions);
      if (typeof input.disabled === "boolean") employee.disabled = input.disabled;
      if (typeof input.password === "string") employee.passwordHash = passwordHash(input.password);
      if (employee.disabled) deleteSessionsForUser(userId);
      saveData();
      return reply(res, 200, { user: { id: employee.id, name: employee.name, email: employee.email, role: employee.role, permissions: employee.permissions, disabled: employee.disabled, type: "staff" } });
    }
    if (userMatch && method === "DELETE") {
      const userId = decodeURIComponent(userMatch[1]);
      if (data.staff.some((user) => user.id === userId && user.isSuperAdmin)) return reply(res, 403, { error: "لا يمكن حذف مدير النظام الأعلى." });
      data.staff = data.staff.filter((user) => user.id !== userId);
      deleteSessionsForUser(userId);
      saveData();
      return reply(res, 200, { ok: true });
    }
    if (method === "GET" && pathname === "/api/admin/members") {
      const members = data.users.map(({ id, name, age, email, banned, verified, createdAt }) => ({ id, name, age, email, banned: Boolean(banned), verified: Boolean(verified), createdAt }));
      return reply(res, 200, { members });
    }
    if (method === "PATCH" && pathname.startsWith("/api/admin/members/")) {
      const id = decodeURIComponent(pathname.split("/").pop());
      const member = data.users.find((user) => (user.id || user.email) === id);
      const input = await body(req);
      if (!member) return reply(res, 404, { error: "العضو غير موجود." });
      if (typeof input.banned === "boolean") member.banned = input.banned;
      if (typeof input.verified === "boolean") member.verified = input.verified;
      if (typeof input.banned !== "boolean" && typeof input.verified !== "boolean") return reply(res, 400, { error: "لا يوجد تغيير صالح." });
      if (member.banned) {
        deleteSessionsForUser(member.id || member.email);
      }
      saveData();
      return reply(res, 200, { member: { id: member.id || member.email, name: member.name, age: member.age, email: member.email, banned: Boolean(member.banned), verified: Boolean(member.verified), createdAt: member.createdAt } });
    }
    if (method === "DELETE" && pathname.startsWith("/api/admin/members/")) {
      const id = decodeURIComponent(pathname.split("/").pop());
      const member = data.users.find((user) => (user.id || user.email) === id);
      if (!member) return reply(res, 404, { error: "العضو غير موجود." });
      data.users = data.users.filter((user) => user !== member);
      deleteSessionsForUser(member.id || member.email);
      saveData();
      return reply(res, 200, { ok: true });
    }
    if (method === "POST" && pathname === "/api/admin/media") {
      const input = await body(req, MAX_UPLOAD_BODY);
      const kind = ["image", "video", "document"].includes(input.kind) ? input.kind : "";
      const allowed = kind === "image" ? ["image/jpeg", "image/png", "image/webp", "image/gif"] : kind === "video" ? ["video/mp4", "video/webm"] : ["application/pdf"];
      if (!kind) return reply(res, 400, { error: "اختر صورة أو فيديو مدعومًا." });
      try {
        const maxSize = kind === "image" ? 12 * 1024 * 1024 : kind === "video" ? MAX_UPLOAD_BYTES : 20 * 1024 * 1024;
        const upload = storeUpload(input, allowed, maxSize);
        const media = { id: crypto.randomUUID(), kind, title: String(input.title || "").trim().slice(0, 100), filename: upload.filename, url: upload.url, mimeType: upload.mimeType, size: upload.size, createdAt: new Date().toISOString() };
        data.gallery.unshift(media);
        saveData();
        return reply(res, 201, { media, gallery: data.gallery });
      } catch (error) { return reply(res, 400, { error: error.message }); }
    }
    if (method === "DELETE" && pathname.startsWith("/api/admin/media/")) {
      const id = decodeURIComponent(pathname.split("/").pop());
      const media = data.gallery.find((item) => item.id === id);
      if (!media) return reply(res, 404, { error: "عنصر المعرض غير موجود." });
      data.gallery = data.gallery.filter((item) => item !== media);
      const filename = path.join(UPLOAD_DIR, path.basename(media.filename));
      if (fs.existsSync(filename)) fs.unlinkSync(filename);
      saveData();
      return reply(res, 200, { gallery: data.gallery });
    }
    if (method === "POST" && /^\/api\/admin\/branding\/(logo|badge)$/.test(pathname)) {
      const input = await body(req, 4 * 1024 * 1024);
      const asset = pathname.split("/").pop();
      const allowed = asset === "logo" ? ["image/x-icon", "image/vnd.microsoft.icon", "image/png", "image/webp", "image/jpeg"] : ["image/png", "image/webp", "image/jpeg"];
      try {
        const upload = storeUpload(input, allowed, 2 * 1024 * 1024);
        const key = asset === "logo" ? "logoUrl" : "badgeUrl";
        data.settings[key] = upload.url;
        saveData();
        return reply(res, 200, { settings: data.settings });
      } catch (error) { return reply(res, 400, { error: error.message }); }
    }
    if (method === "DELETE" && /^\/api\/admin\/branding\/(logo|badge)$/.test(pathname)) {
      const asset = pathname.split("/").pop();
      const key = asset === "logo" ? "logoUrl" : "badgeUrl";
      data.settings[key] = "";
      saveData();
      return reply(res, 200, { settings: data.settings });
    }
    if (method === "POST" && pathname === "/api/admin/branding/verification") {
      const input = await body(req);
      if (typeof input.enabled !== "boolean") return reply(res, 400, { error: "حالة التوثيق غير صالحة." });
      data.settings.verified = input.enabled;
      saveData();
      return reply(res, 200, { settings: data.settings });
    }
    if (method === "GET" && pathname === "/api/admin/appointments") return reply(res, 200, { appointments: data.appointments });
    if (method === "POST" && pathname === "/api/admin/appointments") {
      const input = await body(req);
      const outcome = transactData((current) => {
        const service = current.services.find((item) => item.id === input.serviceId);
        const date = String(input.date || "");
        const time = String(input.time || "");
        const name = String(input.name || "").trim();
        const phone = String(input.phone || "").trim();
        const allowedStatuses = ["new", "pending", "review", "confirmed", "arrived", "completed", "cancelled", "no_show"];
        const status = String(input.status || "pending");
        const duration = Number(service?.duration);
        const start = minutes(time);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(new Date(`${date}T12:00:00`).getTime()) ||
          !/^\d{2}:\d{2}$/.test(time) || start < 0 || start >= 1440 || !name || name.length > 100 ||
          normalizedPhone(phone).length < 8 || !service || !Number.isFinite(duration) ||
          !allowedStatuses.includes(status)) {
          return { status: 400, body: { error: "بيانات الحجز غير مكتملة أو غير صالحة." } };
        }
        if (!["cancelled", "no_show"].includes(status) &&
          findAppointmentConflict(date, time, timeFromMinutes(start + duration))) {
          return { status: 409, body: { error: "هذا الوقت يتعارض مع موعد قائم." } };
        }
        const appointment = { id: crypto.randomUUID(), name, phone, email: String(input.email || "").slice(0, 160), serviceId: service.id, serviceName: service.name, doctorId: String(input.doctorId || ""), doctorName: current.doctors.find((doctor) => doctor.id === input.doctorId)?.name || "غير محدد", date, time, duration, price: Number(input.price) || Number(service.price) || 0, notes: String(input.notes || "").slice(0, 2000), status, createdAt: new Date().toISOString() };
        current.appointments.push(appointment);
        upsertPatient(appointment);
        current.notifications.unshift({ id: crypto.randomUUID(), type: "booking", title: "تمت إضافة حجز", detail: `${name} · ${date} ${time}`, createdAt: appointment.createdAt });
        logActivity("إضافة حجز", `${name} · ${date} ${time}`, session(req)?.user?.name);
        return { status: 201, body: { appointment } };
      });
      return reply(res, outcome.status, outcome.body);
    }
    if (method === "POST" && pathname === "/api/admin/appointments/bulk-delete") {
      const input = await body(req);
      const ids = new Set(Array.isArray(input.ids) ? input.ids.map(String) : []);
      const before = data.appointments.length;
      data.appointments = data.appointments.filter((item) => !ids.has(item.id));
      const deleted = before - data.appointments.length;
      logActivity("حذف حجوزات", `${deleted} حجز`, session(req)?.user?.name);
      saveData();
      return reply(res, 200, { deleted });
    }
    if (method === "GET" && pathname.startsWith("/api/admin/appointments/")) {
      const appointment = data.appointments.find((item) => item.id === decodeURIComponent(pathname.slice(24)));
      return appointment ? reply(res, 200, { appointment }) : reply(res, 404, { error: "الحجز غير موجود." });
    }
    if (method === "PATCH" && pathname.startsWith("/api/admin/appointments/")) {
      const input = await body(req);
      const appointmentId = decodeURIComponent(pathname.slice(24));
      const outcome = transactData((current) => {
        const item = current.appointments.find((appointment) => appointment.id === appointmentId);
        if (!item) return { status: 404, body: { error: "الحجز غير موجود." } };
        const allowedStatuses = ["new", "pending", "review", "confirmed", "arrived", "completed", "cancelled", "no_show"];
        if (input.status && !allowedStatuses.includes(input.status)) return { status: 400, body: { error: "حالة الحجز غير صالحة." } };
        const nextDate = String(input.date || item.date);
        const nextTime = String(input.time || item.time);
        const nextStart = minutes(nextTime);
        if (!/^\d{4}-\d{2}-\d{2}$/.test(nextDate) || Number.isNaN(new Date(`${nextDate}T12:00:00`).getTime()) ||
          !/^\d{2}:\d{2}$/.test(nextTime) || nextStart < 0 || nextStart >= 1440) {
          return { status: 400, body: { error: "التاريخ أو الوقت غير صالح." } };
        }
        const itemDuration = Number(item.duration) || Number(current.settings.slotDuration);
        const nextStatus = input.status || item.status;
        if (!["cancelled", "no_show"].includes(nextStatus) &&
          findAppointmentConflict(nextDate, nextTime, timeFromMinutes(nextStart + itemDuration), item.id)) {
          return { status: 409, body: { error: "الوقت الجديد يتعارض مع موعد آخر." } };
        }
        item.date = nextDate;
        item.time = nextTime;
        item.status = nextStatus;
        if (typeof input.doctorId === "string") {
          item.doctorId = input.doctorId;
          item.doctorName = current.doctors.find((doctor) => doctor.id === input.doctorId)?.name || "غير محدد";
        }
        if (typeof input.notes === "string") item.notes = input.notes.slice(0, 2000);
        if (input.price !== undefined && Number.isFinite(Number(input.price))) item.price = Number(input.price);
        logActivity("تحديث حجز", `${item.name} · ${item.date} ${item.time}`, session(req)?.user?.name);
        return { status: 200, body: { appointment: item } };
      });
      return reply(res, outcome.status, outcome.body);
    }
    if (method === "DELETE" && pathname === "/api/admin/appointments") {
      data.appointments = [];
      saveData();
      return reply(res, 200, { ok: true });
    }
    if (method === "DELETE" && pathname.startsWith("/api/admin/appointments/")) {
      const id = decodeURIComponent(pathname.slice(24));
      const previous = data.appointments.length;
      data.appointments = data.appointments.filter((item) => item.id !== id);
      if (previous === data.appointments.length) return reply(res, 404, { error: "الحجز غير موجود." });
      saveData();
      return reply(res, 200, { ok: true });
    }
    if (method === "POST" && pathname === "/api/admin/services") {
      const input = await body(req);
      const service = { id: String(input.id || crypto.randomUUID()), name: String(input.name || "").trim(), description: String(input.description || "").trim(), duration: Number(input.duration), price: String(input.price || "").trim(), icon: String(input.icon || "✳").slice(0, 4), imageUrl: String(input.imageUrl || "").slice(0, 500), category: String(input.category || "").slice(0, 60), doctorId: String(input.doctorId || ""), status: input.status === "hidden" ? "hidden" : "active" };
      if (!service.name || service.name.length > 60 || service.duration < 10 || service.duration > 240) return reply(res, 400, { error: "بيانات الخدمة غير صالحة." });
      const index = data.services.findIndex((item) => item.id === service.id);
      if (index < 0) data.services.push(service); else data.services[index] = service;
      saveData();
      return reply(res, 200, { services: data.services });
    }
    if (method === "DELETE" && pathname.startsWith("/api/admin/services/")) {
      const id = decodeURIComponent(pathname.slice(20));
      data.services = data.services.filter((item) => item.id !== id);
      saveData();
      return reply(res, 200, { services: data.services });
    }
    if (method === "GET" && pathname === "/api/admin/customization") return reply(res, 200, { settings: data.settings });
    if (method === "POST" && pathname === "/api/admin/customization") {
      const input = await body(req);
      const allowedFonts = ["IBM Plex Sans Arabic", "Cairo", "Tajawal", "Noto Kufi Arabic"];
      const colors = input.colors && typeof input.colors === "object" ? input.colors : data.settings.colors;
      for (const color of Object.values(colors)) if (typeof color !== "string" || !/^#[\da-fA-F]{6}$/.test(color)) return reply(res, 400, { error: "صيغة اللون غير صحيحة." });
      if (input.fontFamily && !allowedFonts.includes(input.fontFamily)) return reply(res, 400, { error: "الخط المختار غير مدعوم." });
      data.settings = {
        ...data.settings,
        siteDescription: String(input.siteDescription ?? data.settings.siteDescription).slice(0, 300),
        heroLead: String(input.heroLead ?? data.settings.heroLead).slice(0, 100),
        heroAccent: String(input.heroAccent ?? data.settings.heroAccent).slice(0, 100),
        heroDescription: String(input.heroDescription ?? data.settings.heroDescription).slice(0, 500),
        copy: input.copy && typeof input.copy === "object" ? Object.fromEntries(Object.entries(input.copy).map(([key, value]) => [key, String(value).slice(0, 1000)])) : data.settings.copy,
        clinicEmail: String(input.clinicEmail ?? data.settings.clinicEmail).slice(0, 160),
        phone: String(input.phone ?? data.settings.phone).slice(0, 40),
        address: String(input.address ?? data.settings.address).slice(0, 200),
        seoTitle: String(input.seoTitle ?? data.settings.seoTitle).slice(0, 100),
        seoDescription: String(input.seoDescription ?? data.settings.seoDescription).slice(0, 300),
        footerDescription: String(input.footerDescription ?? data.settings.footerDescription).slice(0, 240),
        socialLinks: input.socialLinks && typeof input.socialLinks === "object" ? input.socialLinks : data.settings.socialLinks,
        colors,
        sections: input.sections && typeof input.sections === "object" ? input.sections : data.settings.sections,
        fontFamily: input.fontFamily || data.settings.fontFamily,
        fontSize: Math.min(20, Math.max(12, Number(input.fontSize || data.settings.fontSize))),
        headingSize: Math.min(52, Math.max(24, Number(input.headingSize || data.settings.headingSize))),
        buttonSize: Math.min(18, Math.max(10, Number(input.buttonSize || data.settings.buttonSize)))
      };
      saveData();
      logActivity("تخصيص الموقع", "ألوان وخطوط ومعلومات الموقع", session(req)?.user?.name);
      return reply(res, 200, { settings: data.settings });
    }
    if (method === "POST" && pathname === "/api/admin/settings") {
      const input = await body(req);
      const open = minutes(input.openTime);
      const close = minutes(input.closeTime);
      const days = Array.isArray(input.workingDays) ? [...new Set(input.workingDays.map(Number))] : [];
      const interval = Number(input.slotDuration);
      if (!String(input.clinicName || "").trim() || open >= close || normalizedPhone(input.whatsapp).length < 10 || interval < 10 || interval > 120 || !days.length || days.some((day) => day < 0 || day > 6)) return reply(res, 400, { error: "تحقق من بيانات العيادة وأوقات العمل." });
      data.settings = { ...data.settings, clinicName: String(input.clinicName).trim().slice(0, 60), doctorName: String(input.doctorName || "فريق العيادة").trim().slice(0, 60), whatsapp: String(input.whatsapp).trim().slice(0, 30), openTime: input.openTime, closeTime: input.closeTime, slotDuration: interval, workingDays: days };
      saveData();
      return reply(res, 200, { settings: data.settings });
    }
  }
  return reply(res, 404, { error: "المسار غير موجود." });
}

const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8", ".png": "image/png", ".jpg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml", ".mp4": "video/mp4", ".webm": "video/webm", ".ico": "image/x-icon", ".pdf": "application/pdf" };
initializeAdministrator();
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    if (url.pathname.startsWith("/api/")) {
      if (!["GET", "HEAD", "OPTIONS"].includes(req.method) && req.headers.origin) {
        let origin;
        try { origin = new URL(req.headers.origin); }
        catch { return reply(res, 403, { error: "مصدر الطلب غير مسموح." }); }
        const hostOrigin = new URL(`http://${req.headers.host || "localhost"}`);
        const forwardedProtocol = String(req.headers["x-forwarded-proto"] || "http").split(",")[0].trim().toLowerCase();
        const secureOrigin = forwardedProtocol === "https";
        if (origin.host !== hostOrigin.host || origin.protocol !== (secureOrigin ? "https:" : "http:")) {
          return reply(res, 403, { error: "مصدر الطلب غير مسموح." });
        }
      }
      return await api(req, res, url.pathname);
    }
    if (req.method !== "GET" && req.method !== "HEAD") return reply(res, 405, { error: "الطريقة غير مدعومة." });
    const requested = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
    const filename = path.resolve(ROOT, `.${requested}`);
    const relativePath = path.relative(ROOT, filename);
    const firstSegment = relativePath.split(path.sep)[0];
    const protectedFiles = new Set(["server.js", "database.js", "package.json", "package-lock.json"]);
    if (!filename.startsWith(`${ROOT}${path.sep}`) || firstSegment.startsWith(".") || firstSegment === "data" ||
      protectedFiles.has(relativePath.toLowerCase()) || firstSegment === "test") {
      return reply(res, 404, { error: "الملف غير موجود." });
    }
    fs.readFile(filename, (error, content) => {
      if (error) return reply(res, 404, { error: "الملف غير موجود." });
      res.writeHead(200, { ...SECURITY_HEADERS, "Content-Type": types[path.extname(filename)] || "application/octet-stream", "Cache-Control": "no-cache" });
      res.end(req.method === "HEAD" ? undefined : content);
    });
  } catch (error) {
    console.error("Request failed:", error);
    if (!res.headersSent) {
      const invalidRequest = error.message === "بيانات JSON غير صالحة." || error.message === "حجم الطلب كبير.";
      reply(res, invalidRequest ? 400 : 500, { error: invalidRequest ? error.message : "حدث خطأ داخلي في الخادم." });
    }
  }
});
server.listen(PORT, HOST, () => {
  console.log(`Sinan is available at http://localhost:${PORT}`);
  if (ADMIN_EMAIL) console.log("Administrator account is configured from the environment.");
});
