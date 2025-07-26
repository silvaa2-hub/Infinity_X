import { db } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// This function now uploads the file using the secure signature from our backend
export const uploadFileWithSignature = async (file) => {
  try {
    // 1. Get the signature from our Vercel backend function
    const signatureResponse = await fetch('/api/sign-upload');
    const { signature, timestamp } = await signatureResponse.json();

    // 2. Prepare the form data for Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    formData.append('api_key', import.meta.env.VITE_CLOUDINARY_API_KEY); // We need a public API key for this part

    const url = `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`;

    // 3. Send the file to Cloudinary
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });
    const data = await response.json();

    if (data.secure_url) {
      return data.secure_url;
    } else {
      throw new Error('Upload to Cloudinary failed after signing.');
    }
  } catch (error) {
    console.error('Error uploading with signature:', error);
    return null;
  }
};

// This function remains the same
export const saveSubmissionToFirestore = async (submissionDetails) => {
  try {
    const submissionsRef = collection(db, 'submissions');
    await addDoc(submissionsRef, {
      ...submissionDetails,
      submittedAt: serverTimestamp(),
    });
    return true;
  } catch (error) {
    console.error('Error saving submission to Firestore:', error);
    return false;
  }
};