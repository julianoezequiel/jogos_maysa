// Index de espécies para inclusão no browser sem módulos.
// Este arquivo agrega as fábricas e habilidades e as expõe em window.Species

(function(){
  // Tenta usar imports via ES module se estiver disponível (desenvolvimento),
  // caso contrário espera que os arquivos individuais sejam concatenados/embutidos.
  // Para simplicidade e compatibilidade, carregamos por reflexão se os módulos
  // estiverem presentes no ambiente (Node/Bundle) ou definimos stubs.
  const S = window.Species = window.Species || {};
  try{
    // Em ambientes que suportam import(), poderíamos dinamicamente importar.
    // Aqui preferimos a atribuição direta via bundlers ou carga manual.
  }catch(e){}
  // Se os módulos foram carregados como globals (por bundler), preserve-os.
  if(window.createCat) S.createCat = window.createCat;
  if(window.createDog) S.createDog = window.createDog;
  if(window.createBird) S.createBird = window.createBird;
  if(window.createFish) S.createFish = window.createFish;
  if(window.catAbilities) S.catAbilities = window.catAbilities;
  if(window.dogAbilities) S.dogAbilities = window.dogAbilities;
  if(window.birdAbilities) S.birdAbilities = window.birdAbilities;
  if(window.fishAbilities) S.fishAbilities = window.fishAbilities;
  // For safety, if nothing is defined, consumer (sketch.js) will fall back to its own defaults.
})();
