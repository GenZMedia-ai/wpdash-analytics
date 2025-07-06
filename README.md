# WPDash - WhatsApp Click Tracking Dashboard

A real-time analytics dashboard for tracking WhatsApp button clicks on websites.

## Features

- 📊 Real-time click tracking with 60-second refresh
- 🌍 Geographic visualization with world heatmap
- 📱 Device and browser analytics
- 🎯 UTM campaign tracking
- 🔥 Button interaction heatmaps
- 🌐 Multi-language support (Arabic & English)
- 🏆 Gulf region optimized

## Quick Start

### 1. Deploy PHP Tracking Endpoint
See [PHP_DEPLOYMENT_GUIDE.md](PHP_DEPLOYMENT_GUIDE.md)

### 2. Configure Google Tag Manager
See [GTM_CONFIGURATION_GUIDE.md](GTM_CONFIGURATION_GUIDE.md)

### 3. Deploy Dashboard
```bash
cd dashboard
npm install
npm run build
```

## Documentation

- **Complete System Documentation**: [CLAUDE.md](CLAUDE.md)
- **PHP Deployment**: [PHP_DEPLOYMENT_GUIDE.md](PHP_DEPLOYMENT_GUIDE.md)
- **GTM Setup**: [GTM_CONFIGURATION_GUIDE.md](GTM_CONFIGURATION_GUIDE.md)

## Tech Stack

- Next.js 14 + TypeScript
- Supabase (PostgreSQL + Edge Functions)
- Google Tag Manager
- Tailwind CSS + Recharts

## Environment Variables

Create `.env.local` in the dashboard directory:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## License

MIT License - see LICENSE file for details