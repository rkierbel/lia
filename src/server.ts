// Focuses on starting the server and handling related logic
import app from "./index.js";

const PORT = process.env.PORT || 3000;

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});