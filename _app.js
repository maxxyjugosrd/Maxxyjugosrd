import Head from 'next/head';

export default function App({ Component, pageProps }) {
  return (
    <>
      <Head>
        <link rel="icon" href="/barra.jpeg" type="logo.JPG" />
        <link rel="apple-touch-icon" href="/logo.JPG" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
