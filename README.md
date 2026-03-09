# SnippetManager

Personal engineering knowledge base — search, save and retrieve your code solutions.

## Quick Start

```bash
npm install
npm run dev
# http://localhost:3000
```

## Deploy to GitHub Pages

1. Push repo to GitHub
2. Settings → Pages → Source: **GitHub Actions**
3. Edit `.github/workflows/deploy.yml` → change `NEXT_PUBLIC_BASE_PATH: /snippetmanager` to `/your-repo-name`
4. Push to `main` → auto-deploys

## Stack

- Next.js 14 (static export)
- Monaco Editor (VS Code)
- Fuse.js (fuzzy search)
- Tailwind CSS
- localStorage (no backend needed)
