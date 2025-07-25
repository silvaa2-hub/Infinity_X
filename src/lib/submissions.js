import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Function to upload the file to Cloudinary
export const uploadFileToCloudinary = async (file) => {
  const url = `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`;

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();
    if (data.secure_url) {
      return data.secure_url; // Return the URL of the uploaded file
    } else {
      throw new Error('File upload to Cloudinary failed.');
    }
  } catch (error) {
    console.error('Error uploading file:', error);
    return null;
  }
};

// Function to save project submission details to Firestore
export const saveSubmissionToFirestore = async (submissionDetails) => {
  try {
    const submissionsRef = collection(db, 'submissions');
    await addDoc(submissionsRef, {
      ...submissionDetails,
      submittedAt: serverTimestamp(), // Add a timestamp
    });
    return true;
  } catch (error) {
    console.error('Error saving submission to Firestore:', error);
    return false;
  }
};