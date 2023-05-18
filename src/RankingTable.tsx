import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { useSupabaseMutation, useSupabaseQuery } from "./useSupabaseQuery";
import { Box, Button, Card, CardActions, CardContent, Collapse, Divider, IconButton, Menu, MenuItem, Stack, Typography } from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { DrinkMapping, InsertDrinkForm } from "./InsertDrinkForm";
import { groupBy } from "lodash";
import { IconChevronDown, IconChevronUp } from "@supabase/ui";
import { MoreVert } from "@mui/icons-material";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@supabase/auth-helpers-react";

type Drinks = {
  amount_ml: number;
  percentage: number;
  created_at: string;
}[];

const calculateTotalAlcohol = (drinks: Drinks, weight: number) => {
  const metabolizationRate = 7; // grams per hour
  const totalAlcohol = drinks.reduce(
    (total, drink) => {
      const alcoholInMilliliters = (drink.amount_ml * drink.percentage) / 100;
      const alcoholInGrams = alcoholInMilliliters * 0.789; // Assuming the density of alcohol is 0.789 g/mL
      const drinkTimestamp = new Date(drink.created_at).valueOf();
      if (total.timeStampPrevious === 0) {
        return {
          grams: alcoholInGrams,
          timeStampPrevious: drinkTimestamp,
        };
      }
      let previousGrams = total.grams;
      // Calculate the time difference in hours between the current timestamp and the drink timestamp
      const timeDiffHoursBetweenTwoDrinks = (drinkTimestamp - total.timeStampPrevious) / (1000 * 60 * 60);

      let metabolizedAlcohol = timeDiffHoursBetweenTwoDrinks * metabolizationRate;
      previousGrams = Math.max(previousGrams - metabolizedAlcohol, 0);
      return {
        grams: previousGrams + alcoholInGrams,
        timeStampPrevious: drinkTimestamp,
      };
    },
    {
      grams: 0,
      timeStampPrevious: 0,
    }
  );
  let lastDrinkGrams = totalAlcohol.grams;
  // Calculate the time difference in hours between the current timestamp and the drink timestamp
  const timeDiffHoursBetweenLastDrink = (Date.now() - totalAlcohol.timeStampPrevious) / (1000 * 60 * 60);

  let metabolizedAlcohol = timeDiffHoursBetweenLastDrink * metabolizationRate;
  lastDrinkGrams = Math.max(lastDrinkGrams - metabolizedAlcohol, 0);
  return lastDrinkGrams;
};

const calculcateBloodAlcohol = (drinks: Drinks, weight: number) => {
  const WIDMARK_CONSTANT_MALE = 0.7;

  return calculateTotalAlcohol(drinks, weight) / (weight * WIDMARK_CONSTANT_MALE);
};

const dateFormatter = new Intl.DateTimeFormat("de-DE", { year: "2-digit", month: "2-digit", day: "2-digit", hour: "numeric", minute: "numeric", second: "numeric" });

