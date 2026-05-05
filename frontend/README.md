# NirnayAI Frontend

Professional React-based frontend for the NirnayAI tender evaluation system.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Features

- **Branding Page**: Professional introduction to NirnayAI
- **Authentication**: Secure login with JWT tokens
- **Dashboard**: Real-time overview of active tenders and evaluations
- **Tender Management**: Upload and manage tender documents
- **AI Evaluation**: View AI-powered evaluation results
- **Human Review**: Override AI decisions with justification
- **Reporting**: Generate and sign off on reports
- **Audit Logs**: Track all system activities
- **Multilingual Support**: English, Hindi, and Kannada

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State Management**: Zustand
- **Internationalization**: i18next
- **HTTP Client**: Axios
- **Routing**: React Router

## Environment Setup

1. Copy `.env.example` to `.env`
2. Update `VITE_API_URL` to match your backend URL
3. Start the development server

## Project Structure

```
frontend/
├── public/
│   └── images/           # Generated background images
├── src/
│   ├── components/       # Reusable UI components
│   ├── pages/           # Page components
│   ├── stores/          # Zustand state management
│   ├── services/        # API service layer
│   ├── i18n/            # Internationalization
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   └── index.css        # Global styles with animations
├── index.html           # HTML entry point
└── vite.config.ts       # Vite configuration
```

## API Integration

All API calls are made through `/src/services/api.ts`. The service includes:

- Authentication endpoints
- Tender management
- Criteria extraction and confirmation
- Bidder management
- Evaluation triggering and results
- Review queue and verdict overrides
- Reports generation and sign-off
- Audit log retrieval

## Animations

The frontend includes smooth animations powered by Framer Motion:

- Count-up number animations on dashboard cards
- Hover scale effects on interactive elements
- Staggered fade-in animations for lists
- Smooth page transitions
- Loading spinners and progress indicators

## Styling

Tailwind CSS is used with custom color tokens:

- **Primary**: Deep Blue (#1E40AF) for primary actions
- **Success**: Emerald Green (#059669) for eligible/passed
- **Warning**: Amber (#D97706) for needs review
- **Danger**: Crimson Red (#DC2626) for ineligible/failed

## Language Support

Currently supported languages:

- English (en)
- Hindi (hi)
- Kannada (kn)

Language preference is saved in localStorage and synced automatically.

## Performance

- Lazy loading for route-based code splitting
- Optimized component renders with Framer Motion
- Efficient state management with Zustand
- API response caching where appropriate

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development Tips

1. Use the demo credentials in login: `officer@example.com` / `password123`
2. Console logs are prefixed with `[v0]` for debugging
3. All features are integrated with the backend API
4. No mock data is used - all data comes from the backend

## Deployment

Build the frontend for production:

```bash
npm run build
```

The compiled files will be in the `dist/` directory, ready for deployment to any static hosting service.
