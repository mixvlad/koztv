# KozDev Content Repository

This repository contains the content for the KozDev blog, powered by the [k-engine](https://www.npmjs.com/package/k-engine) static site generator.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the site:
   ```bash
   npm run build
   ```

3. Start development server:
   ```bash
   npm run serve
   ```

## Content Structure

- `content/posts/` - Blog posts in Markdown format
- `content/projects/` - Project showcases with images and videos
- `subscribers.json` - Email subscribers list

## Customization

To override default styles or templates:
- Add `static/` folder in the root to override default assets
- Add `templates/` folder in the root to override default templates

## Updating k-engine

To update to the latest version of k-engine:
```bash
npm update k-engine
```

## License

MIT 