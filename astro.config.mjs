import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import expressiveCode from 'astro-expressive-code';

import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
	site: 'https://thatfire.dev',
	integrations: [
		expressiveCode({
			themes: ['dark-plus', 'github-light'],
		}),
		mdx(), sitemap()],
	i18n: {
		defaultLocale: 'en',
		locales: ['en', 'pt'],
		routing: {
			prefixDefaultLocale: false,
		},
	},
});
