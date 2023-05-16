import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import Paper from "@mui/material/Paper";
import { useSupabaseMutation, useSupabaseQuery } from "./useSupabaseQuery";
import { Box, Button, Card, CardActions, CardContent, Collapse, Divider, IconButton, Menu, MenuItem, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { DrinkMapping, InsertDrinkForm } from "./InsertDrinkForm";
import { groupBy } from "lodash";
import { IconChevronDown, IconChevronUp } from "@supabase/ui";
import { MoreVert } from "@mui/icons-material";
import { useQueryClient } from "@tanstack/react-query";

function calculateTotalAlcohol(drinks) {
  let totalAlcohol = 0;

  for (let i = 0; i < drinks.length; i++) {
    const drink = drinks[i];
    const alcoholInMilliliters = (drink.amount_ml * drink.percentage) / 100;
    const alcoholInGrams = alcoholInMilliliters * 0.789; // Assuming the density of alcohol is 0.789 g/mL
    totalAlcohol += alcoholInGrams;
  }

  return totalAlcohol.toFixed(2);
}

export const RankingTable = () => {
  const { data: drinks, isLoading } = useSupabaseQuery((supabase) => supabase.from("drink").select("*"), { refetchInterval: 10000, refetchOnWindowFocus: true });
  const { data: users, isLoading: isLoadingUsers } = useSupabaseQuery((supabase) => supabase.from("user").select("*"), { refetchInterval: 10000, refetchOnWindowFocus: true });
  const [showInsertDrinkForm, setShowInsertDrinkForm] = useState(false);
  const [visibleDetails, setVisibleDetails] = useState<string | undefined>(undefined);
  const queryClient = useQueryClient();

  if (isLoading || isLoadingUsers) return null;
  const hasDrinks = drinks.length > 0;
  const drinksByUser = groupBy(drinks, (drink) => drink.user_id);

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
                <TableCell></TableCell>
                <TableCell width={150}>Name</TableCell>
                <TableCell>Alkohol</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Object.entries(drinksByUser).map(([userId, userDrinks]) => (
                <>
                  <TableRow key={userId} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                    <TableCell component="th" scope="row">
                      <IconButton color="primary" onClick={() => setVisibleDetails(visibleDetails === userId ? undefined : userId)}>
                        {visibleDetails ? <IconChevronUp /> : <IconChevronDown />}
                      </IconButton>
                    </TableCell>
                    <TableCell component="th" scope="row">
                      {users.find((u) => u.user_id === userId)?.name ?? "Nicht registriert (geil ey)"}
                    </TableCell>
                    <TableCell>
                      {userDrinks
                        .reduce((total, drink) => {
                          const alcoholInMilliliters = (drink.amount_ml * drink.percentage) / 100;
                          const alcoholInGrams = alcoholInMilliliters * 0.789; // Assuming the density of alcohol is 0.789 g/mL
                          return total + alcoholInGrams;
                        }, 0)
                        .toFixed(2)}
                      g
                    </TableCell>
                  </TableRow>
                  <TableRow sx={{ border: 0 }}>
                    <TableCell colSpan={8} sx={{ py: 0 }}>
                      <Collapse in={visibleDetails === userId} mountOnEnter>
                        <Stack spacing={2}>
                          <Box>
                            <Typography variant="h6">Statistik:</Typography>
                            <Typography variant="body2">Kurze: {userDrinks.filter((d) => d.type === "shot").length}</Typography>
                            <Typography variant="body2">0.33l Bier: {userDrinks.filter((d) => d.type === "beer" && d.amount_ml === 330).length}</Typography>
                            <Typography variant="body2">0.5l Bier: {userDrinks.filter((d) => d.type === "beer" && d.amount_ml === 500).length}</Typography>
                            <Typography variant="body2">
                              Anderes Bier: {userDrinks.filter((d) => d.type === "beer" && d.amount_ml !== 330 && d.amount_ml !== 500).length}
                            </Typography>
                            <Typography variant="body2">Mischen: {userDrinks.filter((d) => d.type === "mixed").length}</Typography>
                          </Box>
                          <Box>
                            <Typography variant="h6">Auflistung:</Typography>
                            <Table sx={{ maxWidth: 444 }}>
                              <TableHead>
                                <TableRow>
                                  <TableCell></TableCell>
                                  <TableCell>Getränk</TableCell>
                                  <TableCell align="right">Menge</TableCell>
                                  <TableCell align="right">Prozent</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {userDrinks.map((drink, index) => (
                                  <TableRow key={index} onContextMenu={console.log}>
                                    <TableCell>
                                      <IconButton onClick={handleClick} sx={{ p: 0 }}>
                                        <MoreVert />
                                      </IconButton>
                                      <Menu anchorEl={anchorEl} open={open} onClose={handleClose} MenuListProps={{ sx: { p: 0 } }}>
                                        <Button color="error" size="small" variant="contained" onClick={hasClickedDelete ? handleDeleteDrink(drink.id) : handleDeleteFirstClick}>
                                          {hasClickedDelete ? "Wirklich löschen?" : "Löschen"}
                                        </Button>
                                      </Menu>
                                    </TableCell>
                                    <TableCell>{DrinkMapping[drink.type]}</TableCell>
                                    <TableCell align="right">{drink.amount_ml}ml</TableCell>
                                    <TableCell align="right">{drink.percentage}%</TableCell>
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
          <Box display="flex" justifyContent="flex-end" px={1} py={2}>
            <Button variant="contained" onClick={() => setShowInsertDrinkForm(!showInsertDrinkForm)} color={showInsertDrinkForm ? "error" : "primary"}>
              {showInsertDrinkForm ? "Doch nicht eintragen" : "Drink eintragen"}
            </Button>
          </Box>
        </TableContainer>
      )}
      {showInsertDrinkForm && <InsertDrinkForm onClose={() => setShowInsertDrinkForm(false)} />}
    </Stack>
  );
};
