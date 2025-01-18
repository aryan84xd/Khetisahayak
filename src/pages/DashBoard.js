import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Card, CardContent, CardMedia, CardActions, Button } from '@mui/material';
import supabase from '../utils/superbaseClient'; // Make sure to configure your Supabase client

export default function DashBoard() {
  const [user, setUser] = useState(null);
  const [equipment, setEquipment] = useState([]);

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const user = session.user;
        setUser(user);
        const { data, error } = await supabase
          .from('user_equipment')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching equipment:', error);
        } else {
          // For each equipment item, get the image URLs using the new method
          const updatedEquipment = await Promise.all(
            data.map(async (item) => {
              const imageUrls = await Promise.all(
                item.image_urls.map(async (imagePath) => {
                  return await getImageUrl(imagePath); // Use getImageUrl function
                })
              );
              return { ...item, image_urls: imageUrls };
            })
          );
          setEquipment(updatedEquipment);
        }
      }
    };

    fetchUserData();
  }, []);

  // Function to download and create an object URL for image
  const getImageUrl = async (path) => {
    const { data, error } = await supabase.storage
      .from('images') // Your bucket name
      .download(path); // Path to the image
    if (error) {
      console.error('Error downloading image:', error);
      return null;
    }
    return URL.createObjectURL(data); // Create a local URL for the image
  };

  return (
    <Container maxWidth="lg" sx={{ paddingTop: 4 }}>
      {user && (
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: '#3f51b5' }}>
          Welcome, {user.email.split('@')[0]}
        </Typography>
      )}
      <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 'bold', marginBottom: 2 }}>
        Your Registered Equipment
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 4,
        }}
      >
        {equipment.map((item) => (
          <Card key={item.id} sx={{ boxShadow: 3, borderRadius: 2 }}>
            {item.image_urls && item.image_urls.length > 0 && (
              <Box sx={{ display: 'flex', overflowX: 'scroll', paddingBottom: 2, '&::-webkit-scrollbar': { height: '8px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: '#888' }, '&::-webkit-scrollbar-thumb:hover': { backgroundColor: '#555' } }}>
                {item.image_urls.map((url, index) => (
                  <CardMedia
                    key={index}
                    component="img"
                    height="180"
                    image={url} // Using the object URL for the image
                    alt={item.name}
                    sx={{
                      minWidth: 300,
                      borderRadius: 1,
                      marginRight: 2,
                      '&:hover': {
                        transform: 'scale(1.05)',
                        transition: 'transform 0.3s ease',
                      },
                    }}
                  />
                ))}
              </Box>
            )}
            <CardContent>
              <Typography gutterBottom variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                {item.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                Category: {item.category}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ marginBottom: 1, fontWeight: 'bold' }}>
                Rental Price: ${item.rental_price}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'bold' }}>
                Location: {item.location}
              </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'space-between' }}>
              <Button size="small" color="primary">
                Edit
              </Button>
              {/* Removed Delete button */}
            </CardActions>
          </Card>
        ))}
      </Box>
    </Container>
  );
}
