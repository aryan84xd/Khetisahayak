import * as React from "react";
import dayjs from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Button,
  Grid,
  TextField,
  MenuItem,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import supabase from "../utils/superbaseClient"; // Ensure Supabase is configured
import stateDistrictMap from "../components/statesWithDistricts";
export default function Search() {
  const [equipment, setEquipment] = React.useState([]);
  const [filteredEquipment, setFilteredEquipment] = React.useState([]);
  const [category, setCategory] = React.useState("");
  const [maxPrice, setMaxPrice] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [selectedEquipment, setSelectedEquipment] = React.useState(null);
  const [startDate, setStartDate] = React.useState(dayjs()); // Start date
  const [endDate, setEndDate] = React.useState(dayjs()); // End date
  const [refreshTrigger, setRefreshTrigger] = React.useState(0);
  const [state, setState] = React.useState("");
  const [district, setDistrict] = React.useState("");
  const [districts, setDistricts] = React.useState([]); // Stores available districts for selected state

  // Function to get the image URL
  const getImageUrl = async (path) => {
    const { data, error } = await supabase.storage
      .from("images") // Your bucket name
      .download(path);
    if (error) {
      console.error("Error downloading image:", error);
      return null;
    }
    return URL.createObjectURL(data); // Convert to a URL object to use in img tags
  };

  React.useEffect(() => {
    const fetchEquipment = async () => {
      const { data, error } = await supabase
        .from("user_equipment")
        .select("*")
        .eq("availability", true)
        .eq("for_rent", true);

      if (error) {
        console.error("Error fetching equipment:", error);
      } else {
        const updatedEquipment = await Promise.all(
          data.map(async (item) => {
            const imageUrls =
              item.image_urls && item.image_urls.length > 0
                ? await Promise.all(
                    item.image_urls.map(async (imagePath) => {
                      return await getImageUrl(imagePath);
                    })
                  )
                : [];

            return { ...item, image_urls: imageUrls };
          })
        );
        setEquipment(updatedEquipment);
        setFilteredEquipment(updatedEquipment);
      }
    };

    fetchEquipment();
  }, [refreshTrigger]);

  const handleCategoryChange = (event) => {
    setCategory(event.target.value);
    filterEquipment(event.target.value, maxPrice);
  };

  const handleMaxPriceChange = (event) => {
    const value = event.target.value;
    setMaxPrice(value);
    filterEquipment(category, value);
  };

  const filterEquipment = (category, maxPrice, state, district) => {
    let filtered = equipment;

    // Filter by category
    if (category) {
      filtered = filtered.filter((item) => item.category === category);
    }

    // Filter by price - ensure price is numeric and apply filter
    if (maxPrice && !isNaN(maxPrice)) {
      filtered = filtered.filter(
        (item) => parseFloat(item.rental_price) <= parseFloat(maxPrice)
      );
    }

    // Filter by state
    if (state) {
      filtered = filtered.filter((item) => item.state === state);
    }

    // Filter by district
    if (district) {
      filtered = filtered.filter((item) => item.district === district);
    }

    setFilteredEquipment(filtered);
  };
  const handleStateChange = (event) => {
    const selectedState = event.target.value;
    setState(selectedState);
    setDistrict(""); // Reset district when state changes

   
    setDistricts(stateDistrictMap[selectedState] || []);
    filterEquipment(category, maxPrice, selectedState, district);
  };

  const handleDistrictChange = (event) => {
    const selectedDistrict = event.target.value;
    setDistrict(selectedDistrict);
    filterEquipment(category, maxPrice, state, selectedDistrict);
  };
  const handleOpenDialog = (item) => {
    setSelectedEquipment(item);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSelectedEquipment(null);
  };

  const handleBooking = async () => {
    // Input validation checks
    if (!startDate || !endDate) {
      alert("Please select both start and end dates.");
      return;
    }

    if (endDate.isBefore(startDate)) {
      alert("End date cannot be before start date.");
      return;
    }

    if (startDate.isBefore(dayjs(), "day")) {
      alert("Cannot book equipment for past dates.");
      return;
    }

    if (!selectedEquipment) {
      alert("No equipment selected.");
      return;
    }

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session) {
        alert("Please login to book equipment.");
        return;
      }

      const userId = session.user.id;
      const numberOfDays = endDate.diff(startDate, "day") + 1;
      const totalCost =
        parseFloat(selectedEquipment.rental_price) * numberOfDays;

      // First, check if the equipment is still available
      const { data: equipmentCheck, error: checkError } = await supabase
        .from("user_equipment")
        .select("availability")
        .eq("id", selectedEquipment.id)
        .single();

      console.log("Initial equipment check:", equipmentCheck);

      if (checkError) {
        throw new Error("Failed to check equipment availability");
      }

      if (!equipmentCheck.availability) {
        alert("Sorry, this equipment is no longer available.");
        return;
      }

      // Update equipment availability first with explicit return value
      const { data: updateData, error: updateError } = await supabase
        .from("user_equipment")
        .update({ availability: false })
        .eq("id", selectedEquipment.id)
        .select()
        .single();

      console.log("Update response:", updateData);

      if (updateError) {
        throw new Error("Failed to update equipment availability");
      }

      // Verify the update was successful
      const { data: verifyUpdate, error: verifyError } = await supabase
        .from("user_equipment")
        .select("availability")
        .eq("id", selectedEquipment.id)
        .single();

      console.log("Verify update:", verifyUpdate);

      if (verifyError || verifyUpdate.availability !== false) {
        throw new Error("Failed to verify equipment availability update");
      }

      // Then create the booking
      const { data: bookingData, error: bookingError } = await supabase
        .from("bookings")
        .insert([
          {
            equipment_id: selectedEquipment.id,
            user_id: userId,
            owner_id: selectedEquipment.user_id,
            start_date: startDate.format("YYYY-MM-DD"),
            end_date: endDate.format("YYYY-MM-DD"),
            cost: totalCost,
            status: "pending",
          },
        ])
        .select();

      if (bookingError) {
        // If booking fails, revert the availability update
        await supabase
          .from("user_equipment")
          .update({ availability: true })
          .eq("id", selectedEquipment.id);
        throw new Error("Failed to create booking");
      }

      alert(`Booking successful! Total cost: ₹${totalCost}`);
      handleClose();

      // Update local state
      setFilteredEquipment((prev) =>
        prev.filter((item) => item.id !== selectedEquipment.id)
      );
      setEquipment((prev) =>
        prev.filter((item) => item.id !== selectedEquipment.id)
      );

      // Trigger a refresh of the equipment list
      setRefreshTrigger((prev) => prev + 1);
    } catch (error) {
      console.error("Error in booking process:", error);
      alert(
        error.message || "An error occurred during booking. Please try again."
      );
    }
  };

  const calculatedCost = React.useMemo(() => {
    if (!selectedEquipment || !startDate || !endDate) return null;
    if (endDate.isBefore(startDate)) return null;

    const days = endDate.diff(startDate, "day") + 1;
    return (parseFloat(selectedEquipment.rental_price) * days).toFixed(2);
  }, [selectedEquipment, startDate, endDate]);

  const renderCostPreview = () => {
    if (!calculatedCost) return null;

    return (
      <Box sx={{ mt: 2, p: 2, bgcolor: "#f5f5f5", borderRadius: 1 }}>
        <Typography variant="body1" sx={{ fontWeight: "bold" }}>
          Booking Summary:
        </Typography>
        <Typography variant="body2">
          Duration: {endDate.diff(startDate, "day") + 1} days
        </Typography>
        <Typography variant="body2" color="primary" sx={{ fontWeight: "bold" }}>
          Total Cost: ₹{calculatedCost}
        </Typography>
      </Box>
    );
  };
  return (
    <Container maxWidth="lg">
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ fontWeight: "bold", color: "#3f51b5" }}
      >
        Search Equipment
      </Typography>
      <Box sx={{ display: "flex", gap: 2, marginBottom: 4 }}>
        <TextField
          select
          label="Category"
          value={category}
          onChange={handleCategoryChange}
          fullWidth
        >
          <MenuItem value="">All Categories</MenuItem>
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
          <MenuItem value="Sugarcane Harvesters">Sugarcane Harvesters</MenuItem>
          <MenuItem value="Rice Combine Harvesters">
            Rice Combine Harvesters
          </MenuItem>
          {/* Add more categories as needed */}
        </TextField>

        <TextField
          label="Max Price"
          type="number"
          value={maxPrice}
          onChange={handleMaxPriceChange}
          fullWidth
        />
      </Box>
      <Box sx={{ display: "flex", gap: 2, marginBottom: 4 }}>
      <TextField
        select
        label="State"
        value={state}
        onChange={handleStateChange}
        fullWidth
      >
        <MenuItem value="">Select State</MenuItem>
        {Object.keys(stateDistrictMap).map((stateName) => (
          <MenuItem key={stateName} value={stateName}>
            {stateName}
          </MenuItem>
        ))}
      </TextField>

      {/* District Dropdown */}
      <TextField
        select
        label="District"
        value={district}
        onChange={handleDistrictChange}
        fullWidth
        disabled={!state}  // Disable district dropdown if state is not selected
      >
        <MenuItem value="">Select District</MenuItem>
        {districts.map((dist) => (
          <MenuItem key={dist} value={dist}>
            {dist}
          </MenuItem>
        ))}
      </TextField>
    </Box>
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
        {filteredEquipment.map((item) => (
          <Box item key={item.id} xs={12} sm={6} md={4}>
            <Card sx={{ boxShadow: 3, borderRadius: 2 }}>
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
                  District:{" "}
                  <span style={{ fontWeight: "normal" }}>
                    {item?.district_name || "NA"}
                  </span>
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ fontWeight: "bold" }}
                >
                  State:{" "}
                  <span style={{ fontWeight: "normal" }}>
                    {item?.state_name || "NA"}
                  </span>
                </Typography>
              </CardContent>
              <CardActions sx={{ justifyContent: "center" }}>
                <Button
                  size="small"
                  color="primary"
                  variant="contained"
                  onClick={() => handleOpenDialog(item)} // Open dialog for selected equipment
                >
                  View
                </Button>
              </CardActions>
            </Card>
          </Box>
        ))}
      </Box>

      {/* Dialog for Viewing and Booking */}
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
              Landmark:{" "}
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
              Village:{" "}
              <span style={{ fontWeight: "normal" }}>
                {selectedEquipment?.village_name || "N/A"}
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
              District:{" "}
              <span style={{ fontWeight: "normal" }}>
                {selectedEquipment?.district_name || "N/A"}
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
              State:{" "}
              <span style={{ fontWeight: "normal" }}>
                {selectedEquipment?.state_name || "N/A"}
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
              Rent:{" "}
              <span style={{ fontWeight: "normal" }}>
                ₹{selectedEquipment?.rental_price} per day
              </span>
            </Typography>

            {/* Date Pickers for Start and End Date */}
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(newValue) => setStartDate(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
                minDate={dayjs()} // Prevent selecting past dates
              />
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(newValue) => setEndDate(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
                minDate={startDate} // Prevent selecting end date before start date
              />
            </LocalizationProvider>
          </Box>
        </DialogContent>
        {renderCostPreview()}
        <DialogActions>
          <Button onClick={handleClose} color="secondary">
            Close
          </Button>
          <Button onClick={handleBooking} color="primary" variant="contained">
            Book Equipment
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
