import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from './index.js';
const env = {META_WEBHOOK_VERIFY_TOKEN:'fixture',ASSETS:{fetch:()=>new Response('app')}};
test('verification echoes challenge only for the matching token',async()=>{
 const req=token=>new Request('https://example.com/webhooks/instagram?hub.mode=subscribe&hub.verify_token='+token+'&hub.challenge=123456');
 const ok=await worker.fetch(req('fixture'),env);assert.equal(ok.status,200);assert.equal(await ok.text(),'123456');
 assert.equal((await worker.fetch(req('wrong'),env)).status,403);
 assert.equal((await worker.fetch(req('fixture'),{})).status,503);
});
test('unfinished processing never acknowledges live events or serves SPA for API',async()=>{
 assert.equal((await worker.fetch(new Request('https://example.com/webhooks/instagram',{method:'POST',body:'{}'}),env)).status,503);
 assert.equal((await worker.fetch(new Request('https://example.com/api/instagram/connect'),env)).status,503);
 assert.equal(await (await worker.fetch(new Request('https://example.com/login'),env)).text(),'app');
});
