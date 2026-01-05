# Shortly Frontend

A modern URL shortening web application built with Next.js, featuring real-time analytics, QR code generation, and JWT-based authentication.

## Features

- URL shortening with optional custom codes
- User authentication with NextAuth.js
- Interactive click analytics charts
- QR code generation and download
- URL management (view, edit, delete)
- Real-time statistics
- Responsive design with Tailwind CSS

## Tech Stack

- Next.js 16 (App Router)
- TypeScript
- React 19
- Tailwind CSS 4
- NextAuth.js v5
- Recharts for analytics
- date-fns for date handling

## Installation

1. Clone the repository
   ```bash
   git clone <repository-url>
   cd shortly-fe
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8080
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-nextauth-secret-key-change-in-production
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Rate Limiting

The frontend communicates with the backend API which implements rate limiting. Rate limits are enforced on the backend:

- General API: 10 req/s, burst 20
- Authentication: 5 req/s, burst 10
- URL shortening: 2 req/s, burst 5
- Redirects: 30 req/s, burst 60

If rate limits are exceeded, the backend returns a 429 Too Many Requests response. The frontend handles these errors gracefully with user-friendly notifications.
