---
title: 'Utilizando Agent Skills para migrar para AGP 9.0.0'
description: 'Quando o Android Gradle Plugin (AGP) 9.0.0 foi lançado em Janeiro de 2026, eu me vi diante de uma lista de projetos Android que precisavam ser migrados.'
pubDate: 'Feb 16 2026'
heroImage: '/covers/my-first-agent-skill.webp'
translationKey: 'my-first-agent-skill'
---

Quando o Android Gradle Plugin (AGP) 9.0.0 foi lançado em janeiro de 2026, eu tinha uma lista de projetos Android que precisavam ser migrados.

No início, tentei fazer as alterações manualmente, como de costume. Eu olhava as mensagens de erro no CI, tentava corrigir, mas outro erro aparecia. (Sempre acontece-me quando tenho que migrar versões de AGP)  
E como eu tinha várias outras tarefas em mãos, pensei: "Talvez eu possa automatizar isso com o [Antigravity Agent](https://antigravity.google/docs/agent)", e alguns momentos depois, veio a ideia: "Ooh, esta é uma boa oportunidade para testar essas novas Agent Skills que têm sido muito faladas\!" 💡

## O que são Agent Skills?

Segundo a definição na página oficial ([agentskills.io](http://agentskills.io)):

> Agent Skills são um formato aberto e leve para estender as capacidades de agentes de IA com conhecimento especializado e fluxos de trabalho.*
> 
> Em sua essência, uma skill é uma pasta contendo um arquivo SKILL.md. Este arquivo inclui metadados (nome e descrição, no mínimo) e instruções que dizem a um agente como realizar uma tarefa específica. Skills também podem agrupar scripts, modelos e materiais de referência.
> 
> ```
> my-skill/
> ├── SKILL.md          # Obrigatório: instruções + metadados
> ├── scripts/          # Opcional: código executável
> ├── references/       # Opcional: documentação
> └── assets/           # Opcional: modelos, recursos
> ```
> 

## Escrevendo a skill de migração

Depois de ver a estrutura da skill descrita acima, pensei: eu sei que terei que escrever o arquivo SKILL.md (já que é obrigatório), mas também poderia colar as notas de lançamento do AGP para ajudar o agente a aprender mais sobre a migração. 🤔

### 1\. Baixar as release notes em Markdown

Então comecei por:

1. Acessar as [release notes](https://developer.android.com/build/releases/agp-9-0-0-release-notes) na documentação oficial.  
2. Nessa página, cliquei em “View as Markdown” (bem ao lado do título da página)  
   <img src="/images/agp-9-release-notes.png" alt="Página de release notes do AGP 9.0.0 na documentação">
3. Gravei esse ficheiro em minha máquina local como `agp-9-0-0-release-notes.md`.

### 2\. Criando a pasta de recursos

Como eu disse antes, estou usando o Antigravity para isso, e ele [suporta](https://antigravity.google/docs/skills) dois tipos de skills: específicas do workspace ou globais. Como preciso usar esta skill em vários projetos, optei pela global, pois a específica do workspace só estaria disponível num único projeto.

As skills globais no Antigravity ficam guardadas em `~/.gemini/antigravity/skills/`, e foi lá que criei um novo diretório e colei a referência agp-9-0–0-release-notes.md que baixei anteriormente. E assim ficou a estrutura:

```
agp9-skill/
├── SKILL.md
└── references/
      └── agp-9-0–0-release-notes.md
```

### 3\. Escrevendo o SKILL.md

Comecei com o _"frontmatter"_ para definir o propósito da skill:

```
---
name: upgrade-to-agp-9.0.0
description: Use esta skill quando o usuário pedir para atualizar um projeto Android para o Android Gradle Plugin 9.0.0.
---
```

Note que, de acordo com a [especificação de Agent Skills](https://agentskills.io/specification), estes são os 2 campos obrigatórios:

* `name`: Máximo de 64 caracteres. Letras minúsculas, números e hífens apenas. Não deve começar ou terminar com hífen.  
* `description`: Máximo de 1024 caracteres. Não vazio. Descreve o que a skill faz e quando usá-la.

No entanto, você também pode ter estes campos opcionais no frontmatter: `license`, `compatibility`, `metadata`, `allowed-tools`.

### 4\. Definindo as instruções

Agora, no corpo do ficheiro `SKILL.md`, defini a lógica. Como já tinha feito algum trabalho manual, sabia quais eram alguns dos passos e armadilhas comuns, então os listei como marcadores. E no final, disse para ele verificar seu trabalho tentando compilar o projeto com `./gradlew assembleDebug`:

```
---
name: upgrade-to-agp-9.0.0
description: Use esta skill quando o usuário pedir para atualizar um projeto Android para o Android Gradle Plugin 9.0.0.
---

# Atualizar para Android Gradle Plugin 9.0.0

## Objetivo
Atualizar com segurança um projeto Android para o Android Gradle Plugin 9.0.0.

## Instruções
- Encontre todos os arquivos gradle/wrapper/gradle-wrapper.properties no projeto e atualize a distributionUrl para usar a versão 9.3.0-bin
- Encontre todos os arquivos build.gradle no projeto e remova o plugin kotlin-android
- (se necessário) remova android.defaults.buildfeatures.buildconfig=true do gradle.properties
- Substitua todos os usos de getDefaultProguardFile("proguard-android.txt") por getDefaultProguardFile("proguard-android-optimize.txt")
- se algum módulo contiver implementation("androidx.multidex:multidex:2.0.1") como dependência, remova-a. Note que isso também pode incluir a remoção de android:name="androidx.multidex.MultiDexApplication" da tag application no manifest

Ao final, certifique-se de que o projeto ainda compila executando `./gradlew assembleDebug`
```

## Colocando à prova

Abri meu primeiro projeto no Antigravity e dei o comando ao Agente: *"Por favor, migre este projeto para o AGP 9.0.0."*

Funcionou perfeitamente. O Antigravity indicou que estava lendo o ficheiro SKILL.md e o agente começou a trabalhar nas atualizações. Ele fez todas as alterações, mostrou-me o diff para eu fazer review e pediu para executar `./gradlew assembleDebug`.

Dado o sucesso deste experimento, abri [o primeiro PR](https://github.com/firebase/snippets-android/pull/674) e segui para executar a mesma Skill em outros 3 projetos ([quickstart-android](https://github.com/firebase/quickstart-android/pull/2753), [friendlyeats-android](https://github.com/firebase/friendlyeats-android/pull/290), [codelab-friendlychat-android](https://github.com/firebase/codelab-friendlychat-android/pull/363)). Para 2 dos 4 projetos, o `assembleDebug` foi concluído com sucesso.

Tive um projeto onde falhou, mas o agente conseguiu ler a mensagem de erro e aplicou a correção necessária.

E houve outro onde o agente falhou em aplicar uma correção e ficou preso em um loop iterativo a executar `assembleDebug`, depois tentar aplicar uma correção, apenas para perceber que a build ainda não compilava e continuar a tentar outras correções. Neste caso em particular, parei o agente e decidi corrigir o problema eu mesmo. (algumas semanas depois, descobri que o problema não estava totalmente resolvido, mas por algum motivo o CI passou quando abri o PR pela primeira vez - vou investigar mais a fundo)

Mas, no geral, estou feliz com o resultado.

## “Por que você não publica esta skill no GitHub?”

Meus colegas de trabalho costumam perguntar por que eu simplesmente não publico esta skill no GitHub para que todos possam usar. Mas na minha opinião, eu acho que escrevi uma skill muito adaptada à configuração específica do meu projeto. Existem outras APIs com alterações significativas no AGP 9 que minha skill não cobre e não tive a chance de testar se o agente seria capaz de ajudar a migrar essas funcionalidades (acredito fortemente que sim, já que o guia de migração em references/ também as cobre, mas não tive oportunidade de testar).

Outro ponto é o fato de que esses projetos estavam todos mudando do AGP 8 para o AGP 9. Se alguém estivesse tentando pular de uma versão mais antiga do AGP (digamos, por exemplo, AGP 7) direto para o 9, esta skill específica pode não ser robusta o suficiente para lidar com a "dupla migração". (embora eu provavelmente pudesse documentar isso no [campo de compatibilidade](https://agentskills.io/specification#compatibility-field) do frontmatter do SKILL.md)

Mas ainda assim achei que seria bom partilhar minha experiência neste blog post. 🙂

Se minha skill funciona para o seu projeto, perfeito\! Caso não, talvez você possa adaptar a lógica para atender às suas necessidades específicas.

## Conclusão

Escrever uma skill de IA personalizada para lidar com uma migração de versão me poupou horas de frustração. Se você se encontrar fazendo a mesma correção manual em vários arquivos ou projetos, recomendo fortemente dedicar um tempo para "ensinar" um agente de IA a fazer isso por você. É um investimento que vale a pena!
