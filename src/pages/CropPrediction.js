import React, { useState } from 'react';
import {
  TextField,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardActions,
  Grid,
  Alert,
  CircularProgress,
  Typography,
  Box,
  Paper
} from '@mui/material';

const CropPredictionForm = () => {
  const [formData, setFormData] = useState({
    N: '',
    P: '',
    K: '',
    temperature: '',
    humidity: '',
    ph: '',
    rainfall: ''
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: parseFloat(e.target.value)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
        const predictResponse = await fetch('http://localhost:5001/predict_crop', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const responseData = await predictResponse.json();
        
        if (!predictResponse.ok) {
            throw new Error(responseData.error || 'Failed to predict crop');
        }

        setResult(responseData);

        // Only proceed with production update if we have a valid prediction
        if (responseData.recommended_crop) {
            const productionResponse = await fetch('http://localhost:5001/add_production', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    crop_name: responseData.recommended_crop,
                    production_value: responseData.production_value
                })
            });

            const productionData = await productionResponse.json();
            
            if (!productionResponse.ok) {
                throw new Error(productionData.error || 'Failed to update production');
            }
        }

    } catch (err) {
        console.error('Error:', err);
        setError(err.message || 'An unexpected error occurred');
    } finally {
        setLoading(false);
    }
};

  return (
    <Box sx={{ maxWidth: 800, margin: 'auto', p: 2 }}>
      <Card elevation={3}>
        <CardHeader 
          title="Crop Prediction System"
          subheader="Enter soil and environmental parameters to get crop recommendations"
        />
        
        <CardContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Nitrogen (N)"
                  name="N"
                  type="number"
                  inputProps={{ step: "0.01" }}
                  required
                  value={formData.N}
                  onChange={handleChange}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phosphorus (P)"
                  name="P"
                  type="number"
                  inputProps={{ step: "0.01" }}
                  required
                  value={formData.P}
                  onChange={handleChange}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Potassium (K)"
                  name="K"
                  type="number"
                  inputProps={{ step: "0.01" }}
                  required
                  value={formData.K}
                  onChange={handleChange}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Temperature (°C)"
                  name="temperature"
                  type="number"
                  inputProps={{ step: "0.1" }}
                  required
                  value={formData.temperature}
                  onChange={handleChange}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Humidity (%)"
                  name="humidity"
                  type="number"
                  inputProps={{ step: "0.1" }}
                  required
                  value={formData.humidity}
                  onChange={handleChange}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="pH Level"
                  name="ph"
                  type="number"
                  inputProps={{ step: "0.1" }}
                  required
                  value={formData.ph}
                  onChange={handleChange}
                  variant="outlined"
                />
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Rainfall (mm)"
                  name="rainfall"
                  type="number"
                  inputProps={{ step: "0.1" }}
                  required
                  value={formData.rainfall}
                  onChange={handleChange}
                  variant="outlined"
                />
              </Grid>
            </Grid>

            <CardActions sx={{ justifyContent: 'flex-end', mt: 2 }}>
              <Button 
                type="submit" 
                variant="contained" 
                color="primary"
                disabled={loading}
                startIcon={loading && <CircularProgress size={20} />}
              >
                {loading ? 'Predicting...' : 'Predict Crop'}
              </Button>
            </CardActions>
          </form>

          {error && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {error}
            </Alert>
          )}

          {result && (
            <Paper sx={{ mt: 3, p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Prediction Results
              </Typography>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body1" gutterBottom>
                  <strong>Recommended Crop:</strong> {result.recommended_crop}
                </Typography>
                <Typography variant="body1" gutterBottom>
                  <strong>Probability:</strong> {(result.probability * 100).toFixed(2)}%
                </Typography>
                <Typography variant="body1">
                  <strong>Production Value:</strong> {result.production_value}
                </Typography>
              </Box>
            </Paper>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default CropPredictionForm;