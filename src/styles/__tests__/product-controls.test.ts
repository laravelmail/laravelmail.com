import {readFileSync} from 'node:fs';
import {describe,it,expect} from 'vitest';
const css=readFileSync(new URL('../marketing.css',import.meta.url),'utf8');
const layout=readFileSync(new URL('../../layouts/Layout.astro',import.meta.url),'utf8');
describe('dark default and equal product controls',()=>{
 it('keeps the existing dark default independent of OS preference',()=>{
  expect(layout).toContain('class="dark"');expect(css).toContain('html{color-scheme:dark}');
 });
 it('uses the same desktop and mobile sizes as the app workspace',()=>{
  for(const token of ['--control-height:40px','--control-height:44px','--control-radius:9px','width:144px','--control-font:13px','--control-weight:500'])expect(css).toContain(token);
  expect(css).toContain('.lm-actions>.lm-button {flex:0 0 144px;}');
  expect(css).toContain('.lm-button.lm-header-cta {display:none;}');
 });
});

describe('hydrated template controls',()=>{it('keeps search usable and adjacent pagination equal',()=>{
 const browser=readFileSync(new URL('../../components/templates/TemplateBrowser.tsx',import.meta.url),'utf8');
 expect(browser).toContain('lm-template-filters');expect(browser.match(/data-lm-action="true"/g)).toHaveLength(4);
 expect(css).toContain('grid-template-columns:minmax(220px,1fr)');expect(css).toContain('[data-lm-action="true"]');
});});

it('applies shared geometry to validation actions and inputs',()=>{expect(css).toContain('.lm-validation-workbench button {box-sizing:border-box;');expect(css).toContain('.lm-validation-workbench input:not([type=checkbox]):not([type=radio])');});
