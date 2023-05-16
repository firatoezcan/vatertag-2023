import { CacheProvider, EmotionCache, ThemeProvider } from "@emotion/react";
import { CssBaseline } from "@mui/material";
import { Auth } from "@supabase/ui";
import { AppProps } from "next/app";
import Head from "next/head";
import { useEffect, useState } from "react";
import { supabase } from "../lib/initSupabase";
import createEmotionCache from "../src/createEmotionCache";
import theme from "../src/theme";
import "./../style.css";
import { createBrowserSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SupabaseQueryProvider } from "../src/useSupabaseQuery";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
// Client-side cache, shared for the whole session of the user in the browser.
const clientSideEmotionCache = createEmotionCache();

export interface MyAppProps extends AppProps {
  emotionCache?: EmotionCache;
}

const queryClient = new QueryClient();

export default function MyApp(props: MyAppProps) {
  const { Component, emotionCache = clientSideEmotionCache, pageProps } = props;
  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Create a new supabase browser client on every first render.
  const [supabaseClient] = useState(() =>
    createBrowserSupabaseClient({
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    })
  );

  if (!isMounted) return null;
  return (
    <SessionContextProvider supabaseClient={supabaseClient} initialSession={pageProps.initialSession}>
      <SupabaseQueryProvider client={supabaseClient}>
        <QueryClientProvider client={queryClient}>
          <ReactQueryDevtools initialIsOpen={false} />
          <CacheProvider value={emotionCache}>
            <Head>
              <meta name="viewport" content="initial-scale=1, width=device-width" />
            </Head>
            <ThemeProvider theme={theme}>
              {/* CssBaseline kickstart an elegant, consistent, and simple baseline to build upon. */}
              <CssBaseline />
              <Component {...pageProps} />
            </ThemeProvider>
          </CacheProvider>
        </QueryClientProvider>
      </SupabaseQueryProvider>
    </SessionContextProvider>
  );
}
