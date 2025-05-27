import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth"; // ✅ alias must be set in tsconfig.json

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
