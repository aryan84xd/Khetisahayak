import React, { useState } from "react";
import {
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Typography,
  Container,
  Box,
  Select,
  MenuItem,
  Slider,
} from "@mui/material";
import supabase from "../utils/superbaseClient";

export default function MyEquipment() {
  const [equipment, setEquipment] = useState({
    brand: "",
    model: "",
    description: "",
    category: "",
    age_years: "",
    rental_price: "",
    location: "",
    availability: true,
    for_rent: false,
    condition: 5,
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
  const handleImageUpload = async (image, userId, modelName) => {
    try {
      const filePath = `${userId}/${modelName}/${image.name}`; // Use userId and equipmentName for the path

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
          const filePath = await handleImageUpload(
            image,
            userId,
            equipment.model
          );
          uploadedUrls.push(filePath);
        }
      }

      // Insert equipment with URLs included
      const { error } = await supabase.from("user_equipment").insert([
        {
          ...equipment,
          user_id: userId,
          image_urls: uploadedUrls, // Store paths in image_urls field
        },
      ]);

      if (error) throw error;

      alert("Equipment added successfully!");

      // Reset form
      setEquipment({
        brand: "",
        model: "",
        description: "",
        category: "",
        age_years: "",
        rental_price: "",
        location: "",
        availability: true,
        for_rent: false,
        image_urls: [],
        condition: 5,
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
            label="Brand"
            name="brand"
            value={equipment.brand}
            onChange={handleChange}
            required
          />
          <TextField
            fullWidth
            margin="normal"
            label="Model"
            name="model"
            value={equipment.model}
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
          <Select
            fullWidth
            margin="normal"
            label="Category"
            name="category"
            value={equipment.category}
            onChange={handleChange}
            displayEmpty
          >
            <MenuItem value="" disabled>
              Select a Category
            </MenuItem>
            <MenuItem value="Harvester">Harvester</MenuItem>
            <MenuItem value="Ploughs">Ploughs</MenuItem>
            <MenuItem value="Harrows">Harrows</MenuItem>
            <MenuItem value="Rotavators">Rotavators</MenuItem>
            <MenuItem value="Seed Drills">Seed Drills</MenuItem>
            <MenuItem value="Transplanters">Transplanters</MenuItem>
            <MenuItem value="Sprinkler Systems">Sprinkler Systems</MenuItem>
            <MenuItem value="Drip Irrigation Systems">
              Drip Irrigation Systems
            </MenuItem>
            <MenuItem value="Combine Harvesters">Combine Harvesters</MenuItem>
            <MenuItem value="Threshers">Threshers</MenuItem>
            <MenuItem value="Sickle and Scythe">Sickle and Scythe</MenuItem>
            <MenuItem value="Sprayers">Sprayers</MenuItem>
            <MenuItem value="Dusters">Dusters</MenuItem>
            <MenuItem value="Grain Dryers">Grain Dryers</MenuItem>
            <MenuItem value="Chaff Cutters">Chaff Cutters</MenuItem>
            <MenuItem value="Trailers">Trailers</MenuItem>
            <MenuItem value="Tractors">Tractors</MenuItem>
            <MenuItem value="Power Tillers">Power Tillers</MenuItem>
            <MenuItem value="Sugarcane Harvesters">
              Sugarcane Harvesters
            </MenuItem>
            <MenuItem value="Rice Combine Harvesters">
              Rice Combine Harvesters
            </MenuItem>
          </Select>
          <TextField
            fullWidth
            margin="normal"
            label="Age in years"
            name="age_years"
            type="number"
            value={equipment.age_years}
            onChange={handleChange}
          />
          <Box padding={2} border={1} borderColor={"grey.500"}>
            <Typography id="equipment-condition-slider" gutterBottom>
              Equipment Condition (1-10)
            </Typography>
            <Slider
              value={equipment.condition} // Current value of the slider
              onChange={(event, newValue) =>
                handleChange({ target: { name: "condition", value: newValue } })
              } // Update state
              aria-labelledby="equipment-condition-slider"
              valueLabelDisplay="auto" // Display the value as a label
              step={1} // Increment step
              marks // Add marks for each step
              min={1} // Minimum value
              max={10} // Maximum value
            />
          </Box>
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
