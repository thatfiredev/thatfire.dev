---
name: translate-blog-post
description: Translates a blog post from English to Portuguese and saves it in the correct directory.
---

# Translate Blog Post Skill

Use this skill when you need to translate an existing English blog post to Portuguese.

## Context
English blog posts are located in `src/content/blog/en/`.
Portuguese blog posts must be placed in `src/content/blog/pt/`.

## Instructions

1. **Locate the Source**: Find the English blog post in `src/content/blog/en/`.
2. **Read Content**: Read the entire content of the English post, including the frontmatter.
3. **Determine the File Path**: The output path should be `src/content/blog/pt/[filename]`. The filename usually stays the same, but you can localize it if the slug should be different (the project handles localized slugs via the directory structure).
4. **Translate Frontmatter**:
    - `title`: Translate to Portuguese.
    - `description`: Translate to Portuguese.
    - `pubDate`: Keep the same.
    - `heroImage`: Keep the same.
    - `translationKey`: **CRITICAL**. This MUST match the `translationKey` of the English version exactly.
5. **Translate Body**:
    - Translate all text content to Portuguese.
    - Keep all Markdown formatting (headings, lists, code blocks, etc.) exactly as they are.
    - Keep local image links and external URLs the same unless a Portuguese version is preferred.
    - Preserve any HTML tags or Astro-specific syntax.
6. **Save File**: Write the translated content to the determined path in `src/content/blog/pt/`.

## Example

### English (`en/my-post.md`)
```markdown
---
title: "Welcome to my blog"
translationKey: "welcome-post"
---
Hello everyone!
```

### Portuguese (`pt/my-post.md`)
```markdown
---
title: "Bem-vindo ao meu blog"
translationKey: "welcome-post"
---
Olá a todos!
```
