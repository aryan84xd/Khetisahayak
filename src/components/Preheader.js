import Stack from "@mui/material/Stack";
import logo from "../assests/logo.png";

// import ButtonTemplate from "./ButtonTemplate";
import { Typography, Button } from "@mui/material";
import supabase from "../utils/superbaseClient";

const Preheader = ({ isLoggedIn }) => {
  const handlelogout = () => {
    supabase.auth.signOut()
  };
  return (
    <Stack
  direction="row"
  justifyContent="space-between"
  alignItems="center"
  padding={2}
  sx={{
    backgroundColor: "#f5f5f5",
    borderBottom: "2px solid lightgrey", // Add bottom border only
  }}
>
  {/* Left Side - Logo and Name */}
  <Stack spacing={2} direction="row" alignItems="center">
    <img src={logo} alt="Logo" width="50" height="50" /> {/* Adjusted size for logo */}
    <Typography variant="h1" color="title">
      KhetiSahayak.com
    </Typography>
  </Stack>

  {/* Right Side - Log Out Button */}
  <Button onClick={handlelogout} variant="contained" color="secondary">
    LOG OUT
  </Button>
</Stack>
  );
};

export default Preheader;
