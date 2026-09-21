"use client";

import * as React from "react";
import { SessionProvider as NextAuthSessionProvider } from "next-auth/react";

type SessionProviderProps = React.ComponentProps<typeof NextAuthSessionProvider>;

export function SessionProvider({ children, ...props }: SessionProviderProps) {
  return <NextAuthSessionProvider {...props}>{children}</NextAuthSessionProvider>;
}
