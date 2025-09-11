import fs from 'fs';
const manifestJson = require('./dist/manifest.json');
const updateUrl = 'https://raw.githubusercontent.com/GodKratos/temporary-containers/beta-updates/updates.json';
manifestJson.applications.gecko.update_url = updateUrl;

fs.writeFileSync('./dist/manifest.json', JSON.stringify(manifestJson, null, 2) + '\n');
