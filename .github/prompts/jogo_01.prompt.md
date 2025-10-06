---
mode: agent
---

{
  "project_type": "game_development",
  "target_platform": "web_browser",
  "primary_technology": "Phaser 3",
  "secondary_technologies": [
    "TypeScript",
    "Webpack",
    "Git"
  ],
  "resources": {
    "official_website": "https://phaser.io/",
    "documentation": "https://newdocs.phaser.io/",
    "examples": "https://labs.phaser.io/",
    "community_forum": "https://phaser.discourse.group/",
    "audio_sources": [
      "https://mixkit.co/free-sound-effects/game/",
      "https://www.zapsplat.com/sound-effect-category/game-sounds/",
      "https://freesound.org/",
      "https://sonniss.com/gameaudiogdc/"
    ]
  },
  "game_specifications": {
    "title": "Cosmic Drift",
    "genre": "Endless Runner / Sci-fi Platformer",
    "storytelling": {
      "logline": "Em um universo em decomposição, um pequeno robô de manutenção deve coletar energia cósmica para manter sua estrela viva antes que ela apague para sempre.",
      "protagonist": "Unit-734, um robô de reparos solitário, leal e ingênuo, cujo único propósito é servir sua estrela. Ele não entende o conceito de falha ou desistência.",
      "setting": "Um campo de asteroides fragmentado, com plataformas flutuantes e restos de naves antigas. O cenário é escuro, com um brilho fraco e pulsante da estrela moribunda no fundo.",
      "conflict": "A energia da estrela está esgotando. Fragmentos de energia ('Cosmic Shards') se espalharam pelo cinturão de asteroides. A Unit-734 deve correr contra o tempo para coletá-los, mas o ambiente se torna cada vez mais instável e perigoso."
    },
    "difficulty_progression": {
      "type": "dynamic",
      "mechanism": "Aumento progressivo da velocidade do cenário e da frequência/complexidade dos obstáculos com o tempo de jogo ou pontuação.",
      "levels": [
        {
          "name": "Fase 1: Início Tranquilo",
          "threshold": "Até 100 pontos",
          "parameters": {
            "speed_multiplier": 1.0,
            "obstacle_spawn_rate": "Baixa (a cada 2-3 segundos)",
            "obstacle_complexity": "Simples (somente rochas sólidas)"
          }
        },
        {
          "name": "Fase 2: Aceleração",
          "threshold": "De 101 a 500 pontos",
          "parameters": {
            "speed_multiplier": 1.5,
            "obstacle_spawn_rate": "Média (a cada 1-2 segundos)",
            "obstacle_complexity": "Média (rochas sólidas e rochas estilhaçadas)"
          }
        },
        {
          "name": "Fase 3: Caos Cósmico",
          "threshold": "Acima de 500 pontos",
          "parameters": {
            "speed_multiplier": 2.0,
            "obstacle_spawn_rate": "Alta (a cada 0.5-1 segundo)",
            "obstacle_complexity": "Alta (combinações de rochas sólidas e estilhaçadas)"
          }
        }
      ]
    },
    "audio_assets": {
      "music": {
        "menu_theme": "Música ambiente, com sintetizadores suaves e um tom de mistério, que evoca o tema espacial.",
        "gameplay_theme": "Música eletrônica e rítmica, com batidas constantes, que acelera junto com a dificuldade do jogo. Deve ser 'loopable'."
      },
      "sound_effects": [
        { "name": "jump", "description": "Som de propulsor ou 'whoosh' sci-fi."},
        { "name": "collect_shard", "description": "Som de sino ou 'bling' ao coletar um item."},
        { "name": "collision", "description": "Som de impacto metálico ou 'crash'."},
        { "name": "game_over", "description": "Som de falha ou uma nota triste de sintetizador."},
        { "name": "button_click", "description": "Efeito sonoro de clique ou confirmação para a UI."},
        { "name": "power_up", "description": "Som de ativação de poder, com um 'swoosh' ou 'ding'."}
      ],
      "audio_controls": {
        "description": "Controle de volume na tela de menu e/ou de pausa. Um botão 'mute' para ativar/desativar todos os sons e a música."
      }
    },
    "core_mechanics": [
      {
        "mechanic": "player_movement",
        "description": "Controle do jogador usando teclado (WASD ou setas) para pular entre plataformas e coletar itens. A corrida é automática (endless runner)."
      },
      {
        "mechanic": "collision_detection",
        "description": "Detecção de colisão entre o jogador, obstáculos (fragmentos de rocha) e itens (Cosmic Shards)."
      },
      {
        "mechanic": "score_system",
        "description": "A pontuação é baseada no número de 'Cosmic Shards' coletados. Cada Shard adiciona 10 pontos."
      },
      {
        "mechanic": "game_states",
        "description": "Gerenciamento de estados de jogo: Menu, Jogabilidade e Fim de Jogo."
      },
      {
        "mechanic": "local_ranking",
        "description": "Sistema de ranking salvo localmente no navegador (utilizando localStorage). A pontuação e o nome do jogador devem ser armazenados e exibidos."
      }
    ],
    "content_assets": {
      "image_generation_parameters": {
        "art_style": "Pixel Art",
        "color_palette": "Cores frias e escuras (azuis, roxos, preto) com pontos de luz vibrantes e quentes (laranja, amarelo) para criar contraste. Estilo arcade, com brilhos sutis.",
        "resolution_guidelines": "Baixa resolução, adequada para jogos de navegador (Ex: 16x16px para sprites, 32x32px para obstáculos, 256x144px para o fundo)."
      },
      "ui_design": {
        "layout": "Posição dos elementos UI deve ser centralizada verticalmente para botões e menus, e fixa nas bordas superior e inferior para placares e ícones. Mantenha as margens consistentes.",
        "buttons": {
          "style": "Retangulares com bordas levemente arredondadas, cor azul escuro e um brilho suave. Texto em branco ou amarelo brilhante. Animação de 'press' ao ser clicado.",
          "text_font": "Fonte em pixel art, estilo 'bitmapped' (Ex: 'Pixeloid Sans' ou similar)."
        },
        "text_styles": {
          "title": {
            "font": "Pixel Art Bold",
            "size": "32px",
            "color": "#FFC107"
          },
          "body": {
            "font": "Pixel Art Regular",
            "size": "16px",
            "color": "#E0E0E0"
          },
          "score_display": {
            "font": "Pixel Art Regular",
            "size": "18px",
            "color": "#FFFFFF"
          }
        },
        "ranking_table": {
          "style": "Tabela simples com um fundo preto semi-transparente para o contraste. Nomes dos jogadores à esquerda e pontuações à direita, com bordas finas em cinza claro."
        }
      },
      "player_character": {
        "description": "Um robô de reparos, pequeno e cúbico. Seu 'olho' (lente da câmera) brilha em amarelo. Tem um pequeno propulsor nas costas que emite um brilho azul ao pular.",
        "asset_type": "Sprite Sheet",
        "sprite_sheet_details": {
          "frame_width": "24px",
          "frame_height": "24px",
          "animations": [
            {"name": "idle", "frames": 2, "description": "Robô parado com o olho piscando."},
            {"name": "run", "frames": 4, "description": "Robô correndo com animação de movimento dos pés."},
            {"name": "jump", "frames": 1, "description": "Robô com propulsor aceso."}
          ]
        }
      },
      "enemies": [],
      "obstacles": [
        {
          "name": "rocha_solida",
          "description": "Pedaços de asteroides flutuantes. Formas irregulares e escuras.",
          "asset_type": "Static Image",
          "size": "32x32px"
        },
        {
          "name": "rocha_estilhacada",
          "description": "Bloco rachado que se parte em pequenos pedaços ao ser atingido ou após um tempo.",
          "asset_type": "Sprite Sheet",
          "sprite_sheet_details": {
            "frame_width": "32px",
            "frame_height": "32px",
            "animations": [
              {"name": "crumble", "frames": 4, "description": "Animação de um bloco se desintegrando em poeira estelar."}
            ]
          }
        }
      ],
      "collectibles": [
        {
          "name": "cosmic_shard",
          "description": "Fragmento de energia cósmica. Um cristal cintilante que irradia um brilho laranja/amarelo.",
          "asset_type": "Sprite Sheet",
          "sprite_sheet_details": {
            "frame_width": "16px",
            "frame_height": "16px",
            "animations": [
              {"name": "spin", "frames": 4, "description": "Cristal girando e cintilando."}
            ]
          }
        }
      ],
      "visual_effects": [
        {
          "name": "collision_explosion",
          "description": "Animação de uma pequena explosão de partículas azuis e brancas ao colidir com um obstáculo.",
          "type": "Particle Emitter"
        },
        {
          "name": "shard_collect_fx",
          "description": "Pequenos brilhos amarelos e laranjas que aparecem e desaparecem rapidamente quando um 'Cosmic Shard' é coletado.",
          "type": "Particle Emitter"
        },
        {
          "name": "jump_jet_trail",
          "description": "Trilha de fumaça azul e brilhante que sai do propulsor do robô ao pular.",
          "type": "Particle Emitter"
        }
      ],
      "backgrounds": [
        {
          "name": "game_background",
          "description": "Cinturão de asteroides escuro. Fundo com estrelas distantes e uma estrela morrendo que pulsa com um brilho fraco e avermelhado.",
          "asset_type": "Tiled Background",
          "tile_size": "256x144px",
          "seamless": true,
          "visual_detail_level": "Baixo (detalhes são pequenos pontos de luz e rochas distantes)"
        },
        {
          "name": "menu_background",
          "description": "Mesmo cenário de jogo, mas com o robô protagonista em destaque, de pé sobre uma plataforma.",
          "asset_type": "Static Image",
          "size": "256x144px"
        }
      ],
      "UI_elements": [
        {
          "name": "score_icon",
          "description": "Ícone de um Cosmic Shard.",
          "asset_type": "Static Image",
          "size": "8x8px"
        },
        {
          "name": "ranking_table",
          "description": "Tabela de ranking simples, com nomes e pontuações, em um estilo pixel art.",
          "asset_type": "Static Image",
          "size": "variável"
        }
      ]
    }
  },
  "project_structure": {
    "root_directory": "/",
    "directories": [
      "src/",
      "assets/images/",
      "assets/audio/",
      "assets/particles/",
      "dist/"
    ],
    "files": [
      "src/main.ts",
      "src/scenes/MenuScene.ts",
      "src/scenes/GameScene.ts",
      "webpack.config.js",
      ".gitignore",
      "index.html",
      "package.json"
    ]
  },
  "tasks": [
    "1. Gere o arquivo `package.json` com as dependências necessárias (Phaser, TypeScript, Webpack, etc.).",
    "2. Gere o arquivo `webpack.config.js` para compilar o projeto TypeScript e empacotar os assets.",
    "3. Gere o arquivo `index.html` básico, que servirá como a página do jogo.",
    "4. Gere os assets de imagem (spritesheets, imagens estáticas, backgrounds) baseados nas especificações. Salve as imagens em uma pasta virtual `assets/images/`.",
    "5. Gere os arquivos de áudio (músicas e efeitos sonoros) com base nas descrições de 'audio_assets'. Salve os áudios em uma pasta virtual `assets/audio/`.",
    "6. Gere o código TypeScript para a cena principal do jogo em `src/main.ts`, configurando o Phaser e as cenas.",
    "7. Gere o código TypeScript para a cena do menu em `src/scenes/MenuScene.ts`, incluindo botões interativos e uma opção para o ranking.",
    "8. Gere o código TypeScript para a cena de jogabilidade em `src/scenes/GameScene.ts`, incluindo a lógica de movimento do jogador, física, colisão, geração de obstáculos progressiva e efeitos visuais.",
    "9. Implemente a lógica do sistema de ranking e salvamento no `localStorage` nas cenas apropriadas.",
    "10. Implemente a lógica de controle de volume e mute do áudio."
  ],
  "output_format_instructions": "O output deve ser os arquivos de código completos e prontos para uso, formatados como blocos de código com o nome do arquivo, sua localização e o código completo. Gere também a URL para os assets de imagem e áudio, simulando a geração de arquivos. O formato deve ser claro, conciso e separado por cada arquivo."
}