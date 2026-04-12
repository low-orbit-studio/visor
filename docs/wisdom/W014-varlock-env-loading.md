# W014 — Varlock `.env.local` requires two-step bootstrap

**Tags:** varlock, env, bitwarden, infrastructure
**Severity:** Gotcha
**Discovered:** 2026-04-12

## Lesson

`varlock load` resolves secrets from Bitwarden Secrets Manager but the **pretty output (default) does not write to `.env.local`**. The `--format env` / `-f env` flag outputs raw `KEY=value` lines to stdout, which must be captured and written to `.env.local` manually.

**Critical gotcha:** `BITWARDEN_ACCESS_TOKEN` must already exist in `.env.local` before `varlock load` can resolve other secrets. If you redirect stdout to `.env.local` (truncating it), the token is destroyed and all Bitwarden lookups fail.

## Correct procedure

```bash
# 1. Ensure BITWARDEN_ACCESS_TOKEN is in .env.local (varlock load without redirect will populate it)
npx varlock load

# 2. Export resolved values to a temp file, THEN overwrite .env.local
npx varlock load -f env 2>/dev/null > /tmp/varlock_env.txt
cp /tmp/varlock_env.txt .env.local

# 3. Strip quotes — linear.py's simple parser includes them literally
sed -i '' 's/"//g' .env.local
```

## Anti-pattern

```bash
# WRONG — truncates .env.local before varlock can read BITWARDEN_ACCESS_TOKEN from it
npx varlock load -f env > .env.local
```

## Why

Varlock reads `.env.local` to get `BITWARDEN_ACCESS_TOKEN`, then uses it to resolve all other `bitwarden()` references in `.env.schema`. Redirecting stdout to the same file creates a race condition where the file is truncated before varlock reads it.

Additionally, `linear.py` uses a simple line parser (`line.startswith("LINEAR_API_KEY=")`) that doesn't strip quotes, so `"lin_api_..."` (with quotes) fails authentication.
