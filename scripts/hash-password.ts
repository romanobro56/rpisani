// Usage: npm run hash-password -- 'your password'
// Prints a value for the ADMIN_PASSWORD_HASH environment variable.
import { randomBytes, scryptSync } from "node:crypto";

const password = process.argv[2];
if (!password || password.length < 12) {
  console.error("Pass a password of at least 12 characters: npm run hash-password -- 'your password'");
  process.exit(1);
}
const salt = randomBytes(16);
const hash = scryptSync(password, salt, 32);
console.log(`scrypt:${salt.toString("base64")}:${hash.toString("base64")}`);
