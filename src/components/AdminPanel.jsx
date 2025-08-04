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
  bulkAddPartialScores, // NEW: Import the bulk add function
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
  Award, // New Icon for Evaluations
  Briefcase, // Icon for Submissions
  MessageSquare,
  Star,
  Upload // NEW: Icon for bulk upload
} from 'lucide-react';

const AdminPanel = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  // NEW state for the evaluation pop-up form
  const [isEvalDialogOpen, setIsEvalDialogOpen] = useState(false);
  const [currentEval, setCurrentEval] = useState({ studentEmail: '', score: 0, feedback: '', evaluationDate: '' });
  
  // NEW: State for bulk add scores dialog
  const [isBulkScoresDialogOpen, setIsBulkScoresDialogOpen] = useState(false);
  const [bulkScoresData, setBulkScoresData] = useState({
    evaluationName: '',
    pastedData: ''
  });
  
  const [submissions, setSubmissions] = useState([]); // New state for submissions
  const [feedback, setFeedback] = useState([]); // New state for feedback
  // Student management state
  const [authorizedEmails, setAuthorizedEmails] = useState([]);
  const [newEmail, setNewEmail] = useState('');

  // NEW: Evaluations state
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

  // UPDATED: The loadData function now also fetches evaluations
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
  
// UPDATED function to open the pop-up dialog
  const handleEditEvaluation = (email) => {
    const existingEval = evaluations.find(e => e.studentEmail === email);
    if (existingEval) {
      setCurrentEval(existingEval);
    } else {
      // Set up a new evaluation object
      setCurrentEval({
        studentEmail: email,
        score: 0,
        feedback: '',
        evaluationDate: new Date().toISOString().split('T')[0] // today's date
      });
    }
    setIsEvalDialogOpen(true);
  };

  // NEW function to save the evaluation from the pop-up
  const handleSaveEvaluation = async (e) => {
    e.preventDefault();
    setLoading(true);
    const success = await updateStudentEvaluation({
        ...currentEval,
        evaluationDate: new Date().toISOString().split('T')[0] // always save with today's date
    });

    if (success) {
      await loadData();
      showMessage('Evaluation saved successfully!');
    } else {
      showMessage('Failed to save evaluation. Please try again.', true);
    }
    setLoading(false);
    setIsEvalDialogOpen(false); // Close the dialog
  };

  // NEW: Handle bulk add scores
  const handleBulkAddScores = async (e) => {
    e.preventDefault();
    if (!bulkScoresData.evaluationName || !bulkScoresData.pastedData) {
      showMessage('Please fill in both evaluation name and data.', true);
      return;
    }

    setLoading(true);
    const success = await bulkAddPartialScores(bulkScoresData.evaluationName, bulkScoresData.pastedData);
    
    if (success) {
      await loadData();
      showMessage('Bulk scores added successfully!');
      setBulkScoresData({ evaluationName: '', pastedData: '' });
      setIsBulkScoresDialogOpen(false);
    } else {
      showMessage('Failed to add bulk scores. Please check your data format.', true);
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
              {/* NEW: Bulk Add Scores Button */}
              <div className="mb-6">
                <Button
                  onClick={() => setIsBulkScoresDialogOpen(true)}
                  className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2"
                >
                  <Upload className="w-4 h-4" />
                  <span>Bulk Add Scores</span>
                </Button>
              </div>

              <div className="space-y-3">
                {authorizedEmails.map((emailObj) => {
                  const evaluation = evaluations.find(e => e.studentEmail === emailObj.email);
                  return (
                    <div key={emailObj.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50/80 rounded-lg border border-gray-200 hover:bg-gray-100/80 transition-colors space-y-2 sm:space-y-0">
                      <div className="flex-1">
                        <span className="font-medium text-gray-800 break-all">{emailObj.email}</span>
                        {evaluation && (
                          <div className="text-sm text-gray-600 mt-1">
                            {/* UPDATED: Show totalScore instead of score */}
                            Total Score: <span className="font-semibold text-blue-600">{evaluation.totalScore || evaluation.score || 0}/100</span>
                            {evaluation.partialScores && evaluation.partialScores.length > 0 && (
                              <span className="ml-2">• {evaluation.partialScores.length} partial score(s)</span>
                            )}
                            {evaluation.evaluationDate && (
                              <span className="ml-2">• Last updated: {evaluation.evaluationDate}</span>
                            )}
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={() => handleEditEvaluation(emailObj.email)}
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-2 border-blue-300 text-blue-600 hover:bg-blue-50"
                      >
                        <Edit className="w-4 h-4" />
                        <span>{evaluation ? 'Edit Evaluation' : 'Add Evaluation'}</span>
                      </Button>
                    </div>
                  );
                })}
                {authorizedEmails.length === 0 && (
                  <div className="text-center py-12">
                    <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No students to evaluate</p>
                    <p className="text-gray-400 text-sm">Add students first to manage their evaluations</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'lectures':
        return (
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
              <CardTitle className="flex items-center space-x-2 text-gray-800">
                <Video className="w-5 h-5 text-green-600" />
                <span>Lecture Videos</span>
              </CardTitle>
              <CardDescription className="text-gray-600">
                Add and manage lecture video content for students
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAddLecture} className="space-y-4 mb-6 p-4 bg-gray-50/50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Lecture title"
                    value={newLecture.title}
                    onChange={(e) => setNewLecture({ ...newLecture, title: e.target.value })}
                    className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                  <Input
                    placeholder="Duration (e.g., 45 minutes)"
                    value={newLecture.duration}
                    onChange={(e) => setNewLecture({ ...newLecture, duration: e.target.value })}
                    className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                  />
                </div>
                <Input
                  placeholder="Video URL"
                  value={newLecture.url}
                  onChange={(e) => setNewLecture({ ...newLecture, url: e.target.value })}
                  className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
                <Textarea
                  placeholder="Lecture description"
                  value={newLecture.description}
                  onChange={(e) => setNewLecture({ ...newLecture, description: e.target.value })}
                  className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
                <Input
                  type="date"
                  value={newLecture.date}
                  onChange={(e) => setNewLecture({ ...newLecture, date: e.target.value })}
                  className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
                <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span className="ml-2">Add Lecture</span>
                </Button>
              </form>

              <div className="space-y-3">
                {(content.lectures || []).map((lecture) => (
                  <div key={lecture.id} className="p-4 bg-gray-50/80 rounded-lg border border-gray-200 hover:bg-gray-100/80 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-1">{lecture.title}</h3>
                        <p className="text-gray-600 text-sm mb-2">{lecture.description}</p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          {lecture.duration && <span>Duration: {lecture.duration}</span>}
                          {lecture.date && <span>Date: {lecture.date}</span>}
                          {lecture.url && (
                            <a href={lecture.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 flex items-center">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              View Video
                            </a>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleRemoveItem('lectures', lecture.id)}
                        variant="destructive"
                        size="sm"
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {(!content.lectures || content.lectures.length === 0) && (
                  <div className="text-center py-12">
                    <Video className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No lectures added yet</p>
                    <p className="text-gray-400 text-sm">Add your first lecture to get started</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'materials':
        return (
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-t-lg">
              <CardTitle className="flex items-center space-x-2 text-gray-800">
                <FileText className="w-5 h-5 text-purple-600" />
                <span>Course Materials</span>
              </CardTitle>
              <CardDescription className="text-gray-600">
                Upload and manage course materials, documents, and resources
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAddMaterial} className="space-y-4 mb-6 p-4 bg-gray-50/50 rounded-lg border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input
                    placeholder="Material title"
                    value={newMaterial.title}
                    onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                    className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                  />
                  <select
                    value={newMaterial.type}
                    onChange={(e) => setNewMaterial({ ...newMaterial, type: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:border-purple-500 focus:ring-purple-500"
                  >
                    <option value="PDF">PDF</option>
                    <option value="DOC">Document</option>
                    <option value="PPT">Presentation</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <Input
                  placeholder="Material URL or file link"
                  value={newMaterial.url}
                  onChange={(e) => setNewMaterial({ ...newMaterial, url: e.target.value })}
                  className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
                <Textarea
                  placeholder="Material description"
                  value={newMaterial.description}
                  onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                  className="border-gray-300 focus:border-purple-500 focus:ring-purple-500"
                />
                <Button type="submit" disabled={loading} className="bg-purple-600 hover:bg-purple-700 text-white">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span className="ml-2">Add Material</span>
                </Button>
              </form>

              <div className="space-y-3">
                {(content.materials || []).map((material) => (
                  <div key={material.id} className="p-4 bg-gray-50/80 rounded-lg border border-gray-200 hover:bg-gray-100/80 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-800">{material.title}</h3>
                          <Badge variant="secondary" className="text-xs">{material.type}</Badge>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{material.description}</p>
                        {material.url && (
                          <a href={material.url} target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:text-purple-800 flex items-center text-sm">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Download/View Material
                          </a>
                        )}
                      </div>
                      <Button
                        onClick={() => handleRemoveItem('materials', material.id)}
                        variant="destructive"
                        size="sm"
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {(!content.materials || content.materials.length === 0) && (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No materials added yet</p>
                    <p className="text-gray-400 text-sm">Add course materials to help your students</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'links':
        return (
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-lg">
            <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 rounded-t-lg">
              <CardTitle className="flex items-center space-x-2 text-gray-800">
                <ExternalLink className="w-5 h-5 text-red-600" />
                <span>Useful Links</span>
              </CardTitle>
              <CardDescription className="text-gray-600">
                Share important links and external resources with students
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAddLink} className="space-y-4 mb-6 p-4 bg-gray-50/50 rounded-lg border border-gray-200">
                <Input
                  placeholder="Link title"
                  value={newLink.title}
                  onChange={(e) => setNewLink({ ...newLink, title: e.target.value })}
                  className="border-gray-300 focus:border-red-500 focus:ring-red-500"
                />
                <Input
                  placeholder="URL"
                  value={newLink.url}
                  onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                  className="border-gray-300 focus:border-red-500 focus:ring-red-500"
                />
                <Textarea
                  placeholder="Link description"
                  value={newLink.description}
                  onChange={(e) => setNewLink({ ...newLink, description: e.target.value })}
                  className="border-gray-300 focus:border-red-500 focus:ring-red-500"
                />
                <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span className="ml-2">Add Link</span>
                </Button>
              </form>

              <div className="space-y-3">
                {(content.links || []).map((link) => (
                  <div key={link.id} className="p-4 bg-gray-50/80 rounded-lg border border-gray-200 hover:bg-gray-100/80 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-1">{link.title}</h3>
                        <p className="text-gray-600 text-sm mb-2">{link.description}</p>
                        {link.url && (
                          <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:text-red-800 flex items-center text-sm">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            Visit Link
                          </a>
                        )}
                      </div>
                      <Button
                        onClick={() => handleRemoveItem('links', link.id)}
                        variant="destructive"
                        size="sm"
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {(!content.links || content.links.length === 0) && (
                  <div className="text-center py-12">
                    <ExternalLink className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No links added yet</p>
                    <p className="text-gray-400 text-sm">Add useful links for your students</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'notes':
        return (
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-lg">
            <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-t-lg">
              <CardTitle className="flex items-center space-x-2 text-gray-800">
                <StickyNote className="w-5 h-5 text-indigo-600" />
                <span>Course Notes</span>
              </CardTitle>
              <CardDescription className="text-gray-600">
                Add important notes and announcements for students
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <form onSubmit={handleAddNote} className="space-y-4 mb-6 p-4 bg-gray-50/50 rounded-lg border border-gray-200">
                <Input
                  placeholder="Note title"
                  value={newNote.title}
                  onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
                  className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                />
                <Textarea
                  placeholder="Note content"
                  value={newNote.content}
                  onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
                  rows={4}
                  className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                />
                <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  <span className="ml-2">Add Note</span>
                </Button>
              </form>

              <div className="space-y-3">
                {(content.notes || []).map((note) => (
                  <div key={note.id} className="p-4 bg-gray-50/80 rounded-lg border border-gray-200 hover:bg-gray-100/80 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-1">{note.title}</h3>
                        <p className="text-gray-600 text-sm mb-2 whitespace-pre-wrap">{note.content}</p>
                        {note.date && (
                          <p className="text-gray-400 text-xs">Added: {note.date}</p>
                        )}
                      </div>
                      <Button
                        onClick={() => handleRemoveItem('notes', note.id)}
                        variant="destructive"
                        size="sm"
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {(!content.notes || content.notes.length === 0) && (
                  <div className="text-center py-12">
                    <StickyNote className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No notes added yet</p>
                    <p className="text-gray-400 text-sm">Add important notes for your students</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'submissions':
        return (
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-lg">
            <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-t-lg">
              <CardTitle className="flex items-center space-x-2 text-gray-800">
                <Briefcase className="w-5 h-5 text-teal-600" />
                <span>Project Submissions</span>
              </CardTitle>
              <CardDescription className="text-gray-600">
                View and manage student project submissions
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <div key={submission.id} className="p-4 bg-gray-50/80 rounded-lg border border-gray-200 hover:bg-gray-100/80 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-1">{submission.projectTitle}</h3>
                        <p className="text-gray-600 text-sm mb-2">Student: {submission.studentEmail}</p>
                        <p className="text-gray-600 text-sm mb-2">{submission.description}</p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <span>Submitted: {submission.submittedAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}</span>
                          {submission.githubUrl && (
                            <a href={submission.githubUrl} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-800 flex items-center">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              GitHub
                            </a>
                          )}
                          {submission.liveUrl && (
                            <a href={submission.liveUrl} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-800 flex items-center">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              Live Demo
                            </a>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleDeleteSubmission(submission.id)}
                        variant="destructive"
                        size="sm"
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {submissions.length === 0 && (
                  <div className="text-center py-12">
                    <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No submissions yet</p>
                    <p className="text-gray-400 text-sm">Student project submissions will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'feedback':
        return (
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-lg">
            <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-t-lg">
              <CardTitle className="flex items-center space-x-2 text-gray-800">
                <MessageSquare className="w-5 h-5 text-amber-600" />
                <span>Student Feedback</span>
              </CardTitle>
              <CardDescription className="text-gray-600">
                View feedback submitted by students about lectures and course content
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {feedback.map((item) => (
                  <div key={item.id} className="p-4 bg-gray-50/80 rounded-lg border border-gray-200 hover:bg-gray-100/80 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800 mb-1">
                          Feedback for: {item.lectureTitle || 'General Feedback'}
                        </h3>
                        <p className="text-gray-600 text-sm mb-2">From: {item.studentEmail}</p>
                      </div>
                      <div className="flex items-center space-x-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < (item.rating || 0) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                          />
                        ))}
                        <span className="text-sm text-gray-600 ml-2">{item.rating}/5</span>
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm mb-2">{item.feedback}</p>
                    <p className="text-gray-400 text-xs">
                      Submitted: {item.submittedAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                    </p>
                  </div>
                ))}
                {feedback.length === 0 && (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No feedback yet</p>
                    <p className="text-gray-400 text-sm">Student feedback will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'sync':
        return <GoogleDriveSync />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
              <Shield className="w-8 h-8 text-blue-600" />
              <span>Admin Dashboard</span>
            </h1>
            <p className="text-gray-600 mt-1">Welcome back, {user?.email}</p>
          </div>
          <Button
            onClick={logout}
            variant="outline"
            className="flex items-center space-x-2 border-red-300 text-red-600 hover:bg-red-50"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Button>
        </div>

        {/* Message Alert */}
        {message && (
          <Alert className="mb-6 border-blue-200 bg-blue-50">
            <AlertDescription className="text-blue-800">{message}</AlertDescription>
          </Alert>
        )}

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 p-2 bg-white/60 backdrop-blur-lg rounded-xl border border-white/20 shadow-lg">
          <TabButton value="students" isActive={activeTab === 'students'} onClick={setActiveTab} icon={Users} colorScheme="blue">
            Students
          </TabButton>
          <TabButton value="evaluations" isActive={activeTab === 'evaluations'} onClick={setActiveTab} icon={Award} colorScheme="yellow">
            Evaluations
          </TabButton>
          <TabButton value="lectures" isActive={activeTab === 'lectures'} onClick={setActiveTab} icon={Video} colorScheme="green">
            Lectures
          </TabButton>
          <TabButton value="materials" isActive={activeTab === 'materials'} onClick={setActiveTab} icon={FileText} colorScheme="purple">
            Materials
          </TabButton>
          <TabButton value="links" isActive={activeTab === 'links'} onClick={setActiveTab} icon={ExternalLink} colorScheme="red">
            Links
          </TabButton>
          <TabButton value="notes" isActive={activeTab === 'notes'} onClick={setActiveTab} icon={StickyNote} colorScheme="indigo">
            Notes
          </TabButton>
          <TabButton value="submissions" isActive={activeTab === 'submissions'} onClick={setActiveTab} icon={Briefcase} colorScheme="teal">
            Submissions
          </TabButton>
          <TabButton value="feedback" isActive={activeTab === 'feedback'} onClick={setActiveTab} icon={MessageSquare} colorScheme="amber">
            Feedback
          </TabButton>
          <TabButton value="sync" isActive={activeTab === 'sync'} onClick={setActiveTab} icon={Cloud} colorScheme="cyan">
            Drive Sync
          </TabButton>
        </div>

        {/* Tab Content */}
        <div className="animate-in fade-in duration-300">
          {renderTabContent()}
        </div>

        {/* Evaluation Dialog */}
        <Dialog open={isEvalDialogOpen} onOpenChange={setIsEvalDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Student Evaluation</DialogTitle>
              <DialogDescription>
                Update the evaluation for {currentEval.studentEmail}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSaveEvaluation} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Score (0-100)</label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={currentEval.score}
                  onChange={(e) => setCurrentEval({ ...currentEval, score: parseInt(e.target.value) || 0 })}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Feedback</label>
                <Textarea
                  value={currentEval.feedback}
                  onChange={(e) => setCurrentEval({ ...currentEval, feedback: e.target.value })}
                  rows={4}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Provide detailed feedback for the student..."
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEvalDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  <span className="ml-2">Save Evaluation</span>
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* NEW: Bulk Add Scores Dialog */}
        <Dialog open={isBulkScoresDialogOpen} onOpenChange={setIsBulkScoresDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Bulk Add Partial Scores</DialogTitle>
              <DialogDescription>
                Add partial scores for a specific evaluation (e.g., Quiz 1, Homework 2) for multiple students at once.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleBulkAddScores} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Evaluation Name</label>
                <Input
                  type="text"
                  placeholder="e.g., Quiz 1, Homework 2, Final Project"
                  value={bulkScoresData.evaluationName}
                  onChange={(e) => setBulkScoresData({ ...bulkScoresData, evaluationName: e.target.value })}
                  className="border-gray-300 focus:border-green-500 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student Data</label>
                <Textarea
                  value={bulkScoresData.pastedData}
                  onChange={(e) => setBulkScoresData({ ...bulkScoresData, pastedData: e.target.value })}
                  rows={8}
                  className="border-gray-300 focus:border-green-500 focus:ring-green-500 font-mono text-sm"
                  placeholder="Paste data from Excel here. Format should be:
student1@example.com	85
student2@example.com	92
student3@example.com	78

Each line should have: email [TAB] score"
                />
              </div>
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Instructions:</strong> Copy data from Excel with two columns: student email and score. 
                  The system will automatically calculate the new total score for each student by averaging all their partial scores.
                </p>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsBulkScoresDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading} className="bg-green-600 hover:bg-green-700 text-white">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  <span className="ml-2">Add Scores</span>
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminPanel;

