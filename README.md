# vite-plugin-markdownify

`vite-plugin-markdownify` is a Vite plugin for converting markdown files to static html files using an html template and outputting them to a folder. It also injects metadata and static site navigation data into your pages. It's a simple tool for generating incredibly fast static websites with Markdown and Vite.

## Features

- **Markdown to HTML Conversion**: Easily convert Markdown files into HTML pages.
- **Metadata Extraction**: Extract front matter and file statistics, including creation and modification dates.
- **Navigation Data Injection**: Inject page and site navigation data into the `window.markdownify` object.
- **Markdown Transformations**: Apply transformations using markdown-it and plugins.
- **Custom Templates**: Use a custom HTML template for page generation.
- **Live Updates**: Update the template live during development.
- **Draft Ignoring**: Ignore draft pages during processing.
- **Sitemap & Feed Generation**: Automatically generate `sitemap.xml` and `feed.xml`.

## Installation

```bash
npm install --save-dev vite-plugin-markdownify
# or
yarn add vite-plugin-markdownify
```

## Usage

```javascript
import { defineConfig } from 'vite';
import markdownify from 'vite-plugin-markdownify';

export default defineConfig({
  plugins: [
    markdownify({
      htmlTemplate: './index.html',
      input: './markdown',
      output: './dist',
      defaults: { // Default meta tags and fields for default `feed.xml`
        title: `Default Title`,
        author: `Author's Name`,
        description: 'Site description',
        baseUrl: `https://yoursiteexample.com`,
        "og:type": `article`
      }
    })
  ]
});
```

## Configuration

- **`template`**: HTML template path (default `'./index.html'`).
- **`input`**: Markdown files directory (default `'./markdown'`).
- **`output`**: Output directory for HTML files (default `process.cwd()`).
- **`contentPlaceholder`**: Placeholder for content script (default `<!--markdownify content-->`).
- **`metaPlaceholder`**: Placeholder for meta tags (default `<!--markdownify meta-->`).
- **`feedTemplate`**: `Feed.xml` template path. A default feed.xml template will be provided if not supplied.
- **`feedContentPlaceholder`**: If a `feedTemplate` is supplied, this specifies the string to replace with the markdown items.
- **`sitemapTemplate`**: `sitemap.xml` template path. A default `sitemap.xml` template will be provided if not supplied.
- **`sitemapContentPlaceholder`**: If a `sitemapTemplate` is supplied, this specifies the string to replace with the markdown items/urls.
- **`doNotRenderFeed`**: Disable building the `feed.xml`
- **`doNotRenderSitemap`**: Disable building the `sitemap.xml`
- **`words_per_minute`**: Optional reading time calculation (recommended `275`) presented in `readingTime` (`int` of minutes).
- **`defaults`**: Values to be merged with page meta tags. Required when using the default `feed.xml`, must include `title`, `author`, `baseUrl`, and `description` for proper rendering.

## Front Matter

Include YAML front matter in Markdown files for title, description, keywords, update and creation dates, and draft status.

```md
---
title: "Page title"
description: "Page description"
keywords: ['best site ever', 'all about penguins'].
updatedAt: str | int timestamp 
createdAt: str | int timestamp
url: '/page'
draft: false
---
```

- `createdAt`: is the creation date of the page. If this is not provided, the plugin will use the file's birth date.
- `updatedAt`: is the last update date of the page. If this is not provided, the plugin will use the file's modification date.
- `draft`: If this is true, the plugin will ignore this file during processing.
- `url` : Defaults to the file path within the markdown folder, otherwise may manually be specified.

## Renderings Option

The `renderings` option in the `vite-plugin-markdownify` configuration allows you to define custom renderings for specific files like `feed.xml` and `sitemap.xml`. It provides a flexible way to map and render content based on your pages and configuration.

Here's a breakdown of how the `renderings` option works:

- **`map`**: A function that takes a page and the configuration as arguments and returns a string. It's used to map each page to a specific format. For example, you can use it to format each page as an XML item for a feed.
- **`render`**: A function that takes the mapped pages and the configuration as arguments and returns a string. It's used to render the final content for the file. You can use it to combine the mapped pages into a complete XML feed or sitemap.

### Example

```javascript
renderings: {
  'feed.xml': {
    map: (page, config) => `
      <item>
        <title>${page.title}</title>
        <author>${page.author || defaults.author}</author>
        <pubdate>${new Date(page.createdAt).toISOString()}</pubdate>
        <description>${page.description || defaults.description}</description>
        <link>${page.absolute_url}</link>
        <guid ispermalink="true">${page.absolute_url}</guid>
      </item>`,
    render: (pages, config) => {
      const { defaults } = config
      const feed_template = `...`; // Define your feed template
      return feed_template.replace(placeholder, pages)
    }
  },
  'sitemap.xml': {
    map: (page, config) => `
      <url>
        <loc>${page.absolute_url}</loc>
        <priority>1.0</priority>
        <lastmod>${new Date(page.updatedAt).toISOString()}</lastmod>
      </url>`,
    render: (pages, config) => sitemap_template.replace(placeholder, pages)
  },
}
```

In this example, the `feed.xml` and `sitemap.xml` files are defined with custom mapping and rendering functions. The `map` function formats each page as an XML item, and the `render` function combines them into the final XML content.

The `renderings` option provides a powerful way to customize the output of specific files, giving you full control over the format and content.

## Rendered HTML

The rendered HTML will be based on a specified template, with certain placeholders being replaced with dynamic content. Specifically:
The `metaPlaceholder` will be replaced with the meta tags corresponding to the front matter of the relevant Markdown file. These meta tags include information like the title, author, description, and other metadata specific to the page. 
The `contentPlacholder` will be replaced with a script containing a javascript object structured as follows:

```html
<script>
  window.markdownify = {
    // Active page
    page: {
      "title":"The page title",
      "author":"The page author",
      "description":"The page description",
      "baseUrl":"from vite configuration defaults",
      "og:type":"default vite meta tag specified in configuration",
      "url":"front matter url",
      "updatedAt":1691423641586,
      "createdAt":1531440000000,
      "absolute_url":"combination of baseUrl from the vite configuration with the relative filepath from the relevant markdown file ignoring extension",
      "readingTime": "reading time in minutes",
      "filename":"relative file path from markdown folder, ignoring extension",
      "html": "rendered html from markdown"
    },

    // Other pages
    pages: [
      { ...other markdown file },
      { ...other markdown file },
      ...
    ]
  };
</script>
```

This structure enables seamless integration with front-end frameworks like React or Vue. You can render the active page using the data from `window.markdownify.page` and navigate to other pages represented in `window.markdownify.pages` without reloading the entire page. Such an approach would leverage client-side routing for a super fast and responsive user experience.

## Contribution & Contact

For issues or suggestions, please open an issue or submit a pull request. Feel free to contact us with any questions or suggestions.

## Disclaimer

This Software is provided "as is", without warranty. Users assume all risks and responsibilities. The author(s) and maintainer(s) will not be liable for damages or losses.

## License

MIT