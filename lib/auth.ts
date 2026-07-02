import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import { pool } from "./db"
import bcrypt from "bcryptjs"

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const identifier = String(credentials?.email || "").trim()
        const password = String(credentials?.password || "")

        if (!identifier || !password) {
          return null
        }

        const { rows } = await pool.query(
          `SELECT "id", "email", "name", "password", "role"
           FROM "User"
           WHERE lower("email") = lower($1) OR "id" = $1
           LIMIT 1`,
          [identifier]
        )
        const user = rows[0]

        if (!user?.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)
        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.role = token.role as string
      }
      return session
    },
  },
})