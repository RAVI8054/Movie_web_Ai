// app/layout.js
import "./globals.css"; // your only CSS file

export const metadata = {
  title: "Movie App",
  description: "AI Movie Buddy",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
