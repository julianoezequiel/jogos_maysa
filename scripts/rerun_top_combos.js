// rerun_top_combos.js
// Usage: node rerun_top_combos.js [runsPer]
// Reads ../grid_capy_results.csv, selects top-8 combos by lowest avgCapyAlive,
// re-runs each combo with RUNS_PER and writes grid_capy_rerun_top8.csv

const fs = require('fs');
const path = require('path');
const GRID_CSV = path.resolve(__dirname, '..', '..', 'grid_capy_results.csv');
const OUT_CSV = path.resolve(__dirname, '..', '..', 'grid_capy_rerun_top8.csv');
const args = process.argv.slice(2);
const RUNS_PER = parseInt(args[0]) || 200;

if(!fs.existsSync(GRID_CSV)){
  console.error('Base CSV not found:', GRID_CSV);
  process.exit(1);
}

const rows = fs.readFileSync(GRID_CSV,'utf8').trim().split('\n').slice(1).map(r=>r.split(',').map(x=>x.trim()));
rows.sort((a,b)=> parseFloat(a[9]) - parseFloat(b[9]));
const top = rows.slice(0,8).map(r=>({chompMax:parseFloat(r[0]), chompProb:parseFloat(r[1]), calmProb:parseFloat(r[2])}));
console.log('Top combos to rerun:', top);

// load grid_search functions by requiring the file; it defines runOneSimple in its scope
const gridPath = path.resolve(__dirname, 'grid_search.js');
const grid = require(gridPath);
if(typeof grid.runOneSimple !== 'function'){
  console.error('grid_search did not export runOneSimple. Aborting.');
  process.exit(1);
}

const header = 'chompMax,chompProb,calmProb,dogsW,catsW,birdsW,fishW,capyW,draws,avgCapyAlive,avgTicks,avgHpCats,avgHpDogs,avgHpBirds,avgHpFish,avgHpCapy';
const outLines = [header];

(async function(){
  for(const combo of top){
    // inject into global capyAbilities (grid_search expects global capyAbilities variable)
    if(!global.capyAbilities) global.capyAbilities = require(path.resolve(__dirname, 'grid_search.js')).capyAbilities || [];
    // set params safely
    if(global.capyAbilities && global.capyAbilities[0]){
      global.capyAbilities[0].max = combo.chompMax;
      if(typeof global.capyAbilities[0].min !== 'number' || global.capyAbilities[0].min > global.capyAbilities[0].max) global.capyAbilities[0].min = Math.max(1, global.capyAbilities[0].max - 6);
      global.capyAbilities[0].prob = combo.chompProb;
    }
    if(global.capyAbilities && global.capyAbilities[1]){
      global.capyAbilities[1].prob = combo.calmProb;
    }

    console.log('Running combo', combo, 'runsPer=', RUNS_PER);
    let wins = {cats:0,dogs:0,birds:0,fish:0,capy:0,draws:0};
    let totalTicks = 0, capyAcc = 0; let totalHpSums = {cats:0,dogs:0,birds:0,fish:0,capy:0};
    for(let i=0;i<RUNS_PER;i++){
      const r = grid.runOneSimple(10,10,1.0,1.0, {tickMs:200, MAX_TICKS:12000});
      totalTicks += r.ticks; capyAcc += (r.cp||0);
      if(r.winner && r.winner !== 'draw') wins[r.winner]++;
      else wins.draws++;
      if(r.totalHp){ totalHpSums.cats += r.totalHp.cats||0; totalHpSums.dogs += r.totalHp.dogs||0; totalHpSums.birds += r.totalHp.birds||0; totalHpSums.fish += r.totalHp.fish||0; totalHpSums.capy += r.totalHp.capy||0; }
      process.stdout.write('.');
    }
    const avgCapyAlive = +(capyAcc / RUNS_PER).toFixed(2);
    const avgTicks = Math.round(totalTicks / RUNS_PER);
    const avgHpCats = +(totalHpSums.cats / RUNS_PER).toFixed(2);
    const avgHpDogs = +(totalHpSums.dogs / RUNS_PER).toFixed(2);
    const avgHpBirds = +(totalHpSums.birds / RUNS_PER).toFixed(2);
    const avgHpFish = +(totalHpSums.fish / RUNS_PER).toFixed(2);
    const avgHpCapy = +(totalHpSums.capy / RUNS_PER).toFixed(2);
    const line = [combo.chompMax, combo.chompProb, combo.calmProb, wins.dogs, wins.cats, wins.birds, wins.fish, wins.capy, wins.draws, avgCapyAlive, avgTicks, avgHpCats, avgHpDogs, avgHpBirds, avgHpFish, avgHpCapy].join(',');
    outLines.push(line);
    console.log('\nDone combo', combo);
  }
  fs.writeFileSync(OUT_CSV, outLines.join('\n'));
  console.log('\nWrote rerun CSV to', OUT_CSV);
})();
