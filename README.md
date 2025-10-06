# cat_vs_dog

Jogo p5.js com o tema gato vs cachorro. Contém sketch, assets e um runner de simulação.

Estrutura
- `assets/` — imagens e sons usados pelo jogo (agora consolidadas para usar PNGs canônicos)
- `index.html` — entrypoint para o navegador
- `scripts/` — scripts do jogo (inclui `sketch.js`)
- `sim_runner_node.js` — utilitário para rodar simulações sem UI

Como rodar
1. Sirva a pasta com um servidor HTTP (ex.: `python -m http.server`) e abra `index.html` no navegador.
2. Para rodar simulações headless, use `node sim_runner_node.js` (veja comentários no arquivo para opções).

Notas
- Arquivos redundantes foram movidos para `assets/unused/` e a `preload()` foi atualizada para preferir `*-new.png`.
