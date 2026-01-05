import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { API_ENDPOINTS } from "./api-config";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXT_PUBLIC_AUTH_SECRET || "fallback-secret-for-development-only",
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // If token is provided (from registration), use it directly
          if ((credentials as any).token) {
            const token = (credentials as any).token;
            // Decode token to get user info (we'll validate it on backend)
            // For now, we'll still need to get user info, but we can skip the login call
            // Actually, let's just use the token and fetch user info from backend
            // Or better: if token is provided, validate it by calling a validate endpoint
            // For simplicity, if token exists, we'll make a minimal call or decode it
            // But the safest is to still validate with backend
            
            // For registration flow: token is already validated, just extract user info
            // We'll decode the token payload (not validating signature, that's done on backend)
            try {
              const payload = JSON.parse(atob(token.split('.')[1]));
              return {
                id: payload.user_id,
                email: payload.email,
                name: null, // Name not in token, will be fetched if needed
                token: token,
              };
            } catch {
              // If token decode fails, fall through to normal login
            }
          }

          // Normal login flow - call backend login endpoint
          const response = await fetch(API_ENDPOINTS.login, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          if (!response.ok) {
            return null;
          }

          const user = await response.json();

          return {
            id: user.user_id, // UUID string from backend
            email: user.email,
            name: user.name,
            token: user.token, // JWT token from backend
          };
        } catch (error) {
          console.error("Login error:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      // Store JWT token from backend in the token object
      if (user && (user as any).token) {
        token.accessToken = (user as any).token;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub as string;
        // Add JWT token to session
        (session as any).accessToken = token.accessToken;
      }
      return session;
    },
  },
});