export const RankingTable = () => {
  const { data: drinks, isLoading } = useSupabaseQuery((supabase) => supabase.from("drink").select("*"), { refetchInterval: 2000, refetchOnWindowFocus: true });
  const { data: users, isLoading: isLoadingUsers } = useSupabaseQuery((supabase) => supabase.from("user").select("*"), { refetchInterval: 2000, refetchOnWindowFocus: true });
  const [showInsertDrinkForm, setShowInsertDrinkForm] = useState(false);
  const [visibleDetails, setVisibleDetails] = useState<string | undefined>(undefined);

  const queryClient = useQueryClient();
  const user = useUser() || {} as any;

  const [renderCount, setRenderCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [hasClickedDelete, setHasClickedDelete] = useState(false);
  const open = Boolean(anchorEl);
  const { mutateAsync } = useSupabaseMutation({});
  const handleDeleteDrink = (id: number) => () => {
    handleClose();
    mutateAsync((s) => s.from("drink").delete({ count: "exact" }).eq("id", id)).then(() => queryClient.invalidateQueries(["drink"]));
  };
  const handleDeleteFirstClick = (event: React.MouseEvent<HTMLElement>) => {
    setHasClickedDelete(true);
  };
  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setHasClickedDelete(false);
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setHasClickedDelete(false);
    setAnchorEl(null);
  };

  useEffect(() => {
    const timeout = setTimeout(() => setRenderCount(renderCount + 1), 200);
    return () => {
      clearTimeout(timeout);
    };
  });

  const drinksByUser = useMemo(
    () =>
      Object.entries(groupBy(drinks, (drink) => drink.user_id)).map(([userId, userDrinks]) => ({
        userId,
        drinks: userDrinks,
        shots: userDrinks.filter((d) => d.type === "shot").length,
        "330mlBeer": userDrinks.filter((d) => d.type === "beer" && d.amount_ml === 330).length,
        "500mlBeer": userDrinks.filter((d) => d.type === "beer" && d.amount_ml === 500).length,
        otherBeer: userDrinks.filter((d) => d.type === "beer" && d.amount_ml !== 330 && d.amount_ml !== 500).length,
        mixed: userDrinks.filter((d) => d.type === "mixed").length,
      })),
    [drinks]
  );

  if (isLoading || isLoadingUsers) return null;

  const hasDrinks = drinks.length > 0;

  return (
    <Stack spacing={3} width="100%" justifyContent="center" alignItems="center">
      {!showInsertDrinkForm && !hasDrinks && (
        <Box sx={{ maxWidth: 275 }}>
          <Card variant="outlined">
            {" "}
            <CardContent>
              <Typography variant="h5" component="div">
                Hat wirklich noch keiner gesoffen???
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small" onClick={() => setShowInsertDrinkForm(true)}>
                Als erstes den Drink eintragen
              </Button>
            </CardActions>
          </Card>
        </Box>
      )}
      {hasDrinks && (
        <TableContainer component={Paper}>
          <Typography variant="h6" sx={{ p: 1 }}>
            Besoffski Rangliste
          </Typography>
          <Divider />
          <Table sx={{ maxWidth: 444 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ p: 0 }}></TableCell>
                <TableCell width={150}>Name</TableCell>
                <TableCell>Alkohol</TableCell>
                <TableCell>Aktueller&nbsp;Pegel</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {drinksByUser
                .sort(
                  (a, b) =>
                    calculcateBloodAlcohol(b.drinks, users.find((u) => u.user_id === b.userId).weight) -
                    calculcateBloodAlcohol(a.drinks, users.find((u) => u.user_id === a.userId).weight)
                )
                .map(({ userId, drinks: userDrinks, ...stats }) => (
                  <>
                    <TableRow key={userId} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                      <TableCell component="th" scope="row" sx={{ p: 0 }}>
                        <IconButton color="primary" onClick={() => setVisibleDetails(visibleDetails === userId ? undefined : userId)}>
                          {visibleDetails ? <IconChevronUp /> : <IconChevronDown />}
                        </IconButton>
                      </TableCell>
                      <TableCell component="th" scope="row">
                        {users.find((u) => u.user_id === userId)?.name ?? "Nicht registriert (geil ey)"}
                      </TableCell>
                      <TableCell>{calculateTotalAlcohol(userDrinks, users.find((u) => u.user_id === userId).weight).toFixed(2)}g</TableCell>
                      <TableCell>{calculcateBloodAlcohol(userDrinks, users.find((u) => u.user_id === userId).weight).toFixed(3)}‰</TableCell>
                    </TableRow>
                    <TableRow sx={{ border: 0 }}>
                      <TableCell colSpan={8} sx={{ py: 0 }}>
                        <Collapse in={visibleDetails === userId} mountOnEnter>
                          <Stack spacing={2}>
                            <Box>
                              <Typography variant="h6">Statistik:</Typography>
                              <Typography variant="body2">Kurze: {stats.shots}</Typography>
                              <Typography variant="body2">0.33l Bier: {stats["330mlBeer"]}</Typography>
                              <Typography variant="body2">0.5l Bier: {stats["500mlBeer"]}</Typography>
                              <Typography variant="body2">Anderes Bier: {stats.otherBeer}</Typography>
                              <Typography variant="body2">Mischen: {stats.mixed}</Typography>
                            </Box>
                            <Box>
                              <Typography variant="h6">Auflistung:</Typography>
                              <Table sx={{ maxWidth: 444 }}>
                                <TableHead>
                                  <TableRow>
                                    {user.id === userId && <TableCell sx={{ p: 0 }}></TableCell>}
                                    <TableCell>Getränk</TableCell>
                                    <TableCell align="right">Menge</TableCell>
                                    <TableCell align="right">Prozent</TableCell>
                                    <TableCell align="right">Wann?</TableCell>
                                  </TableRow>
                                </TableHead>
                                <TableBody>
                                  {userDrinks.map((drink, index) => (
                                    <TableRow key={index} onContextMenu={console.log}>
                                      {user.id === userId && (
                                        <TableCell sx={{ p: 0 }}>
                                          <IconButton onClick={handleClick} sx={{ p: 0 }}>
                                            <MoreVert />
                                          </IconButton>
                                          <Menu anchorEl={anchorEl} open={open} onClose={handleClose} MenuListProps={{ sx: { p: 0 } }}>
                                            <Button
                                              color="error"
                                              size="small"
                                              variant="contained"
                                              onClick={hasClickedDelete ? handleDeleteDrink(drink.id) : handleDeleteFirstClick}>
                                              {hasClickedDelete ? "Wirklich löschen?" : "Löschen"}
                                            </Button>
                                          </Menu>
                                        </TableCell>
                                      )}

                                      <TableCell>{DrinkMapping[drink.type]}</TableCell>
                                      <TableCell align="right">{drink.amount_ml}ml</TableCell>
                                      <TableCell align="right">{drink.percentage}%</TableCell>
                                      <TableCell align="right">{dateFormatter.format(new Date(drink.created_at))}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </Box>
                          </Stack>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </>
                ))}
            </TableBody>
          </Table>
         { user && <Box display="flex" justifyContent="flex-end" px={1} py={2}>
            <Button variant="contained" onClick={() => setShowInsertDrinkForm(!showInsertDrinkForm)} color={showInsertDrinkForm ? "error" : "primary"}>
              {showInsertDrinkForm ? "Doch nicht eintragen" : "Drink eintragen"}
            </Button>
          </Box>}
        </TableContainer>
      )}
      {showInsertDrinkForm && <InsertDrinkForm onClose={() => setShowInsertDrinkForm(false)} />}
    </Stack>
  );
};
