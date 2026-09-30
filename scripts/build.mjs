import {execFileSync} from 'node:child_process';
import {readdirSync} from 'node:fs';

for (const file of ['public/app.mjs','public/domain.mjs','api/index.js']) {
  execFileSync(process.execPath,['--check',file],{stdio:'inherit'});
}
console.log('Orbit rich-document build checks passed.');
