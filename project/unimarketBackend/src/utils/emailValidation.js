const ALLOWED_EMAIL_DOMAIN = "brandeis.edu";
const BRANDEIS_EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@brandeis\.edu$/;

const normalizeEmail = (value = "") => String(value || "").trim().toLowerCase();

const isValidCampusEmail = (value = "") => {
  const normalizedEmail = normalizeEmail(value);
  return BRANDEIS_EMAIL_REGEX.test(normalizedEmail);
};

module.exports = {
  ALLOWED_EMAIL_DOMAIN,
  normalizeEmail,
  isValidCampusEmail,
};
