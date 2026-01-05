# Shortly Frontend

A modern, responsive URL shortening web application built with Next.js, featuring real-time analytics, QR code generation, and JWT-based authentication.

## 🚀 Features

- **URL Shortening**: Create short URLs with optional custom codes
- **User Authentication**: Secure login/registration with NextAuth.js
- **Click Analytics**: Interactive charts showing click trends over time
- **QR Code Generation**: Generate and download QR codes for short URLs
- **URL Management**: View, edit expiration, and delete your URLs
- **Real-time Stats**: View click counts and analytics for each URL
- **Responsive Design**: Beautiful, modern UI with Tailwind CSS
- **Toast Notifications**: User-friendly feedback with react-hot-toast

## 🛠 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **UI Library**: React 19
- **Styling**: Tailwind CSS 4
- **Authentication**: [NextAuth.js v5](https://next-auth.js.org/)
- **Charts**: [Recharts](https://recharts.org/)
- **Date Handling**: [date-fns](https://date-fns.org/)
- **HTTP Client**: Axios
- **Notifications**: react-hot-toast

## 📋 Prerequisites

- Node.js 18+ and npm/yarn/pnpm
- Backend API running (see [shortly-be README](../shortly-be/README.md))
- Environment variables configured

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd shortly-fe
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8080
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-nextauth-secret-key-change-in-production
   ```

4. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | - | ✅ |
| `NEXTAUTH_URL` | Frontend URL (for NextAuth) | - | ✅ |
| `NEXTAUTH_SECRET` | Secret for NextAuth encryption | - | ✅ |

## 🏃 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 📁 Project Structure

```
shortly-fe/
├── app/
│   ├── [shortCode]/          # Dynamic route for URL redirects
│   │   └── route.ts
│   ├── api/                  # Next.js API routes (proxies to backend)
│   │   ├── analytics/
│   │   ├── auth/
│   │   ├── qrcode/
│   │   ├── shorten/
│   │   ├── stats/
│   │   └── urls/
│   ├── auth/
│   │   └── signin/           # Sign in/Sign up page
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home page
│   └── providers.tsx         # NextAuth provider
├── components/
│   ├── Header.tsx            # Navigation header
│   └── URLShortener.tsx      # Main URL shortening component
├── lib/
│   ├── api-config.ts         # API endpoint configuration
│   └── auth.ts               # NextAuth configuration
└── public/                   # Static assets
```

## 🔐 Authentication Flow

1. **Registration/Login**
   - User submits credentials on `/auth/signin`
   - Frontend calls backend `/api/v1/auth/register` or `/api/v1/auth/login`
   - Backend returns JWT token
   - NextAuth stores token in session

2. **Protected Routes**
   - NextAuth middleware checks for valid session
   - JWT token is included in API requests via `Authorization` header
   - Token is stored in `session.accessToken`

3. **Session Management**
   - Sessions are managed by NextAuth.js
   - JWT token is stored server-side in the session
   - Token expiration is handled by the backend

## 🔌 API Integration

The frontend communicates with the backend through Next.js API routes that act as proxies:

### API Routes

- `/api/shorten` - Create short URL
- `/api/urls` - Get user's URLs
- `/api/stats/[shortCode]` - Get URL stats
- `/api/analytics/[shortCode]` - Get click analytics
- `/api/urls/[shortCode]` - Update/delete URL
- `/api/auth/register` - User registration
- `/api/auth/[...nextauth]` - NextAuth endpoints
- `/api/qrcode/[shortCode]` - Get QR code

### API Configuration

All API endpoints are centralized in `lib/api-config.ts`:

```typescript
export const API_ENDPOINTS = {
  shorten: `${API_BASE_URL}/api/v1/shorten`,
  stats: (shortCode: string) => `${API_BASE_URL}/api/v1/url/${shortCode}`,
  analytics: (shortCode: string, hours?: number) => `...`,
  // ... more endpoints
}
```

## 📊 Features in Detail

### URL Shortening
- Input validation for URLs
- Optional custom short code
- Optional expiration date/time
- Real-time feedback

### Analytics Dashboard
- Interactive line charts (Recharts)
- Time range selection (6h, 12h, 24h, 3d, 7d, 14d, 30d)
- Automatic time grouping based on range
- Timezone conversion (UTC → local time)

### QR Code Generation
- Generate QR codes for any short URL
- Download QR code as PNG
- Display in stats modal

### URL Management
- View all user URLs
- Edit expiration dates
- Delete URLs
- View click statistics

## 🎨 UI Components

### Header
- Navigation bar with authentication status
- Sign in/Sign out buttons
- Responsive design

### URLShortener
- Main component for URL shortening
- URL list with stats
- Analytics modal with charts
- QR code display and download

## 🔄 Data Flow

1. **User Action** → Component state update
2. **API Call** → Next.js API route (proxy)
3. **Backend Request** → Backend API with JWT token
4. **Response** → Component state update
5. **UI Update** → React re-render

## 📱 Responsive Design

The application is fully responsive and works on:
- Desktop (1920px+)
- Tablet (768px - 1919px)
- Mobile (320px - 767px)

## 🎯 Key Features Implementation

### Timezone Handling
- Backend stores all times in UTC
- Frontend converts UTC to local timezone for display
- Uses `date-fns` for time formatting

### Analytics Time Grouping
- Automatically groups data based on time range:
  - ≤6 hours: 10-minute intervals
  - ≤12 hours: 30-minute intervals
  - ≤24 hours: 1-hour intervals
  - ≤72 hours: 6-hour intervals
  - >72 hours: 1-day intervals

### Custom Short Codes
- Validates length (3-20 characters)
- Validates format (alphanumeric + hyphens/underscores)
- Checks availability before creation
- Shows real-time validation feedback

## 🐛 Troubleshooting

### CORS Issues
- Ensure `NEXT_PUBLIC_API_URL` points to the correct backend URL
- Check backend CORS settings if applicable

### Authentication Issues
- Verify `NEXTAUTH_SECRET` is set
- Check that `NEXTAUTH_URL` matches your frontend URL
- Ensure backend JWT secret matches

### API Connection Issues
- Verify backend is running on the configured port
- Check network connectivity
- Review browser console for errors

## 🚀 Deployment

### Build for Production
```bash
npm run build
npm run start
```

### Environment Variables
Set all environment variables in your hosting platform:
- Vercel: Project Settings → Environment Variables
- Netlify: Site Settings → Environment Variables
- Other: Follow platform-specific instructions

### Recommended Platforms
- **Vercel** (recommended for Next.js)
- **Netlify**
- **AWS Amplify**
- **Railway**
- **Render**

## 📝 Notes

- All API calls go through Next.js API routes (server-side)
- JWT tokens are stored securely in NextAuth sessions
- Analytics data is converted from UTC to local timezone
- QR codes point to the frontend domain (not backend)
- Short URLs redirect through the frontend for better control

## 🔗 Related Documentation

- [Backend README](../shortly-be/README.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Recharts Documentation](https://recharts.org/)

## 📄 License

[Your License Here]
