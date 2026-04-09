---
id: W013
topic: R2 endpoint must not include bucket name — causes doubled path
tags: [cloudflare, r2, fonts, infrastructure]
scope: global
severity: high
---

# W013: R2 endpoint must not include bucket name

## What Happened

Font uploads via `npx visor fonts add` succeeded (exit 0, "✓ Uploaded" messages) but files landed at the wrong path in R2: `visor-fonts/visor-fonts/low-orbit-studio/...` instead of `visor-fonts/low-orbit-studio/...`. The CDN returned 404 for all font URLs.

## Root Cause

`VISOR_R2_ENDPOINT` in Bitwarden SM (secret ID `8e1af3d7-f91f-42e9-820d-b420016de661`) had the bucket name appended: `https://<account>.r2.cloudflarestorage.com/visor-fonts`.

The AWS S3 SDK constructs the path as `{endpoint}/{bucket}/{key}` in path-style mode. With the bucket name already in the endpoint, this becomes `…/visor-fonts/visor-fonts/low-orbit-studio/…`.

## The Fix

`VISOR_R2_ENDPOINT` must be the bare account endpoint **without** the bucket name:
```
https://<account-id>.r2.cloudflarestorage.com
```

Update Bitwarden SM secret `8e1af3d7-f91f-42e9-820d-b420016de661` to remove `/visor-fonts` from the end.

## Recovery

To move files from the wrong path to the correct path, use boto3 with the corrected endpoint directly:

```python
import boto3

s3 = boto3.client("s3",
    endpoint_url="https://<account>.r2.cloudflarestorage.com",  # no bucket
    aws_access_key_id=..., aws_secret_access_key=..., region_name="auto")

result = s3.list_objects_v2(Bucket="visor-fonts", Prefix="visor-fonts/")
for obj in result.get("Contents", []):
    wrong_key = obj["Key"]
    correct_key = wrong_key[len("visor-fonts/"):]
    s3.copy_object(Bucket="visor-fonts", CopySource={"Bucket": "visor-fonts", "Key": wrong_key}, Key=correct_key)
    s3.delete_object(Bucket="visor-fonts", Key=wrong_key)
```

## When This Applies

Any time you configure `VISOR_R2_ENDPOINT`. The comment in `.env.schema` already says "e.g. https://xxxx.r2.cloudflarestorage.com" — follow that pattern exactly, no path suffix.
