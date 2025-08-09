import { db } from './firebase';
import { doc, getDoc, collection, getDocs, addDoc, deleteDoc, updateDoc, setDoc, serverTimestamp, writeBatch, runTransaction } from 'firebase/firestore';

// Check if email is authorized for student access
export const checkAuthorizedEmail = async (email) => {
  try {
    const authorizedEmailsRef = collection(db, 'authorizedEmails');
    const snapshot = await getDocs(authorizedEmailsRef);
    
    const authorizedEmails = [];
    snapshot.forEach((doc) => {
      authorizedEmails.push(doc.data().email);
    });
    
    return authorizedEmails.includes(email.toLowerCase());
  } catch (error) {
    console.error('Error checking authorized email:', error);
    return false;
  }
};

// Admin authentication (simple email/password check)
export const authenticateAdmin = async (email, password) => {
  try {
    const adminRef = doc(db, 'admin', 'credentials');
    const adminDoc = await getDoc(adminRef);
    
    if (adminDoc.exists()) {
      const adminData = adminDoc.data();
      // FIX: Compare both emails in lowercase to prevent case-sensitivity issues
      return adminData.email.toLowerCase() === email.toLowerCase() && adminData.password === password;
    }
    return false;
  } catch (error) {
    console.error('Error authenticating admin:', error);
    return false;
  }
};

// Get all authorized emails
export const getAuthorizedEmails = async () => {
  try {
    const authorizedEmailsRef = collection(db, 'authorizedEmails');
    const snapshot = await getDocs(authorizedEmailsRef);
    
    const emails = [];
    snapshot.forEach((doc) => {
      emails.push({ id: doc.id, email: doc.data().email });
    });
    
    return emails;
  } catch (error) {
    console.error('Error getting authorized emails:', error);
    return [];
  }
};

// Add authorized email
export const addAuthorizedEmail = async (email) => {
  try {
    const authorizedEmailsRef = collection(db, 'authorizedEmails');
    await addDoc(authorizedEmailsRef, { email: email.toLowerCase() });
    return true;
  } catch (error) {
    console.error('Error adding authorized email:', error);
    return false;
  }
};

// Remove authorized email
export const removeAuthorizedEmail = async (emailId) => {
  try {
    const emailRef = doc(db, 'authorizedEmails', emailId);
    await deleteDoc(emailRef);
    return true;
  } catch (error) {
    console.error('Error removing authorized email:', error);
    return false;
  }
};

// Get dashboard content
export const getDashboardContent = async () => {
  try {
    const contentRef = doc(db, 'content', 'dashboard');
    const contentDoc = await getDoc(contentRef);
    
    if (contentDoc.exists()) {
      return contentDoc.data();
    }
    
    // Return default structure if no content exists
    return {
      lectures: [],
      materials: [],
      links: [],
      notes: []
    };
  } catch (error) {
    console.error('Error getting dashboard content:', error);
    return {
      lectures: [],
      materials: [],
      links: [],
      notes: []
    };
  }
};

// Update dashboard content
export const updateDashboardContent = async (content) => {
  try {
    const contentRef = doc(db, 'content', 'dashboard');
    await updateDoc(contentRef, content);
    return true;
  } catch (error) {
    console.error('Error updating dashboard content:', error);
    return false;
  }
};

// Add or update a student evaluation
export const updateStudentEvaluation = async (evaluationData) => {
  try {
    // We use the student's email as the document ID
    const evalRef = doc(db, 'evaluations', evaluationData.studentEmail);
    // setDoc will create the document if it doesn't exist, or overwrite it if it does.
    await setDoc(evalRef, evaluationData);
    return true;
  } catch (error) {
    console.error('Error updating evaluation:', error);
    return false;
  }
};

// Adds a new partial score to a student's evaluation
export const addPartialScore = async (studentEmail, scoreName, scoreValue, feedbackText) => {
  try {
    const evaluationRef = doc(db, 'evaluations', studentEmail);
    
    await runTransaction(db, async (transaction) => {
      const evaluationDoc = await transaction.get(evaluationRef);
      
      let evaluationData;
      if (!evaluationDoc.exists()) {
        // Create new document if it doesn't exist
        evaluationData = {
          studentEmail: studentEmail,
          totalScore: 0,
          partialScores: []
        };
      } else {
        evaluationData = evaluationDoc.data();
        // Ensure partialScores array exists
        if (!evaluationData.partialScores) {
          evaluationData.partialScores = [];
        }
      }
      
      // Add new partial score with unique ID, current date, and feedback
      const newPartialScore = {
        id: Date.now().toString(), // Use timestamp as unique ID
        name: scoreName,
        score: parseFloat(scoreValue),
        feedback: feedbackText, // ADDED THIS LINE
        date: new Date().toISOString().split('T')[0] // YYYY-MM-DD format
      };
      
      evaluationData.partialScores.push(newPartialScore);
      
      // Recalculate total score (average of all partial scores, capped at 100)
      const newTotalScore = evaluationData.partialScores.reduce((sum, partial) => sum + partial.score, 0) / evaluationData.partialScores.length;
      evaluationData.totalScore = Math.min(100, Math.round(newTotalScore * 100) / 100);
      
      // Update the document
      transaction.set(evaluationRef, evaluationData);
    });
    
    console.log(`Successfully added partial score for ${studentEmail}`);
    return true;
  } catch (error) {
    console.error('Error adding partial score:', error);
    return false;
  }
};

