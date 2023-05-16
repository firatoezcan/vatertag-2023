import { Box, Button, Card, CardActions, CardContent, Divider, Stack, Typography } from "@mui/material";
import { z } from "zod";
import { HookFormTextField } from "./form/HookFormTextField";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormProvider, useForm } from "react-hook-form";
import { HookFormSelect } from "./form/HookFormSelect";
import { useSupabaseMutation, useSupabaseQuery } from "./useSupabaseQuery";
import { useUser } from "@supabase/auth-helpers-react";
import { useQueryClient } from "@tanstack/react-query";
import { groupBy, uniqBy } from "lodash";
import { useState } from "react";

const drinkTypes = ["shot", "beer", "mixed", "misc"] as const;
type DrinkType = (typeof drinkTypes)[number];

export const DrinkMapping: Record<DrinkType, string> = {
  shot: "Kurzer",
  beer: "Bier",
  mixed: "Mische",
  misc: "Sonstiges",
};

const InsertDrinkSchema = z.object({
  type: z.enum(drinkTypes, { errorMap: () => ({ message: "Wähl dein scheiß Getränk aus du Honk" }) }),
  amount_ml: z.string().min(1, "Nichts trinken ist gut aber hilft dir hier nichts"),
  percentage: z.string().min(1, "Wasser"),
  customAmount: z.string().optional(),
});

type InsertDrinkValues = z.infer<typeof InsertDrinkSchema>;

type InsertDrinkFormProps = {
  onClose: () => void;
};

const useUserDrinks = () => {
  const { data: drinks, isLoading } = useSupabaseQuery((supabase) => supabase.from("drink").select("*"), { refetchInterval: 10000, refetchOnWindowFocus: true });
  const user = useUser();

  if (isLoading) return null;
  return uniqBy(
    drinks.filter((d) => d.user_id === user.id),
    (drink) => drink.amount_ml + drink.type + drink.percentage
  );
};

export const InsertDrinkForm = (props: InsertDrinkFormProps) => {
  const { onClose } = props;
  const formMethods = useForm<InsertDrinkValues>({
    resolver: zodResolver(InsertDrinkSchema),
  });
  const user = useUser();
  const queryClient = useQueryClient();
  const userDrinks = useUserDrinks();

  const { mutateAsync, isLoading, error } = useSupabaseMutation({});

  const handleSubmit = (values: InsertDrinkValues) => {
    console.log(values);
    if (isLoading) return;
    mutateAsync((supabase) =>
      supabase.from("drink").insert({
        amount_ml: parseInt(values.customAmount ?? values.amount_ml),
        percentage: parseInt(values.percentage),
        type: values.type,
        user_id: user.id,
      })
    ).then(() => {
      queryClient.invalidateQueries(["drink"]);
      onClose();
    });
  };

  const amount = formMethods.watch("amount_ml");

  return (
    <FormProvider {...formMethods}>
      <Box component="form" onSubmit={formMethods.handleSubmit(handleSubmit)} sx={{ maxWidth: 420, width: "100%" }}>
        <Card variant="outlined">
          <Typography variant="h6" sx={{ p: 1 }}>
            Neuer Drink
          </Typography>
          <Divider />
          <CardContent>
            <Stack spacing={2} width="100%">
              <Box>
                <Typography variant="body1" fontWeight="500">
                  Schnellauswahl
                </Typography>
                <Box display="flex" flexWrap="wrap" mx={-1} mb={-1}>
                  {userDrinks.map((drink, index) => (
                    <Box key={index} px={1} mb={1}>
                      <Button variant="outlined" onClick={() => handleSubmit(drink)}>
                        {drink.amount_ml}ml {DrinkMapping[drink.type] ?? drink.type}, {drink.percentage}%
                      </Button>
                    </Box>
                  ))}
                </Box>
              </Box>
              <Box>
                <Typography variant="body1" fontWeight="500">
                  Neues Getränk
                </Typography>
                <HookFormSelect label="Getränk" options={drinkTypes.map((drinkType) => ({ label: DrinkMapping[drinkType], value: drinkType }))} name="type" disabled={isLoading} />
                <HookFormSelect
                  label="Menge"
                  name="amount_ml"
                  options={[
                    { label: "0.33 Liter", value: "330" },
                    { label: "0.4 Becher", value: "400" },
                    { label: "0.5 Liter", value: "500" },
                    { label: "2cl", value: "20" },
                    { label: "4cl", value: "40" },
                    { label: "1 Liter", value: "1000" },
                    { label: "Irgendne andere scheiße", value: "0" },
                  ]}
                  disabled={isLoading}
                />
                {amount === "0" && <HookFormTextField label="Menge in Milliliter die du getrunken hast" name="customAmount" type="number" disabled={isLoading} />}
                <HookFormTextField label="Prozent" name="percentage" type="number" disabled={isLoading} inputProps={{ step: ".1" }} />
                {error && <pre>{JSON.stringify(error)}</pre>}
              </Box>
            </Stack>
          </CardContent>
          <CardActions>
            <Box px={1} display="flex" justifyContent="flex-end" width="100%">
              <Button variant="contained" type="submit" disabled={isLoading}>
                Eintragen
              </Button>
            </Box>
          </CardActions>
        </Card>
      </Box>
    </FormProvider>
  );
};
