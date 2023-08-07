import MarkDownIt from 'markdown-it';
import matter from "gray-matter";
import fs from 'fs-extra';
import path from 'path';
import attrs from 'markdown-it-attrs';
import markdownToken from 'markdown-it-modify-token';
import markdownFootnote from 'markdown-it-footnote';
import { URL } from 'url';

// Define the placeholders and directory paths
const MARKDOWNIFY_CONTENT_PLACEHOLDER = '<!--markdownify content-->'
const MARKDOWNIFY_META_PLACEHOLDER = '<!--markdownify meta-->'
const DEFAULT_TEMPLATE_PATH = './index.html'
const DEFAULT_MARKDOWN_DIR = path.resolve(__dirname, './markdown');
const DEFAULT_OUTPUT_DIR = process.cwd();
const DEFAULT_FEED_PLACEHOLDER = '<!-- markdown items -->'
const DEFAULT_SITEMAP_PLACEHOLDER = '<!-- markdown items -->'
const markdownIt = createMarkdownItInstance();

// Define the tags with meta data name
const META_TAGS_WITH_NAME = [
  'owner', 'author', 'application-name', 'generator', 'referrer', 'theme-color',
  'copyright', 'medium', 'language', 'description', 'keywords', 'robots', 'viewport'
];

const markdownify = (options = {}) => {

  const { input, output, defaults, contentPlaceholder, metaPlaceholder, words_per_minute, htmlTemplate, feedTemplate, feedContentPlaceholder, sitemapTemplate, sitemapContentPlaceholder, doNotRenderFeed, doNotRenderSitemap } = options;

  const config = {
    templatePath: htmlTemplate || DEFAULT_TEMPLATE_PATH,
    feedTemplate,
    sitemapTemplate,
    feedContentPlaceholder: feedContentPlaceholder || DEFAULT_FEED_PLACEHOLDER,
    sitemapContentPlaceholder: sitemapContentPlaceholder || DEFAULT_SITEMAP_PLACEHOLDER,
    doNotRenderFeed,
    doNotRenderSitemap,
    markdownDir: input || DEFAULT_DIRS.markdown,
    outputDir: output || DEFAULT_DIRS.output,
    markdownify_content_placeholder: contentPlaceholder || MARKDOWNIFY_CONTENT_PLACEHOLDER,
    markdownify_meta_placeholder: metaPlaceholder || MARKDOWNIFY_META_PLACEHOLDER,
    words_per_minute,
    defaults
  }

  return {
    name: 'vite-plugin-markdownify',
    // apply: 'all', // Apply this plugin during both development and production

    async writeBundle() {
      await renderMarkdownFiles(config);
    },

    transformIndexHtml: {
      enforce: 'pre',
      transform: (html, { path: url }) => {

        if (process.env.NODE_ENV !== 'development') {
          return html;
        }

        const pages = getFiles(config.markdownDir)
          .map(file => processFile(file, config))
          .filter(file => file)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

        const page = pages.find(p => p.filename === 'index')

        return substituteHtml(html, page, pages, config)
      }
    }
  };
};

// Function to render all markdown files in a directory
async function renderMarkdownFiles(config) {

  const template = fs.readFileSync(config.templatePath, 'utf-8'); // Read the HTML template

  const pages = getFiles(config.markdownDir)
    .map(file => processFile(file, config))
    .filter(file => file)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  pages
    .map(page => ({
      ...page,
      output: substituteHtml(template, page, pages, config)
    }))
    .map(page => makeFile(`${page.filename}.html`, config.outputDir, page.output))

  if(!config.doNotRenderSitemap) {
    makeSitemap(pages, config)
  }
  
  if(!config.doNotRenderFeed) {
    makeFeed(pages, config)
  }
}

const formatDate = date => new Date(date).getTime(); // Function to format date

// Function to process a markdown file into HTML
function processFile(file, { markdownDir, defaults, words_per_minute }) {
  const fileInfo = matter(fs.readFileSync(file, 'utf-8')); // Read the markdown file

  if (fileInfo.data.draft) { // If it is a draft, don't process it
    return false;
  }

  const stats = fs.statSync(file); // Get file statistics
  const filename = path.relative(markdownDir, file).replace(/\.md$/, '') // Get filename
  const html = markdownIt.render(fileInfo.content)

  let mergeReadingTime = {}

  if(words_per_minute) {
    mergeReadingTime.readingTime = calculateReadingTime(html, words_per_minute)
  }

  return { 
    ...defaults,
    ...fileInfo.data,
    updatedAt: formatDate(fileInfo.data.updated ? fileInfo.data.updated : stats.mtime),
    createdAt: formatDate(fileInfo.data.created),
    absolute_url: new URL(fileInfo.data.url || filename, defaults.baseUrl).href,
    ...mergeReadingTime,
    filename,
    url: fileInfo.data.url || "/" + filename,
    html
  }; // Return processed page info
}

/**
 * Counts the number of words in an html string
 * @param {string} html Expected to be the rendered html string from a markdown file
 * @return {number} Number of whole words in the html string
 */
function get_word_count(html) {
  let words = html.replace(/<[^>]*>/g," ");
  words = words.replace(/\s+/g, ' ');
  words = words.trim();

  return words.split(" ").length
}

/**
 * Returns the number of minutes an average reader would need to read a given number of words
 * @param {number} word_count The number of words to read
 * @return {number} The number of minutes it would take an average reader to read
 */
function get_reading_time(word_count, words_per_minute) {

  const reading_time_in_minutes = Math.round(word_count / words_per_minute)

  return reading_time_in_minutes
}


