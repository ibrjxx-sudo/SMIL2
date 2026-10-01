const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const DATA_FILE = path.join(DATA_DIR, "clinic.json");
const UPLOAD_DIR = path.join(ROOT, "uploads");
const MAX_UPLOAD_BYTES = 80 * 1024 * 1024;
const MAX_UPLOAD_BODY = 112 * 1024 * 1024;
const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "ibr.jx@gmail.com").toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "1199";
const sessions = new Map();
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

fs.mkdirSync(DATA_DIR, { recursive: true });
fs.mkdirSync(UPLOAD_DIR, { recursive: true });
let data;
try { data = { ...defaults, ...JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) }; }
catch { data = structuredClone(defaults); }
data.settings = { ...defaults.settings, ...data.settings };
data.services ||= defaults.services;
data.appointments ||= [];
data.users ||= [];
data.gallery ||= [];
for (const key of ["doctors", "patients", "pages", "posts", "testimonials", "faqs", "messages", "categories", "tags", "staff", "roles", "activity", "notifications", "backups"]) data[key] ||= [];

function saveData() {
  const temporary = `${DATA_FILE}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(data, null, 2), "utf8");
  fs.renameSync(temporary, DATA_FILE);
}
if (!fs.existsSync(DATA_FILE)) saveData();
function reply(res, status, body, headers = {}) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers });
  res.end(JSON.stringify(body));
}
function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || "").split(";").map((part) => part.trim().split(/=(.*)/s).slice(0, 2)).filter(([key, value]) => key && value !== undefined));
}
function session(req) {
  const token = parseCookies(req).sinan_session;
  const current = sessions.get(token);
  if (!current || current.expires <= Date.now()) return null;
  if (current.role === "user") {
    const account = data.users.find((user) => user.email === current.user.email);
    if (!account || account.banned) {
      sessions.delete(token);
      return null;
    }
    current.user = { name: account.name, age: account.age, email: account.email, avatarUrl: account.avatarUrl || "", verified: Boolean(account.verified) };
  }
  if (current.role === "staff") {
    const employee = data.staff.find((user) => user.id === current.user.id);
    if (!employee || employee.disabled) {
      sessions.delete(token);
      return null;
    }
    current.user = { id: employee.id, name: employee.name, email: employee.email, role: employee.role, permissions: employee.permissions || [], avatarUrl: employee.avatarUrl || "" };
  }
  return current;
}
function adminOnly(req, res) {
  if (session(req)?.role === "admin") return true;
  reply(res, 401, { error: "يلزم تسجيل دخول الإدارة." });
  return false;
}
function permissionFor(pathname) {
  if (/overview/.test(pathname)) return "appointments";
  if (/appointments|calendar|bookings/.test(pathname)) return "appointments";
  if (/patients/.test(pathname)) return "patients";
  if (/doctors/.test(pathname)) return "doctors";
  if (/services/.test(pathname)) return "services";
  if (/media/.test(pathname)) return "media";
  if (/branding|customization/.test(pathname)) return "appearance";
  if (/members|users|roles/.test(pathname)) return "users";
  if (/reports|overview/.test(pathname)) return "reports";
  if (/settings|backup|export|activity|notifications/.test(pathname)) return "settings";
  if (/collections/.test(pathname)) return "content";
  return "settings";
}
function canAccess(req, res, permission) {
  const current = session(req);
  if (current?.role === "admin" || current?.role === "staff" && current.user.permissions.includes(permission)) return true;
  reply(res, 403, { error: "لا تملك صلاحية الوصول إلى هذا القسم." });
  return false;
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
function normalizedPhone(value) {
  const phone = String(value || "").replace(/\D/g, "");
  return phone.startsWith("00") ? phone.slice(2) : phone;
}
function passwordHash(password, salt = crypto.randomBytes(16).toString("hex")) {
  return `${salt}:${crypto.scryptSync(password, salt, 64).toString("hex")}`;
}
function passwordMatches(password, saved) {
  const [salt, hex] = String(saved).split(":");
  if (!salt || !hex) return false;
  const actual = crypto.scryptSync(password, salt, 64);
  const expected = Buffer.from(hex, "hex");
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}
function setSession(res, role, user = null) {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, { role, user, expires: Date.now() + 7 * 86400000 });
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  res.setHeader("Set-Cookie", `sinan_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800${secure}`);
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
    sessions.delete(parseCookies(req).sinan_session);
    return reply(res, 200, { ok: true }, { "Set-Cookie": "sinan_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0" });
  }
  if (method === "POST" && pathname === "/api/auth/login") {
    const input = await body(req);
    const email = String(input.email || "").trim().toLowerCase();
    const password = String(input.password || "");
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      setSession(res, "admin");
      return reply(res, 200, { role: "admin" });
    }
    const account = data.users.find((user) => user.email === email);
    if (account && !account.banned && passwordMatches(password, account.passwordHash)) {
      const user = { name: account.name, age: account.age, email: account.email, avatarUrl: account.avatarUrl || "", verified: Boolean(account.verified) };
      setSession(res, "user", user);
      return reply(res, 200, { role: "user", user });
    }
    const employee = data.staff.find((user) => user.email === email);
    if (employee && !employee.disabled && passwordMatches(password, employee.passwordHash)) {
      const user = { id: employee.id, name: employee.name, email, role: employee.role, permissions: employee.permissions || [], avatarUrl: employee.avatarUrl || "" };
      setSession(res, "staff", user);
      return reply(res, 200, { role: "staff", user });
    }
    return reply(res, 401, { error: "بيانات الدخول غير صحيحة أو أن الحساب موقوف." });
  }
  if (method === "POST" && pathname === "/api/auth/register") {
    const input = await body(req);
    const name = String(input.name || "").trim();
    const email = String(input.email || "").trim().toLowerCase();
    const age = Number(input.age);
    const password = String(input.password || "");
    if (!name || name.length > 100 || !/^\S+@\S+\.\S+$/.test(email) || age < 1 || age > 120 || password.length < 4) return reply(res, 400, { error: "يرجى إدخال الاسم والعمر والبريد وكلمة المرور بشكل صحيح." });
    if (email === ADMIN_EMAIL || data.users.some((user) => user.email === email)) return reply(res, 409, { error: "يوجد حساب بهذا البريد الإلكتروني بالفعل." });
    const user = { name, age, email };
    data.users.push({ id: crypto.randomUUID(), ...user, banned: false, verified: false, createdAt: new Date().toISOString(), passwordHash: passwordHash(password) });
    saveData();
    setSession(res, "user", user);
    return reply(res, 201, { role: "user", user });
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
    const service = data.services.find((item) => item.id === input.serviceId);
    const date = String(input.date || "");
    const time = String(input.time || "");
    const name = String(input.name || "").trim();
    const phone = String(input.phone || "").trim();
    const day = new Date(`${date}T12:00:00`);
    const now = new Date();
    const start = minutes(data.settings.openTime);
    const close = minutes(data.settings.closeTime);
    const at = minutes(time);
    const duration = Math.max(10, Number(service?.duration) || Number(data.settings.slotDuration));
    const isDate = /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(day.getTime()) && day >= new Date(new Date().setHours(0, 0, 0, 0));
    if (!service || service.status === "hidden" || !isDate || !/^\d{2}:\d{2}$/.test(time) || !name || name.length > 100 || normalizedPhone(phone).length < 8) return reply(res, 400, { error: "بيانات الحجز غير مكتملة أو الخدمة غير متاحة." });
    if (!data.settings.workingDays.includes(day.getDay()) || at < start || at + duration > close || (at - start) % Number(data.settings.slotDuration) !== 0) return reply(res, 400, { error: "هذا الموعد خارج أوقات العمل." });
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    if (date === today && at <= now.getHours() * 60 + now.getMinutes()) return reply(res, 400, { error: "وقت الموعد المحدد قد مضى." });
    const overlapsBooking = data.appointments.some((item) => {
      if (item.date !== date || item.status === "cancelled") return false;
      const bookedStart = minutes(item.time);
      const bookedService = data.services.find((entry) => entry.id === item.serviceId);
      const bookedDuration = Number(item.duration) || Number(bookedService?.duration) || Number(data.settings.slotDuration);
      return at < bookedStart + bookedDuration && at + duration > bookedStart;
    });
    if (overlapsBooking) return reply(res, 409, { error: "يتعارض هذا الوقت مع حجز قائم. اختر وقتًا آخر." });
    const appointment = { id: crypto.randomUUID(), name, phone, age: String(input.age || "").slice(0, 3), email: String(input.email || "").trim().slice(0, 160), serviceId: service.id, serviceName: service.name, duration, date, time, status: "pending", createdAt: new Date().toISOString() };
    data.appointments.push(appointment);
    upsertPatient(appointment);
    data.notifications.unshift({ id: crypto.randomUUID(), type: "booking", title: "حجز جديد", detail: `${name} · ${service.name}`, createdAt: appointment.createdAt });
    logActivity("حجز جديد", `${name} · ${date} ${time}`, "مراجع الموقع");
    saveData();
    return reply(res, 201, { appointment });
  }
  if (pathname.startsWith("/api/admin/")) {
    if (!canAccess(req, res, permissionFor(pathname))) return;
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
      const staff = data.staff.map(({ id, name, email, role, permissions, disabled, createdAt }) => ({ id, name, email, role, permissions, disabled: Boolean(disabled), createdAt, type: "staff" }));
      const members = data.users.map(({ id, name, email, role, banned, verified, createdAt }) => ({ id, name, email, role: role || "member", permissions: [], disabled: Boolean(banned), verified: Boolean(verified), createdAt, type: "member" }));
      return reply(res, 200, { users: [...staff, ...members] });
    }
    if (pathname === "/api/admin/users" && method === "POST") {
      if (!adminOnly(req, res)) return;
      const input = await body(req);
      const email = String(input.email || "").trim().toLowerCase();
      const name = String(input.name || "").trim();
      const role = String(input.role || "Receptionist");
      const rolePermissions = { Admin: ["appointments", "patients", "doctors", "services", "media", "appearance", "users", "reports", "settings", "content"], Doctor: ["appointments", "patients"], Receptionist: ["appointments", "patients"], Editor: ["content", "media", "appearance"] };
      const permissions = Array.isArray(input.permissions) ? input.permissions.filter((item) => ["appointments", "patients", "doctors", "services", "media", "appearance", "users", "reports", "settings", "content"].includes(item)) : rolePermissions[role];
      if (!name || !/^\S+@\S+\.\S+$/.test(email) || String(input.password || "").length < 8 || !permissions || email === ADMIN_EMAIL || data.staff.some((user) => user.email === email) || data.users.some((user) => user.email === email)) return reply(res, 400, { error: "تحقق من الاسم والبريد وكلمة المرور والدور." });
      const employee = { id: crypto.randomUUID(), name, email, role, permissions, disabled: false, createdAt: new Date().toISOString(), passwordHash: passwordHash(input.password) };
      data.staff.push(employee);
      logActivity("إضافة مستخدم", `${name} (${role})`);
      saveData();
      return reply(res, 201, { user: { id: employee.id, name, email, role, permissions, disabled: false, type: "staff" } });
    }
    if (pathname === "/api/admin/roles" && method === "GET") return reply(res, 200, { roles: data.roles });
    if (pathname === "/api/admin/roles" && method === "POST") {
      if (!adminOnly(req, res)) return;
      const input = await body(req);
      const name = String(input.name || "").trim();
      const permissions = Array.isArray(input.permissions) ? input.permissions.filter((item) => ["appointments", "patients", "doctors", "services", "media", "appearance", "users", "reports", "settings", "content"].includes(item)) : [];
      if (!name || !permissions.length) return reply(res, 400, { error: "أدخل اسم الدور وصلاحية واحدة على الأقل." });
      const role = { id: crypto.randomUUID(), name, permissions };
      data.roles.push(role);
      saveData();
      return reply(res, 201, { role, roles: data.roles });
    }
    const userMatch = pathname.match(/^\/api\/admin\/users\/([^/]+)$/);
    if (userMatch && method === "PATCH") {
      if (!adminOnly(req, res)) return;
      const userId = decodeURIComponent(userMatch[1]);
      const employee = data.staff.find((user) => user.id === userId);
      if (!employee) return reply(res, 404, { error: "المستخدم غير موجود." });
      const input = await body(req);
      if (typeof input.name === "string") employee.name = input.name.trim().slice(0, 100);
      if (typeof input.role === "string") employee.role = input.role.slice(0, 40);
      if (Array.isArray(input.permissions)) employee.permissions = input.permissions.filter((item) => ["appointments", "patients", "doctors", "services", "media", "appearance", "users", "reports", "settings", "content"].includes(item));
      if (typeof input.disabled === "boolean") employee.disabled = input.disabled;
      if (typeof input.password === "string" && input.password.length >= 8) employee.passwordHash = passwordHash(input.password);
      if (employee.disabled) for (const [token, current] of sessions) if (current.role === "staff" && current.user.id === userId) sessions.delete(token);
      saveData();
      return reply(res, 200, { user: { id: employee.id, name: employee.name, email: employee.email, role: employee.role, permissions: employee.permissions, disabled: employee.disabled, type: "staff" } });
    }
    if (userMatch && method === "DELETE") {
      if (!adminOnly(req, res)) return;
      const userId = decodeURIComponent(userMatch[1]);
      data.staff = data.staff.filter((user) => user.id !== userId);
      for (const [token, current] of sessions) if (current.role === "staff" && current.user.id === userId) sessions.delete(token);
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
        for (const [token, current] of sessions) if (current.role === "user" && current.user.email === member.email) sessions.delete(token);
      }
      saveData();
      return reply(res, 200, { member: { id: member.id || member.email, name: member.name, age: member.age, email: member.email, banned: Boolean(member.banned), verified: Boolean(member.verified), createdAt: member.createdAt } });
    }
    if (method === "DELETE" && pathname.startsWith("/api/admin/members/")) {
      const id = decodeURIComponent(pathname.split("/").pop());
      const member = data.users.find((user) => (user.id || user.email) === id);
      if (!member) return reply(res, 404, { error: "العضو غير موجود." });
      data.users = data.users.filter((user) => user !== member);
      for (const [token, current] of sessions) if (current.role === "user" && current.user.email === member.email) sessions.delete(token);
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
      const service = data.services.find((item) => item.id === input.serviceId);
      const date = String(input.date || "");
      const time = String(input.time || "");
      const name = String(input.name || "").trim();
      const phone = String(input.phone || "").trim();
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time) || !name || normalizedPhone(phone).length < 8 || !service) return reply(res, 400, { error: "بيانات الحجز غير مكتملة." });
      if (data.appointments.some((item) => item.date === date && item.time === time && !["cancelled", "no_show"].includes(item.status))) return reply(res, 409, { error: "هذا الموعد محجوز بالفعل." });
      const appointment = { id: crypto.randomUUID(), name, phone, email: String(input.email || ""), serviceId: service.id, serviceName: service.name, doctorId: String(input.doctorId || ""), doctorName: data.doctors.find((doctor) => doctor.id === input.doctorId)?.name || "غير محدد", date, time, duration: Number(service.duration), price: Number(input.price) || Number(service.price) || 0, notes: String(input.notes || ""), status: input.status || "pending", createdAt: new Date().toISOString() };
      data.appointments.push(appointment);
      upsertPatient(appointment);
      data.notifications.unshift({ id: crypto.randomUUID(), type: "booking", title: "تمت إضافة حجز", detail: `${name} · ${date} ${time}`, createdAt: appointment.createdAt });
      logActivity("إضافة حجز", `${name} · ${date} ${time}`, session(req)?.user?.name);
      saveData();
      return reply(res, 201, { appointment });
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
      const item = data.appointments.find((appointment) => appointment.id === decodeURIComponent(pathname.slice(24)));
      const input = await body(req);
      if (!item) return reply(res, 404, { error: "الحجز غير موجود." });
      const allowedStatuses = ["new", "pending", "review", "confirmed", "arrived", "completed", "cancelled", "no_show"];
      if (input.status && !allowedStatuses.includes(input.status)) return reply(res, 400, { error: "حالة الحجز غير صالحة." });
      if (input.status) item.status = input.status;
      const nextDate = String(input.date || item.date);
      const nextTime = String(input.time || item.time);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(nextDate) || !/^\d{2}:\d{2}$/.test(nextTime)) return reply(res, 400, { error: "التاريخ أو الوقت غير صالح." });
      const nextStart = minutes(nextTime);
      const itemDuration = Number(item.duration) || Number(data.settings.slotDuration);
      const conflict = data.appointments.some((other) => {
        if (other.id === item.id || other.date !== nextDate || ["cancelled", "no_show"].includes(other.status)) return false;
        const otherStart = minutes(other.time);
        const otherDuration = Number(other.duration) || Number(data.services.find((service) => service.id === other.serviceId)?.duration) || Number(data.settings.slotDuration);
        return nextStart < otherStart + otherDuration && nextStart + itemDuration > otherStart;
      });
      if (conflict) return reply(res, 409, { error: "الوقت الجديد يتعارض مع موعد آخر." });
      item.date = nextDate;
      item.time = nextTime;
      if (typeof input.doctorId === "string") {
        item.doctorId = input.doctorId;
        item.doctorName = data.doctors.find((doctor) => doctor.id === input.doctorId)?.name || "غير محدد";
      }
      if (typeof input.notes === "string") item.notes = input.notes.slice(0, 2000);
      if (input.price !== undefined && Number.isFinite(Number(input.price))) item.price = Number(input.price);
      logActivity("تحديث حجز", `${item.name} · ${item.date} ${item.time}`, session(req)?.user?.name);
      saveData();
      return reply(res, 200, { appointment: item });
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
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
    if (url.pathname.startsWith("/api/")) return await api(req, res, url.pathname);
    if (req.method !== "GET" && req.method !== "HEAD") return reply(res, 405, { error: "الطريقة غير مدعومة." });
    const requested = decodeURIComponent(url.pathname === "/" ? "/index.html" : url.pathname);
    const filename = path.resolve(ROOT, `.${requested}`);
    if (!filename.startsWith(`${ROOT}${path.sep}`) || filename.startsWith(`${DATA_DIR}${path.sep}`)) return reply(res, 404, { error: "الملف غير موجود." });
    fs.readFile(filename, (error, content) => {
      if (error) return reply(res, 404, { error: "الملف غير موجود." });
      res.writeHead(200, { "Content-Type": types[path.extname(filename)] || "application/octet-stream", "Cache-Control": "no-cache" });
      res.end(req.method === "HEAD" ? undefined : content);
    });
  } catch (error) {
    if (!res.headersSent) reply(res, error.message.includes("JSON") ? 400 : 500, { error: error.message || "حدث خطأ في الخادم." });
  }
});
server.listen(PORT, HOST, () => {
  console.log(`Sinan is available at http://localhost:${PORT}`);
  console.log("Set ADMIN_PASSWORD and NODE_ENV=production before public deployment.");
});
