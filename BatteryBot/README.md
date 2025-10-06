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
# então abra http://localhost:8000
```

Arquivos importantes
- `index.html` — página principal
- `phaser.min.js` — engine Phaser
- `assets/` — imagens e sons usados pelo jogo

Licença e créditos
- Conteúdo e código dentro deste diretório são parte do repositório `jogos_maysa`.
- Créditos: julianoezequiel (autor do repositório)
BatteryBot
=========

Pequeno jogo feito com Phaser que controla um robô coletor de baterias.

Como abrir
---------

- Abra `BatteryBot/index.html` em um navegador moderno (Chrome/Edge/Firefox).
- Se preferir rodar localmente com servidor (recomendado), use um servidor simples:

  - Python 3: `python -m http.server 8000` (no diretório raiz do projeto)
  - Node: `npx serve .`

Arquivos principais
-------------------

- `index.html` — entrada do jogo
- `assets/` — imagens e áudio
- `js/game.js` — lógica do jogo

Observações
-----------

- Este README foi criado automaticamente ao publicar o subprojeto como repositório separado.
# BatteryBot

Pequeno jogo HTML/JS embutido neste monorepo.

Como executar
- Abra `BatteryBot/index.html` em um navegador moderno.
- Ou sirva o diretório com um servidor estático (por exemplo, `npx http-server BatteryBot`).

Observações
- Este diretório foi exportado do monorepo `jogos_maysa` e publicado em um repositório remoto separado.
# Caçadora de Pugs

Este é um jogo web personalizado baseado no "Battery Bot" original. Nele, você controla uma menina corajosa em uma vila infestada de pugs malvados. Sua missão é encontrar e eliminar todos os pugs antes que eles destruam tudo!

## Como Jogar
- Use as setas do teclado para se mover e pular.
- Colete (mate) os pugs caindo para aumentar sua pontuação.
- Cuidado com os robôs voadores que protegem os pugs!
- Mantenha sua energia carregada evitando danos.

## Como Executar o Jogo

### Pré-requisitos
- Python 3 instalado no seu sistema (disponível em [python.org](https://www.python.org/)).

### Passos para Executar
1. Abra um terminal (PowerShell, CMD ou similar) no diretório do projeto (`BatteryBot`).
2. Execute o comando:
   ```
   python -m http.server 8000
   ```
3. Abra seu navegador web e acesse: `http://localhost:8000` ou `http://127.0.0.1:8000`.
4. O jogo deve carregar e você pode começar a jogar!

### Por que usar esse comando?
O jogo é baseado em HTML, CSS e JavaScript (usando Phaser.js). Para funcionar corretamente no navegador, os arquivos precisam ser servidos via HTTP. Abrir o `index.html` diretamente pode causar problemas de carregamento de assets devido a restrições de segurança do navegador. O servidor HTTP simples do Python resolve isso de forma rápida e local.

## Estrutura do Projeto
- `index.html`: Arquivo principal do jogo.
- `phaser.min.js`: Biblioteca Phaser para desenvolvimento de jogos.
- `assets/`: Pasta com imagens, sons e outros recursos.
- `README.md`: Este arquivo.

## Personalizações
Este jogo foi personalizado a partir do original "Battery Bot":
- Tema alterado: De robô coletando baterias para menina caçando pugs.
- Textos traduzidos para português brasileiro.
- Imagens redimensionadas para otimização.
- Referências ao autor original removidas.

## Contribuições
Sinta-se à vontade para modificar e melhorar o jogo. Use Git para versionamento.

## Licença
Baseado no jogo original "Battery Bot" (disponível em itch.io), com modificações pessoais.</content>
<parameter name="filePath">d:\projetos\jogo_maysa\BatteryBot\README.md