function calculateReadingTime(html, words_per_minute) {
  const wordCount = get_word_count(html);
  return get_reading_time(wordCount, words_per_minute);
}

function substituteHtml(template, page, pages, { markdownify_content_placeholder, markdownify_meta_placeholder } = {}) {

  const htmlInsert = `<script>
    window.markdownify = { 
      page: ${JSON.stringify(page)}, 
      pages: ${JSON.stringify(pages)} 
    };
  </script>`

  const metaInsert = Object.keys(page)
    .map(key => createMetaTag(page, key))
    .join('');

  return template
    .replace(markdownify_content_placeholder, htmlInsert)
    .replace(markdownify_meta_placeholder, metaInsert)
}

function makeSitemap(pages, { outputDir, sitemapTemplate, sitemapContentPlaceholder }) {

  let sitemap_template;

  if(sitemapTemplate) {
    sitemap_template = fs.readFileSync(sitemapTemplate, 'utf-8');
  } else {
    sitemap_template = `<?xml version="1.0" encoding="utf-8" ?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">${sitemapContentPlaceholder}
</urlset>`;
  }

  const sitemap_string = pages
    .map(file => {
      return `
  <url>
    <loc>${file.absolute_url}</loc>
    <priority>1.0</priority>
    <lastmod>${new Date(file.updatedAt).toISOString()}</lastmod>
  </url>`})
    .join("");

  let sitemap_html = sitemap_template.replace(
    sitemapContentPlaceholder,
    sitemap_string
  );

  makeFile(`sitemap.xml`, outputDir, sitemap_html)
}

function makeFeed(pages, { outputDir, defaults, feedTemplate, feedContentPlaceholder } = {}) {

  let feed_template;

  if(feedTemplate) {
    feed_template = fs.readFileSync(feedTemplate, 'utf-8');
  } else {
    feed_template = `<?xml version="1.0" encoding="utf-8" ?>
    <rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
      <channel>
        <title>${defaults.title}</title>
        <author>${defaults.author}</author>
        <link>${defaults.baseUrl}</link>
        <description>${defaults.description}</description>
        <atom:link href="${defaults.baseUrl}/feed.xml" rel="self" type="application/rss+xml"></atom:link>${feedContentPlaceholder}
      </channel>
    </rss>`;
  }

  const feed_string = pages
    .filter(file => !['home', 'index', 'privacy-policy', 'about', 'contact', 'analytics', 'missing', '404'].includes(file.filename))
    .filter(file => file.draft !== true)
    .map(file => {
      return `
      <item>
        <title>${file.title}</title>
        <author>${file.author || defaults.author}</author>
        <pubdate>${new Date(file.createdAt).toISOString()}</pubdate>
        <description>${file.description || defaults.description}</description>
        <link>${file.absolute_url}</link>
        <guid ispermalink="true">${file.absolute_url}</guid>
      </item>`;
    })
    .join("");

  let feed_xml = feed_template.replace(feedContentPlaceholder, feed_string);

  makeFile(`feed.xml`, outputDir, feed_xml)
}

function makeFile(filename, outputDirectory, content) {
  const outputPath = path.join(outputDirectory, filename);
  fs.ensureDirSync(path.dirname(outputPath)); // Create directories if they don't exist
  fs.writeFileSync(outputPath, content); // Write HTML to output file
}

// Function to create a meta tag based on key and content
function createMetaTag(page, key) {

  const content = page[key]

  const dismiss = [
    'html',
    'url',
    'baseUrl',
    'created',
    'updated',
    'draft',
    'filename',
    'readingTime',
  ]

  if(dismiss.includes(key)) { return ''; }

  // Define templates for creating meta tags based on key
  const templates = {
    title: () => `
  <title>${content}</title>
  <meta name="pagename" content="${content}" />
  <meta property="og:title" content="${content}" />
  <meta name="twitter:title" content="${content}" />`,
    author: () => `
  <meta name="author" content="${content}" />
  <meta property="article:author" content="${content}" />`,
    description: () => `
  <meta name="description" content="${content}" />
  <meta property="og:description" content="${content}" />
  <meta name="twitter:description" content="${content}" />`,
    absolute_url: () => `
  <meta name="url" content="${content}" />
  <meta property="og:url" content="${content}" />
  <meta name="identifier-URL" content="${content}" />`,
    updatedAt: () => `
  <meta property="article:modified_time" content="${new Date(content).toISOString()}" />`,
    createdAt: () => `
  <meta property="article:published_time" content="${new Date(content).toISOString()}" />`,
    default: () => META_TAGS_WITH_NAME.includes(key) ? `
  <meta name="${key}" content="${content}" />`: `
  <meta property="${key}" content="${content}" />`
  };

  return (templates[key] || templates.default)();
}

function getFiles(dirPath, files_ = []) {
  const files = fs.readdirSync(dirPath); // Read all files in directory
  for (let file of files) { // Iterate through all files
    let name = path.join(dirPath, file);
    if (fs.statSync(name).isDirectory()) { // If the file is a directory, recurse
      getFiles(name, files_);
    } else {
      // Only add the file to the list if it has a .md extension
      if (path.extname(file) === '.md') {
        files_.push(name); // If the file is not a directory, add it to the list
      }
    }
  }
  return files_; // Return the list of files
}

// Function to create an instance of markdownIt with required options and plugins
function createMarkdownItInstance() {
  return MarkDownIt({ html: true, linkify: false, typographer: false })
    .use(attrs)
    .use(markdownToken)
    .use(markdownFootnote);
}

export default markdownify;