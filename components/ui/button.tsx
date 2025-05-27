// src/components/ui/button.tsx
"use client";

import React, { ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "outline" | "link" | "ghost" | "primary";
  size?: "sm" | "md" | "lg";
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...props
}: ButtonProps) {
  // Simple Tailwind defaults—tweak to taste
  const base = "rounded px-4 py-2 font-semibold transition ";
  const colours = {
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    outline: "bg-white border border-gray-300 hover:border-blue-500",
    link: "bg-transparent underline text-blue-600 hover:text-blue-700",
    ghost: "bg-transparent hover:bg-gray-100",
  }[variant];
  const sizes = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  }[size];

  return (
    <button className={`${base} ${colours} ${sizes} ${className}`} {...props}>
      {children}
    </button>
  );
}
