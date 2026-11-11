---
title: 'Trying out the Gemini Decisions API on Android'
description: 'The Gemini Decisions API has just launched and I decided to take it for a spin'
pubDate: 'Nov 11 2026'
heroImage: '/covers/gemini-decisions-1-api.jpg'
translationKey: 'trying-gemini-decisions-api'
---

The Gemini Decisions API has [just been released]() and I decided to try it out on Android and explore some use cases.
In this blog I'll share some of the experiments I ran.

Differently from Generative models, the [Gemini Decisions API]() evaluates typed questions and returns calibrated probablities.
It generates zero text tokens, which means that its responses are fast, easy to parse and your output token usage is **always 0** (because it doesn't generate text tokens).

There are three types of questions that you can send to the Gemini Decisions API:
- **Noul** - Yes/No questions to check whether a statement is true or false.
- **Choice** - Provide the model with a list of options and let it choose the most suitable option.
- **Score** - Give the model a rubric for it to rate your input against.

Let's breakdown each of these!

## Setting it up for Android (or any mobile app really)

At the time of writing, this new API is not yet available on [Firebase AI Logic](https://firebase.google.com/docs/ai-logic) - that would allow me to call the Decision model securely from the client-side (like an Android app) without setting up my own backend.

So I had to set up a tiny backend for this: a [callable Cloud function](https://firebase.google.com/docs/functions/callable). The idea is simple: my Android app calls the Cloud function, and the Cloud function will then call the Decisions API.

The Cloud function is responsible for:
- Enforcing [App Check](https://firebase.google.com/docs/app-check/cloud-functions) to make sure the request is coming from my legitimate Android app.
- Forwarding the request to the Gemini Decisions API (using the [js-genai SDK](https://github.com/googleapis/js-genai/)).

```javascript

```

## Noul - yes or no?

As I've mentioned earlier, this type of question allows you to ask the model a "yes or no" question.
To show it in action, I have created a simple demo where the user is scanning a receipt. To be considered a valid receipt, all of these need to be visible in the image: store name, prices for each item, total.

Here's what the code looks like:

```kotlin

```


## Choice - choose one

By using a choice question we could, for example, automatically select the most appropriate category where the user can file a support case based on the text they provide.

This demo shows a hypothetical app where developers can file a support case to Firebase. As the user types, the model automatically picks the most suitable Support category from this list of categories:
- Bug
- Feature Request
- Billing
- Analytics help
- General question
- Report spam
- Phishing
- Account issue

```kotlin

```


## Score - rate it from X to Y

To show you the score question, I have an example where the user is rating a restaurant they have recently visited.
As they start typing the review, the model can suggest the number of stars to give from 1-5.

```kotlin

```



## Multiple questions

Another cool feature of the API is that you can pass up to (aprox) 1000 questions (as long as you're within the input tokens limit). So you could evaluate multiple questions all at once!

Let's spice up our Camera example to validate multiple things at once:
- Are all necessary fields visible?
- What kind of expense would this classify as? (Food, Transport, Office Supplies)
- How costly was the expense?

```kotlin

```

---

And that's all for today, if you'd like to give it a try, check out the [documentation]() or try one of the [sample apps in Google AI Studio]().