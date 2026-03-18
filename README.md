# RLSS Speeds Results Site

A static HTML/CSS/JS site for browsing RLSS speeds results.

## Files
- `index.html` - page layout
- `style.css` - styles
- `script.js` - filtering and table rendering
- `results.json` - result data

## Run locally
Because the site uses `fetch('results.json')`, open it with a local server instead of double-clicking the HTML file.

### Option 1: Python
```bash
cd rlss-site
python -m http.server 8000
```
Then open `http://localhost:8000`

## Put on GitHub Pages
1. Create a GitHub repo
2. Upload all files from this folder
3. In GitHub: Settings -> Pages
4. Source: Deploy from a branch
5. Branch: `main` and folder `/root`
6. Save

Your site will go live on a `github.io` URL.
