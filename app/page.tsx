"use client";

import { Suspense } from "react";

import InteractiveAvatar from "@/components/InteractiveAvatar";

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <main className="flex min-h-screen flex-col items-center justify-between">
        <InteractiveAvatar />
      </main>
    </Suspense>
  );
}
