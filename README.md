# Jogos Maísa (monorepo)

Este repositório contém vários projetos/jogos desenvolvidos localmente. A intenção é manter todos os jogos organizados em subpastas para facilitar desenvolvimento e versionamento.

Diretório raiz
- `BatteryBot/`
- `cat_vs_dog/`  — jogo "cat vs dog" (sketch p5.js, assets em `cat_vs_dog/assets`)
- `CosmicDrift/`
- `HugoGame/`
- `HuntGame/`
- `Maisa/` — projeto específico da Maísa

Visão geral e recomendações
- Estrutura atual: monorepo com `D:/projetos/jogo_maysa` como repositório Git raiz. Cada jogo vive em sua própria pasta.
- Recomendo manter este repositório como um monorepo se você deseja gerenciar tudo centralmente (backup, tags e snapshots únicos). Ele é simples de manter e facilita compartilhar utilitários.
- Se preferir publicar cada jogo separadamente (por exemplo, um repositório por jogo no GitHub), é possível extrair cada subpasta preservando histórico (com `git subtree split` ou `git filter-repo`).

Como rodar os jogos localmente
- A maioria dos jogos são páginas estáticas. Sirva a pasta do jogo com um servidor HTTP simples para evitar problemas com carregamento de assets (SVG/CORS):

```powershell
# No PowerShell (na pasta do jogo ou na raiz)
python -m http.server 8000
# então abra http://localhost:8000/cat_vs_dog/index.html
```

Remotes recomendados (se quiser separar)
- Monorepo (já criado): `https://github.com/julianoezequiel/jogos_maysa` (push feito)
- Se for dividir por projetos, sugiro os nomes a seguir para os repositórios remotos individuais:
  - `jogos_maysa-cat_vs_dog`
  - `jogos_maysa-maisa`
  - `jogos_maysa-batterybot`
  - `jogos_maysa-cosmicdrift`
  - `jogos_maysa-huntgame`
  - `jogos_maysa-hugogame`

Comandos úteis
- Push do monorepo (já usado):
```powershell
git remote add origin https://github.com/usuario/jogos_maysa.git
git push -u origin HEAD
git push origin --tags
```
- Extrair e criar um repo apenas para `cat_vs_dog` (preservando histórico):
```powershell
git subtree split -P cat_vs_dog -b cat_vs_dog-only
git remote add cat_vs_dog_remote https://github.com/usuario/jogos_maysa-cat_vs_dog.git
git push cat_vs_dog_remote cat_vs_dog-only:main
```

Se quiser que eu crie repositórios remotos separados (sub-repos) ou que eu envie subpastas para repositórios individuais, me passe os nomes/URLs e eu executo os pushes.

---
Commit snapshot criado: tag `snapshot-2025-10-06` disponível no remoto.
