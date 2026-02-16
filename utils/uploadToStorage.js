import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { storage } from "./firbase";   // ← make sure this is correctly imported

// Upload file and return download URL
export const uploadToStorage = async (file, path) => {
  // Optional: you can add more sanitization if needed
  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const uniqueName = `${Date.now()}-${safeFileName}`;
  
  const fileRef = ref(storage, `${path}/${uniqueName}`);
  
  await uploadBytes(fileRef, file);
  const downloadURL = await getDownloadURL(fileRef);
  
  return downloadURL;
};

// Delete file from Storage using its download URL
export const deleteFromStorage = async (url) => {
  if (!url) return; // nothing to delete
  
  try {
    // Create a reference from the URL
    const fileRef = ref(storage, url);
    await deleteObject(fileRef);
    console.log("File deleted successfully:", url);
  } catch (error) {
    console.error("Error deleting file:", error);
    
    // Common error codes you might want to handle specifically:
    if (error.code === 'storage/object-not-found') {
      console.warn("File already doesn't exist or was never uploaded");
      // Usually safe to consider this "success" for cleanup
    } else if (error.code === 'storage/unauthorized') {
      console.error("Permission denied - check Firebase Storage rules");
    }
    
    // You can choose to re-throw or just swallow the error depending on your needs
    // throw error;   // ← uncomment if you want calling code to handle failures
  }
};
