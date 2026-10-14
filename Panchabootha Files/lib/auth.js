// Minimal auth: username + password hashed in a JSON file, opaque session
// tokens in an in-memory Map. No DB, no library. Matches the in-memory room
// store — registered accounts survive a restart, live sessions and games do not.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";

const g = globalThis;
const DATA_DIR = join(process.cwd(), "data");
const USERS_FILE = join(DATA_DIR, "users.json");

/** token -> { userId, name, guest } */
export const sessions = (g.__panchaSessions ??= new Map());

function loadUsers() {
  try {
    return JSON.parse(readFileSync(USERS_FILE, "utf8"));
  } catch {
    return {};
  }
}

function saveUsers(users) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  return { salt, hash: scryptSync(password, salt, 64).toString("hex") };
}

function verifyPassword(password, salt, hash) {
  const candidate = scryptSync(password, salt, 64);
  const known = Buffer.from(hash, "hex");
  return candidate.length === known.length && timingSafeEqual(candidate, known);
}

function validName(name) {
  return typeof name === "string" && /^[A-Za-z0-9_ -]{2,20}$/.test(name.trim());
}

export function registerUser(name, password) {
  name = String(name || "").trim();
  if (!validName(name)) return { error: "Name must be 2–20 letters, digits, space, _ or -." };
  if (typeof password !== "string" || password.length < 6) {
    return { error: "Password must be at least 6 characters." };
  }
  const users = loadUsers();
  const key = name.toLowerCase();
  if (users[key]) return { error: "That name is taken." };
  const { salt, hash } = hashPassword(password);
  const user = { id: `u_${randomBytes(6).toString("hex")}`, name, salt, hash, createdAt: Date.now() };
  users[key] = user;
  saveUsers(users);
  return { user: { id: user.id, name: user.name, guest: false } };
}

export function loginUser(name, password) {
  const users = loadUsers();
  const rec = users[String(name || "").trim().toLowerCase()];
  if (!rec || !verifyPassword(String(password || ""), rec.salt, rec.hash)) {
    return { error: "Wrong name or password." };
  }
  return { user: { id: rec.id, name: rec.name, guest: false } };
}

export function guestUser(name) {
  name = String(name || "").trim() || "Guest";
  if (!validName(name)) return { error: "Name must be 2–20 letters, digits, space, _ or -." };
  return { user: { id: `g_${randomBytes(6).toString("hex")}`, name, guest: true } };
}

export function createSession(user) {
  const token = randomBytes(24).toString("hex");
  sessions.set(token, { userId: user.id, name: user.name, guest: !!user.guest });
  return token;
}

export function sessionUser(token) {
  if (!token) return null;
  const s = sessions.get(token);
  return s ? { id: s.userId, name: s.name, guest: s.guest } : null;
}

export function destroySession(token) {
  if (token) sessions.delete(token);
}

export const SESSION_COOKIE = "pancha_sid";
