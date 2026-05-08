# Code Review Dashboard

AI-powered static code analysis dashboard with actionable suggestions.


## 🚀 Live Demo

Coba aplikasi secara langsung: [code-review-dashboard](https://personalbotai.github.io/code-review-dashboard/)

[![Deploy to GitHub Pages](https://img.shields.io/badge/Deploy-GitHub%20Pages-blue?logo=github)](https://personalbotai.github.io/code-review-dashboard/)

## Features
- Multi-language static analysis (Go, JSON, Markdown)
- Severity classification (Critical, High, Medium, Low)
- Inline code snippets with line numbers
- AI-generated improvement suggestions
- Sample project for demo
- Copy code to clipboard
- Responsive Tailwind UI

## Tech
- HTML5, Tailwind CSS, Vanilla JS
- Highlight.js for syntax highlighting
- Regex-based rule engine (extensible)

## Usage
1. Open `index.html`
2. Click "Sample" to load demo project
3. Click "Analisis" to run rules
4. Click files in sidebar to view issues

## Extending Rules
Edit `rules` object in `app.js` to add more patterns per language.

## Deploy
Static site - push to GitHub Pages.
