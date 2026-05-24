// Lightweight input validation helpers

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidDate(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return false;
  const d = new Date(dateStr);
  return !isNaN(d.getTime());
}

export function sanitizeString(str, maxLen = 500) {
  if (typeof str !== "string") return "";
  return str.trim().slice(0, maxLen);
}

export function isValidPassword(password) {
  return typeof password === "string" && password.length >= 6;
}
