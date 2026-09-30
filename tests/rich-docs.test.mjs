import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('rich project documents keep a single validated project record and autosave controls',()=>{
  const source=readFileSync(new URL('../public/app.mjs',import.meta.url),'utf8');
  assert.match(source,/blocks:\[\{id:'rich-content',type:'paragraph',text:html\}\]/);
  assert.match(source,/Shared with project members/);
  assert.match(source,/richSaveDocument\(true\)/);
  assert.match(source,/\['http:','https:','mailto:'\]/);
});
