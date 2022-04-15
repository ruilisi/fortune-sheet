module.exports = {
	base: '/fortune-sheet-docs/',
	locales: {
		// 键名是该语言所属的子路径
		// 作为特例，默认语言可以使用 '/' 作为其路径。
		'/': {
			lang: 'en-US', // 将会被设置为 <html> 的 lang 属性
			title: 'FortuneSheet Document',
			description: 'FortuneSheet is an online spreadsheet component library that provides out-of-the-box features just like Excel. This site contains official configuration document, API, and tutorial.'
		},
		'/zh/': {
			lang: 'zh-CN',
			title: 'FortuneSheet文档',
			description: 'FortuneSheet是一款类似Excel的开箱即用的在线表格组件。本站包含官方配置文档，API，教程。'
		},
		
	},
	themeConfig: {
		domain: 'https://ruilisi.github.io/fortune-sheet-demo/',
		author: 'Ruilisi',
		// 仓库地址
		repo: 'ruilisi/fortune-sheet',
		// 允许编辑链接文字
		editLinks: true,
		// 仓库的文档目录 
		docsDir: 'docs',
		// 页面滚动
		smoothScroll: true,
		locales: {
			'/': {
				selectText: 'Languages',
				label: 'English',
				ariaLabel: 'Select language',
				editLinkText: 'Edit this page on GitHub',
				lastUpdated: 'Last Updated',
				serviceWorker: {
					updatePopup: {
						message: "New content is available.",
						buttonText: "Refresh"
					}
				},
				nav: [
					{ text: 'Home', link: '/' },
					{ text: 'Guide', link: '/guide/' },
					{ text: 'Demo', link: 'https://ruilisi.github.io/fortune-sheet-demo/' },
				],
				// 侧边栏 
				sidebar: {
					'/guide/': [
						'',
						'config',
						'sheet',
						'cell',
						'op',
						'api',
						'FAQ',
						'contribute'
					],
				},
			},
			'/zh/': {
				// 多语言下拉菜单的标题
				selectText: '选择语言',
				// 该语言在下拉菜单中的标签
				label: '简体中文',
				ariaLabel: '选择语言',
				// 编辑链接文字
				editLinkText: '在 GitHub 上编辑此页',
				lastUpdated: '上次更新',
				// Service Worker 的配置
				serviceWorker: {
					updatePopup: {
						message: "发现新内容可用.",
						buttonText: "刷新"
					}
				},
				// 导航栏
				nav: [
					{ text: '首页', link: '/zh/' },
					{ text: '指南', link: '/zh/guide/' },
					{ text: '演示', link: 'https://ruilisi.github.io/fortune-sheet-demo/' },
				],
				// 侧边栏 
				sidebar: {
					'/zh/guide/': [
						'',
						'config',
						'sheet',
						'cell',
						'op',
						'api',
						'FAQ',
						'contribute'
					],
				},
			},
			
		},	
	},
	plugins: {
		'sitemap': {
			hostname: 'https://ruilisi.github.io/fortune-sheet-demo/',
			dateFormatter: val => {
				return new Date().toISOString()
			}
		},
		'vuepress-plugin-code-copy': true,
		'seo': {
			siteTitle: (_, $site) => $site.title,
			title: $page => $page.title,
			description: $page => $page.frontmatter.description,
			author: (_, $site) => $site.themeConfig.author,
			tags: $page => $page.frontmatter.tags,
			twitterCard: _ => 'summary_large_image',
			type: $page => ['guide'].some(folder => $page.regularPath.startsWith('/' + folder)) ? 'article' : 'website',
			url: (_, $site, path) => ($site.themeConfig.domain || '') + path,
			image: ($page, $site) => $page.frontmatter.image && (($site.themeConfig.domain && !$page.frontmatter.image.startsWith('http') || '') + $page.frontmatter.image),
			publishedAt: $page => $page.frontmatter.date && new Date($page.frontmatter.date),
			modifiedAt: $page => $page.lastUpdated && new Date($page.lastUpdated),
		}
	}
}