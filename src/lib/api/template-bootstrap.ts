import {listTemplates, getIndustries, getMessageTypes} from './client';

/** Cache only public catalogue data, never visitor/session state. */
let cached: {value: Awaited<ReturnType<typeof load>>, expires: number} | undefined;
let pending: ReturnType<typeof load> | undefined;
async function load() {
  const [listing, industries, messageTypes] = await Promise.all([
    listTemplates({page:1,page_size:12}), getIndustries().catch(() => []), getMessageTypes().catch(() => []),
  ]);
  return {initialTemplates:listing.templates,initialTotal:listing.total,initialIndustries:industries,initialMessageTypes:messageTypes};
}
export async function getTemplateBootstrap() {
  if (cached && cached.expires > Date.now()) return cached.value;
  if (!pending) pending = load().then(value => {
    cached = {value,expires:Date.now()+60000}; return value;
  }).finally(() => {pending=undefined;});
  // Retain the most recent public page on a transient upstream failure. With
  // no cache return undefined so the island retries, not a false empty library.
  try { return await pending; } catch { return cached?.value; }
}
