import React, { useState, useEffect } from "react";
import {
  TextField,
  Button,
  Typography,
  Container,
  Box,
  Card,
  CardContent,
  CardMedia,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Paper,
  Grid,
  CardActions,
  Divider,
  Avatar,
} from "@mui/material";
import {
  Close as CloseIcon,
  Image as ImageIcon,
  Send as SendIcon,
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  Article as ArticleIcon,
} from "@mui/icons-material";
import supabase from "../utils/superbaseClient";

export default function BlogPage() {
  const [blogs, setBlogs] = useState([]);
  const [blog, setBlog] = useState({ title: "", content: "" });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedBlog, setSelectedBlog] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    fetchBlogs();
    getUser();
  }, []);

  const getUser = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session) {
      const user = session.user;
      setUser(user);
    }
  };

  const fetchBlogs = async () => {
    const { data, error } = await supabase
      .from("blogs")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) console.error(error);
    else setBlogs(data);
  };

  const handleChange = (e) => {
    setBlog({ ...blog, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    setImages([...e.target.files]);
  };

  const handleImageUpload = async (image, userId, title) => {
    try {
      const filePath = `blogs/${userId}/${title}/${image.name}`;
      const { error } = await supabase.storage
        .from("blog-images")
        .upload(filePath, image);
      if (error) throw error;
      return filePath;
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  const sendToFlaskAPI = async (title, content) => {
    try {
      const response = await fetch('http://localhost:5000/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: `Title: ${title}\nDescription: ${content}`, // Format the text as required
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Successfully sent to Flask API:', data);
    } catch (error) {
      console.error('Error sending to Flask API:', error);
      alert('Note: Blog was saved but there was an error updating the vector store.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("You need to be logged in to post a blog.");
      return;
    }
    setLoading(true);
    const imagePaths = [];

    try {
      // Handle image uploads
      for (const image of images) {
        const path = await handleImageUpload(image, user.id, blog.title);
        if (path) imagePaths.push(path);
      }

      // Insert blog into Supabase
      const { error } = await supabase.from("blogs").insert([
        {
          ...blog,
          user_id: user.id,
          author_name: user.user_metadata.full_name,
          image_urls: imagePaths,
        },
      ]);

      if (error) throw error;

      // If Supabase insert was successful, send to Flask API
      await sendToFlaskAPI(blog.title, blog.content);

      alert("Blog posted successfully!");
      setBlog({ title: "", content: "" });
      setImages([]);
      fetchBlogs();
    } catch (error) {
      console.error(error);
      alert("Failed to post blog.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenBlog = (blog) => {
    setSelectedBlog(blog);
    setOpenDialog(true);
  };

  const handleNextImage = () => {
    if (selectedBlog?.image_urls?.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === selectedBlog.image_urls.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handlePrevImage = () => {
    if (selectedBlog?.image_urls?.length > 1) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? selectedBlog.image_urls.length - 1 : prev - 1
      );
    }
  };

  return (
    <Container maxWidth="lg">
    <Box sx={{ mt: 4, mb: 6 }}>
      {/* Create Blog Section */}
      <Paper elevation={3} sx={{ p: 4, mb: 6, borderRadius: 2 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
          Create a Blog Post
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            margin="normal"
            label="Title"
            name="title"
            value={blog.title}
            onChange={handleChange}
            required
            variant="outlined"
            sx={{ mb: 3 }}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Content"
            name="content"
            multiline
            rows={6}
            value={blog.content}
            onChange={handleChange}
            required
            variant="outlined"
            sx={{ mb: 3 }}
          />
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Button
                variant="outlined"
                component="label"
                fullWidth
                startIcon={<ImageIcon />}
                sx={{ height: 56 }}
              >
                Upload Images
                <input type="file" hidden multiple onChange={handleImageChange} />
              </Button>
            </Grid>
            <Grid item xs={12} md={6}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                sx={{ height: 56 }}
              >
                {loading ? "Posting..." : "Post Blog"}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

        {/* Blogs List Section */}
        <Typography variant="h4" sx={{ mb: 4 }}>
          Recent Blogs
        </Typography>
        <Grid container spacing={4}>
          {blogs.map((blog) => (
            <Grid item xs={12} sm={6} md={4} key={blog.id}>
              <Card 
                sx={{ 
                  height: '100%', 
                 
                  display: 'flex', 
                  flexDirection: 'column',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 6,
                  }
                }}
              >
                <Box 
                  sx={{ 
                    position: 'relative', 
                    height: 200,
                    bgcolor: 'grey.100',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  {!blog.image_urls?.length ? (
                    <ArticleIcon sx={{ fontSize: 60, color: 'grey.300' }} />
                  ) : (
                    <CardMedia
                      component="img"
                      height="200"
                      image={supabase.storage
                        .from("blog-images")
                        .getPublicUrl(blog.image_urls[0]).data.publicUrl}
                      alt={blog.title}
                      sx={{ 
                        objectFit: "cover",
                        height: '100%',
                        width: '100%'
                      }}
                    />
                  )}
                  {blog.image_urls?.length > 1 && (
                    <Box
                      sx={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        bgcolor: 'rgba(0, 0, 0, 0.6)',
                        color: 'white',
                        px: 1,
                        borderRadius: 1,
                        fontSize: '0.75rem',
                      }}
                    >
                      +{blog.image_urls.length - 1} more
                    </Box>
                  )}
                </Box>
                <CardContent sx={{ flexGrow: 1, pt: 2 }}>
                  <Typography variant="h6" component="h2" gutterBottom>
                    {blog.title}
                  </Typography>
                  <Typography 
                    variant="body2" 
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {blog.content}
                  </Typography>
                </CardContent>
                <Divider />
                <CardActions sx={{ justifyContent: 'space-between', px: 2, py: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Avatar
                      sx={{ width: 24, height: 24, mr: 1 }}
                      alt={blog.author_name}
                      src="/placeholder-avatar.jpg"
                    />
                    <Typography variant="caption" color="text.secondary">
                      {blog.author_name || "Anonymous"}
                    </Typography>
                  </Box>
                  <Button 
                    size="small" 
                    color="primary"
                    onClick={() => handleOpenBlog(blog)}
                  >
                    Read More
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Blog Dialog */}
        <Dialog
          open={openDialog}
          onClose={() => {
            setOpenDialog(false);
            setCurrentImageIndex(0);
          }}
          maxWidth="md"
          fullWidth
        >
          {selectedBlog && (
            <>
              <DialogTitle sx={{ pr: 6 }}>
                {selectedBlog.title}
                <IconButton
                  onClick={() => {
                    setOpenDialog(false);
                    setCurrentImageIndex(0);
                  }}
                  sx={{ position: 'absolute', right: 8, top: 8 }}
                >
                  <CloseIcon />
                </IconButton>
              </DialogTitle>
              <DialogContent dividers>
                {selectedBlog.image_urls?.length > 0 ? (
                  <Box sx={{ position: 'relative', mb: 3 }}>
                    <Box
                      sx={{
                        position: 'relative',
                        height: { xs: 250, sm: 400 },
                        width: '100%',
                        overflow: 'hidden',
                        borderRadius: 1,
                        bgcolor: 'grey.100',
                      }}
                    >
                      <img
                        src={supabase.storage
                          .from("blog-images")
                          .getPublicUrl(selectedBlog.image_urls[currentImageIndex]).data.publicUrl}
                        alt={`Blog image ${currentImageIndex + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'contain',
                        }}
                      />
                      {selectedBlog.image_urls.length > 1 && (
                        <>
                          <IconButton
                            onClick={handlePrevImage}
                            sx={{
                              position: 'absolute',
                              left: 8,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              bgcolor: 'rgba(255, 255, 255, 0.8)',
                              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' },
                            }}
                          >
                            <ChevronLeftIcon />
                          </IconButton>
                          <IconButton
                            onClick={handleNextImage}
                            sx={{
                              position: 'absolute',
                              right: 8,
                              top: '50%',
                              transform: 'translateY(-50%)',
                              bgcolor: 'rgba(255, 255, 255, 0.8)',
                              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.9)' },
                            }}
                          >
                            <ChevronRightIcon />
                          </IconButton>
                          <Box
                            sx={{
                              position: 'absolute',
                              bottom: 8,
                              right: 8,
                              bgcolor: 'rgba(0, 0, 0, 0.6)',
                              color: 'white',
                              px: 1,
                              borderRadius: 1,
                              fontSize: '0.875rem',
                            }}
                          >
                            {currentImageIndex + 1} / {selectedBlog.image_urls.length}
                          </Box>
                        </>
                      )}
                    </Box>
                  </Box>
                ) : (
                  <Box
                    sx={{
                      height: { xs: 200, sm: 300 },
                      bgcolor: 'grey.100',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 3,
                      borderRadius: 1,
                    }}
                  >
                    <ArticleIcon sx={{ fontSize: 80, color: 'grey.300' }} />
                  </Box>
                )}
                <Typography variant="body1" paragraph>
                  {selectedBlog.content}
                </Typography>
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
                  <Avatar
                    sx={{ width: 32, height: 32, mr: 1 }}
                    alt={selectedBlog.author_name}
                    src="/placeholder-avatar.jpg"
                  />
                  <Box>
                    <Typography variant="subtitle2">
                      {selectedBlog.author_name || "Anonymous"}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Posted on {new Date(selectedBlog.created_at).toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => {
                  setOpenDialog(false);
                  setCurrentImageIndex(0);
                }}>
                  Close
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>
      </Box>
    </Container>
  );
}