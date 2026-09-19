# 🧠 NeuroAdapt AI

An adaptive learning prototype that changes the *whole* learning experience, not just the difficulty. It builds a live **learner digital twin** from behaviour (accuracy, response time, error streaks) and adapts difficulty, content format, guidance and accessibility, then **explains why**.

Plain HTML, CSS and JavaScript. No build step, no backend, no dependencies.

## Run locally
Open `index.html` in a browser, or run `npx serve .`

## Deploy
- **GitHub Pages:** push the repo, then Settings → Pages → Deploy from branch → `main` / root.
- **Netlify / Vercel:** import the repo. Leave build command empty and set the publish directory to `.`

## Push to GitHub
```bash
git init
git add .
git commit -m "NeuroAdapt AI hackathon prototype"
git branch -M main
git remote add origin https://github.com/<you>/neuroadapt-ai.git
git push -u origin main
```

## How it works
| Signal | Rule (in `app.js`, `decide()`) |
|---|---|
| 2 wrong in a row, or a wrong answer slower than 8s | Propose: lower difficulty, visual content, step-by-step guidance. The learner approves it with **Apply adaptation**. |
| 2 correct in a row with average time under 6s | Auto-raise difficulty and return to text. |
| Cognitive load ≥ 60 / 70 / 75 | Auto-enable larger text and reduced motion / simpler instructions / read-aloud. All can be switched off. |

**Try it:** answer two questions wrong, then click *Apply adaptation* and *Explain my adaptation*. Then answer several correctly to watch difficulty rise.

**Prototype vs production:** rule-based engine now; replace `decide()` with an ML learner model later. Behavioural data is simulated in the browser, and nothing is sent anywhere.

## Files
`index.html` layout · `style.css` styling · `app.js` engine and UI · `README.md`
