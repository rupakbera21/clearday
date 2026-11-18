import fs from "node:fs";

if (fs.existsSync(".env.local")) {
  process.loadEnvFile(".env.local");
}

const results = {
  gemini: "SKIP",
  groq: "SKIP",
  upstash: "SKIP",
  openMeteo: "SKIP",
};

async function checkOpenMeteo() {
  try {
    const res = await fetch(
      "https://air-quality-api.open-meteo.com/v1/air-quality?latitude=28.61&longitude=77.20&current=pm2_5,pm10,european_aqi,us_aqi&timezone=auto",
    );
    results.openMeteo = res.ok ? "PASS" : `FAIL (${res.status})`;
  } catch (err) {
    results.openMeteo = `FAIL (${err.name || "Error"})`;
  }
}

async function checkGemini() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    results.gemini = "SKIP (no key)";
    return;
  }
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
    );
    results.gemini = res.ok ? "PASS" : `FAIL (${res.status})`;
  } catch (err) {
    results.gemini = `FAIL (${err.name || "Error"})`;
  }
}

async function checkGroq() {
  const key = process.env.GROQ_API_KEY;
  if (!key) {
    results.groq = "SKIP (no key)";
    return;
  }
  try {
    const res = await fetch("https://api.groq.com/openai/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
    });
    results.groq = res.ok ? "PASS" : `FAIL (${res.status})`;
  } catch (err) {
    results.groq = `FAIL (${err.name || "Error"})`;
  }
}

async function checkUpstash() {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    results.upstash = "SKIP (no credentials)";
    return;
  }
  try {
    const res = await fetch(`${url}/ping`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    results.upstash = res.ok ? "PASS" : `FAIL (${res.status})`;
  } catch (err) {
    results.upstash = `FAIL (${err.name || "Error"})`;
  }
}

async function run() {
  await Promise.allSettled([
    checkOpenMeteo(),
    checkGemini(),
    checkGroq(),
    checkUpstash(),
  ]);

  console.log("=== Smoke Test Results ===");
  console.log(`Open-Meteo: ${results.openMeteo}`);
  console.log(`Gemini:     ${results.gemini}`);
  console.log(`Groq:       ${results.groq}`);
  console.log(`Upstash:    ${results.upstash}`);
  console.log("==========================");
}

run();
