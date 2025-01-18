import React, { useState } from "react";
import {
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Typography,
  Container,
  Box,
} from "@mui/material";
import supabase from "../utils/superbaseClient";

export default function MyEquipment() {
  const [equipment, setEquipment] = useState({
    name: "",
    description: "",
    category: "",
    age_years: "",
    rental_price: "",
    location: "",
    availability: true,
    for_rent: false,
    image_urls: [], // Add this to initial state
  });
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEquipment({
      ...equipment,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleImageChange = (e) => {
    setImages([...e.target.files]);
  };

  // Updated image upload function
  const handleImageUpload = async (image, userId, equipmentName) => {
    try {
      const filePath = `${userId}/${equipmentName}/${image.name}`; // Use userId and equipmentName for the path

      // Upload image to the storage bucket
      const { error } = await supabase.storage
        .from("images") // Specify your bucket name
        .upload(filePath, image); // Upload image with the file path

      if (error) throw error;

      // Return the file path in case you want to store it in the database
      return filePath;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error; // Handle errors properly in your UI
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      alert("You need to be logged in to add equipment.");
      setLoading(false);
      return;
    }

    try {
      const userId = session.user.id;
      const uploadedUrls = [];

      // Upload images first
      if (images.length > 0) {
        for (const image of images) {
          const filePath = await handleImageUpload(image, userId, equipment.name);
          uploadedUrls.push(filePath);
        }
      }

      // Insert equipment with URLs included
      const { error } = await supabase
        .from("user_equipment")
        .insert([{ 
          ...equipment, 
          user_id: userId,
          image_urls: uploadedUrls // Store paths in image_urls field
        }]);

      if (error) throw error;

      alert("Equipment added successfully!");

      // Reset form
      setEquipment({
        name: "",
        description: "",
        category: "",
        age_years: "",
        rental_price: "",
        location: "",
        availability: true,
        for_rent: false,
        image_urls: [],
      });
      setImages([]);
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to add equipment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Register Your Equipment
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            margin="normal"
            label="Name"
            name="name"
            value={equipment.name}
            onChange={handleChange}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Description"
            name="description"
            multiline
            rows={4}
            value={equipment.description}
            onChange={handleChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Category"
            name="category"
            value={equipment.category}
            onChange={handleChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Age in years"
            name="age_years"
            type="number"
            value={equipment.age_years}
            onChange={handleChange}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Rental Price"
            name="rental_price"
            type="number"
            step="0.01"
            value={equipment.rental_price}
            onChange={handleChange}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Location"
            name="location"
            value={equipment.location}
            onChange={handleChange}
          />
          <FormControlLabel
            control={
              <Checkbox
                name="availability"
                checked={equipment.availability}
                onChange={handleChange}
              />
            }
            label="Availability"
          />
          <FormControlLabel
            control={
              <Checkbox
                name="for_rent"
                checked={equipment.for_rent}
                onChange={handleChange}
              />
            }
            label="For Rent"
          />
          <Button
            variant="contained"
            component="label"
            fullWidth
            sx={{ mt: 2, mb: 2 }}
          >
            Upload Images
            <input type="file" hidden multiple onChange={handleImageChange} />
          </Button>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </Button>
        </form>
      </Box>
    </Container>
  );
}
