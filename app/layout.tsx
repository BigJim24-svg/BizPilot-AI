import "./globals.css";

export const metadata = {
  title: "BizPilot AI",
  description: "AI business copilot for small and medium businesses",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}
