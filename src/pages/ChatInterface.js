import React, { useState, useEffect } from "react";
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
  useMediaQuery,
  useTheme,
} from "@mui/material";


export default function AIChat() {
  const [messages, setMessages] = useState(() => {
    const savedMessages = localStorage.getItem('chatMessages');
    return savedMessages ? JSON.parse(savedMessages) : [];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    localStorage.setItem('chatMessages', JSON.stringify(messages));
  }, [messages]);


  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "User", text: input };
    setMessages((prev) => [...prev, userMessage]);

    setInput(""); 
    setLoading(true);

    try {
      const response = await fetch("http://localhost:5001/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: input }),
      });

      if (!response.ok) throw new Error("Failed to fetch response");

      const data = await response.json();
      const aiMessage = {
        sender: "AI",
        text: formatResponse(data.response),
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error communicating with the API:", error);
      const errorMessage = {
        sender: "AI",
        text: "Something went wrong. Please try again later.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const formatResponse = (response) => {
    const formattedResponse = response
      .split('\n')
      .map((line) => {
        line = line.trim();
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        if (line.startsWith('*') || line.startsWith('-')) {
          return `<li style="margin-left: 20px; margin-bottom: 8px;">${line.substring(1).trim()}</li>`;
        }

        if (line === '') {
          return '<br/>';
        }

        return `<p style="margin-bottom: 8px;">${line}</p>`;
      })
      .join('');

    return `<div style="line-height: 1.5;">${formattedResponse}</div>`;
  };
  const clearChat = () => {
    setMessages([]);
    localStorage.removeItem('chatMessages');
  };
  return (
    <Container 
      maxWidth={false}
      sx={{ 
        width: '100%', 
        maxWidth: isSmallScreen ? '95%' : '800px', 
        height: isSmallScreen ? '95vh' : '80vh', 
        mt: 2, 
        display: "flex", 
        flexDirection: "column" 
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" gutterBottom>
          AI Assistant Chat
        </Typography>
        {messages.length > 0 && (
          <Button 
            variant="outlined" 
            color="secondary" 
            size="small" 
            onClick={clearChat}
          >
            Clear Chat
          </Button>
        )}
      </Box>
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
                <ListItemText
                  primary={<div dangerouslySetInnerHTML={{ __html: message.text }} />}
                />
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