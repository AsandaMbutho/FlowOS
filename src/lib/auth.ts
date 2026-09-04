import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/lib/db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        console.log("=== LOGIN ATTEMPT ===");
        console.log("Raw credentials:", JSON.stringify(credentials));

        const email = credentials?.email?.trim().toLowerCase();
        const password = credentials?.password?.trim();

        console.log("Normalized email:", JSON.stringify(email));
        console.log("Password length:", password?.length);

        if (!email || !password) {
          console.log("FAILED: missing email or password");
          throw new Error("Invalid credentials");
        }

        const user = await db.user.findUnique({
          where: { email },
        });

        console.log(
          "USER FOUND:",
          user ? `${user.id} (${user.email})` : "NONE",
        );

        if (!user || !user.password) {
          console.log("FAILED: no user or no password field on user");
          throw new Error("Invalid credentials");
        }

        console.log("Stored hash:", user.password);

        const isCorrectPassword = await bcrypt.compare(password, user.password);

        console.log("PASSWORD MATCH:", isCorrectPassword);

        if (!isCorrectPassword) {
          console.log("FAILED: password mismatch");
          throw new Error("Invalid credentials");
        }

        console.log("LOGIN SUCCESS:", user.email);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
