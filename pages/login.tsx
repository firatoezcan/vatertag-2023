import { Container } from "@mui/material";
import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const Index = () => {
  const supabaseClient = useSupabaseClient();
  const user = useUser();
  const router = useRouter();
  if (!user)
    return (
      <Container maxWidth="sm" sx={{ py: 8 }}>
        <Auth redirectTo="http://localhost:3000/" appearance={{ theme: ThemeSupa }} supabaseClient={supabaseClient} providers={[]} socialLayout="horizontal" />
      </Container>
    );

  router.push("/");
};

export default Index;
