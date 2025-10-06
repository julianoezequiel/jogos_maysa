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