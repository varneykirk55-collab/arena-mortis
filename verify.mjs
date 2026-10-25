import fs from 'node:fs';
import assert from 'node:assert/strict';
// Gameplay logic is split across ES modules in dist/. Functions are extracted by name from the module that owns them
// and run against a stub state object S, so this check stays fast and needs no DOM or WebGL.
const modules=['game','state','world','combat','waves','economy','player','input','hud','audio','util','assets','models'].map(m=>'dist/'+m+'.js').filter(f=>fs.existsSync(f));
const s=modules.map(f=>fs.readFileSync(f,'utf8')).join('\n');
function fn(name){let start=s.indexOf('function '+name+'('),brace=s.indexOf('{',start),depth=1,end=brace+1;assert.ok(start>=0,'Missing function '+name);while(depth){if(s[end]==='{')depth++;if(s[end]==='}')depth--;end++}return s.slice(start,end)}
const test=new Function('assert',`
const S={round:0,wrathReady:false,remainingSpawn:0,spawnClock:3,roundWait:3,time:1,points:0,score:0,kills:0,hitUntil:0};const announce=()=>{},tone=()=>{},sound=()=>{},setTimeout=()=>{},$=()=>({});
${fn('nextRound')}
${fn('damage')}
nextRound();assert.equal(S.round,1);assert.equal(S.wrathReady,true);assert.equal(S.remainingSpawn,9);
S.wrathReady=false;nextRound();assert.equal(S.round,2);assert.equal(S.wrathReady,true);assert.equal(S.remainingSpawn,13);
let enemy={hp:50,dead:false};damage(enemy,60,true);assert.equal(enemy.dead,true);assert.equal(S.kills,1);assert.equal(S.points,160);damage(enemy,60);assert.equal(S.kills,1);
S.health=100;S.enemies=[{dead:false,group:{position:{distanceTo:()=>1}},hp:100}];let burst=()=>{},visual={explosion:()=>{}};
${fn('explode')}
explode({},4,180);assert.equal(S.health,100);assert.equal(S.enemies[0].dead,true);
`);test(assert);
const html=fs.readFileSync('dist/index.html','utf8');for(const match of s.matchAll(/\$\('([^']+)'\)/g))assert.ok(html.includes('id="'+match[1]+'"'),'Missing DOM '+match[1]);
console.log('PASS: wave progression, one-charge replenishment, scoring, death deduplication, no explosive self-damage, DOM bindings.');
