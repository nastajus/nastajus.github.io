import test from 'node:test';
import assert from 'node:assert/strict';
import {parseHTML} from 'linkedom';
import {extract,slug} from '../extract.mjs';
import {rootPage,burstPage,formatDate} from '../render.mjs';
const stats={mtime:new Date('2026-09-12T12:00:00Z'),birthtime:new Date('2026-09-11T19:00:00Z')};
const fixture=`<!doctype html><html><head><title>Job Details</title></head><body><!--\n url: https://jobboard.jvstoronto.org/60-2/\n saved date: Fri Sep 11 2026 15:01:03 GMT-0400 (Eastern Daylight Time)\n--><header>Account menu</header><div class="elementor-widget-text-editor"><p><strong>Job Title:</strong> Revit Technologist</p><p><strong>Department:</strong> Design</p><p><strong>Hours of Work:</strong> Full Time</p></div><div class="elementor-widget-text-editor"><p><strong>Job Number:</strong> ABC123</p><p><strong>Main Intersection:</strong> One &amp; Two</p><p>Produce drawings and coordinate with the team.</p><ul><li>Read plans</li></ul><img src=x onerror="bad()"><script>bad()</script><a href="javascript:bad()">Bad link</a></div><form><input value="private"></form><a id="applyLink" href="https://jobboard.jvstoronto.org/application/?id=abc">Apply</a></body></html>`;
test('capture date takes priority over file time; metadata and content survive',()=>{
 const e=extract(fixture,stats);assert.equal(e.savedAt,'2026-09-11T19:01:03.000Z');assert.equal(e.fileModifiedAt,stats.mtime.toISOString());assert.equal(e.title,'Revit Technologist');assert.equal(e.location,'One & Two');assert.match(e.content,/Read plans/);
});
test('public copies remove executable content and account controls',()=>{
 const e=extract(fixture,stats);assert.doesNotMatch(e.content,/<script|onerror|javascript:/i);assert.doesNotMatch(e.snapshot,/<script|onerror|javascript:|Account menu|value="private"/i);assert.match(e.snapshot,/Content-Security-Policy/);
});
test('bad inputs fail rather than publish a login page; missing capture date uses file time',()=>{
 assert.throws(()=>extract('<html><input type=password></html>',stats));const e=extract(fixture.replace('saved date:','no date:'),stats);assert.equal(e.savedAt,stats.mtime.toISOString());assert.match(e.savedAtBasis,/fallback/);
});
test('slugs are friendly; timezone labels respect daylight saving',()=>{
 assert.equal(slug('Bilingual Administrative Assistant (English/French)'),'bilingual-administrative-assistant-english-french');assert.match(formatDate('2026-12-11T19:00:00Z'),/EST/);assert.match(formatDate('2026-09-11T19:00:00Z'),/EDT/);
});
test('NVM is collapsed on root/week indexes, visible when its group is opened',()=>{
 const burst={key:'2026/w37',year:2026,slug:'w37',label:'Week 37',searchedOn:'2026-09-11',path:'/postings/2026/w37/',sourceLabel:'JVS'};
 const entry={...extract(fixture,stats),key:'2026/w37:ABC123',burst:burst.key,path:burst.path+'nvm/revit/',groupPath:'nvm',groupLabel:'NVM',hidden:true};
 const state={siteUrl:'https://nastajus.github.io',bursts:[burst],entries:[entry],attachments:[]};
 for(const html of [rootPage(state),burstPage(state,burst)]){const {document}=parseHTML(html);assert.equal(document.querySelector('details.nvm').hasAttribute('open'),false);assert.equal(document.querySelector('[data-copy]').dataset.copy.startsWith(state.siteUrl),true);}
 const {document}=parseHTML(burstPage(state,burst,'nvm'));assert.equal(document.querySelector('details.nvm').hasAttribute('open'),true);
});
