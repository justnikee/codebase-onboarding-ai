import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

const handler = NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID as string,
      clientSecret: process.env.GITHUB_SECRET as string,
      authorization: {
        params: {
          scope: "read:user user:email repo", // Request repo scope to analyze private repos
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        // First sign-in: store GitHub info and sync user to backend DB
        token.accessToken = account.access_token;
        token.githubId = String((profile as any).id ?? "");
        token.name = (profile as any).name ?? token.name;
        token.email = (profile as any).email ?? token.email;
        token.avatarUrl = (profile as any).avatar_url ?? null;

        // Sync user to Supabase via backend – best effort, never blocks sign-in
        try {
          const res = await fetch(`${BACKEND_URL}/api/auth/sync`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              githubId: token.githubId,
              email: token.email,
              name: token.name,
              avatarUrl: token.avatarUrl,
            }),
          });
          if (res.ok) {
            const json = await res.json();
            token.userId = json.userId ?? null;
          }
        } catch (err) {
          // DB not available – app still works without persistence
          console.warn("[auth] Failed to sync user to backend:", err);
        }
      }
      return token;
    },
    async session({ session, token }: any) {
      session.accessToken = token.accessToken;
      session.userId = token.userId ?? null; // Supabase UUID, may be null if DB not configured
      session.githubId = token.githubId ?? null;
      return session;
    },
  },
});

export { handler as GET, handler as POST };
