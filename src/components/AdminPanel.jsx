import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase'; // Import db from firebase
import { collection, getDocs } from 'firebase/firestore'; // Import firestore functions
import { 
  getAuthorizedEmails, 
  addAuthorizedEmail, 
  removeAuthorizedEmail,
  getDashboardContent,
  updateDashboardContent,
  updateStudentEvaluation,
  addPartialScore, // Import the add partial score function
  deletePartialScore, // Import the delete partial score function
  deletePartialScoreFromAll, // NEW: Import the new bulk delete function
  getAllFeedback,
  deleteSubmission // Add this line
} from '../lib/auth';
import GoogleDriveSync from './GoogleDriveSync';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { 
  LogOut, 
  Users, 
  Video, 
  FileText, 
  ExternalLink, 
  StickyNote,
  Plus,
  Trash2,
  Edit,
  Save,
  Shield,
  Settings,
  Database,
  Loader2,
  Cloud,
  Award, // Icon for Evaluations
  Briefcase, // Icon for Submissions
  MessageSquare,
  Star,
  Upload, // Icon for bulk upload
  Calendar,
  Target
} from 'lucide-react';

const AdminPanel = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Enhanced evaluation dialog state
  const [isEvalDialogOpen, setIsEvalDialogOpen] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [currentEvaluation, setCurrentEvaluation] = useState(null);
  const [newPartialScore, setNewPartialScore] = useState({
    name: '',
    score: ''
  });
  
  // NEW: Bulk delete dialog state
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [bulkDeleteScoreName, setBulkDeleteScoreName] = useState('');
  
  const [submissions, setSubmissions] = useState([]); // State for submissions
  const [feedback, setFeedback] = useState([]); // State for feedback
  // Student management state
  const [authorizedEmails, setAuthorizedEmails] = useState([]);
  const [newEmail, setNewEmail] = useState('');

  // Evaluations state
  const [evaluations, setEvaluations] = useState([]);
  
  // Content management state
  const [content, setContent] = useState({
    lectures: [],
    materials: [],
    links: [],
    notes: []
  });
  
  // Form states for adding new content
  const [newLecture, setNewLecture] = useState({ title: '', description: '', url: '', duration: '', date: '' });
  const [newMaterial, setNewMaterial] = useState({ title: '', description: '', url: '', type: 'PDF' });
  const [newLink, setNewLink] = useState({ title: '', description: '', url: '' });
  const [newNote, setNewNote] = useState({ title: '', content: '', date: '' });

  useEffect(() => {
    loadData();
  }, []);

  // The loadData function now also fetches evaluations
