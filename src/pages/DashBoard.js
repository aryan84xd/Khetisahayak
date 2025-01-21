import React, { use, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Import the useNavigate hook from the react-router-dom package
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import supabase from "../utils/superbaseClient"; // Ensure Supabase is configured

export default function DashBoard() {
  const [user, setUser] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [rentedEquipment, setRentedEquipment] = useState([]);
  const [rentedOutEquipment, setRentedOutEquipment] = useState([]);
  const navigate = useNavigate(); // Initialize the navigate function

  // Function to navigate to the Add Equipment page
  const navigateToAddEquipmentPage = () => {
    navigate("/register"); // Redirect to the Add Equipment page
  };
  const navigateToSearchPage = () => {
    navigate("/search"); // Redirect to the Add Equipment page
  };

  useEffect(() => {
    const fetchUserData = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const user = session.user;
        setUser(user);

        // Fetch user's owned equipment
        const { data: ownedData, error: ownedError } = await supabase
          .from("user_equipment")
          .select("*")
          .eq("user_id", user.id);

        if (ownedError) {
          console.error("Error fetching owned equipment:", ownedError);
        } else {
          const updatedOwnedEquipment = await Promise.all(
            ownedData.map(async (item) => {
              const imageUrls = await Promise.all(
                item.image_urls.map(async (imagePath) => {
                  return await getImageUrl(imagePath);
                })
              );
              return { ...item, image_urls: imageUrls };
            })
          );
          setEquipment(updatedOwnedEquipment);
        }

        // Fetch equipment rented by the user
        const { data: rentedData, error: rentedError } = await supabase
          .from("bookings")
          .select(
            `
          *,
          equipment:user_equipment (*)
        `
          )
          .eq("user_id", user.id)
          .neq("status", "completed");

        if (rentedError) {
          console.error("Error fetching rented equipment:", rentedError);
        } else {
          const updatedRentedEquipment = await Promise.all(
            rentedData.map(async (booking) => {
              const equipment = booking.equipment;
              const imageUrls = await Promise.all(
                equipment.image_urls.map(async (imagePath) => {
                  return await getImageUrl(imagePath);
                })
              );
              return {
                ...equipment,
                image_urls: imageUrls,
                booking_details: {
                  start_date: booking.start_date,
                  end_date: booking.end_date,
                  status: booking.status,
                  cost: booking.cost,
                },
              };
            })
          );
          setRentedEquipment(updatedRentedEquipment);
        }

        // Fetch equipment rented out by the user
        const { data: rentedOutData, error: rentedOutError } = await supabase
          .from("bookings")
          .select(
            `
    *,
    equipment:user_equipment (*)
    `
          )
          .eq("owner_id", user.id) // Match logged-in user's ID
          .neq("status", "completed"); // Exclude completed bookings

        console.log(rentedOutData);
        if (rentedOutError) {
          console.error("Error fetching rented out equipment:", rentedOutError);
        } else {
          const updatedRentedOutEquipment = await Promise.all(
            rentedOutData.map(async (booking) => {
              const equipment = booking.equipment;
              const imageUrls = await Promise.all(
                equipment.image_urls.map(async (imagePath) => {
                  return await getImageUrl(imagePath);
                })
              );
              return {
                ...equipment,
                image_urls: imageUrls,
                booking_details: {
                  start_date: booking.start_date,
                  end_date: booking.end_date,
                  status: booking.status,
                  cost: booking.cost,
                  renter: booking.renter,
                },
              };
            })
          );
          setRentedOutEquipment(updatedRentedOutEquipment);
        }
      }
    };

    fetchUserData();
  }, []);

  const getImageUrl = async (path) => {
    const { data, error } = await supabase.storage
      .from("images")
      .download(path);
    if (error) {
      console.error("Error downloading image:", error);
      return null;
    }
    return URL.createObjectURL(data);
  };

  const handleOpen = (item) => {
    setSelectedEquipment(item);
    setOpen(true);
  };

  const handleClose = () => {
    setSelectedEquipment(null);
    setOpen(false);
  };

  // Helper function to format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };
  return (
    <Container maxWidth="lg" sx={{ paddingTop: 4 }}>
      {user && (
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          sx={{ fontWeight: "bold", color: "#3f51b5" }}
        >
          Welcome, {user.email.split("@")[0]}
        </Typography>
      )}

      <Typography
        variant="h5"
        component="h2"
        gutterBottom
        sx={{ fontWeight: "bold", marginBottom: 2 }}
      >
        Your Registered Equipment
      </Typography>
      {equipment.length > 0 ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 4,
            margin: {
              xs: "16px", // Extra small screens
              sm: "24px", // Small screens
              md: "32px", // Medium screens
              lg: "48px", // Large screens
            },
            padding: "16px", // Added padding to help visualize space
          }}
        >
          {equipment.map((item) => (
            <Card key={item.id} sx={{ boxShadow: 3, borderRadius: 2 }}>
              {item.image_urls && item.image_urls.length > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    overflowX: "scroll",
                    paddingBottom: 2,
                    "&::-webkit-scrollbar": { height: "8px" },
                    "&::-webkit-scrollbar-thumb": { backgroundColor: "#888" },
                    "&::-webkit-scrollbar-thumb:hover": {
                      backgroundColor: "#555",
                    },
                  }}
                >
                  {item.image_urls.map((url, index) => (
                    <CardMedia
                      key={index}
                      component="img"
                      height="180"
                      image={url}
                      alt={item.name}
                      sx={{
                        minWidth: 300,
                        borderRadius: 1,
                        marginRight: 2,
                        "&:hover": {
                          transform: "scale(1.05)",
                          transition: "transform 0.3s ease",
                        },
                      }}
                    />
                  ))}
                </Box>
              )}
              <CardContent>
                <Typography
                  gutterBottom
                  variant="h5"
                  component="div"
                  sx={{ fontWeight: "bold" }}
                >
                  {item.brand} {item.model}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontWeight: "bold" }}
                >
                  Category:{" "}
                  <span style={{ fontWeight: "normal" }}>{item.category}</span>
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontWeight: "bold" }}
                >
                  Rental Price:{" "}
                  <span style={{ fontWeight: "normal" }}>
                    ₹{item.rental_price}
                  </span>
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontWeight: "bold" }}
                >
                  Location:{" "}
                  <span style={{ fontWeight: "normal" }}>{item.location}</span>
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: "center" }}>
                <Button
                  size="small"
                  color="primary"
                  variant="contained"
                  onClick={() => handleOpen(item)}
                >
                  View
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            border: "2px dashed #888",
            borderRadius: 2,
            padding: 4,
            marginTop: 4,
            backgroundColor: "#f9f9f9",
            boxShadow: 2,
          }}
        >
          <Typography
            variant="h6"
            color="text.primary"
            sx={{ textAlign: "center", fontWeight: "bold", marginBottom: 2 }}
          >
            No Equipment Registered{" "}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ textAlign: "center", maxWidth: "600px", marginBottom: 2 }}
          >
            You havent Registered any equipment yet. Start by listing your
            equipment
          </Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ marginTop: 2 }}
            onClick={() => navigateToAddEquipmentPage()}
          >
            Add Your Equipment
          </Button>
        </Box>
      )}
      <Typography
        variant="h5"
        component="h2"
        gutterBottom
        sx={{ fontWeight: "bold", marginBottom: 2 }}
      >
        Equipment You Have Rented
      </Typography>
      {rentedEquipment.length > 0 ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 4,
            margin: {
              xs: "16px", // Extra small screens
              sm: "24px", // Small screens
              md: "32px", // Medium screens
              lg: "48px", // Large screens
            },
            padding: "16px", // Added padding to help visualize space
          }}
        >
          {rentedEquipment.map((item) => (
            <Card key={item.id} sx={{ boxShadow: 3, borderRadius: 2 }}>
              {item.image_urls && item.image_urls.length > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    overflowX: "scroll",
                    paddingBottom: 2,
                    "&::-webkit-scrollbar": { height: "8px" },
                    "&::-webkit-scrollbar-thumb": { backgroundColor: "#888" },
                    "&::-webkit-scrollbar-thumb:hover": {
                      backgroundColor: "#555",
                    },
                  }}
                >
                  {item.image_urls.map((url, index) => (
                    <CardMedia
                      key={index}
                      component="img"
                      height="180"
                      image={url}
                      alt={item.name}
                      sx={{
                        minWidth: 300,
                        borderRadius: 1,
                        marginRight: 2,
                        "&:hover": {
                          transform: "scale(1.05)",
                          transition: "transform 0.3s ease",
                        },
                      }}
                    />
                  ))}
                </Box>
              )}
              <CardContent>
                <Typography
                  gutterBottom
                  variant="h5"
                  component="div"
                  sx={{ fontWeight: "bold" }}
                >
                  {item.brand} {item.model}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontWeight: "bold" }}
                >
                  Category:{" "}
                  <span style={{ fontWeight: "normal" }}>{item.category}</span>
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontWeight: "bold" }}
                >
                  Rental Price:{" "}
                  <span style={{ fontWeight: "normal" }}>
                    ₹{item.rental_price}
                  </span>
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontWeight: "bold" }}
                >
                  Location:{" "}
                  <span style={{ fontWeight: "normal" }}>{item.location}</span>
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: "center" }}>
                <Button
                  size="small"
                  color="primary"
                  variant="contained"
                  onClick={() => handleOpen(item)}
                >
                  View
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            border: "2px dashed #888",
            borderRadius: 2,
            padding: 4,
            marginTop: 4,
            backgroundColor: "#f9f9f9",
            boxShadow: 2,
          }}
        >
          <Typography
            variant="h6"
            color="text.primary"
            sx={{ textAlign: "center", fontWeight: "bold", marginBottom: 2 }}
          >
            No Equipment Rented{" "}
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ textAlign: "center", maxWidth: "600px", marginBottom: 2 }}
          >
            You haven't rented any equipment yet. Start by Exploring the
            equipment available for rent
          </Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ marginTop: 2 }}
            onClick={() => navigateToSearchPage()}
          >
            Add Your Equipment
          </Button>
        </Box>
      )}
      <Typography
        variant="h5"
        component="h2"
        gutterBottom
        sx={{ fontWeight: "bold", marginBottom: 2 }}
      >
        Equipment You Have Rented Out
      </Typography>
      {rentedOutEquipment.length > 0 ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 4,
            margin: {
              xs: "16px", // Extra small screens
              sm: "24px", // Small screens
              md: "32px", // Medium screens
              lg: "48px", // Large screens
            },
            padding: "16px", // Added padding to help visualize space
          }}
        >
          {rentedOutEquipment.map((item) => (
            <Card key={item.id} sx={{ boxShadow: 3, borderRadius: 2 }}>
              {item.image_urls && item.image_urls.length > 0 && (
                <Box
                  sx={{
                    display: "flex",
                    overflowX: "scroll",
                    paddingBottom: 2,
                    "&::-webkit-scrollbar": { height: "8px" },
                    "&::-webkit-scrollbar-thumb": { backgroundColor: "#888" },
                    "&::-webkit-scrollbar-thumb:hover": {
                      backgroundColor: "#555",
                    },
                  }}
                >
                  {item.image_urls.map((url, index) => (
                    <CardMedia
                      key={index}
                      component="img"
                      height="180"
                      image={url}
                      alt={item.name}
                      sx={{
                        minWidth: 300,
                        borderRadius: 1,
                        marginRight: 2,
                        "&:hover": {
                          transform: "scale(1.05)",
                          transition: "transform 0.3s ease",
                        },
                      }}
                    />
                  ))}
                </Box>
              )}
              <CardContent>
                <Typography
                  gutterBottom
                  variant="h5"
                  component="div"
                  sx={{ fontWeight: "bold" }}
                >
                  {item.brand} {item.model}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontWeight: "bold" }}
                >
                  Category:{" "}
                  <span style={{ fontWeight: "normal" }}>{item.category}</span>
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontWeight: "bold" }}
                >
                  Rental Price:{" "}
                  <span style={{ fontWeight: "normal" }}>
                    ₹{item.rental_price}
                  </span>
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontWeight: "bold" }}
                >
                  Location:{" "}
                  <span style={{ fontWeight: "normal" }}>{item.location}</span>
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: "center" }}>
                <Button
                  size="small"
                  color="primary"
                  variant="contained"
                  onClick={() => handleOpen(item)}
                >
                  View
                </Button>
              </CardActions>
            </Card>
          ))}
        </Box>
      ) : (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            border: "2px dashed #888",
            borderRadius: 2,
            padding: 4,
            marginTop: 4,
            backgroundColor: "#f9f9f9",
            boxShadow: 2,
          }}
        >
          <Typography
            variant="h6"
            color="text.primary"
            sx={{ textAlign: "center", fontWeight: "bold", marginBottom: 2 }}
          >
            No Equipment Rented Out Yet
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ textAlign: "center", maxWidth: "600px", marginBottom: 2 }}
          >
            You haven't rented out any equipment yet. Start by listing your
            equipment to make it available for renting and see your listed
            equipment here!
          </Typography>
          <Button
            variant="contained"
            color="primary"
            sx={{ marginTop: 2 }}
            onClick={() => navigateToAddEquipmentPage()}
          >
            Add Your Equipment
          </Button>
        </Box>
      )}
      {/* Popup Dialog */}
      {/* Popup Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{
            fontWeight: "bold",
            fontSize: "1.5rem",
            color: "#3f51b5",
            textAlign: "center",
          }}
        >
          {selectedEquipment?.brand} {selectedEquipment?.model}
        </DialogTitle>
        <DialogContent>
          {/* Scrollable Image Gallery */}
          {selectedEquipment?.image_urls &&
            selectedEquipment.image_urls.length > 0 && (
              <Box
                sx={{
                  display: "flex",
                  overflowX: "scroll",
                  marginBottom: 2,
                  "&::-webkit-scrollbar": { height: "8px" },
                  "&::-webkit-scrollbar-thumb": { backgroundColor: "#888" },
                  "&::-webkit-scrollbar-thumb:hover": {
                    backgroundColor: "#555",
                  },
                }}
              >
                {selectedEquipment.image_urls.map((url, index) => (
                  <CardMedia
                    key={index}
                    component="img"
                    height="200"
                    image={url}
                    alt={selectedEquipment.name}
                    sx={{
                      borderRadius: 2,
                      marginRight: 2,
                      boxShadow: 2,
                      "&:hover": {
                        transform: "scale(1.05)",
                        transition: "transform 0.3s ease",
                      },
                    }}
                  />
                ))}
              </Box>
            )}

          {/* Equipment Details */}
          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 1.5,
              padding: 2,
              backgroundColor: "#f9f9f9",
              borderRadius: 2,
              boxShadow: 2,
            }}
          >
            <Typography
              variant="body1"
              sx={{
                fontWeight: "bold",
                fontSize: "1rem",
                marginBottom: 0.5,
              }}
            >
              Description:{" "}
              <span style={{ fontWeight: "normal" }}>
                {selectedEquipment?.description || "N/A"}
              </span>
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontWeight: "bold",
                fontSize: "1rem",
                marginBottom: 0.5,
              }}
            >
              Category:{" "}
              <span style={{ fontWeight: "normal" }}>
                {selectedEquipment?.category || "N/A"}
              </span>
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontWeight: "bold",
                fontSize: "1rem",
                marginBottom: 0.5,
              }}
            >
              Rental Price:{" "}
              <span style={{ fontWeight: "normal" }}>
                ₹{selectedEquipment?.rental_price || "N/A"}
              </span>
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontWeight: "bold",
                fontSize: "1rem",
                marginBottom: 0.5,
              }}
            >
              Location:{" "}
              <span style={{ fontWeight: "normal" }}>
                {selectedEquipment?.location || "N/A"}
              </span>
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontWeight: "bold",
                fontSize: "1rem",
                marginBottom: 0.5,
              }}
            >
              Age (Years):{" "}
              <span style={{ fontWeight: "normal" }}>
                {selectedEquipment?.age_years || "N/A"}
              </span>
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontWeight: "bold",
                fontSize: "1rem",
                marginBottom: 0.5,
              }}
            >
              Availability:{" "}
              <span style={{ fontWeight: "normal" }}>
                {selectedEquipment?.availability ? "Available" : "Unavailable"}
              </span>
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontWeight: "bold",
                fontSize: "1rem",
                marginBottom: 0.5,
              }}
            >
              For Rent:{" "}
              <span style={{ fontWeight: "normal" }}>
                {selectedEquipment?.for_rent ? "Yes" : "No"}
              </span>
            </Typography>
            <Typography
              variant="body1"
              sx={{
                fontWeight: "bold",
                fontSize: "1rem",
                marginBottom: 0.5,
              }}
            >
              Condition:{" "}
              <span style={{ fontWeight: "normal" }}>
                {selectedEquipment?.condition || "N/A"}/10
              </span>
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleClose}
            variant="contained"
            sx={{
              backgroundColor: "#3f51b5",
              color: "#fff",
              "&:hover": { backgroundColor: "#303f9f" },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
