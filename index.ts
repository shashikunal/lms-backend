import { app } from "./app";
import { CONFIG } from "./config";
import connectDb from "./utils/db";
import { v2 as cloudinary } from "cloudinary";

// Cloudinary config
if (CONFIG.CLOUD_NAME && CONFIG.CLOUDINARY_API && CONFIG.CLOUDINARY_SECRET) {
  cloudinary.config({
    cloud_name: CONFIG.CLOUD_NAME,
    api_key: CONFIG.CLOUDINARY_API,
    api_secret: CONFIG.CLOUDINARY_SECRET,
  });
}

const PORT = CONFIG.PORT || 8000;

app.listen(PORT, () => {
  console.log(`Server is running on port number ${PORT}`);
  console.log(`Swagger UI Documentation available at: http://localhost:${PORT}/api-docs`);
  connectDb();
});

export default app;
