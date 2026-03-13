export const ALLOWED_EMAIL_DOMAIN = "brandeis.edu";
export const CAMPUS_EMAIL_ERROR_MESSAGE =
  "Please enter a valid Brandeis email address ending in @brandeis.edu.";

const BRANDEIS_EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@brandeis\.edu$/;

export const normalizeEmail = (email: string) => String(email || "").trim().toLowerCase();

export const isValidCampusEmail = (email: string): boolean => {
  const normalizedEmail = normalizeEmail(email);
  return BRANDEIS_EMAIL_REGEX.test(normalizedEmail);
};
