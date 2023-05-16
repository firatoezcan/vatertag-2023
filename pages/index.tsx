import Link from "next/link";
import { Card, Typography, Space } from "@supabase/ui";
import { supabase } from "../lib/initSupabase";
import { Box, Container } from "@mui/material";
import { RankingTable } from "../src/RankingTable";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "../src/types/supabase";

export default function Profile({ user }) {
  return (
    <Container maxWidth="xs" sx={{ py: 8, display: "flex", justifyContent: "center" }}>
      <RankingTable />
    </Container>
  );
}

export async function getServerSideProps({ req, res }) {
  const supabaseServerClient = createServerSupabaseClient<Database>({
    req,
    res,
  });
  const {
    data: { user },
  } = await supabaseServerClient.auth.getUser();
  if (!user) {
    // If no user, redirect to index.
    return { props: {}, redirect: { destination: "/login", permanent: false } };
  }

  // If there is a user, return it.
  return { props: { user } };
}
