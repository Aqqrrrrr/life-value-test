import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "人生性价比决策风格测试",
  description: "用成本、收益和证据复盘你的生活选择。",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="antialiased">{children}</body>
    </html>
  );
}
