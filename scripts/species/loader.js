// Loader ES module: importa definições de espécies (ESM) e as expõe no escopo global
// Mantemos uma única fonte de verdade: os arquivos em scripts/species/*.js
import { createCat, catAbilities } from './cat.js';
import { createDog, dogAbilities } from './dog.js';
import { createBird, birdAbilities } from './bird.js';
import { createFish, fishAbilities } from './fish.js';

// Expõe no window para compatibilidade com o restante do código não-module
if(typeof window !== 'undefined'){
  window.Species = window.Species || {};
  window.createCat = createCat; window.catAbilities = catAbilities; window.Species.createCat = createCat; window.Species.catAbilities = catAbilities;
  window.createDog = createDog; window.dogAbilities = dogAbilities; window.Species.createDog = createDog; window.Species.dogAbilities = dogAbilities;
  window.createBird = createBird; window.birdAbilities = birdAbilities; window.Species.createBird = createBird; window.Species.birdAbilities = birdAbilities;
  window.createFish = createFish; window.fishAbilities = fishAbilities; window.Species.createFish = createFish; window.Species.fishAbilities = fishAbilities;
}

// também exportamos por compatibilidade se outros módulos quiserem importar o loader
export { createCat, catAbilities, createDog, dogAbilities, createBird, birdAbilities, createFish, fishAbilities };
