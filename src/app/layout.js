import "./globals.css"; // o los estilos de Tailwind

export const metadata = {
  title: "Maxi Jugos",
  description: "Panel de control y tienda de Maxi Jugos",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
