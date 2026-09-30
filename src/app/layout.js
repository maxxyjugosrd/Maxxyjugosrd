import "./globals.css";

export const metadata = {
  title: "Maxxy Jugos",
  description: "Panel de control y tienda de Maxxy Jugos",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
