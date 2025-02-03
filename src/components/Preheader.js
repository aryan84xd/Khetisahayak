import React, { useEffect } from "react";
import Stack from "@mui/material/Stack";
import { Typography, Button } from "@mui/material";
import logo from "../assests/logo.png";
import supabase from "../utils/superbaseClient";

const Preheader = ({ isLoggedIn }) => {
  const handlelogout = () => {
    supabase.auth.signOut();
  };

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
    script.crossOrigin = "anonymous";
    script.async = true;
    script.onload = () => {
      window.googleTranslateElementInit = () => {
        new window.google.translate.TranslateElement(
          { 
            pageLanguage: "en", 
            includedLanguages: "en,hi,bn,mr,gu,ta,te,kn,ml,pa,ur,or,as,sd,kok,mai,mni,ne,sa,si", 
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE 
          },
          "google_translate_element"
        );
      };
      window.googleTranslateElementInit();
    };
    document.body.appendChild(script);
  }, []);

  return (
    <Stack
      direction="row"
      justifyContent="space-between"
      alignItems="center"
      padding={2}
      sx={{
        backgroundColor: "#f5f5f5",
        borderBottom: "2px solid lightgrey",
      }}
    >
      {/* Left Side - Logo and Name */}
      <Stack spacing={2} direction="row" alignItems="center">
        <img src={logo} alt="Logo" width="50" height="50" />
        <Typography variant="h6" color="primary">
          KhetiSahayak.com
        </Typography>
      </Stack>

      {/* Language Selector */}
      <div 
        id="google_translate_element" 
        style={{ 
          position: 'absolute', 
          right: '200px',  // Adjust based on your layout
          top: '10px'      // Fine-tune positioning
        }}
      ></div>

      {/* Right Side - Log Out Button */}
      <Button onClick={handlelogout} variant="contained" color="secondary">
        LOG OUT
      </Button>
    </Stack>
  );
};

export default Preheader;