# HuntGame

Jogo simples feito com p5.js (versões compatíveis incluídas).

Resumo
- Pequeno jogo onde você controla um personagem e interage com sprites/objetos na tela. Projetado como exercício de sketch interativo.

Como rodar
- Abra `HuntGame/index.html` em um navegador moderno.
- Para desenvolvimento, rode um servidor estático na pasta do projeto:

  - Python: `python -m http.server 8000`
  - Node: `npx http-server HuntGame`

Arquivos importantes
- `index.html` — página principal
- `sketch.js` / `sketch.legacy.js` — código p5.js
- `assets/` — gráficos e SVGs

Licença
- Verifique a licença no repositório raiz `jogos_maysa`.

Observações
- Este diretório foi exportado do monorepo e também publicado como repositório separado.
HuntGame
========

Jogo simples em p5.js. Padrões de execução:

Como executar
- Abra `HuntGame/index.html` em um navegador.
- Ou sirva a pasta com `python -m http.server` no diretório `HuntGame`.

Estrutura
- `index.html`, `sketch.js`, e `assets/`.

Observações
- Histórico exportado para repositório separado. Use `npm`/`python` se quiser automatizar testes.
HuntGame
========

Jogo feito com p5.js. Controle personagens e colete itens enquanto evita inimigos.

Como rodar localmente
- Abra `HuntGame/index.html` em um navegador moderno.
- Para servir localmente (evitar CORS), use um servidor estático:

```powershell
cd HuntGame
python -m http.server 8001
# abra http://localhost:8001
```

Arquivos importantes
- `index.html`, `sketch.js`, `assets/`

Licença
- Parte do repositório `jogos_maysa`.
HuntGame
========

Jogo de captura com p5.js — contém lógica de entidades e leaderboard.

Como abrir
---------

- Abra `HuntGame/index.html` em um navegador moderno.
- Para servir localmente use um servidor estático (`python -m http.server 8000` ou `npx serve .`).

Arquivos importantes
--------------------

- `index.html` — entrada
- `src/` — código do jogo (entities, audio, leaderboard)
- `assets/` — imagens vetoriais e sprites

Notas
-----

- O repositório foi criado a partir do monorepo e este README foi adicionado automaticamente.
# HuntGame

Game sketch em p5.js incluído neste monorepo.

Como executar
- Abra `HuntGame/index.html` em um navegador.
- Ou use um servidor estático (`npx http-server HuntGame`).

Status
- Conteúdo exportado e publicado em repositório remoto separado via subtree.
