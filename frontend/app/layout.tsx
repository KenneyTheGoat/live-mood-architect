import "./globals.css";

export const metadata = {
  title: "Live Mood Architect",
  description: "Generate supportive affirmations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
