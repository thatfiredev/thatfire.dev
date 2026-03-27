# 👨🏻‍💻 thatfire.dev - Rosário's Portfolio

Welcome to the source code of my personal portfolio and blog: [thatfire.dev](http://thatfire.dev).

This website is built with **Astro 5** and features a fully internationalized blog (English and Portuguese).

## 🧞 Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

## 🌍 Internationalization (i18n)

This project uses Astro's built-in i18n support. 
- **English (Default)**: `/`
- **Portuguese**: `/pt/`

Blog posts are managed in `src/content/blog/` and linked via a `translationKey` in the frontmatter to enable the language switcher and SEO hreflang tags.

## 🚀 Project Structure

Inside of the Astro project, you'll see the following folders and files:

```text
├── .agent/              # Antigravity Skills & Workflows
├── public/              # Static assets (images, fonts)
├── src/
│   ├── components/      # Localized Astro components
│   ├── content/         # Markdown/MDX Blog posts (en/pt)
│   ├── layouts/         # Shared page layouts
│   └── pages/           # Routing and page logic
├── astro.config.mjs
├── README.md
├── package.json
└── tsconfig.json
```

Astro looks for `.astro` or `.md` files in the `src/pages/` directory. Each page is exposed as a route based on its file name.

There's nothing special about `src/components/`, but that's where we like to put any Astro/React/Vue/Svelte/Preact components.

The `src/content/` directory contains "collections" of related Markdown and MDX documents. Use `getCollection()` to retrieve posts from `src/content/blog/`, and type-check your frontmatter using an optional schema. See [Astro's Content Collections docs](https://docs.astro.build/en/guides/content-collections/) to learn more.

Any static assets, like images, can be placed in the `public/` directory.

## 📝 Credit

Created using Astro's [Blog template](https://github.com/withastro/astro/tree/main/examples/blog).
This theme is based off of the lovely [Bear Blog](https://github.com/HermanMartinus/bearblog/).
