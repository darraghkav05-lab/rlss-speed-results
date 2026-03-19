# RLSS Speeds Results Site

Upload these files to the same folder in your GitHub repository:

- `index.html`
- `style.css`
- `script.js`
- `results.json`

Then enable GitHub Pages for that repo.

This version expects `results.json` to be a JSON array with rows shaped like:

```json
{
  "year": 2024,
  "event": "Female 50m Manikin Carry",
  "age_group": "15/18",
  "place": 1,
  "name": "Example Swimmer",
  "club": "Example Club",
  "time": "38.41",
  "status": "OK"
}
```
