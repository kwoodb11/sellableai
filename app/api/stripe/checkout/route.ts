import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
const prisma = new PrismaClient();


export async function POST() {
  // 🔐 Auth check
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user?.email) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // 🔍 Look up user in DB
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email },
  });

  if (!dbUser) {
    return new NextResponse("User not found", { status: 404 });
  }

  // 💳 Create or reuse Stripe customer
  let stripeCustomerId = dbUser.stripeCustomerId;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({ email: user.email });
    stripeCustomerId = customer.id;

    await prisma.user.update({
      where: { email: user.email },
      data: { stripeCustomerId },
    });
  }

  // 🧾 Create Stripe Checkout session
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    mode: "subscription",
    line_items: [
      {
        price: "price_XXX", // ← Replace with your Stripe Price ID
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
