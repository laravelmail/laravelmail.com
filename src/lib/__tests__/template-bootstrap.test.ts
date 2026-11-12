import {it,expect,vi,beforeEach} from 'vitest';
const mocks=vi.hoisted(()=>({listTemplates:vi.fn(),getIndustries:vi.fn(),getMessageTypes:vi.fn()}));
vi.mock('../api/client',()=>mocks);
beforeEach(()=>{vi.resetModules();vi.clearAllMocks();mocks.listTemplates.mockResolvedValue({templates:[{slug:'one'}],total:1945});mocks.getIndustries.mockResolvedValue(['Retail']);mocks.getMessageTypes.mockResolvedValue(['Newsletter']);});
it('coalesces concurrent requests and caches only the first12 public templates',async()=>{
 const {getTemplateBootstrap}=await import('../api/template-bootstrap');const [a,b]=await Promise.all([getTemplateBootstrap(),getTemplateBootstrap()]);expect(a).toEqual(b);expect(a?.initialTotal).toBe(1945);expect(mocks.listTemplates).toHaveBeenCalledExactlyOnceWith({page:1,page_size:12});await getTemplateBootstrap();expect(mocks.listTemplates).toHaveBeenCalledTimes(1);
});
it('allows a client retry rather than returning a false empty library on cold failure',async()=>{
 mocks.listTemplates.mockRejectedValueOnce(new Error('upstream'));const {getTemplateBootstrap}=await import('../api/template-bootstrap');expect(await getTemplateBootstrap()).toBeUndefined();expect((await getTemplateBootstrap())?.initialTemplates).toHaveLength(1);
});
it('serves the last successful public page during a transient upstream failure',async()=>{
 vi.useFakeTimers();try {const {getTemplateBootstrap}=await import('../api/template-bootstrap');const first=await getTemplateBootstrap();vi.advanceTimersByTime(61000);mocks.listTemplates.mockRejectedValueOnce(new Error('temporary'));expect(await getTemplateBootstrap()).toEqual(first);} finally {vi.useRealTimers();}
});
