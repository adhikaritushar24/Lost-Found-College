const API =
  import.meta.env.VITE_API_URL?.replace("/api", "") || "http://localhost:5000";

// Cloudinary images are already full URLs (https://...). Old items may still
// have local paths (/uploads/xyz.jpg) saved from before the Cloudinary
// migration — those still need the API prefix.
export const getImageUrl = (image) => {
  if (!image) return "";
  if (image.startsWith("http")) return image;
  return `${API}${image}`;
};