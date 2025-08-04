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

// Add a new partial score to a student's evaluation
export const addPartialScore = async (studentEmail, partialScore) => {
  try {
    const evaluationRef = doc(db, 'evaluations', studentEmail);
    
    await runTransaction(db, async (transaction) => {
      const evaluationDoc = await transaction.get(evaluationRef);
      
      if (!evaluationDoc.exists()) {
        // Create new document if it doesn't exist
        const newData = {
          partialScores: [partialScore],
          totalScore: partialScore.score
        };
        transaction.set(evaluationRef, newData);
      } else {
        const data = evaluationDoc.data();
        const currentPartialScores = data.partialScores || [];
        
        // Check if partial score with same ID already exists
        const existingIndex = currentPartialScores.findIndex(ps => ps.id === partialScore.id);
        if (existingIndex !== -1) {
          throw new Error(`Partial score with ID "${partialScore.id}" already exists`);
        }
        
        // Add new partial score
        const updatedPartialScores = [...currentPartialScores, partialScore];
        
        // Recalculate total score
        const newTotalScore = updatedPartialScores.reduce((sum, ps) => sum + (ps.score || 0), 0);
        
        // Update document
        transaction.update(evaluationRef, {
          partialScores: updatedPartialScores,
          totalScore: newTotalScore
        });
      }
    });
    
    console.log(`Successfully added partial score for ${studentEmail}`);
  } catch (error) {
    console.error('Error adding partial score:', error);
    throw error;
  }
};

// Delete a partial score from a student's evaluation by ID
export const deletePartialScore = async (studentEmail, partialScoreId) => {
  try {
    const evaluationRef = doc(db, 'evaluations', studentEmail);
    
    await runTransaction(db, async (transaction) => {
      const evaluationDoc = await transaction.get(evaluationRef);
      
      if (!evaluationDoc.exists()) {
        throw new Error(`No evaluation found for student: ${studentEmail}`);
      }
      
      const data = evaluationDoc.data();
      const currentPartialScores = data.partialScores || [];
      
      // Filter out the partial score with the specified ID
      const updatedPartialScores = currentPartialScores.filter(ps => ps.id !== partialScoreId);
      
      // Check if any partial score was actually removed
      if (updatedPartialScores.length === currentPartialScores.length) {
        throw new Error(`Partial score with ID "${partialScoreId}" not found`);
      }
      
      // Recalculate total score
      const newTotalScore = updatedPartialScores.length > 0 
        ? updatedPartialScores.reduce((sum, ps) => sum + (ps.score || 0), 0) / updatedPartialScores.length
        : 0;
      
      // Update document
      transaction.update(evaluationRef, {
        partialScores: updatedPartialScores,
        totalScore: Math.min(100, Math.round(newTotalScore * 100) / 100)
      });
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

// NEW: Delete a specific partial score from all students (bulk delete)
export const deletePartialScoreFromAll = async (scoreName) => {
  try {
    // Get all evaluation documents
    const evaluationsRef = collection(db, 'evaluations');
    const snapshot = await getDocs(evaluationsRef);
    
    if (snapshot.empty) {
      console.log('No evaluations found');
      return { success: true, updatedCount: 0 };
    }

    // Use batch write for efficiency
    const batch = writeBatch(db);
    let updatedCount = 0;

    snapshot.docs.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      const currentPartialScores = data.partialScores || [];
      
      // Filter out the partial scores with the matching name
      const updatedPartialScores = currentPartialScores.filter(ps => ps.name !== scoreName);
      
      // Only update if there was a change
      if (updatedPartialScores.length !== currentPartialScores.length) {
        // Recalculate total score
        const newTotalScore = updatedPartialScores.length > 0 
          ? updatedPartialScores.reduce((sum, ps) => sum + (ps.score || 0), 0) / updatedPartialScores.length
          : 0;
        
        // Add to batch
        batch.update(docSnapshot.ref, {
          partialScores: updatedPartialScores,
          totalScore: Math.min(100, Math.round(newTotalScore * 100) / 100)
        });
        
        updatedCount++;
      }
    });

    // Commit the batch
    if (updatedCount > 0) {
      await batch.commit();
      console.log(`Successfully deleted "${scoreName}" from ${updatedCount} students`);
    } else {
      console.log(`No partial scores with name "${scoreName}" found`);
    }

    return { success: true, updatedCount };
  } catch (error) {
    console.error('Error deleting partial score from all students:', error);
    return { success: false, error: error.message };
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



