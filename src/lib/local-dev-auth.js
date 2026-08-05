import "server-only";

const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1", "::1"]);

const emptyAddress = {
  firstName: "Local",
  lastName: "Developer",
  company: "Maya Herbs",
  street: "",
  neighborhood: "",
  city: "",
  state: "",
  zip: "",
  country: "",
};

export function isLocalDevRequest(request) {
  if (process.env.NODE_ENV === "production") return false;

  try {
    return LOCAL_HOSTNAMES.has(new URL(request.url).hostname);
  } catch {
    return false;
  }
}

export function isLocalDevLoginConfigured() {
  return (
    process.env.LOCAL_DEV_LOGIN_ENABLED === "true" &&
    Boolean(process.env.LOCAL_DEV_LOGIN_EMAIL) &&
    Boolean(process.env.LOCAL_DEV_LOGIN_PASSWORD)
  );
}

export function isLocalDevAutoLoginConfigured() {
  return (
    process.env.LOCAL_DEV_AUTO_LOGIN === "true" &&
    isLocalDevLoginConfigured()
  );
}

export function matchesLocalDevCredentials(email, password) {
  if (!isLocalDevLoginConfigured()) return false;

  return (
    email === process.env.LOCAL_DEV_LOGIN_EMAIL.trim().toLowerCase() &&
    password === process.env.LOCAL_DEV_LOGIN_PASSWORD
  );
}

export function isLocalDevSession(session) {
  return (
    isLocalDevLoginConfigured() &&
    session?.localDev === true &&
    session.email === process.env.LOCAL_DEV_LOGIN_EMAIL.trim().toLowerCase()
  );
}

export function getLocalDevUser() {
  const email = process.env.LOCAL_DEV_LOGIN_EMAIL.trim().toLowerCase();

  return {
    firstName: "Local",
    lastName: "Developer",
    displayName: "Local Developer",
    email,
    company: "Maya Herbs",
    phone: "",
    country: "",
    accountId: "MAYA-LOCAL-DEV",
    wcCustomerId: null,
    role: "wholesale_customer",
    status: "ACTIVE",
    discountRate: 0,
    avatar: null,
    isAdmin: false,
    shippingAddress: { ...emptyAddress },
    billingAddress: { ...emptyAddress },
  };
}
