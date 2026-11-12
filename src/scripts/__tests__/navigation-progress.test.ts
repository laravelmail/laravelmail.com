import {describe,it,expect,vi,afterEach} from 'vitest';
import {installNavigationProgress} from '../navigation-progress';
function fixture(){
 const document = new EventTarget() as Document;
 const window = new EventTarget() as Window;
 const bar={dataset:{state:'idle'}};
 document.getElementById=vi.fn(()=>bar as any);
 Object.assign(window,{location:new URL('https://laravelmail.com/')});
 installNavigationProgress(document,window);return {document,window,bar};
}
function custom(type:string,detail:string){const event=new Event(type);Object.assign(event,{detail});return event;}
afterEach(()=>vi.useRealTimers());
describe('top navigation progress',()=>{
 it('starts on Astro preparation, completes on page-load and fades',()=>{
  vi.useFakeTimers();const f=fixture();f.document.dispatchEvent(new Event('astro:before-preparation'));expect(f.bar.dataset.state).toBe('loading');f.document.dispatchEvent(new Event('astro:page-load'));expect(f.bar.dataset.state).toBe('complete');vi.advanceTimersByTime(300);expect(f.bar.dataset.state).toBe('idle');
 });
 it('keeps concurrent template work visible until every request ends',()=>{
  vi.useFakeTimers();const f=fixture();f.window.dispatchEvent(custom('lm:progress-start','a'));f.window.dispatchEvent(custom('lm:progress-start','b'));f.window.dispatchEvent(custom('lm:progress-end','a'));expect(f.bar.dataset.state).toBe('loading');f.window.dispatchEvent(custom('lm:progress-end','b'));expect(f.bar.dataset.state).toBe('complete');
 });
 it('clears a failed navigation and handles back-forward restore',()=>{
  vi.useFakeTimers();const f=fixture();f.document.dispatchEvent(new Event('astro:before-preparation'));vi.advanceTimersByTime(15300);expect(f.bar.dataset.state).toBe('idle');f.document.dispatchEvent(new Event('astro:before-preparation'));f.window.dispatchEvent(new Event('pageshow'));expect(f.bar.dataset.state).toBe('complete');
 });
});
