import fs from 'node:fs';
import assert from 'node:assert/strict';
const s=fs.readFileSync('dist/game.js','utf8');
function fn(name){let start=s.indexOf('function '+name+'('),brace=s.indexOf('{',start),depth=1,end=brace+1;while(depth){if(s[end]==='{')depth++;if(s[end]==='}')depth--;end++}return s.slice(start,end)}
const test=new Function('assert',`
let round=0,wrathReady=false,remainingSpawn=0,spawnClock=3,roundWait=3,time=1,points=0,score=0,kills=0,hitUntil=0;const announce=()=>{},tone=()=>{},sound=()=>{},setTimeout=()=>{},$=()=>({});
${fn('nextRound')}
${fn('damage')}
nextRound();assert.equal(round,1);assert.equal(wrathReady,true);assert.equal(remainingSpawn,9);
wrathReady=false;nextRound();assert.equal(round,2);assert.equal(wrathReady,true);assert.equal(remainingSpawn,13);
let enemy={hp:50,dead:false};damage(enemy,60,true);assert.equal(enemy.dead,true);assert.equal(kills,1);assert.equal(points,160);damage(enemy,60);assert.equal(kills,1);
let health=100,enemies=[{dead:false,group:{position:{distanceTo:()=>1}},hp:100}],burst=()=>{},visual={explosion:()=>{}};
${fn('explode')}
explode({},4,180);assert.equal(health,100);assert.equal(enemies[0].dead,true);
`);test(assert);
const html=fs.readFileSync('dist/index.html','utf8');for(const match of s.matchAll(/\$\('([^']+)'\)/g))assert.ok(html.includes('id="'+match[1]+'"'),'Missing DOM '+match[1]);
console.log('PASS: wave progression, one-charge replenishment, scoring, death deduplication, no explosive self-damage, DOM bindings.');
