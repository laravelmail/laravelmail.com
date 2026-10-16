import {describe,it,expect} from 'vitest';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {resolve} from 'node:path';
import {calendlyUrl,calendlyEmbedUrl,DEFAULT_CALENDLY_URL} from '../../config/booking';
const source=(p:string)=>readFileSync(resolve(process.cwd(),p),'utf8');
describe('marketing redesign guardrails',()=>{
 it('uses the existing Calendly event and rejects non-Calendly embeds',()=>{
  expect(calendlyUrl()).toBe(DEFAULT_CALENDLY_URL);
  expect(calendlyUrl('https://calendly.com/laravelagency/30min')).toBe(DEFAULT_CALENDLY_URL);
  for(const bad of ['javascript:alert(1)','http://calendly.com/test','https://calendly.com.attacker.test/test','https://name:pass@calendly.com/test']) expect(calendlyUrl(bad)).toBe(DEFAULT_CALENDLY_URL);
  expect(new URL(calendlyEmbedUrl()).searchParams.get('embed_type')).toBe('Inline');
  expect(new URL(calendlyEmbedUrl()).searchParams.get('hide_gdpr_banner')).toBe('0');
 });
 it('removes root and localized Pricing pages and nav links',()=>{
  expect(existsSync('src/pages/pricing.astro')).toBe(false);
  expect(existsSync('src/pages/[lang]/pricing.astro')).toBe(false);
  expect(source('src/components/Header.astro')).not.toContain('/pricing');
  expect(source('src/components/Footer.astro')).not.toContain('/pricing');
 });
 it('keeps retired Pricing routes from falling through to SEO routes',()=>{
  const middleware=source('src/middleware.ts');
  expect(middleware).toContain('status: 404');
  expect(middleware).toContain("context.rewrite('/404')");
 });
 it('keeps the dark mode contract and content visible without scroll observers',()=>{
  expect(source('src/layouts/Layout.astro')).toContain('<html lang={lang} class="dark">');
  expect(source('src/styles/marketing.css')).toContain('.js .animate-on-scroll,.js .animate-on-scroll.animated{opacity:1!important');
 });
 it('uses static product images and one shared booking component',()=>{
  for(const locale of ['', '[lang]/']){
   expect(source(`src/pages/${locale}product.astro`)).toContain('src="/screens/dashboard.png"');
   expect(source(`src/pages/${locale}product.astro`)).not.toContain('<Image');
   expect(source(`src/pages/${locale}demo.astro`)).toContain('<Demo />');
   expect(source(`src/pages/${locale}solutions.astro`)).toContain('<Solutions />');
  }
  expect(source('src/components/marketing/Demo.astro')).toContain('<Booking />');
 });
 it('does not leave blank product placeholders or CDN template theme behind',()=>{
  const solutions=source('src/components/marketing/Solutions.astro');
  for(const name of ['Laravel Social','Laravel Mail','Laravel SEO','Laravel GPT','Laravel UI','LeadsCaptain']) expect(solutions).toContain(name);
  expect(source('src/pages/laravel-email-templates.astro')).not.toContain('cdn.tailwindcss.com');
  expect(source('src/pages/create-campaign.astro')).not.toContain('youtube.com/embed');
 });
 it('keeps contact details, company location and legal destinations',()=>{
  const footer=source('src/components/Footer.astro');
  for(const value of ['7 High Street','Basildon, Essex','SS14 1AB','+44 744 821 8899','info@laravelmail.com','/privacy','/terms-of-service','/cookie-policy']) expect(footer).toContain(value);
 });
 it('retains all three interactive product islands',()=>{
  for(const locale of ['', '[lang]/']) {
   expect(source(`src/pages/${locale}templates.astro`)).toContain('TemplateBrowser');
   expect(source(`src/pages/${locale}validation.astro`)).toContain('ValidationDashboard client:load');
  }
  expect(source('src/components/ChatContent.astro')).toContain('AssistantChat client:only="preact"');
 });
 it('uses real captured thumbnails and preserves the blog collection',()=>{
  for(const name of ['templates','validation','agent']) expect(existsSync(`public/screens/product/${name}.webp`)).toBe(true);
  expect(readdirSync('src/content/blog').length).toBeGreaterThan(100);
 });
});
