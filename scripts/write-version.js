const fs = require('fs');
const path = require('path');

const pkg = require('../package.json');

async function resolveVersion() {
  const orgApiUrl = process.env.ORG_API_URL;
  if (!orgApiUrl) {
    console.warn('ORG_API_URL not set — falling back to package.json version for version.json');
    return pkg.version;
  }
  try {
    const base = orgApiUrl.replace(/\/api\/?$/, '');
    const res = await fetch(`${base}/api/system-parameters/version`, { signal: AbortSignal.timeout(5000) });
    if (!res.ok) {
      throw new Error(`org-api responded with ${res.status}`);
    }
    const body = await res.json();
    if (typeof body.versionNumber !== 'string' || !body.versionNumber) {
      throw new Error('org-api version response missing versionNumber');
    }
    return body.versionNumber;
  } catch (err) {
    console.warn(`Could not fetch live version from org-api (${err.message}) — falling back to package.json version`);
    return pkg.version;
  }
}

async function main() {
  const version = {
    version: await resolveVersion(),
    commit: process.env.GIT_COMMIT_SHA || 'unknown',
    builtAt: new Date().toISOString(),
  };

  const outDir = path.join(__dirname, '..', 'public');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'version.json'), JSON.stringify(version, null, 2));
  console.log('Wrote public/version.json:', version);
}

main();
