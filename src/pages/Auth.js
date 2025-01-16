import React from "react";
import supabase from "../utils/superbaseClient";
import { Typography,Box,Container,Button } from "@mui/material";

const Auth = () => {
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
    });

    if (error) {
      console.error("Error signing in with Google:", error.message);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "linear-gradient(to right, #f0e68c, #d2b97f)", // Softer, earthy gradient // Warm agricultural theme background
        textAlign: "center",
        padding: "20px",
      }}
    >
      <Container maxWidth="sm">
        {/* Heading with warm color and larger font size */}
        <Typography variant="h3" sx={{ fontWeight: 'bold', color: "#fff", marginBottom: "20px" }}>
          Welcome to KhetiSahayak.com
        </Typography>
        
        <Typography variant="h6" sx={{ color: "#fff", marginBottom: "30px" }}>
          A platform to support farmers with crop insights, equipment rentals, and more.
        </Typography>

        {/* Google Sign-in Button */}
        <Button
          onClick={signInWithGoogle}
          sx={{
            padding: "12px 30px",
            fontSize: "18px",
            fontWeight: "600",
            cursor: "pointer",
            backgroundColor: "#dc004e", // Pink button to contrast with the warm background
            color: "#fff",
            borderRadius: "8px",
            '&:hover': {
              backgroundColor: "#9a0036", // Darker pink on hover
            },
          }}
        >
          Sign in with Google
        </Button>
      </Container>
    </Box>
  );
};

export default Auth;
