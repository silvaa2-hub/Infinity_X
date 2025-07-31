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
  Star
} from 'lucide-react';

const AdminPanel = () => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  // NEW state for the evaluation pop-up form
  const [isEvalDialogOpen, setIsEvalDialogOpen] = useState(false);
  const [currentEval, setCurrentEval] = useState({ studentEmail: '', score: 0, feedback: '', evaluationDate: '' });
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
              <div className="space-y-3">
                {authorizedEmails.map((emailObj) => {
                  const evaluation = evaluations.find(e => e.studentEmail === emailObj.email);
                  return (
                    <div key={emailObj.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50/80 rounded-lg border border-gray-200 hover:bg-gray-100/80 transition-colors space-y-2 sm:space-y-0">
                      <div className="flex-1">
                        <span className="font-medium text-gray-800 break-all">{emailObj.email}</span>
                        {evaluation && (
                          <div className="text-sm text-gray-600 mt-1">
                            Score: <span className="font-semibold text-blue-600">{evaluation.score}/100</span>
                            {evaluation.evaluationDate && (
                              <span className="ml-2">• Evaluated: {evaluation.evaluationDate}</span>
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
                    <p className="text-gray-400 text-sm">Add students first to start evaluations</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'submissions':
        return (
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-lg">
            <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-t-lg">
              <CardTitle className="flex items-center space-x-2 text-gray-800">
                <Briefcase className="w-5 h-5 text-green-600" />
                <span>Project Submissions</span>
              </CardTitle>
              <CardDescription className="text-gray-600">
                Review and manage student project submissions.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {submissions.length > 0 ? submissions.map((sub) => (
                  <div key={sub.id} className="p-4 bg-gray-50/80 rounded-lg border border-gray-200 hover:bg-gray-100/80 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between space-y-3 sm:space-y-0">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 text-lg">{sub.projectTitle}</h3>
                        <p className="text-gray-600 mt-2 leading-relaxed">{sub.description}</p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <Badge variant="outline" className="text-xs">
                            {sub.studentEmail}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {sub.submittedAt ? new Date(sub.submittedAt.toDate()).toLocaleDateString() : 'N/A'}
                          </Badge>
                        </div>
                        {sub.projectUrl && (
                          <a 
                            href={sub.projectUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 mt-2 text-sm"
                          >
                            <ExternalLink className="w-4 h-4" />
                            <span>View Project</span>
                          </a>
                        )}
                      </div>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => handleDeleteSubmission(sub.id)}
                        disabled={loading}
                        className="flex-shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12">
                    <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No projects have been submitted yet.</p>
                    <p className="text-gray-400 text-sm">Student submissions will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'feedback':
        return (
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-lg">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-t-lg">
              <CardTitle className="flex items-center space-x-2 text-gray-800">
                <MessageSquare className="w-5 h-5 text-purple-600" />
                <span>Student Feedback</span>
              </CardTitle>
              <CardDescription className="text-gray-600">
                Review feedback and suggestions submitted by students.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {feedback.length > 0 ? feedback.map((fb) => (
                  <div key={fb.id} className="p-4 bg-gray-50/80 rounded-lg border border-gray-200 hover:bg-gray-100/80 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between space-y-3 sm:space-y-0">
                      <div className="flex-1">
                        <p className="font-bold text-gray-800">{fb.lectureName}</p>
                        <p className="text-gray-600 mt-2 leading-relaxed">{fb.feedback}</p>
                      </div>
                      <div className="flex items-center space-x-1 text-yellow-500 flex-shrink-0">
                        <span className="font-semibold">{fb.rating}</span>
                        <Star className="w-4 h-4" fill="currentColor" />
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-200 flex flex-col sm:flex-row sm:justify-between space-y-1 sm:space-y-0">
                      <p>From: {fb.studentEmail}</p>
                      <p>Date: {fb.submittedAt ? new Date(fb.submittedAt.toDate()).toLocaleString() : 'N/A'}</p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No feedback has been submitted yet.</p>
                    <p className="text-gray-400 text-sm">Student feedback will appear here</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );

      case 'lectures':
        return (
          <div className="space-y-6">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-lg">
              <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2 text-gray-800">
                  <Video className="w-5 h-5 text-red-600" />
                  <span>Add New Lecture</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleAddLecture} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Lecture Title"
                      value={newLecture.title}
                      onChange={(e) => setNewLecture({...newLecture, title: e.target.value})}
                      className="border-gray-300 focus:border-red-500 focus:ring-red-500"
                    />
                    <Input
                      placeholder="Duration (e.g., 45 min)"
                      value={newLecture.duration}
                      onChange={(e) => setNewLecture({...newLecture, duration: e.target.value})}
                      className="border-gray-300 focus:border-red-500 focus:ring-red-500"
                    />
                  </div>
                  <Textarea
                    placeholder="Lecture Description"
                    value={newLecture.description}
                    onChange={(e) => setNewLecture({...newLecture, description: e.target.value})}
                    className="border-gray-300 focus:border-red-500 focus:ring-red-500"
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Video URL (Google Drive, YouTube, etc.)"
                      value={newLecture.url}
                      onChange={(e) => setNewLecture({...newLecture, url: e.target.value})}
                      className="border-gray-300 focus:border-red-500 focus:ring-red-500"
                    />
                    <Input
                      type="date"
                      value={newLecture.date}
                      onChange={(e) => setNewLecture({...newLecture, date: e.target.value})}
                      className="border-gray-300 focus:border-red-500 focus:ring-red-500"
                    />
                  </div>
                  <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700 text-white">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    Add Lecture
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-lg">
              <CardHeader className="bg-gradient-to-r from-red-50 to-pink-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2 text-gray-800">
                  <Video className="w-5 h-5 text-red-600" />
                  <span>Existing Lectures</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {(content.lectures || []).map((lecture) => (
                    <div key={lecture.id} className="p-4 bg-gray-50/80 rounded-lg border border-gray-200 hover:bg-gray-100/80 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between space-y-3 sm:space-y-0">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800">{lecture.title}</h3>
                          <p className="text-gray-600 mt-1">{lecture.description}</p>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {lecture.duration && (
                              <Badge variant="outline" className="text-xs">
                                {lecture.duration}
                              </Badge>
                            )}
                            {lecture.date && (
                              <Badge variant="outline" className="text-xs">
                                {lecture.date}
                              </Badge>
                            )}
                          </div>
                          {lecture.url && (
                            <a 
                              href={lecture.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-red-600 hover:text-red-800 mt-2 text-sm"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span>Watch Lecture</span>
                            </a>
                          )}
                        </div>
                        <Button
                          onClick={() => handleRemoveItem('lectures', lecture.id)}
                          variant="destructive"
                          size="sm"
                          disabled={loading}
                          className="flex-shrink-0"
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
                      <p className="text-gray-400 text-sm">Add your first lecture above</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'materials':
        return (
          <div className="space-y-6">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-lg">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2 text-gray-800">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <span>Add New Material</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleAddMaterial} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Material Title"
                      value={newMaterial.title}
                      onChange={(e) => setNewMaterial({...newMaterial, title: e.target.value})}
                      className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <select
                      value={newMaterial.type}
                      onChange={(e) => setNewMaterial({...newMaterial, type: e.target.value})}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:border-indigo-500 focus:ring-indigo-500"
                    >
                      <option value="PDF">PDF</option>
                      <option value="Document">Document</option>
                      <option value="Presentation">Presentation</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <Textarea
                    placeholder="Material Description"
                    value={newMaterial.description}
                    onChange={(e) => setNewMaterial({...newMaterial, description: e.target.value})}
                    className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <Input
                    placeholder="Material URL (Google Drive, etc.)"
                    value={newMaterial.url}
                    onChange={(e) => setNewMaterial({...newMaterial, url: e.target.value})}
                    className="border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
                  />
                  <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    Add Material
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-lg">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2 text-gray-800">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <span>Existing Materials</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {(content.materials || []).map((material) => (
                    <div key={material.id} className="p-4 bg-gray-50/80 rounded-lg border border-gray-200 hover:bg-gray-100/80 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between space-y-3 sm:space-y-0">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800">{material.title}</h3>
                          <p className="text-gray-600 mt-1">{material.description}</p>
                          <Badge variant="outline" className="text-xs mt-2">
                            {material.type}
                          </Badge>
                          {material.url && (
                            <a 
                              href={material.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 mt-2 text-sm block"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span>Download Material</span>
                            </a>
                          )}
                        </div>
                        <Button
                          onClick={() => handleRemoveItem('materials', material.id)}
                          variant="destructive"
                          size="sm"
                          disabled={loading}
                          className="flex-shrink-0"
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
                      <p className="text-gray-400 text-sm">Add your first material above</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'links':
        return (
          <div className="space-y-6">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-lg">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-green-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2 text-gray-800">
                  <ExternalLink className="w-5 h-5 text-teal-600" />
                  <span>Add New Link</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleAddLink} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Link Title"
                      value={newLink.title}
                      onChange={(e) => setNewLink({...newLink, title: e.target.value})}
                      className="border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                    />
                    <Input
                      placeholder="URL"
                      value={newLink.url}
                      onChange={(e) => setNewLink({...newLink, url: e.target.value})}
                      className="border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                    />
                  </div>
                  <Textarea
                    placeholder="Link Description"
                    value={newLink.description}
                    onChange={(e) => setNewLink({...newLink, description: e.target.value})}
                    className="border-gray-300 focus:border-teal-500 focus:ring-teal-500"
                  />
                  <Button type="submit" disabled={loading} className="bg-teal-600 hover:bg-teal-700 text-white">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    Add Link
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-lg">
              <CardHeader className="bg-gradient-to-r from-teal-50 to-green-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2 text-gray-800">
                  <ExternalLink className="w-5 h-5 text-teal-600" />
                  <span>Existing Links</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {(content.links || []).map((link) => (
                    <div key={link.id} className="p-4 bg-gray-50/80 rounded-lg border border-gray-200 hover:bg-gray-100/80 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between space-y-3 sm:space-y-0">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800">{link.title}</h3>
                          <p className="text-gray-600 mt-1">{link.description}</p>
                          {link.url && (
                            <a 
                              href={link.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-1 text-teal-600 hover:text-teal-800 mt-2 text-sm"
                            >
                              <ExternalLink className="w-4 h-4" />
                              <span>Visit Link</span>
                            </a>
                          )}
                        </div>
                        <Button
                          onClick={() => handleRemoveItem('links', link.id)}
                          variant="destructive"
                          size="sm"
                          disabled={loading}
                          className="flex-shrink-0"
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
                      <p className="text-gray-400 text-sm">Add your first link above</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'notes':
        return (
          <div className="space-y-6">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-lg">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2 text-gray-800">
                  <StickyNote className="w-5 h-5 text-amber-600" />
                  <span>Add New Note</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <form onSubmit={handleAddNote} className="space-y-4">
                  <Input
                    placeholder="Note Title"
                    value={newNote.title}
                    onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                    className="border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                  />
                  <Textarea
                    placeholder="Note Content"
                    value={newNote.content}
                    onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                    rows={4}
                    className="border-gray-300 focus:border-amber-500 focus:ring-amber-500"
                  />
                  <Button type="submit" disabled={loading} className="bg-amber-600 hover:bg-amber-700 text-white">
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    Add Note
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-lg">
              <CardHeader className="bg-gradient-to-r from-amber-50 to-yellow-50 rounded-t-lg">
                <CardTitle className="flex items-center space-x-2 text-gray-800">
                  <StickyNote className="w-5 h-5 text-amber-600" />
                  <span>Existing Notes</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {(content.notes || []).map((note) => (
                    <div key={note.id} className="p-4 bg-gray-50/80 rounded-lg border border-gray-200 hover:bg-gray-100/80 transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between space-y-3 sm:space-y-0">
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-800">{note.title}</h3>
                          <p className="text-gray-600 mt-2 whitespace-pre-wrap leading-relaxed">{note.content}</p>
                          {note.date && (
                            <Badge variant="outline" className="text-xs mt-2">
                              {note.date}
                            </Badge>
                          )}
                        </div>
                        <Button
                          onClick={() => handleRemoveItem('notes', note.id)}
                          variant="destructive"
                          size="sm"
                          disabled={loading}
                          className="flex-shrink-0"
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
                      <p className="text-gray-400 text-sm">Add your first note above</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 'drive':
        return (
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-lg">
            <CardHeader className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-t-lg">
              <CardTitle className="flex items-center space-x-2 text-gray-800">
                <Cloud className="w-5 h-5 text-cyan-600" />
                <span>Google Drive Sync</span>
              </CardTitle>
              <CardDescription className="text-gray-600">
                Manage Google Drive integration and file synchronization
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <GoogleDriveSync />
            </CardContent>
          </Card>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-blue-50 to-indigo-100 relative">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-indigo-400/20 to-pink-600/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-cyan-400/10 to-blue-600/10 rounded-full blur-3xl"></div>
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-gray-200/50 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold text-gray-900">Admin Panel</h1>
                  <p className="text-sm text-gray-600">AI Diploma Portal Management</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 hidden sm:inline-flex">
                Administrator
              </Badge>
              <span className="text-sm text-gray-700 hidden md:inline">{user?.email}</span>
              <Button
                onClick={logout}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 hover:bg-red-50 hover:border-red-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 relative z-10">
        {message && (
          <Alert className={`mb-6 ${message.includes('Error') || message.includes('Failed') ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <AlertDescription className={message.includes('Error') || message.includes('Failed') ? 'text-red-800' : 'text-green-800'}>
              {message}
            </AlertDescription>
          </Alert>
        )}

        {/* 3-Line Tab Layout */}
        <div className="bg-white/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-gray-200/50 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Navigation</h2>
          
          {/* First Line - User Management */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-600 mb-2">User Management</h3>
            <div className="flex flex-wrap gap-2">
              <TabButton 
                value="students" 
                isActive={activeTab === 'students'} 
                onClick={setActiveTab} 
                icon={Users} 
                colorScheme="blue"
              >
                Students
              </TabButton>
              <TabButton 
                value="evaluations" 
                isActive={activeTab === 'evaluations'} 
                onClick={setActiveTab} 
                icon={Award} 
                colorScheme="yellow"
              >
                Evaluations
              </TabButton>
              <TabButton 
                value="submissions" 
                isActive={activeTab === 'submissions'} 
                onClick={setActiveTab} 
                icon={Briefcase} 
                colorScheme="green"
              >
                Submissions
              </TabButton>
              <TabButton 
                value="feedback" 
                isActive={activeTab === 'feedback'} 
                onClick={setActiveTab} 
                icon={MessageSquare} 
                colorScheme="purple"
              >
                Feedback
              </TabButton>
            </div>
          </div>

          {/* Second Line - Content Management */}
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-600 mb-2">Content Management</h3>
            <div className="flex flex-wrap gap-2">
              <TabButton 
                value="lectures" 
                isActive={activeTab === 'lectures'} 
                onClick={setActiveTab} 
                icon={Video} 
                colorScheme="red"
              >
                Lectures
              </TabButton>
              <TabButton 
                value="materials" 
                isActive={activeTab === 'materials'} 
                onClick={setActiveTab} 
                icon={FileText} 
                colorScheme="indigo"
              >
                Materials
              </TabButton>
              <TabButton 
                value="links" 
                isActive={activeTab === 'links'} 
                onClick={setActiveTab} 
                icon={ExternalLink} 
                colorScheme="teal"
              >
                Links
              </TabButton>
              <TabButton 
                value="notes" 
                isActive={activeTab === 'notes'} 
                onClick={setActiveTab} 
                icon={StickyNote} 
                colorScheme="amber"
              >
                Notes
              </TabButton>
            </div>
          </div>

          {/* Third Line - System Management */}
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-2">System Management</h3>
            <div className="flex flex-wrap gap-2">
              <TabButton 
                value="drive" 
                isActive={activeTab === 'drive'} 
                onClick={setActiveTab} 
                icon={Cloud} 
                colorScheme="cyan"
              >
                Drive Sync
              </TabButton>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        <div className="space-y-6">
          {renderTabContent()}
        </div>

        {/* Evaluation Dialog */}
        <Dialog open={isEvalDialogOpen} onOpenChange={setIsEvalDialogOpen}>
          <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-lg">
            <DialogHeader>
              <DialogTitle>Student Evaluation</DialogTitle>
              <DialogDescription>
                Evaluate {currentEval.studentEmail}
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
                  onChange={(e) => setCurrentEval({...currentEval, score: parseInt(e.target.value) || 0})}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Feedback</label>
                <Textarea
                  value={currentEval.feedback}
                  onChange={(e) => setCurrentEval({...currentEval, feedback: e.target.value})}
                  placeholder="Enter evaluation feedback..."
                  rows={4}
                  className="border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEvalDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Evaluation
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminPanel;

