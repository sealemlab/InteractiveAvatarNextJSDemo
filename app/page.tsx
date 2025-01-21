"use client";

import InteractiveAvatar from "@/components/InteractiveAvatar";
export default function App() {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col items-start justify-start gap-5 mx-auto pt-5 pb-5">
        <div className="w-full">
          <InteractiveAvatar />
        </div>
      </div>
    </div>
  );
}
