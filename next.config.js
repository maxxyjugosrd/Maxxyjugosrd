/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export', // Requerido para despliegues estáticos en GitHub Pages
  images: {
    unoptimized: true, // Requerido al usar output: 'export'
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true, // Evita que advertencias de linteo cancelen el build
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
