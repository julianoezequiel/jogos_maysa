# cat_vs_dog

Jogo p5.js com o tema gato vs cachorro. Este subprojeto foi publicado separadamente em: https://github.com/julianoezequiel/jogos_maysa-cat_vs_dog

Como rodar localmente
- Abra `index.html` em um navegador moderno.
- Ou sirva o diretório localmente (recomendado):

```powershell
cd cat_vs_dog
python -m http.server 8002
# então abra http://localhost:8002
```

Arquivos importantes
- `index.html` — entrada do jogo
- `scripts/sketch.js` — sketch p5.js (carrega imagens preferindo `*-new.png` quando presentes)
- `assets/` — imagens e áudio (arquivos redundantes foram movidos para `assets/unused/`)
- `sim_runner_node.js` — runner de simulação headless (Node)

Notas
- Histórico preservado quando o subprojeto foi extraído/empurrado para um repositório remoto.
- Backups locais: `BatteryBot_git_backup`, `HuntGame_git_backup`, `cat_vs_dog_local_backup` — revise antes de apagar.

Licença
- Parte do repositório `jogos_maysa`.
# Cat vs Dog

Jogo `cat_vs_dog` convertido para subtree e publicado em um repositório remoto separado.

Como executar
- Abra `cat_vs_dog/index.html` em um navegador.

Observações
- Histórico preservado ao adicionar como subtree.
# cat_vs_dog

Jogo p5.js com o tema gato vs cachorro. Contém sketch, assets e um runner de simulação.

Estrutura
- `assets/` — imagens e sons usados pelo jogo (agora consolidadas para usar PNGs canônicos)
- `index.html` — entrypoint para o navegador
- `scripts/` — scripts do jogo (inclui `sketch.js`)
- `sim_runner_node.js` — utilitário para rodar simulações sem UI

# cat_vs_dog

Pequeno jogo p5.js com animais controlados por IA/simulação. Este diretório foi publicado como repositório separado e também mantido dentro do monorepo.

Como abrir
---------

- Abra `cat_vs_dog/index.html` em um navegador moderno.
- Para servir localmente (recomendado):

	- Python 3: `python -m http.server 8000`
	- Node: `npx serve .`

Arquivos principais
-------------------

- `index.html` — entrada do jogo
- `scripts/sketch.js` — sketch p5.js (carrega imagens preferindo `*-new.png` quando presentes)
- `assets/` — imagens e áudio (arquivos redundantes foram movidos para `assets/unused/`)
- `sim_runner_node.js` — runner de simulação headless (Node)

Rodando simulações headless
---------------------------

Se quiser rodar séries de simulações sem UI, use `node sim_runner_node.js` a partir do diretório `cat_vs_dog` e consulte os comentários no arquivo para opções de execução.

Observações
-----------

- Ao publicar, o histórico do subprojeto foi preservado.
- Backups locais foram deixados em `*_git_backup` e `cat_vs_dog_local_backup/` — revise antes de apagar.
