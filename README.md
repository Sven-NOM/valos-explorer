# ValOS Explorer

An educational, interactive self-assessment tool for Ethereum node operators to understand their operational risk posture against the [ValOS specification](https://lidofinance.github.io/valos/valos-spec.html).

## About

ValOS Explorer helps node operators:
- **Discover risks** across 8 categories (Financial, Slashing, Downtime, Key Custody, Hacking, Infrastructure, Service Partner, Reputational)
- **Understand mitigations** tailored to their operational scale
- **Map controls** to their practices and organizational structure
- **Track implementation** progress toward the spec's requirements
- **Assess compliance** with a controls-by-risk matrix

All content is sourced directly from the [ValOS specification](https://lidofinance.github.io/valos/valos-spec.html)—nothing is invented. This tool is **educational, never pass/fail, and never a certification mechanism**.

## Features

- **Risk Discovery** — Interactive questionnaire across 74 active risks (and 21 deprecated)
- **Scale Appropriateness** — Content adapts to your operator profile (solo → enterprise)
- **Blind Spots** — Highlights risks above your scale band
- **Results** — Coverage summary by risk category with maturity assessment
- **Compliance Matrix** — Controls × Risks grid with MUST/SHOULD encoding
- **Implementation Guide** — Organize controls by organizational scope (HR, Key Management, Monitoring, etc.)
- **Dark Mode** — Theme toggle in the sidebar
- **Persistent Storage** — Your assessment is saved locally in the browser

## Getting Started

### Prerequisites
- Node.js 22+
- npm

### Installation

```bash
git clone https://github.com/Sven-NOM/valos-explorer.git
cd valos-explorer
npm install
```

### Development

```bash
npm run dev
```

Open http://localhost:5173/valos-explorer/ in your browser.

### Build

```bash
npm run build
```

The optimized app is in `dist/` and ready for deployment.

## Architecture

Built with:
- **Vue 3** — Progressive framework
- **TypeScript** — Type-safe code
- **Vite** — Next-gen build tool
- **Tailwind CSS** — Utility-first styling
- **Pinia** — State management with local persistence
- **vue-router** — Hash-based navigation

Data pipeline:
- `scripts/build-data.ts` parses the ValOS spec HTML (`references/valos-spec.html`)
- Generates `src/data/valos.json` — 74 risks, 43 mitigations, 64 controls, 4 evidence types
- Editorial overlays add scale appropriateness and level guidance without modifying spec data

## Deployment

### GitHub Pages

Automatically deployed via GitHub Actions on push to `main`:

```bash
git add .
git commit -m "Your message"
git push origin main
```

The site is live at `https://Sven-NOM.github.io/valos-explorer/`.

## Development Notes

- **Hash routing** — URLs use `/#/path` (no server rewrites needed)
- **Environment variables** — See `.env.example` for optional spec/cert URL overrides
- **Dark mode** — CSS-variable-driven; toggle via sidebar button
- **Responsive** — Works on desktop, tablet, and mobile

## Contributing

This is an educational reference implementation of the ValOS specification. Suggestions and corrections are welcome via GitHub issues.

## License

This project is licensed under the [MIT License](LICENSE) — free to use, modify, and distribute with attribution to Sven Brekelmans.

## Learn More

- [ValOS Specification](https://lidofinance.github.io/valos/valos-spec.html) — Full technical requirements
- [Lido](https://lido.fi/) — Ethereum staking protocol

---

Built with clarity and precision by [Sven Brekelmans](https://github.com/Sven-NOM).
