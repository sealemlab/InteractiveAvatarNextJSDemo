"use client";

import * as React from "react";
import { NextUIProvider } from "@nextui-org/system";
import { useRouter } from "next/navigation";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ThemeProviderProps } from "next-themes/dist/types";

import I18nContext, { Language, messages } from "./lib/i18n";

export interface ProvidersProps {
  children: React.ReactNode;
  themeProps?: ThemeProviderProps;
}

export function Providers({ children, themeProps }: ProvidersProps) {
  const router = useRouter();
  const [language, setLanguage] = React.useState<Language>("en");

  const i18nValue = React.useMemo(
    () => ({
      language,
      setLanguage,
      t: (key: keyof typeof messages.en) => messages[language][key],
    }),
    [language],
  );

  return (
    <NextUIProvider navigate={router.push}>
      <NextThemesProvider {...themeProps}>
        <I18nContext.Provider value={i18nValue}>
          {children}
        </I18nContext.Provider>
      </NextThemesProvider>
    </NextUIProvider>
  );
}
