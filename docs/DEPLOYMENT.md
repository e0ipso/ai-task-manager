# GitHub Pages Deployment Setup

This document provides instructions for setting up automated deployment of the documentation site to GitHub Pages.

## Prerequisites

The following files have been created and are ready for deployment:
- `docs/index.md` - Main documentation content
- `docs/_config.yml` - Jekyll configuration for Mermaid support
- `.github/workflows/docs.yml` - GitHub Actions workflow for automated deployment

## Manual Setup Required

After the GitHub Actions workflow is in place, you need to manually enable GitHub Pages in your repository settings:

### Step 1: Enable GitHub Pages

1. Go to your repository on GitHub
2. Click on **Settings** tab
3. Scroll down to **Pages** section in the left sidebar
4. Under **Source**, select **GitHub Actions**
   - This tells GitHub to use the Actions workflow instead of a branch
5. Click **Save**

### Step 2: Verify Configuration

After enabling GitHub Pages:

1. The first deployment will trigger automatically when you push changes to the `docs/` folder on the main branch
2. You can also trigger deployment manually:
   - Go to **Actions** tab
   - Select "Deploy Documentation" workflow
   - Click **Run workflow** button
3. Monitor the deployment in the Actions tab

### Step 3: Access Your Documentation

Once deployment completes (typically within 5-10 minutes):

1. Your documentation will be available at: `https://[username].github.io/[repository-name]/`
2. The exact URL will be shown in the GitHub Pages settings and workflow output

## Workflow Features

### Automatic Deployment
- Triggers on any push to the `main` branch that modifies files in `docs/`
- Uses Jekyll to build the site with Mermaid diagram support
- Deploys to GitHub Pages automatically

### Manual Deployment
- Can be triggered manually from the Actions tab
- Useful for testing or forcing a rebuild

### Concurrency Control
- Only one pages deployment can run at a time
- New deployments will wait for the current one to complete

## Troubleshooting

### Common Issues

**Workflow not triggering:**
- Ensure changes are pushed to the `main` branch
- Verify that files in the `docs/` directory were modified
- Check that GitHub Pages is configured to use GitHub Actions

**Build failures:**
- Check the Actions tab for detailed error messages
- Verify Jekyll configuration in `_config.yml`
- Ensure Markdown files have proper front matter

**Site not updating:**
- GitHub Pages may take a few minutes to reflect changes
- Clear your browser cache
- Check the deployment URL in the workflow output

### Testing Locally

To test the Jekyll build locally before deployment:

```bash
# Install Jekyll (requires Ruby)
gem install jekyll bundler

# Navigate to docs directory
cd docs

# Build and serve locally
jekyll serve

# Visit http://localhost:4000 to preview
```

## Security Notes

The workflow uses minimal permissions:
- `contents: read` - To checkout the repository
- `pages: write` - To deploy to GitHub Pages
- `id-token: write` - For secure authentication

No additional secrets or configuration are required.