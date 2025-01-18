import { Button } from "@nextui-org/react";

import { useI18n } from "@/app/lib/i18n";

export default function LanguageSwitch() {
  const { language, setLanguage } = useI18n();

  return (
    <Button
      className="min-w-12 px-2"
      size="sm"
      variant="light"
      onClick={() => setLanguage(language === "en" ? "zh" : "en")}
    >
      {language === "en" ? "中" : "En"}
    </Button>
  );
}
