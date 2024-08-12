import { app } from "./app";
import { CONFIG } from "./config";
import connectDb from "./utils/db";
import { v2 as cloudinary } from "cloudinary";
//cloudinary config
cloudinary.config({
  cloud_name: CONFIG.CLOUD_NAME,
  api_key: CONFIG.CLOUDINARY_API,
  api_secret: CONFIG.CLOUDINARY_SECRET,
});

app.listen(CONFIG.PORT || 8000, () => {
  console.log(`server is running on port number ${CONFIG.PORT}`);
  connectDb();
});
