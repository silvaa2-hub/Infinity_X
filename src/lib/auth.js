import { db } from './firebase';
import { doc, getDoc, collection, getDocs, addDoc, deleteDoc, updateDoc, setDoc, serverTimestamp, writeBatch } from 'firebase/firestore';

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

// UPDATED: Add or update a student evaluation with new cumulative structure
export const updateStudentEvaluation = async (evaluationData) => {
  try {
    // We use the student's email as the document ID
    const evalRef = doc(db, 'evaluations', evaluationData.studentEmail);
    
    // For backward compatibility, if it's the old format, convert it
    if (evaluationData.score !== undefined && !evaluationData.totalScore) {
      // This is old format data, convert to new format
      const newEvaluationData = {
        studentEmail: evaluationData.studentEmail,
        totalScore: evaluationData.score,
        partialScores: [
          {
            name: "Initial Evaluation",
            score: evaluationData.score,
            date: evaluationData.evaluationDate || new Date().toISOString().split('T')[0]
          }
        ]
      };
      await setDoc(evalRef, newEvaluationData);
    } else {
      // This is new format data
      await setDoc(evalRef, evaluationData);
    }
    
    return true;
  } catch (error) {
    console.error('Error updating evaluation:', error);
    return false;
  }
};

// NEW: Bulk add partial scores function
export const bulkAddPartialScores = async (evaluationName, pastedData) => {
  try {
    const batch = writeBatch(db);
    const lines = pastedData.trim().split('\n');
    const currentDate = new Date().toISOString().split('T')[0];
    
    for (const line of lines) {
      const [email, scoreStr] = line.split('\t').map(item => item.trim());
      
      if (!email || !scoreStr) continue;
      
      const score = parseFloat(scoreStr);
      if (isNaN(score)) continue;
      
      const evalRef = doc(db, 'evaluations', email.toLowerCase());
      
      // Get existing evaluation data
      const existingDoc = await getDoc(evalRef);
      let evaluationData;
      
      if (existingDoc.exists()) {
        evaluationData = existingDoc.data();
        
        // Ensure partialScores array exists
        if (!evaluationData.partialScores) {
          evaluationData.partialScores = [];
        }
      } else {
        // Create new evaluation document
        evaluationData = {
          studentEmail: email.toLowerCase(),
          totalScore: 0,
          partialScores: []
        };
      }
      
      // Add new partial score
      evaluationData.partialScores.push({
        name: evaluationName,
        score: score,
        date: currentDate
      });
      
      // Recalculate total score (average of all partial scores, capped at 100)
      const totalScore = evaluationData.partialScores.reduce((sum, partial) => sum + partial.score, 0) / evaluationData.partialScores.length;
      evaluationData.totalScore = Math.min(100, Math.round(totalScore * 100) / 100);
      
      // Add to batch
      batch.set(evalRef, evaluationData);
    }
    
    // Commit the batch
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Error bulk adding partial scores:', error);
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

