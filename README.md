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
      template: './path/to/template.html',
      input: './path/to/markdown',
      output: './path/to/output',
      contentPlaceholder: `<!--markdownify content-->`,
      metaPlaceholder: `<!--markdownify meta-->`,
      words_per_minute: 275, // Optional reading time calculation
      defaults: { // Default meta tags and fields for `feed.xml`
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
- **`words_per_minute`**: Optional reading time calculation (recommended `275`) presented in `readingTime` (`int` of minutes).
- **`defaults`**: Values to be merged with page meta tags. Required for `feed.xml`, must include `title`, `author`, `baseUrl`, and `description` for proper rendering.

## Front Matter

Include YAML front matter in Markdown files for title, description, keywords, update and creation dates, and draft status.

```md
---
title: "Page title"
description: "Page description"
keywords: ['best site ever', 'all about penguins'].
updatedAt: str | int timestamp 
createdAt: str | int timestamp
draft: false
---
```

- `createdAt`: is the creation date of the page. If this is not provided, the plugin will use the file's birth date.
- `updatedAt`: is the last update date of the page. If this is not provided, the plugin will use the file's modification date.
- `draft`: If this is true, the plugin will ignore this file during processing.

## Contribution & Contact

For issues or suggestions, please open an issue or submit a pull request. Feel free to contact us with any questions or suggestions.

## Disclaimer

This Software is provided "as is", without warranty. Users assume all risks and responsibilities. The author(s) and maintainer(s) will not be liable for damages or losses.

## License

MIT