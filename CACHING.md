# Caching in the Project

## Overview

The project uses multi-level caching to optimize build times:

1. **Local image caching** – based on SHA-1 hashes of file contents
2. **GitHub Actions caching** – caches processed images and dependencies
3. **Node.js dependency caching** – caches `node_modules` for faster installs

## Local Image Caching

### How it Works

The `shouldRegenerateFile()` function compares the SHA-1 hashes of the source and destination files:

```javascript
const sourceHash = hashContent(sourceBuf);
const destHash = hashContent(destBuf);
if (sourceHash !== destHash) {
    // File changed, needs regeneration
    return true;
}
```

### Benefits

- **Accuracy**: Hashes reliably detect any content changes
- **Cross-platform**: Works correctly on all OSes (including Windows)
- **Performance**: Avoids unnecessary processing of unchanged files

### Debug Flags

- `--force-regenerate`: Forces regeneration of all images
- `--clean`: Cleans the output directory before building

## GitHub Actions Caching

### Image Cache

```yaml
key: images-${{ hashFiles('content/**/*.{png,jpg,jpeg}', 'static/**/*.{png,jpg,jpeg}') }}-code-${{ hashFiles('build.js', 'lib/**/*.js', 'package.json') }}
```

**The cache key includes:**
- Hash of all images in `content/` and `static/`
- Hash of build logic (`build.js`, `lib/**/*.js`, `package.json`)

**Benefits:**
- Cache is invalidated if images or build logic change
- Prevents use of outdated processed images
- Fallback to partial matches if only some files change

### Dependency Cache

```yaml
key: ${{ runner.os }}-node-${{ hashFiles('**/package-lock.json') }}
```

Caches `node_modules` for faster dependency installation.

## Testing Caching

```bash
npm run test:cache
```

This script checks:
1. Handling of non-existent files
2. Hash comparison for existing files
3. The `--force-regenerate` flag

## Recommendations

### For Development

1. Use `--watch` for automatic rebuilds
2. If you encounter cache issues, use `--force-regenerate`
3. Regularly run `npm run test:cache` to verify caching logic

### For CI/CD

1. Cache is automatically invalidated on changes
2. For critical changes in image processing logic, you can manually clear the cache in the repository settings
3. Monitor build times in GitHub Actions for cache effectiveness

## Troubleshooting

### Cache not working on Windows

- Ensure `shouldRegenerateFile()` is used instead of modification time checks
- Check file permissions
- Use `--force-regenerate` for debugging

### Outdated GitHub Actions cache

- Cache is automatically invalidated on code changes
- You can manually clear the cache in repository settings if needed
- Check build logs for cache-related errors

### Slow builds

- Ensure dependency cache is working
- Verify that images are being cached correctly
- Consider optimizing image sizes if needed 