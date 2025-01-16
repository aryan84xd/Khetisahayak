import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#4caf50", // Green (Fresh, nature-related color)
    },
    secondary: {
      main: "#ff9800", // Orange (Harvest and soil-related color)
    },
    title: {
      main: "#2e7d32", // Dark green (Nature and agriculture)
    },
    background: {
      default: "#f4f1e1", // Soft off-white (Natural, neutral background)
      paper: "#ffffff", // White for cards or containers
    },
    text: {
      primary: "#3e2723", // Dark brown (Natural, earthy text color)
      secondary: "#6d4c41", // Lighter brown (Soft earth tone)
    },
  },
  typography: {
    fontFamily: "'Roboto', 'Arial', sans-serif", // A clean and simple font
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
      color: "#2e7d32", // Dark green for headers
      "@media (min-width:600px)": {
        fontSize: "3rem",
      },
      [createTheme().breakpoints.up("md")]: {
        fontSize: "4rem",
      },
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 600,
      color: "#4caf50", // Lighter green for h2
      "@media (min-width:600px)": {
        fontSize: "2.5rem",
      },
      [createTheme().breakpoints.up("md")]: {
        fontSize: "3rem",
      },
    },
    h3: {
      fontSize: "1.5rem",
      fontWeight: 500,
      color: "#ff9800", // Orange for h3 (harvest vibes)
      "@media (min-width:600px)": {
        fontSize: "2rem",
      },
      [createTheme().breakpoints.up("md")]: {
        fontSize: "2.5rem",
      },
    },
    body1: {
      fontSize: "1rem",
      fontWeight: 400,
      color: "#3e2723", // Dark brown for body text
    },
    body2: {
      fontSize: "0.875rem",
      fontWeight: 400,
      color: "#6d4c41", // Lighter brown for smaller text
    },
    button: {
      textTransform: "none", // Prevent uppercase transformation
      fontWeight: 600,
      color: "#fff", // Default text color for buttons
    },
  },
  spacing: 8, // Default spacing unit (e.g., 8px, 16px, 24px, etc.)
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: "8px", // Rounded corners for buttons
          padding: "8px 16px", // Button padding
          backgroundColor: "transparent", // Default to transparent for normal buttons
          border: "2px solid", // Add border for normal buttons
          borderColor: "#4caf50", // Green border for normal buttons
          color: "#4caf50", // Green text for normal buttons
          "&:hover": {
            backgroundColor: "rgba(76, 175, 80, 0.1)", // Light green background on hover
            borderColor: "#388e3c", // Darker green border on hover
            color: "#388e3c", // Darker green text on hover
          },
        },
        containedPrimary: {
          backgroundColor: "#4caf50",
          color: "#ffffff",
          "&:hover": {
            backgroundColor: "#388e3c", // Darker green on hover
          },
        },
        containedSecondary: {
          backgroundColor: "#ff9800",
          color: "#ffffff",
          "&:hover": {
            backgroundColor: "#f57c00", // Darker orange on hover
          },
        },
        outlinedPrimary: {
          backgroundColor: "transparent", // Transparent background for outlined primary buttons
          color: "#4caf50",
          borderColor: "#4caf50",
          "&:hover": {
            backgroundColor: "rgba(76, 175, 80, 0.1)", // Light green on hover
            borderColor: "#388e3c", // Darker green border on hover
            color: "#388e3c", // Darker green text on hover
          },
        },
        outlinedSecondary: {
          backgroundColor: "transparent", // Transparent background for outlined secondary buttons
          color: "#ff9800",
          borderColor: "#ff9800",
          "&:hover": {
            backgroundColor: "rgba(255, 152, 0, 0.1)", // Light orange on hover
            borderColor: "#f57c00", // Darker orange border on hover
            color: "#f57c00", // Darker orange text on hover
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: "12px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          padding: "16px",
          backgroundColor: "#fafafa", // Light background for cards
        },
      },
    },
  },
});

export default theme;
