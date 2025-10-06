BatteryBot
=========

Pequeno jogo feito com Phaser. Contém assets e código no diretório `js/`.

Como executar localmente
- Abra `BatteryBot/index.html` em um navegador moderno.
- Ou sirva a pasta com um servidor estático (por exemplo, `npx http-server` ou `python -m http.server`).

Estrutura
- `index.html` — página principal
- `js/game.js` — lógica do jogo
- `assets/` — imagens e sons

Notas
- Subprojeto exportado do monorepo. Histórico preservado.

Licença
- Verifique o `LICENSE` no repositório principal.
BatteryBot
=========

Pequeno jogo feito com Phaser (HTML/JS). Controle um robô que coleta baterias e evita inimigos.

Como rodar localmente
- Abra `BatteryBot/index.html` em um navegador moderno.
- Para evitar problemas de CORS, rode um servidor estático na pasta `BatteryBot`. Exemplo com Python:

```powershell
cd BatteryBot
python -m http.server 8000
# BatteryBot

Pequeno jogo HTML/JS criado com Phaser.

Resumo
- Controle um robô que coleta baterias e evita obstáculos/inimigos. O projeto foi exportado deste monorepo e preserva histórico.

Como executar localmente
- Abra `BatteryBot/index.html` em um navegador moderno.
- Recomendado: rode um servidor estático para evitar problemas de CORS. Exemplos:

  - Python 3: `python -m http.server 8000`
  - Node (http-server): `npx http-server BatteryBot`

Arquivos importantes
- `index.html` — página principal
- `phaser.min.js` — engine Phaser usada pelo jogo
- `js/game.js` — lógica do jogo
- `assets/` — imagens e sons

Estrutura
- `BatteryBot/` — diretório do jogo dentro do monorepo

Licença e créditos
- Este diretório faz parte do repositório `jogos_maysa`.
- Verifique a licença no repositório raiz para detalhes.

---
