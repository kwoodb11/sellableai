import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export async function POST(req: Request) {
  const { email, password, name } = await req.json();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return new NextResponse("Email already registered", { status: 400 });
  }

  const hashed = await bcrypt.hash(password, 10);
  await prisma.user.create({
    data: { email, name, password: hashed },
  });

  return new NextResponse("Created", { status: 201 });
}
