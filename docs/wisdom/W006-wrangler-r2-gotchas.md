---
id: W006
topic: Wrangler R2 CLI defaults to local simulator
tags: [cloudflare, r2, wrangler, infrastructure]
scope: global
severity: high
---

# W006: Wrangler R2 CLI defaults to local simulator

## What Happened

Uploaded 40 font files to R2 via `wrangler r2 object put` — all reported "Upload complete" but the bucket remained empty. Wrangler defaulted to a local R2 simulator instead of the remote bucket.

## Root Cause

`wrangler r2 object put` and `get` default to `--local` mode. The output says "Resource location: local" but it's easy to miss in a loop of 40 uploads that all say "Upload complete."

## The Fix

Always pass `--remote` for real R2 operations:
```bash
wrangler r2 object put "bucket/key" --file "./file" --remote
wrangler r2 object get "bucket/key" --file "./output" --remote
```

## Additional Wrangler R2 Gotchas

### CORS config format differs between dashboard and CLI
- **Dashboard** shows PascalCase flat arrays: `AllowedOrigins`, `AllowedMethods`
- **Wrangler CLI** expects nested camelCase with `rules` wrapper:
  ```json
  {
    "rules": [{
      "allowed": {
        "origins": ["*"],
        "methods": ["GET"],
        "headers": ["*"]
      }
    }]
  }
  ```

### No object list command
Wrangler has no `r2 object list` subcommand. Use the Cloudflare dashboard or S3-compatible API to list bucket contents.

## When This Applies

Any time you're using `wrangler r2 object` commands for bucket operations. Bucket-level commands (`create`, `cors`) don't have this issue — they always operate remotely.
