import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { SITE_TITLE, SITE_DESCRIPTION } from '../consts';

export async function GET(context) {
	const posts = await getCollection('blog');
	return rss({
		title: SITE_TITLE,
		description: SITE_DESCRIPTION,
		site: context.site,
		items: posts.map((post) => {
			const [lang, ...slugParts] = post.id.split('/');
			const slug = slugParts.join('/').replace(/\.(md|mdx)$/, '');
			return {
				...post.data,
				link: `/${lang === 'en' ? '' : lang + '/'}blog/${slug}/`,
			};
		}),
	});
}
