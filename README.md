# Personal Blog

A simple static blog built with Markdown and a minimal set of technologies.

## Project Structure

```
.
├── content/          # Markdown files for posts and projects
├── docs/             # Generated HTML files (for GitHub Pages)
├── static/           # Static files (CSS, images, JS)
├── templates/        # HTML templates
├── build.js          # Build script (entry point)
├── serve.js          # Local development server
├── lib/              # Helper modules (image processing, markdown, etc.)
├── scripts/          # Utility scripts (import, cleanup, etc.)
├── package.json      # Project dependencies and scripts
├── CACHING.md        # Caching documentation
```

## Installation

1. Install Node.js (if not already installed)
2. Clone the repository
3. Install dependencies:
   ```bash
   npm install
   ```

## Available Commands

| Command                | Description                                                      |
|------------------------|------------------------------------------------------------------|
| `npm run build`        | Build the site into the `docs/` directory                        |
| `npm run serve`        | Start the local development server (http://localhost:3000)        |
| `npm run dev`          | Run build in watch mode and start live-reload server             |
| `npm run dev:build`    | Build the site in watch mode (rebuild on file changes)            |
| `npm run dev:serve`    | Start only the live-reload server (serves `docs/`)                |
| `npm run import`       | Import a single post from an external source                      |
| `npm run import:all`   | Import all posts from external sources                            |
| `npm run import:project`| Import a single project from an external source                  |
| `npm run import:projects`| Import all projects from external sources                       |
| `npm run sort:posts`   | Sort posts in the main index                                      |
| `npm run cleanup:posts`| Remove unused files from the posts directory                      |
| `npm run sync:project-media`| Sync project media files                                      |
| `npm run test:cache`   | Test the image caching logic                                      |

## Usage

### Creating a New Post

1. Create a new folder in `content/posts/` with your post's name
2. Create an `index.md` file in that folder
3. Add front matter to the top of the file:
   ```markdown
   ---
   title: Post Title
   date: 2024-03-20
   ---

   Post content goes here...
   ```

### Local Development

Start the local development server:
```bash
npm run serve
```
The site will be available at http://localhost:3000

### Building the Site

To build the site:
```bash
npm run build
```
The generated files will be in the `docs/` directory.

### Automatic Deployment to GitHub Pages

The project is set up for automatic deployment to GitHub Pages on every push to the `main` or `master` branch.

#### Setup:

1. **Enable GitHub Pages** in your repository settings:
   - Go to Settings → Pages
   - Under "Source", select "Deploy from a branch"
   - Choose the `gh-pages` branch (created automatically)
   - Click "Save"

2. **GitHub Actions** will automatically:
   - Run on push to the main branch
   - Install dependencies
   - Build the project
   - Deploy to the `gh-pages` branch

See [DEPLOYMENT.md](DEPLOYMENT.md) for more details.

## Caching

The project uses multi-level caching to speed up builds, both locally and in CI:
- **Local image caching**: Based on SHA-1 hashes of file contents
- **GitHub Actions caching**: Caches processed images and dependencies, and automatically invalidates the cache if image files or build logic change
- **Node.js dependency caching**: Caches `node_modules` for faster installs

See [CACHING.md](CACHING.md) for full details and troubleshooting.

## Technologies

- Markdown for content
- Node.js for build scripts
- Express for local development server
- GitHub Pages for hosting
- GitHub Actions for CI/CD and deployment 