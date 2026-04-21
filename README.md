# Laravel Mail

A powerful, self-hosted email marketing platform built with Laravel. Take full control of your customer relationships with privacy-first Local AI Marketing Agents, automated campaigns, and a verified B2B leads database.

![Laravel Mail Dashboard](https://laravelmail.com/screens/dashboard.png)

## Features

- **Self-Hosted** - Complete data sovereignty. Your data stays on your servers.
- **Local AI Agents** - Privacy-first AI marketing agents powered by Ollama
- **Visual Campaign Builder** - Create beautiful email campaigns with an intuitive drag-and-drop interface
- **Automated Campaigns** - Set up drip sequences, behavior-triggered emails, and more
- **Verified B2B Leads Database** - Access lifetime verified B2B leads
- **Multi-Channel** - WhatsApp & Instagram integrations included
- **No Monthly Fees** - One-time purchase, lifetime access

## Screenshots

| Dashboard | Campaigns | Subscribers |
|-----------|-----------|-------------|
| ![Dashboard](https://laravelmail.com/screens/dashboard.png) | ![Campaigns](https://laravelmail.com/screens/campaigns-2.png) | ![Subscribers](https://laravelmail.com/screens/subscribers-2.png) |

| Automation | Email Templates | AI Marketing |
|------------|-----------------|--------------|
| ![Automation](https://laravelmail.com/screens/automation2.png) | ![Templates](https://laravelmail.com/screens/templates.png) | ![AI Marketing](https://laravelmail.com/screens/ai-email-marketing.png) |

## Tech Stack

- **Frontend**: [Astro](https://astro.build) with Preact
- **Styling**: Tailwind CSS
- **Deployment**: Cloudflare Pages
- **Analytics**: Google Tag Manager, Hotjar

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run astro` | Run Astro CLI |

### Environment Variables

Create a `.env` file in the root directory with required environment variables (see documentation for available options).

The `/validation` page also supports:

```bash
PUBLIC_VALIDATION_API_BASE_URL=https://validation.laravelmail.com
```

If omitted, the dashboard defaults to the production Laravel Mail Validation API.
If you serve the page from a different origin, configure a same-origin proxy or enable CORS on the validation API. On April 21, 2026, the live API did not return `Access-Control-Allow-Origin` for `Origin: https://laravelmail.com`.

## Project Structure

```
├── src/
│   ├── assets/          # Static assets (images, fonts)
│   ├── components/      # Reusable UI components
│   ├── chat/            # Chat functionality
│   ├── content/         # Content collections
│   ├── layouts/         # Page layouts
│   ├── pages/           # Route pages
│   ├── scripts/         # Build scripts
│   ├── styles/          # Global styles
│   └── typings.ts       # TypeScript definitions
├── public/              # Public static files
├── astro.config.mjs     # Astro configuration
├── tailwind.config.mjs  # Tailwind configuration
└── wrangler.jsonc       # Cloudflare Pages configuration
```

## Deployment

This project is configured for deployment on Cloudflare Pages. To deploy:

```bash
# Build the project
npm run build

# Deploy using wrangler
npx wrangler pages deploy dist
```

Or connect your repository to Cloudflare Pages for automatic deployments.

## Documentation

For full documentation, visit [laravelmail.com](https://laravelmail.com)

## Validation Dashboard

The `/validation` route provides a browser-based control panel for the Laravel Mail Validation API. It includes:

- Single-email validation via `POST /v1/filter-email`
- Spam feedback via `POST /v1/feedback/spam`
- Health and root endpoint monitoring via `GET /health` and `GET /`
- Allowlist and blocklist management via the `/v1/lists` endpoints
- Score inspection, updates, and reset controls via the `/v1/scores` endpoints

The page is client-rendered and talks directly to the configured validation API base URL.

## License

MIT License - See LICENSE file for details.

## Support

- Website: [https://laravelmail.com](https://laravelmail.com)
- Contact: [https://laravelmail.com/contact](https://laravelmail.com/contact)
