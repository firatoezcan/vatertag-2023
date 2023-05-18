import Link from "next/link";
import { Card, Typography, Space } from "@supabase/ui";
import { supabase } from "../lib/initSupabase";
import { Box, Container } from "@mui/material";
import { RankingTable } from "../src/RankingTable";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { Database } from "../src/types/supabase";
import { useSession, useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export default function Profile() {
  const client = useSupabaseClient();
  const router = useRouter();
  const [hasCheckedUser, setHasCheckedUser] = useState(false);
 
    



      






  
  return (
    <Container maxWidth="xs" sx={{ py: 8, display: "flex", justifyContent: "center" }}>
      <RankingTable />
    </Container>
  );
}
