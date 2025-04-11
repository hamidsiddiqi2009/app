import React, { useEffect, useState } from "react";
import { Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const languages = [
  { code: "en", name: "English" },
  { code: "es", name: "Español" },
  { code: "fr", name: "Français" },
  { code: "de", name: "Deutsch" },
  { code: "zh-CN", name: "中文" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" },
  { code: "ru", name: "Русский" },
  { code: "ar", name: "العربية" },
];

export const LanguageSelector = () => {
  const [isTranslateReady, setIsTranslateReady] = useState(false);

  useEffect(() => {
    // Dynamically load the Google Translate script
    const script = document.createElement("script");
    script.src =
      "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.async = true;
    document.head.appendChild(script);

    // Define the callback globally
    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "en",
          includedLanguages: "en,es,fr,de,zh-CN,ja,ko,ru,ar",
          layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
          autoDisplay: false,
        },
        "google_translate_element",
      );
      setIsTranslateReady(true);
      console.log("Google Translate initialized");
    };

    // Cleanup
    return () => {
      document.head.removeChild(script);
      delete window.googleTranslateElementInit;
    };
  }, []);

  const changeLanguage = (languageCode: string) => {
    const select = document.querySelector(
      ".goog-te-combo",
    ) as HTMLSelectElement;
    if (select) {
      console.log(`Changing language to ${languageCode}`);
      select.value = languageCode;
      select.dispatchEvent(new Event("change"));
    } else {
      console.error("Google Translate combo box not found.");
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center justify-center w-8 h-8 rounded-full bg-[#252525] text-white hover:bg-[#303030] transition-colors"
        disabled={!isTranslateReady}
      >
        <Globe className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="bg-[#1E1E1E] border-[#303030]"
      >
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className="cursor-pointer text-white hover:bg-[#303030]"
            disabled={!isTranslateReady}
          >
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