// Deletes a specific partial score from a student's evaluation
export const deletePartialScore = async (studentEmail, partialScoreId) => {
  try {
    const evaluationRef = doc(db, 'evaluations', studentEmail);
    
    await runTransaction(db, async (transaction) => {
      const evaluationDoc = await transaction.get(evaluationRef);
      
      if (!evaluationDoc.exists()) {
        throw new Error('Student evaluation not found');
      }
      
      const evaluationData = evaluationDoc.data();
      
      if (!evaluationData.partialScores || evaluationData.partialScores.length === 0) {
        throw new Error('No partial scores found for this student');
      }
      
      // Filter out the partial score with the specified ID
      const updatedPartialScores = evaluationData.partialScores.filter(
        partial => partial.id !== partialScoreId
      );
      
      if (updatedPartialScores.length === evaluationData.partialScores.length) {
        throw new Error('Partial score with specified ID not found');
      }
      
      evaluationData.partialScores = updatedPartialScores;
      
      // Recalculate total score
      if (evaluationData.partialScores.length > 0) {
        const newTotalScore = evaluationData.partialScores.reduce((sum, partial) => sum + partial.score, 0) / evaluationData.partialScores.length;
        evaluationData.totalScore = Math.min(100, Math.round(newTotalScore * 100) / 100);
      } else {
        evaluationData.totalScore = 0;
      }
      
      // Update the document
      transaction.set(evaluationRef, evaluationData);
    });
    
    console.log(`Successfully deleted partial score ${partialScoreId} for ${studentEmail}`);
    return true;
  } catch (error) {
    console.error('Error deleting partial score:', error);
    return false;
  }
};

// Get a single student's evaluation by their email
export const getStudentEvaluation = async (email) => {
  try {
    if (!email) return null;

    // The document ID is the student's email
    const evalRef = doc(db, 'evaluations', email);
    const evalDoc = await getDoc(evalRef);

    if (evalDoc.exists()) {
      return evalDoc.data();
    }
    return null; // No evaluation found for this student
  } catch (error) {
    console.error('Error getting student evaluation:', error);
    return null;
  }
};

// Save student feedback to Firestore
export const submitLectureFeedback = async (feedbackData) => {
  try {
    const feedbackRef = collection(db, 'feedback');
    await addDoc(feedbackRef, {
      ...feedbackData,
      submittedAt: serverTimestamp(), // Add a timestamp
    });
    return true;
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return false;
  }
};

// Get all student feedback, sorted by newest first
export const getAllFeedback = async () => {
  try {
    const feedbackRef = collection(db, 'feedback');
    const snapshot = await getDocs(feedbackRef);
    const allFeedback = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    // Sort by newest first
    return allFeedback.sort((a, b) => b.submittedAt?.toMillis() - a.submittedAt?.toMillis());
  } catch (error) {
    console.error('Error getting all feedback:', error);
    return [];
  }
};

// Deletes a specific partial score from ALL students' evaluations
export const deletePartialScoreFromAll = async (scoreName) => {
  try {
    const evaluationsRef = collection(db, 'evaluations');
    const evaluationsSnapshot = await getDocs(evaluationsRef);
    
    const batch = writeBatch(db);
    let updatedCount = 0;
    
    evaluationsSnapshot.forEach((docSnapshot) => {
      const evaluationData = docSnapshot.data();
      
      // Check if this student has the partial score to delete
      if (evaluationData.partialScores && evaluationData.partialScores.length > 0) {
        const originalLength = evaluationData.partialScores.length;
        
        // Filter out the partial score with the specified name
        const updatedPartialScores = evaluationData.partialScores.filter(
          partial => partial.name !== scoreName
        );
        
        // Only update if something was actually removed
        if (updatedPartialScores.length < originalLength) {
          evaluationData.partialScores = updatedPartialScores;
          
          // Recalculate total score
          if (evaluationData.partialScores.length > 0) {
            const newTotalScore = evaluationData.partialScores.reduce((sum, partial) => sum + partial.score, 0) / evaluationData.partialScores.length;
            evaluationData.totalScore = Math.min(100, Math.round(newTotalScore * 100) / 100);
          } else {
            evaluationData.totalScore = 0;
          }
          
          // Add this document to the batch update
          const docRef = doc(db, 'evaluations', docSnapshot.id);
          batch.set(docRef, evaluationData);
          updatedCount++;
        }
      }
    });
    
    // Commit all updates in a single batch
    if (updatedCount > 0) {
      await batch.commit();
      console.log(`Successfully deleted "${scoreName}" from ${updatedCount} students`);
    } else {
      console.log(`No students found with partial score "${scoreName}"`);
    }
    
    return { success: true, updatedCount };
  } catch (error) {
    console.error('Error deleting partial score from all students:', error);
    return { success: false, updatedCount: 0 };
  }
};

// Delete a project submission
export const deleteSubmission = async (submissionId) => {
  try {
    const subRef = doc(db, 'submissions', submissionId);
    await deleteDoc(subRef);
    return true;
  } catch (error) {
    console.error('Error deleting submission:', error);
    return false;
  }
};

