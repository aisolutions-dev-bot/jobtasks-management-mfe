const fs = require('fs');
const path = require('path');

const pkg = require('../package.json');

const version = {
  version: pkg.version,
  commit: process.env.GIT_COMMIT_SHA || 'unknown',
  builtAt: new Date().toISOString(),
};

const outDir = path.join(__dirname, '..', 'public');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'version.json'), JSON.stringify(version, null, 2));
console.log('Wrote public/version.json:', version);
