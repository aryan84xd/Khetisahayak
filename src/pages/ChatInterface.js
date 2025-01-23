import React, { useState } from "react";
import {
  TextField,
  Button,
  Container,
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from "@mui/material";

export default function AIChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "User", text: input };
    setMessages((prev) => [...prev, userMessage]);

    setInput(""); // Clear the input
    setLoading(true); // Show loading indicator

    try {
      // Send the user's message to the Flask API
      const response = await fetch("http://localhost:5000/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: input }),
      });

      if (!response.ok) throw new Error("Failed to fetch response");

      const data = await response.json();
      const aiMessage = { sender: "AI", text: data.response };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error communicating with the API:", error);
      const errorMessage = { sender: "AI", text: "Something went wrong. Please try again later." };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false); // Hide loading indicator
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 4, display: "flex", flexDirection: "column", height: "80vh" }}>
      <Typography variant="h4" gutterBottom>
        AI Assistant Chat
      </Typography>
      <Paper
        elevation={3}
        sx={{
          flex: 1,
          p: 2,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <List
          sx={{
            flex: 1,
            overflowY: "auto",
            mb: 2,
          }}
        >
          {messages.map((message, index) => (
            <ListItem
              key={index}
              sx={{
                justifyContent: message.sender === "User" ? "flex-end" : "flex-start",
              }}
            >
              <Paper
                sx={{
                  p: 1,
                  bgcolor: message.sender === "User" ? "primary.main" : "grey.300",
                  color: message.sender === "User" ? "white" : "black",
                  borderRadius: 2,
                  maxWidth: "75%",
                }}
              >
                <ListItemText primary={message.text} />
              </Paper>
            </ListItem>
          ))}
        </List>
        {loading && (
          <Box sx={{ textAlign: "center", mb: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}
        <Box display="flex" alignItems="center" gap={1}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <Button variant="contained" color="primary" onClick={handleSend} disabled={loading}>
            Send
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
