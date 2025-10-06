const fs = require('fs');
const path = require('path');
const CSV = path.resolve(__dirname, '..', '..', 'grid_capy_rerun_top8.csv');
if(!fs.existsSync(CSV)){ console.error('CSV not found:', CSV); process.exit(1); }
const rows = fs.readFileSync(CSV,'utf8').trim().split('\n').slice(1).map(r=>r.split(',').map(x=>x.trim()));
const runs = 200;
function ci95(p,n){ if(n===0) return [0,0]; const z=1.96; const se=Math.sqrt(p*(1-p)/n); return [Math.max(0,(p - z*se)), Math.min(1,(p + z*se))]; }
console.log('combo | dogs% (95% CI) | cats% (95% CI) | birds% | fish% | capy% | avgCapyAlive | avgTicks');
rows.forEach(r=>{
  const combo = `${r[0]} / ${r[1]} / ${r[2]}`;
  const dogs = parseInt(r[3]), cats = parseInt(r[4]), birds = parseInt(r[5]), fish = parseInt(r[6]), capy = parseInt(r[7]);
  const pd = dogs / runs, pc = cats / runs, pb = birds / runs, pf = fish / runs, pp = capy / runs;
  const cd = ci95(pd, runs), cc = ci95(pc, runs);
  console.log(`${combo} | ${ (pd*100).toFixed(1)}% (${(cd[0]*100).toFixed(1)}-${(cd[1]*100).toFixed(1)}) | ${ (pc*100).toFixed(1)}% (${(cc[0]*100).toFixed(1)}-${(cc[1]*100).toFixed(1)}) | ${ (pb*100).toFixed(1)}% | ${ (pf*100).toFixed(1)}% | ${ (pp*100).toFixed(1)}% | ${r[9]} | ${r[10]}`);
});
