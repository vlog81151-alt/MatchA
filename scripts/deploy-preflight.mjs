const target = process.argv[2] ?? "all";

const checks = {
  admin: [
    ["NEXT_PUBLIC_API_URL", "Admin API base URL, for example https://api.matcha.example/api"]
  ],
  backend: [
    ["ADMIN_ORIGIN", "Admin app origin, for example https://admin.matcha.example"],
    ["COOKIE_SECRET", "Long random secret used to sign cookies", 24],
    ["DATABASE_URL", "PostgreSQL connection string"],
    ["JWT_ACCESS_SECRET", "Long random access-token signing secret", 24],
    ["JWT_REFRESH_SECRET", "Long random refresh-token signing secret", 24],
    ["WEB_ORIGIN", "Consumer web origin, for example https://matcha.example"]
  ],
  web: [
    ["NEXT_PUBLIC_API_URL", "Consumer API base URL, for example https://api.matcha.example/api"],
    ["NEXT_PUBLIC_APP_URL", "Consumer app origin, for example https://matcha.example"]
  ]
};

const optionalProviderKeys = [
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "CLOUDINARY_CLOUD_NAME",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "FIREBASE_PROJECT_ID",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "SMTP_HOST",
  "SMTP_PASS",
  "SMTP_USER"
];

function selectedTargets() {
  if (target === "all") {
    return Object.keys(checks);
  }

  if (!Object.hasOwn(checks, target)) {
    throw new Error(`Unknown preflight target "${target}". Use one of: all, backend, web, admin.`);
  }

  return [target];
}

function isPlaceholder(value) {
  return /replace-with|change-before-production|localhost|matcha\.local/i.test(value);
}

function validateRequired(name, description, minLength) {
  const value = process.env[name]?.trim();

  if (!value) {
    return `${name} is missing. ${description}.`;
  }

  if (minLength && value.length < minLength) {
    return `${name} must be at least ${minLength} characters.`;
  }

  if (process.env.NODE_ENV === "production" && isPlaceholder(value)) {
    return `${name} still looks like a local or placeholder value.`;
  }

  return null;
}

const failures = [];
const warnings = [];

for (const item of selectedTargets()) {
  for (const [name, description, minLength] of checks[item]) {
    const failure = validateRequired(name, description, minLength);

    if (failure) {
      failures.push(`[${item}] ${failure}`);
    }
  }
}

if (target === "backend" || target === "all") {
  for (const name of optionalProviderKeys) {
    if (!process.env[name]?.trim()) {
      warnings.push(`[backend] ${name} is not set; related provider features stay disabled.`);
    }
  }
}

if (failures.length > 0) {
  console.error("MatchA deployment preflight failed:");
  failures.forEach((failure) => console.error(`- ${failure}`));

  if (warnings.length > 0) {
    console.error("");
    warnings.forEach((warning) => console.error(`Warning: ${warning}`));
  }

  process.exit(1);
}

console.log(`MatchA deployment preflight passed for ${selectedTargets().join(", ")}.`);

if (warnings.length > 0) {
  warnings.forEach((warning) => console.warn(`Warning: ${warning}`));
}
