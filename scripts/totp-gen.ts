#!/usr/bin/env bun
/**
 * سكريبت توليد رمز TOTP لاختبار 2FA
 * الاستخدام: bun run scripts/totp-gen.ts <base32-secret>
 */
import * as OTPAuth from "otpauth";

const secret = process.argv[2];
if (!secret) {
  console.error("الاستخدام: bun run scripts/totp-gen.ts <base32-secret>");
  process.exit(1);
}

const totp = new OTPAuth.TOTP({
  issuer: "سيدي يوسف بن علي العاصمة",
  label: secret,
  algorithm: "SHA1",
  digits: 6,
  period: 30,
  secret: OTPAuth.Secret.fromBase32(secret),
});

const token = totp.generate();
const remainingSeconds = 30 - (Math.floor(Date.now() / 1000) % 30);

console.log("====================================================");
console.log("  مولّد رمز TOTP — اختبار 2FA");
console.log("====================================================");
console.log(`السر (base32): ${secret}`);
console.log(`الرمز الحالي:  ${token}`);
console.log(`صالح لـ:       ${remainingSeconds} ثانية`);
console.log("====================================================");