const loadData = async () => {
  setLoading(true);
  try {
    const [emails, dashboardContent, evalsSnapshot, subsSnapshot, feedbackData] = await Promise.all([
      getAuthorizedEmails(),
      getDashboardContent(),
      getDocs(collection(db, "evaluations")),
      getDocs(collection(db, "submissions")),
      getAllFeedback() // Fetch feedback
    ]);

    setAuthorizedEmails(emails);
    setContent(dashboardContent);

    const evalsData = evalsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setEvaluations(evalsData);

    const subsData = subsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setSubmissions(subsData);

    setFeedback(feedbackData); // Set feedback state

  } catch (error) {
    console.error('Error loading data:', error);
    setMessage('Error loading data. Please try again.');
  } finally {
    setLoading(false);
  }
};
  const showMessage = (msg, isError = false) => {
    setMessage(msg);
    setTimeout(() => setMessage(''), 3000);
  };

  // Student management functions
  const handleAddEmail = async (e) => {
    e.preventDefault();
    if (!newEmail) return;

    setLoading(true);
    const success = await addAuthorizedEmail(newEmail);
    if (success) {
      setNewEmail('');
      await loadData();
      showMessage('Email added successfully!');
    } else {
      showMessage('Failed to add email. Please try again.', true);
    }
    setLoading(false);
  };

  const handleRemoveEmail = async (emailId) => {
    setLoading(true);
    const success = await removeAuthorizedEmail(emailId);
    if (success) {
      await loadData();
      showMessage('Email removed successfully!');
    } else {
      showMessage('Failed to remove email. Please try again.', true);
    }
    setLoading(false);
  };
  
  // Enhanced function to open the evaluation dialog
  const handleEditEvaluation = (email) => {
    const student = authorizedEmails.find(e => e.email === email);
    const existingEval = evaluations.find(e => e.studentEmail === email);
    
    setCurrentStudent(student);
    setCurrentEvaluation(existingEval || {
      studentEmail: email,
      totalScore: 0,
      partialScores: []
    });
    setNewPartialScore({ name: '', score: '' });
    setIsEvalDialogOpen(true);
  };

  // Handle adding a new partial score
  const handleAddPartialScore = async (e) => {
    e.preventDefault();
    if (!newPartialScore.name || !newPartialScore.score) {
      showMessage('Please fill in both evaluation name and score.', true);
      return;
    }

    const score = parseFloat(newPartialScore.score);
    if (isNaN(score) || score < 0 || score > 100) {
      showMessage('Please enter a valid score between 0 and 100.', true);
      return;
    }

    setLoading(true);
    
    // Create the partial score object with unique ID
    const partialScoreObj = {
      id: Date.now().toString(), // Use timestamp as unique ID
      name: newPartialScore.name,
      score: score,
      date: new Date().toISOString().split('T')[0]
    };
    
    const success = await addPartialScore(currentEvaluation.studentEmail, partialScoreObj);
    
    if (success) {
      await loadData();
      // Refresh current evaluation data
      const updatedEval = evaluations.find(e => e.studentEmail === currentEvaluation.studentEmail);
      setCurrentEvaluation(updatedEval || currentEvaluation);
      setNewPartialScore({ name: '', score: '' });
      showMessage('Partial score added successfully!');
    } else {
      showMessage('Failed to add partial score. Please try again.', true);
    }
    setLoading(false);
  };

  // FIXED: Handle deleting a partial score
  const handleDeletePartialScore = async (partialScoreId) => {
    if (!window.confirm('Are you sure you want to delete this partial score?')) {
      return;
    }

    setLoading(true);
    const success = await deletePartialScore(currentEvaluation.studentEmail, partialScoreId);
    
    if (success) {
      await loadData();
      // Refresh current evaluation data
      const updatedEval = evaluations.find(e => e.studentEmail === currentEvaluation.studentEmail);
      setCurrentEvaluation(updatedEval || { ...currentEvaluation, partialScores: [] });
      showMessage('Partial score deleted successfully!');
    } else {
      showMessage('Failed to delete partial score. Please try again.', true);
    }
    setLoading(false);
  };

  // NEW: Handle bulk delete partial score
  const handleBulkDeletePartialScore = async (e) => {
    e.preventDefault();
    if (!bulkDeleteScoreName.trim()) {
      showMessage('Please enter a score name to delete.', true);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete "${bulkDeleteScoreName}" from ALL students? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    const result = await deletePartialScoreFromAll(bulkDeleteScoreName.trim());
    
    if (result.success) {
      await loadData();
      setBulkDeleteScoreName('');
      setIsBulkDeleteDialogOpen(false);
      showMessage(`Successfully deleted "${bulkDeleteScoreName}" from ${result.updatedCount} students!`);
    } else {
      showMessage(`Failed to delete partial score: ${result.error}`, true);
    }
    setLoading(false);
  };

  // Content management functions
  const handleAddLecture = async (e) => {
    e.preventDefault();
    if (!newLecture.title) return;

    const updatedContent = {
      ...content,
      lectures: [...(content.lectures || []), { ...newLecture, id: Date.now().toString() }]
    };

    setLoading(true);
    const success = await updateDashboardContent(updatedContent);
    if (success) {
      setContent(updatedContent);
      setNewLecture({ title: '', description: '', url: '', duration: '', date: '' });
      showMessage('Lecture added successfully!');
    } else {
      showMessage('Failed to add lecture. Please try again.', true);
    }
    setLoading(false);
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    if (!newMaterial.title) return;

    const updatedContent = {
      ...content,
      materials: [...(content.materials || []), { ...newMaterial, id: Date.now().toString() }]
    };

    setLoading(true);
    const success = await updateDashboardContent(updatedContent);
    if (success) {
      setContent(updatedContent);
      setNewMaterial({ title: '', description: '', url: '', type: 'PDF' });
      showMessage('Material added successfully!');
    } else {
      showMessage('Failed to add material. Please try again.', true);
    }
    setLoading(false);
  };

  const handleAddLink = async (e) => {
    e.preventDefault();
    if (!newLink.title || !newLink.url) return;

    const updatedContent = {
      ...content,
      links: [...(content.links || []), { ...newLink, id: Date.now().toString() }]
    };

    setLoading(true);
    const success = await updateDashboardContent(updatedContent);
    if (success) {
      setContent(updatedContent);
      setNewLink({ title: '', description: '', url: '' });
      showMessage('Link added successfully!');
    } else {
      showMessage('Failed to add link. Please try again.', true);
    }
    setLoading(false);
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!newNote.title || !newNote.content) return;

    const updatedContent = {
      ...content,
      notes: [...(content.notes || []), { ...newNote, id: Date.now().toString(), date: new Date().toLocaleDateString() }]
    };

    setLoading(true);
    const success = await updateDashboardContent(updatedContent);
    if (success) {
      setContent(updatedContent);
      setNewNote({ title: '', content: '', date: '' });
      showMessage('Note added successfully!');
    } else {
      showMessage('Failed to add note. Please try again.', true);
    }
    setLoading(false);
  };

  const handleRemoveItem = async (type, itemId) => {
    const updatedContent = {
      ...content,
      [type]: content[type].filter(item => item.id !== itemId)
    };

    setLoading(true);
    const success = await updateDashboardContent(updatedContent);
    if (success) {
      setContent(updatedContent);
      showMessage(`${type.slice(0, -1)} removed successfully!`);
    } else {
      showMessage(`Failed to remove ${type.slice(0, -1)}. Please try again.`, true);
    }
    setLoading(false);
  };
  
  const handleDeleteSubmission = async (submissionId) => {
  if (window.confirm("Are you sure you want to delete this submission?")) {
    setLoading(true);
    const success = await deleteSubmission(submissionId);
    if (success) {
      showMessage('Submission deleted successfully!');
      await loadData(); // Reload the list
    } else {
      showMessage('Failed to delete submission.', true);
    }
    setLoading(false);
  }
};

  // Custom Tab Button Component
  const TabButton = ({ value, isActive, onClick, icon: Icon, children, colorScheme = 'blue' }) => {
    const colorClasses = {
      blue: isActive ? 'bg-blue-100 border-blue-300 text-blue-700 shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50',
      yellow: isActive ? 'bg-yellow-100 border-yellow-300 text-yellow-700 shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50',
      green: isActive ? 'bg-green-100 border-green-300 text-green-700 shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50',
      purple: isActive ? 'bg-purple-100 border-purple-300 text-purple-700 shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50',
      red: isActive ? 'bg-red-100 border-red-300 text-red-700 shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50',
      indigo: isActive ? 'bg-indigo-100 border-indigo-300 text-indigo-700 shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50',
      teal: isActive ? 'bg-teal-100 border-teal-300 text-teal-700 shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50',
      amber: isActive ? 'bg-amber-100 border-amber-300 text-amber-700 shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50',
      cyan: isActive ? 'bg-cyan-100 border-cyan-300 text-cyan-700 shadow-md' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
    };

    return (
      <button
        onClick={() => onClick(value)}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all duration-200 ${colorClasses[colorScheme]}`}
      >
        <Icon className="w-4 h-4" />
        <span>{children}</span>
      </button>
    );
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'students':
        return (
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-lg">
            <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
              <CardTitle className="flex items-center space-x-2 text-gray-800">
                <Users className="w-5 h-5 text-blue-600" />
                <span>Authorized Students</span>
              </CardTitle>
              <CardDescription className="text-gray-600">
                Manage student email addresses that can access the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAddEmail} className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mb-6">
                <Input
                  type="email"
                  placeholder="student@example.com"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
                <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span className="ml-2">Add Email</span>
                </Button>
              </form>

              <div className="space-y-3">
                {authorizedEmails.map((emailObj) => (
                  <div key={emailObj.id} className="flex items-center justify-between p-4 bg-gray-50/80 rounded-lg border border-gray-200 hover:bg-gray-100/80 transition-colors">
                    <span className="font-medium text-gray-800 break-all">{emailObj.email}</span>
                    <Button
                      onClick={() => handleRemoveEmail(emailObj.id)}
                      variant="destructive"
                      size="sm"
                      disabled={loading}
                      className="ml-2 flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {authorizedEmails.length === 0 && (
                  <div className="text-center py-12">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No authorized emails yet</p>
                    <p className="text-gray-400 text-sm">Add student emails to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'evaluations':
        return (
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-lg">
            <CardHeader className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-t-lg">
              <CardTitle className="flex items-center space-x-2 text-gray-800">
                <Award className="w-5 h-5 text-yellow-600" />
                <span>Student Evaluations</span>
              </CardTitle>
              <CardDescription className="text-gray-600">
                View and manage student evaluations and scores.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {/* NEW: Bulk Delete Button */}
              <div className="mb-6">
                <Button
                  onClick={() => setIsBulkDeleteDialogOpen(true)}
                  variant="outline"
                  className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
                  disabled={loading}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Bulk Delete a Score
                </Button>
              </div>

              <div className="space-y-3">
                {authorizedEmails.map((emailObj) => {
                  const evaluation = evaluations.find(e => e.studentEmail === emailObj.email);
                  return (
                    <div key={emailObj.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50/80 rounded-lg border border-gray-200 hover:bg-gray-100/80 transition-colors">
                      <div className="flex-1">
                        <div className="font-medium text-gray-800 break-all mb-1">{emailObj.email}</div>
                        <div className="text-sm text-gray-600">
                          {evaluation ? (
                            <div className="flex items-center space-x-4">
                              <span>Total Score: <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">{evaluation.totalScore}</Badge></span>
                              <span>Partial Scores: {evaluation.partialScores?.length || 0}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">No evaluation yet</span>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleEditEvaluation(emailObj.email)}
                        variant="outline"
                        size="sm"
                        disabled={loading}
                        className="mt-2 sm:mt-0 ml-0 sm:ml-2 flex-shrink-0"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                    </div>
                  );
                })}
                {authorizedEmails.length === 0 && (
                  <div className="text-center py-12">
                    <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No students to evaluate</p>
                    <p className="text-gray-400 text-sm">Add authorized emails first</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );

      // ... (other cases remain the same)
      default:
        return <div>Select a tab</div>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-lg shadow-lg border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
                <p className="text-sm text-gray-600">Welcome, {user?.email}</p>
              </div>
            </div>
            <Button onClick={logout} variant="outline" className="flex items-center space-x-2">
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Message Alert */}
      {message && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <Alert className="bg-blue-50 border-blue-200">
            <AlertDescription className="text-blue-800">{message}</AlertDescription>
          </Alert>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 p-1 bg-white/60 backdrop-blur-lg rounded-xl border border-gray-200/50 shadow-lg">
          <TabButton value="students" isActive={activeTab === 'students'} onClick={setActiveTab} icon={Users} colorScheme="blue">
            Students
          </TabButton>
          <TabButton value="evaluations" isActive={activeTab === 'evaluations'} onClick={setActiveTab} icon={Award} colorScheme="yellow">
            Evaluations
          </TabButton>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>

      {/* Evaluation Dialog */}
      <Dialog open={isEvalDialogOpen} onOpenChange={setIsEvalDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-yellow-600" />
              <span>Edit Evaluation - {currentStudent?.email}</span>
            </DialogTitle>
            <DialogDescription>
              Manage partial scores and view total evaluation for this student.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Current Total Score */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Current Total Score</h3>
              <div className="text-3xl font-bold text-yellow-600">
                {currentEvaluation?.totalScore || 0}
              </div>
            </div>

            {/* Existing Partial Scores */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Partial Scores</h3>
              {currentEvaluation?.partialScores && currentEvaluation.partialScores.length > 0 ? (
                <div className="space-y-2">
                  {currentEvaluation.partialScores.map((score) => (
                    <div key={score.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
                      <div className="flex-1">
                        <div className="font-medium text-gray-800">{score.name}</div>
                        <div className="text-sm text-gray-600">Score: {score.score} | Date: {score.date}</div>
                      </div>
                      <Button
                        onClick={() => handleDeletePartialScore(score.id)}
                        variant="destructive"
                        size="sm"
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Award className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p>No partial scores yet</p>
                </div>
              )}
            </div>

            {/* Add New Partial Score */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Add New Partial Score</h3>
              <form onSubmit={handleAddPartialScore} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Evaluation Name
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., Quiz 1, Assignment 2"
                      value={newPartialScore.name}
                      onChange={(e) => setNewPartialScore({ ...newPartialScore, name: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Score (0-100)
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      placeholder="85"
                      value={newPartialScore.score}
                      onChange={(e) => setNewPartialScore({ ...newPartialScore, score: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Add Partial Score
                </Button>
              </form>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEvalDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* NEW: Bulk Delete Dialog */}
      <Dialog open={isBulkDeleteDialogOpen} onOpenChange={setIsBulkDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2 text-red-700">
              <Trash2 className="w-5 h-5" />
              <span>Bulk Delete Partial Score</span>
            </DialogTitle>
            <DialogDescription>
              Delete a specific partial score from ALL students. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleBulkDeletePartialScore} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Score Name to Delete
              </label>
              <Input
                type="text"
                placeholder="e.g., Quiz 1, Assignment 2"
                value={bulkDeleteScoreName}
                onChange={(e) => setBulkDeleteScoreName(e.target.value)}
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the exact name of the partial score you want to delete from all students.
              </p>
            </div>

            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setIsBulkDeleteDialogOpen(false);
                  setBulkDeleteScoreName('');
                }}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                variant="destructive" 
                disabled={loading || !bulkDeleteScoreName.trim()}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Delete From All Students
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;

