const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./docs/swagger.json");

const festivalRoutes = require("./routes/festival");
const authRoutes = require("./routes/auth");
const wishlistRoutes = require("./routes/wishlist");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Serve festival images
app.use("/images", express.static("public/images"));

// Swagger API documentation
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Routes
app.use("/api/festivals", festivalRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/wishlist", wishlistRoutes);

// Health check route (useful for Render monitoring)
app.get("/", (req, res) => {
  res.json({
    message: "ArtOfest API is running",
    docs: "/api-docs"
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: "Something went wrong"
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});