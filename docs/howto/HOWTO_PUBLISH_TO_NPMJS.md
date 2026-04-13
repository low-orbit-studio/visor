# How to Publish Visor Packages to npm

Visor uses [Changesets](https://github.com/changesets/changesets) to manage versioning and publishing. There are two publishing paths: automated (via GitHub Actions on every push to `main`) and manual (for the first publish or emergency releases).

## Packages

| Package | npm name | Path |
|---------|----------|------|
| Tokens | `@loworbitstudio/visor-core` | `packages/tokens/` |
| CLI | `@loworbitstudio/visor` | `packages/cli/` |
| Theme Engine | `@loworbitstudio/visor-theme-engine` | `packages/theme-engine/` |

`@loworbitstudio/visor-docs` is private and never published.

---

## Automated Publishing (Normal Workflow)

The release workflow (`.github/workflows/release.yml`) runs on every push to `main`. It uses `changesets/action`, which does one of two things depending on whether there are pending changesets:

- **Pending changesets exist** → opens/updates a "Version Packages" PR that bumps versions and generates `CHANGELOG.md`
- **"Version Packages" PR is merged** → publishes any packages with versions not yet on npm

**You do not need to do anything manually** for routine releases. The flow is:

1. Make changes on a feature branch
2. Run `npm run changeset` and follow the prompts to describe your changes
3. Commit the generated `.changeset/*.md` file with your PR
4. Merge the PR to `main`
5. Changesets bot opens/updates the "Version Packages" PR
6. When ready to release, merge the "Version Packages" PR
7. GitHub Actions publishes to npm automatically

### Requirements

- `NPM_TOKEN` secret set in GitHub repo settings (Settings → Secrets → Actions)
- The token must be an **automation** type to bypass npm 2FA. Create one at [npmjs.com → Access Tokens → Generate New Token → Automation](https://www.npmjs.com/settings/~/tokens).

---

## Manual Publishing

Use this for the first publish or if GitHub Actions is unavailable.

### 1. Load secrets

```sh
cd ~/Code/visor
npx varlock load -f env 2>/dev/null > /tmp/varlock_env.txt
cp /tmp/varlock_env.txt .env.local
sed -i '' 's/"//g' .env.local
```

### 2. Configure npm auth

```sh
NPM_TOKEN=$(grep NPM_TOKEN .env.local | cut -d'=' -f2)
npm set //registry.npmjs.org/:_authToken=$NPM_TOKEN
```

### 3. Build all packages

```sh
npm run build
```

### 4. Publish

If your npm account has 2FA enabled, you need a one-time password:

```sh
NPM_CONFIG_OTP=<your-authenticator-code> npm run changeset:publish
```

Without 2FA (automation token set locally):

```sh
npm run changeset:publish
```

Changesets will detect which packages have versions not yet on npm and publish only those.

### 5. Verify

```sh
npm view @loworbitstudio/visor-core
npm view @loworbitstudio/visor
npm view @loworbitstudio/visor-theme-engine
```

---

## Troubleshooting

### `EOTP` error

npm 2FA is requiring a one-time password. Pass it via `NPM_CONFIG_OTP`:

```sh
NPM_CONFIG_OTP=123456 npm run changeset:publish
```

For CI, ensure `NPM_TOKEN` is an **automation** token (not a legacy token). Automation tokens bypass OTP.

### `E404` — package not found after publish

npm can take a few minutes to propagate. Wait 2–3 minutes and retry `npm view`.

### Package published but wrong version

Changesets only publishes packages whose `package.json` version is not yet on npm. If you need to re-publish the same version, you must first unpublish it (within 72 hours) via `npm unpublish @loworbitstudio/visor-core@0.3.0`.

### `registry-url` not set

If you see auth failures in CI, ensure the `setup-node` step in `.github/workflows/release.yml` has `registry-url: "https://registry.npmjs.org"` — this is required for `NODE_AUTH_TOKEN` to be picked up by npm.
