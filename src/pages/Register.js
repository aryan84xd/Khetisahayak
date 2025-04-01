import React, { useState } from "react";


import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Box,
  Switch,
  FormGroup,
  FormControlLabel,
  InputAdornment,
  CircularProgress,
  Slider
} from '@mui/material';
import SentimentVeryDissatisfiedIcon from '@mui/icons-material/SentimentVeryDissatisfied';
import SentimentVerySatisfiedIcon from '@mui/icons-material/SentimentVerySatisfied';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SaveIcon from '@mui/icons-material/Save';
import supabase from "../utils/superbaseClient";
import stateDistrictMap from "../components/statesWithDistricts";

export default function MyEquipment() {
  const [equipment, setEquipment] = useState({
    brand: "",
    model: "",
    description: "",
    category: "",
    age_years: "",
    rental_price: "",
    location: "", // Existing location field
    village_name: "", // New field
    district_name: "", // New field
    state_name: "", // New field
    availability: true,
    for_rent: false,
    condition: 5,
    image_urls: [],
  });

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedState, setSelectedState] = useState("");
  const [districts, setDistricts] = useState([]);
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEquipment({
      ...equipment,
      [name]: type === "checkbox" ? checked : value,
    });
    if (name === "state_name") {
      setSelectedState(value);
      setDistricts(stateDistrictMap[value] || []);
      setEquipment({ ...equipment, state_name: value, district_name: "" });
    }
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
    <Container maxWidth="md">
  <Paper elevation={3} sx={{ p: 4, mt: 5, mb: 5 }}>
    <Typography variant="h4" component="h1" gutterBottom align="center" color="primary" fontWeight="500">
      Register Your Equipment
    </Typography>
    <Divider sx={{ mb: 4 }} />
    
    <form onSubmit={handleSubmit}>
      <Grid container spacing={3}>
        {/* Basic Information */}
        <Grid item xs={12}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Basic Information
          </Typography>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Brand"
            name="brand"
            value={equipment.brand}
            onChange={handleChange}
            required
            variant="outlined"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Model"
            name="model"
            value={equipment.model}
            onChange={handleChange}
            required
            variant="outlined"
          />
        </Grid>
        
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Description"
            name="description"
            multiline
            rows={3}
            value={equipment.description}
            onChange={handleChange}
            variant="outlined"
            placeholder="Describe your equipment features, specifications, and condition"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth variant="outlined">
            <InputLabel>Equipment Category</InputLabel>
            <Select
              label="Equipment Category"
              name="category"
              value={equipment.category}
              onChange={handleChange}
              displayEmpty
            >
              <MenuItem value="" disabled>
                
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
          </FormControl>
        </Grid>

        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Age in years"
            name="age_years"
            type="number"
            value={equipment.age_years}
            onChange={handleChange}
            variant="outlined"
            InputProps={{
              endAdornment: <InputAdornment position="end">years</InputAdornment>,
            }}
          />
        </Grid>

        {/* Equipment Condition Slider */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 3, bgcolor: 'background.paper', border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
            <Typography id="equipment-condition-slider" gutterBottom variant="subtitle1" fontWeight="medium">
              Equipment Condition
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box sx={{ mr: 2 }}>
                <SentimentVeryDissatisfiedIcon color="error" />
              </Box>
              <Slider
                value={equipment.condition}
                onChange={(event, newValue) =>
                  handleChange({ target: { name: "condition", value: newValue } })
                }
                aria-labelledby="equipment-condition-slider"
                valueLabelDisplay="auto"
                step={1}
                marks
                min={1}
                max={10}
                sx={{ mx: 2 }}
              />
              <Box sx={{ ml: 2 }}>
                <SentimentVerySatisfiedIcon color="success" />
              </Box>
            </Box>
            <Typography variant="caption" color="text.secondary" align="center" display="block">
              {equipment.condition < 4 ? 'Poor condition' : 
               equipment.condition < 7 ? 'Average condition' : 
               'Excellent condition'}
            </Typography>
          </Paper>
        </Grid>

        {/* Rental Information */}
        <Grid item xs={12} sx={{ mt: 2 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Rental Information
          </Typography>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Rental Price"
            name="rental_price"
            type="number"
            step="0.01"
            value={equipment.rental_price}
            onChange={handleChange}
            required
            variant="outlined"
            InputProps={{
              startAdornment: <InputAdornment position="start">₹</InputAdornment>,
              endAdornment: <InputAdornment position="end">/day</InputAdornment>,
            }}
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormGroup row>
            <FormControlLabel
              control={
                <Switch
                  name="availability"
                  checked={equipment.availability}
                  onChange={handleChange}
                  color="primary"
                />
              }
              label="Available Now"
            />
            <FormControlLabel
              control={
                <Switch
                  name="for_rent"
                  checked={equipment.for_rent}
                  onChange={handleChange}
                  color="primary"
                />
              }
              label="For Rent"
            />
          </FormGroup>
        </Grid>

        {/* Location Information */}
        <Grid item xs={12} sx={{ mt: 2 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Location Details
          </Typography>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Village Name"
            name="village_name"
            value={equipment.village_name}
            onChange={handleChange}
            required
            variant="outlined"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Landmark/Location"
            name="location"
            value={equipment.location}
            onChange={handleChange}
            variant="outlined"
            placeholder="Nearby landmark for easy location"
          />
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth variant="outlined">
            <InputLabel>State</InputLabel>
            <Select
              label="State"
              name="state_name"
              value={selectedState}
              onChange={handleChange}
              displayEmpty
              required
            >
              <MenuItem value="" disabled>
                
              </MenuItem>
              {Object.keys(stateDistrictMap).map((state) => (
                <MenuItem key={state} value={state}>
                  {state}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <FormControl fullWidth variant="outlined" disabled={!selectedState}>
            <InputLabel>District</InputLabel>
            <Select
              label="District"
              name="district_name"
              value={equipment.district_name}
              onChange={handleChange}
              displayEmpty
              required
            >
              <MenuItem value="" disabled>
                
              </MenuItem>
              {districts.map((district) => (
                <MenuItem key={district} value={district}>
                  {district}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        {/* Image Upload */}
        <Grid item xs={12} sx={{ mt: 2 }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Equipment Images
          </Typography>
        </Grid>
        
        <Grid item xs={12}>
          <Box
            sx={{
              border: '2px dashed',
              borderColor: 'primary.light',
              borderRadius: 2,
              p: 3,
              textAlign: 'center',
              bgcolor: 'background.paper',
              cursor: 'pointer'
            }}
            component="label"
          >
            <input type="file" hidden multiple onChange={handleImageChange} />
            <CloudUploadIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="subtitle1" gutterBottom>
              Drag and drop images here or click to browse
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Upload clear images from different angles (max 5 images)
            </Typography>
          </Box>
        </Grid>

        {/* Submit Button */}
        <Grid item xs={12} sx={{ mt: 4 }}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            size="large"
            disabled={loading}
            sx={{ py: 1.5, fontSize: '1.1rem' }}
            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
          >
            {loading ? "Submitting..." : "Register Equipment"}
          </Button>
        </Grid>
      </Grid>
    </form>
  </Paper>
</Container>
  );
}
