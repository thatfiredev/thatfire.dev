---
title: 'Testando a Gemini Decisions API no Android'
description: 'A Gemini Decisions API acabou de ser lançada e eu decidi colocá-la à prova'
pubDate: 'Nov 12 2026'
heroImage: '/covers/gemini-decisions-1-api.png'
translationKey: 'trying-gemini-decisions-api'
---

A Gemini Decisions API foi [lançada ontem](https://blog.google/innovation-and-ai/technology/developers-tools/gemini-decisions-api/) e eu decidi testá-la no Android e explorar alguns casos de uso. Neste post, vou partilhar alguns dos experimentos que fiz.

Diferentemente dos modelos generativos, a [Gemini Decisions API](https://aistudio.google.com/docs/decisions-api) avalia **perguntas tipadas** e retorna probabilidades. Ela gera zero tokens de texto, o que significa que suas respostas são rápidas e fáceis de interpretar. Como ela não gera tokens de texto, o seu uso de tokens de saída é **sempre 0** (o que também significa que você não pagará pela saída).

Existem três tipos de perguntas que você pode enviar para a Gemini Decisions API:
- **Noul** - Perguntas de Sim/Não para verificar se uma afirmação é verdadeira ou falsa.
- **Choice** - Voce fornece ao modelo uma lista de opções e deixe que ele escolha a opção mais adequada.
- **Score** - Dê ao modelo uma rubrica para que ele avalie a sua entrada com base nela.

Antes de mergulharmos e detalharmos cada um deles com exemplos, vamos fazer a configuração inicial.

## Configurando para Android (ou qualquer app móvel)

No momento em que escrevo este post, esta nova API ainda não está disponível no [Firebase AI Logic](https://firebase.google.com/docs/ai-logic) - se estivesse, isso me permitiria chamar o modelo de forma segura diretamente do lado do cliente (como um app Android) sem precisar criar meu próprio backend. Mas como ainda não está, tive que configurar um pequeno backend para isso: uma [callable Cloud function)](https://firebase.google.com/docs/functions/callable). O fluxo é: meu app Android chama a Cloud function e, em seguida, a Cloud function chama a Decisions API e retorna a resposta para o app Android.

A Cloud function é responsável por:
- Aplicar o [App Check](https://firebase.google.com/docs/app-check/cloud-functions) para garantir que a requisição está vindo legitimamente do meu app Android.
- Encaminhar a requisição para a Gemini Decisions API (usando o [SDK js-genai](https://github.com/googleapis/js-genai/)).

### Escrevendo e fazendo deploy da Cloud function

Para configurar a Cloud function, precisei:
1. Executar o comando `firebase init functions`
2. Escrever o código para fazer o proxy das requisições para a API:

    ```javascript
    // functions/index.js
    const {setGlobalOptions} = require("firebase-functions");
    const {onCall} = require("firebase-functions/v2/https");
    const {defineSecret} = require("firebase-functions/params");
    const {GoogleGenAI} = require("@google/genai");
    
    setGlobalOptions({maxInstances: 10});

    const geminiApiKey = defineSecret("GEMINI_API_KEY");

    exports.createDecision = onCall({secrets: [geminiApiKey]}, async (request) => {
      const ai = new GoogleGenAI({apiKey: geminiApiKey.value()});

      return ai.decisions.create({
        model: "gemini-decision-1",
        input: request.data.input,
        questions: request.data.questions,
      });
    });
    ```

3. Configurar a minha chave de API do Gemini usando: `firebase functions:secrets:set GEMINI_API_KEY`
4. Fazer o deploy da função: `firebase deploy`

### Configurando o App Check para proteger esta implementação

Como a `createDecision` usa a minha `GEMINI_API_KEY` por baixo dos panos, deixar o endpoint aberto permitiria que qualquer pessoa com a URL a chamasse diretamente e consumisse toda a minha cota. Repare no `enforceAppCheck: true` nas opções do `onCall` acima—com essa única flag, o Cloud functions rejeita automaticamente qualquer requisição que não traga um token válido do [Firebase App Check](https://firebase.google.com/docs/app-check/cloud-functions).

No lado do Android, como estou testando localmente em vez de distribuir pelo Google Play, usei o [provedor de depuração (debug provider) do App Check](https://firebase.google.com/docs/app-check/android/debug-provider) (para um lançamento em produção, troque pelo [provedor Play Integrity](https://firebase.google.com/docs/app-check/android/play-integrity-provider)):

1. Adicione a dependência do provedor de depuração ao `app/build.gradle.kts` (usando a [BoM do Firebase](https://firebase.google.com/docs/android/learn-more#bom)):

```kotlin
implementation(platform("com.google.firebase:firebase-bom:35.1.0"))
implementation("com.google.firebase:firebase-appcheck-debug")
implementation("com.google.firebase:firebase-functions")
```

2. Inicialize o App Check dentro de uma classe `Application` personalizada (registrada via `android:name=".DecisionsApplication"` no `AndroidManifest.xml`) antes de fazer qualquer chamada a `Firebase.functions`:

```kotlin
class DecisionsApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        Firebase.initialize(context = this)
        Firebase.appCheck.installAppCheckProviderFactory(
            DebugAppCheckProviderFactory.getInstance()
        )
    }
}
```

3. Inicie o app uma vez e copie o segredo de depuração gerado no Logcat:

```
D DebugAppCheckProvider: Enter this debug secret into the allow list in the Firebase Console for your project: XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
```

4. No Console do Firebase, acesse **App Check > Apps**, abra **Manage debug tokens** no app Android clicando no menu de três pontos e adicione esse segredo. A partir daí, `Firebase.functions` anexa automaticamente um token válido do App Check a cada chamada de `createDecision`!

Agora que a função está configurada e funcionando, vamos explorar todos os tipos de perguntas.

## Noul - sim ou não?

Este tipo de pergunta permite fazer uma pergunta de "sim ou não" ao modelo - e como a Decisions API é multimodal, você pode enviar mais do que apenas texto para o modelo: também pode passar imagens, áudio, vídeo e PDFs! :)

Para mostrar isso em ação, criei uma demo simples onde o usuário escaneia um recibo. Para ser considerado um recibo válido, todos estes itens precisam estar visíveis na imagem: nome da loja, preços de cada item e valor total.

Para escanear o recibo, estou usando a [biblioteca CameraX](https://developer.android.com/media/camera/camerax) com um [ImageAnalysis.Analyzer](https://developer.android.com/media/camera/camerax/analyze) personalizado que captura frames da câmera localmente a cada 600ms e envia o frame mais recente para a Cloud function aproximadamente a cada 1,5 segundo.

Veja como fica o código para enviar o frame:

```kotlin
val request = DecisionRequest(
    input = Content.Image(
        mimeType = "image/jpeg",
        bytes = frameBytes, // array de bytes
    ),
    questions = mapOf(
        "is_valid_receipt" to Question.Noul(
            instructions = "Does this receipt clearly show the store name," +
                " an itemized breakdown with prices, and the total amount?",
            criteria = NoulCriteria(
                trueDescription = "Store name, item breakdown with prices," +
                    " and total amount are all present and legible.",
                falseDescription = "One or more of store name, itemized prices," +
                    " or total are missing or unreadable.",
            ),
        ),
    ),
)

val payload = DecisionRequestSerializer.serialize(request)
val rawData = Firebase.functions
    .getHttpsCallable("createDecision")
    .call(payload)
    .await()
    .getData()

val result = DecisionResponseDeserializer.deserialize(rawData)
val noulAnswer = result.answers?.get("is_valid_receipt") as? Answer.Noul
val isValid = (noulAnswer?.noul ?: 0.0) >= 0.5
```

<img src="/images/decisions_camera_demo.gif" alt="Demo de escaneamento de um recibo usando uma pergunta Noul de sim/não com CameraX" width="360" style="display: block; margin: 1.5rem auto;" />

## Choice - escolha uma opção

Usando uma pergunta do tipo `choice`, poderíamos, por exemplo, selecionar automaticamente a categoria mais apropriada onde o usuário pode abrir um ticket de suporte com base no texto fornecido.

Esta demo mostra um app hipotético onde desenvolvedores podem abrir um ticket de suporte para o Firebase. À medida que o usuário digita, o modelo escolhe automaticamente a categoria de suporte mais adequada a partir desta lista de categorias:
- Bug
- Feature Request (Solicitação de funcionalidade)
- Billing (Faturamento)
- Analytics help (Ajuda com Analytics)
- General question (Pergunta geral)
- Report spam (Denunciar spam)
- Phishing
- Account issue (Problema na conta)

```kotlin
val request = DecisionRequest(
    input = issueText,
    questions = mapOf(
        "support_category" to Question.Choice(
            instructions = "Choose the single best Firebase support category for" +
                " this customer support issue.",
            criteria = mapOf(
                "bug" to "Crashes, exceptions, errors, broken SDK behavior, or regressions in Firebase.",
                "feature_request" to "Requests for new Firebase capabilities, APIs, or console enhancements.",
                "billing" to "Questions or issues regarding Blaze or Spark plans, invoices, charges, payments, or refunds.",
                "analytics_help" to "Help with Google Analytics for Firebase, conversion events, funnels, audiences, or DebugView.",
                "general_question" to "General how-to questions, best practices, or Firebase documentation inquiries.",
                "report_spam" to "Reports of unsolicited spam, bot signups, SMS pumping, or automated abuse.",
                "phishing" to "Reports of suspicious emails, fake login links, credential theft, or impersonation.",
                "account_issue" to "Sign-in issues, two-factor lockouts, IAM permissions, console access, or ownership transfers.",
            ),
        ),
    ),
)

val payload = DecisionRequestSerializer.serialize(request)
val rawData = Firebase.functions
    .getHttpsCallable("createDecision")
    .call(payload)
    .await()
    .getData()

val result = DecisionResponseDeserializer.deserialize(rawData)
val choiceAnswer = result.answers?.get("support_category") as? Answer.Choice
val matchedCategory = choiceAnswer
    ?.let { SupportCategory.fromOptionId(it.choice) }
    ?: SupportCategory.GENERAL_QUESTION
```

<video controls muted loop playsinline preload="metadata" width="360" style="display: block; margin: 1.5rem auto;">
  <source src="/videos/demo_decisions_support.mp4" type="video/mp4" />
  Seu navegador não suporta a tag de vídeo.
</video>

## Score - avalie em uma escala

Para demonstrar a pergunta do tipo `score`, tenho um exemplo em que o usuário está avaliando um restaurante que visitou recentemente.
À medida que começa a digitar a avaliação, o modelo pode sugerir a quantidade de estrelas a dar, de 1 a 5.

```kotlin
val request = DecisionRequest(
    input = reviewText,
    questions = mapOf(
        "restaurant_rating" to Question.Score(
            instructions = "Score the sentiment of this restaurant review from" +
                " lowest (1 star) to highest (5 stars).",
            criteria = listOf(
                "1 star: Very negative experience; severe complaints about food quality, hygiene, or rude staff.",
                "2 stars: Below expectations; noticeable issues such as cold food, slow service, or poor value.",
                "3 stars: Neutral or mixed experience; acceptable food and service with pros and cons.",
                "4 stars: Positive experience; good food and friendly service with minor flaws at most.",
                "5 stars: Exceptional experience; enthusiastic praise for delicious food and standout service.",
            ),
        ),
    ),
)

val payload = DecisionRequestSerializer.serialize(request)
val rawData = Firebase.functions
    .getHttpsCallable("createDecision")
    .call(payload)
    .await()
    .getData()

val result = DecisionResponseDeserializer.deserialize(rawData)
val scoreAnswer = result.answers?.get("restaurant_rating") as? Answer.Score
// Os níveis de score começam no índice 0 (0..4), então somamos 1 para mapear para 1..5 estrelas
val stars = scoreAnswer?.let { (it.score.roundToInt() + 1).coerceIn(1, 5) }
```

<video controls muted loop playsinline preload="metadata" width="360" style="display: block; margin: 1.5rem auto;">
  <source src="/videos/demo_decisions_restaurant.mp4" type="video/mp4" />
  Seu navegador não suporta a tag de vídeo.
</video>

## Múltiplas perguntas

Outra funcionalidade muito top da API é que você pode enviar até (aproximadamente) 1000 perguntas (desde que esteja dentro do context window). Assim, você pode avaliar várias perguntas de uma só vez!

Vamos construir um classificador automático de receitas que avalia **6 perguntas** combinando `noul`, `choice` e `score` em uma única requisição ao escolher uma receita:
- **3 sinalizadores alimentares (`noul`)**: É vegetariana? Sem glúten? Sem lactose?
- **2 classificações (`choice`)**: Tipo de refeição e estilo de culinária
- **1 avaliação (`score`)**: Dificuldade de preparo (Fácil, Média, Difícil)

```kotlin
val request = DecisionRequest(
    input = recipeText,
    questions = mapOf(
        "is_vegetarian" to Question.Noul(
            instructions = "Is this recipe vegetarian (contains no meat, poultry, fish, or seafood)?",
        ),
        "is_gluten_free" to Question.Noul(
            instructions = "Is this recipe naturally gluten-free (contains no wheat flour, regular pasta, or bread)?",
        ),
        "is_dairy_free" to Question.Noul(
            instructions = "Is this recipe dairy-free (contains no milk, butter, cream, cheese, or buttermilk)?",
        ),
        "meal_type" to Question.Choice(
            instructions = "Which meal course best fits this recipe?",
            criteria = mealTypeCriteriaMap,
        ),
        "cuisine" to Question.Choice(
            instructions = "Which cuisine style best matches this recipe?",
            criteria = cuisineCriteriaMap,
        ),
        "difficulty" to Question.Score(
            instructions = "Rate how difficult and time-consuming this recipe is to prepare.",
            criteria = difficultyRubric,
        ),
    ),
)

val payload = DecisionRequestSerializer.serialize(request)
val rawData = Firebase.functions
    .getHttpsCallable("createDecision")
    .call(payload)
    .await()
    .getData()

val answers = DecisionResponseDeserializer.deserialize(rawData).answers
val isVegetarian = ((answers?.get("is_vegetarian") as? Answer.Noul)?.noul ?: 0.0) >= 0.5
val isGlutenFree = ((answers?.get("is_gluten_free") as? Answer.Noul)?.noul ?: 0.0) >= 0.5
val isDairyFree = ((answers?.get("is_dairy_free") as? Answer.Noul)?.noul ?: 0.0) >= 0.5
val mealType = (answers?.get("meal_type") as? Answer.Choice)?.choice
val cuisine = (answers?.get("cuisine") as? Answer.Choice)?.choice
val difficulty = (answers?.get("difficulty") as? Answer.Score)?.score
```

<video controls muted loop playsinline preload="metadata" width="360" style="display: block; margin: 1.5rem auto;">
  <source src="/videos/demo_decisions_recipes.mp4" type="video/mp4" />
  Seu navegador não suporta a tag de vídeo.
</video>

## Conclusão

Muitas funcionalidades que construímos em apps mobile não precisam, de fato, de geração de texto aberta - elas precisam apenas de uma resposta rápida e confiável para uma pergunta estruturada: *Esta imagem está nítida o suficiente? Qual categoria deve ser pré-selecionada? Quantas estrelas esta avaliação aparenta ter?*

Até agora, criar essas experiências com um LLM geralmente significava pedir a um modelo generativo uma saída estruturada em JSON e pagar pela latência e pelo custo dos tokens gerados. Com a Gemini Decisions API, você obtém probabilidades calibradas para perguntas do tipo `noul`, `choice` e `score` com **zero tokens de saída**, respostas previsíveis e a capacidade de avaliar múltiplas perguntas sobre a mesma entrada em uma única chamada.

Mesmo que chamá-la no Android atualmente exija um pequeno proxy via Cloud function protegido com App Check, a configuração leva apenas algumas linhas de código, e espero que em breve seja suportado pelo Firebase AI Logic!

Ah, e se você preferir executar a inferência diretamente no dispositivo (on-device), a biblioteca [MediaPipe Decision Maker](https://developers.google.com/edge/mediapipe/solutions/decision/decision_maker) resolve isso para você. :)

E por hoje é isso! Se quiser experimentar a Gemini Decisions API por conta própria, confira a [documentação](https://aistudio.google.com/docs/decisions-api) ou teste o [playground no Google AI Studio](https://aistudio.google.com/apps/bundled/gemini-decisions-api-playground?fullscreenApplet=true).
