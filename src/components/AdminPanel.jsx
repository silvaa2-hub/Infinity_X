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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-red-600 to-orange-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Admin Panel</h1>
                  <p className="text-sm text-slate-500">AI Diploma Portal Management</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <Badge variant="secondary" className="bg-red-100 text-red-800">
                Administrator
              </Badge>
              <span className="text-sm text-slate-700">{user?.email}</span>
              <Button
                onClick={logout}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <Alert className={`mb-6 ${message.includes('Error') || message.includes('Failed') ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
            <AlertDescription className={message.includes('Error') || message.includes('Failed') ? 'text-red-800' : 'text-green-800'}>
              {message}
            </AlertDescription>
          </Alert>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="w-full flex border-b overflow-x-auto">
            <TabsTrigger value="students" className="flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Students</span>
            </TabsTrigger>
            {/* NEW Evaluations Tab */}
            <TabsTrigger value="evaluations" className="flex items-center space-x-2"> 
              <Award className="w-4 h-4" />
              <span>Evaluations</span>
            </TabsTrigger>
            {/* ADD THIS NEW TAB TRIGGER */}
            <TabsTrigger value="submissions" className="flex items-center space-x-2"> 
              <Briefcase className="w-4 h-4" />
              <span>Submissions</span>
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center space-x-2"> 
              <MessageSquare className="w-4 h-4" />
              <span>Feedback</span>
            </TabsTrigger>
            <TabsTrigger value="lectures" className="flex items-center space-x-2"></TabsTrigger>
            <TabsTrigger value="lectures" className="flex items-center space-x-2">
              <Video className="w-4 h-4" />
              <span>Lectures</span>
            </TabsTrigger>
            <TabsTrigger value="materials" className="flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Materials</span>
            </TabsTrigger>
            <TabsTrigger value="links" className="flex items-center space-x-2">
              <ExternalLink className="w-4 h-4" />
              <span>Links</span>
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center space-x-2">
              <StickyNote className="w-4 h-4" />
              <span>Notes</span>
            </TabsTrigger>
            <TabsTrigger value="drive" className="flex items-center space-x-2">
              <Cloud className="w-4 h-4" />
              <span>Drive</span>
            </TabsTrigger>
            
          </TabsList>

          {/* Students Management */}
          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Authorized Students</span>
                </CardTitle>
                <CardDescription>
                  Manage student email addresses that can access the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddEmail} className="flex space-x-2 mb-6">
                  <Input
                    type="email"
                    placeholder="student@example.com"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Add Email
                  </Button>
                </form>

                <div className="space-y-2">
                  {authorizedEmails.map((emailObj) => (
                    <div key={emailObj.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <span className="font-medium">{emailObj.email}</span>
                      <Button
                        onClick={() => handleRemoveEmail(emailObj.id)}
                        variant="destructive"
                        size="sm"
                        disabled={loading}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                  {authorizedEmails.length === 0 && (
                    <p className="text-slate-500 text-center py-8">No authorized emails yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* NEW Evaluations Management Content */}
          <TabsContent value="evaluations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Award className="w-5 h-5" />
                  <span>Student Evaluations</span>
                </CardTitle>
                <CardDescription>
                  View and manage student evaluations and scores.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {authorizedEmails.map((emailObj) => {
                    const evaluation = evaluations.find(e => e.studentEmail === emailObj.email);
                    return (
                      <div key={emailObj.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <span className="font-medium">{emailObj.email}</span>
                          {evaluation ? (
                            <Badge variant="default" className="bg-blue-600 text-white">Score: {evaluation.score}</Badge>
                          ) : (
                            <Badge variant="outline">Not Evaluated</Badge>
                          )}
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleEditEvaluation(emailObj.email)}>
                          <Edit className="w-4 h-4 mr-2" />
                          {evaluation ? 'Edit' : 'Add'} Evaluation
                        </Button>
                      </div>
                    );
                  })}
                  {authorizedEmails.length === 0 && (
                    <p className="text-slate-500 text-center py-8">No students to evaluate yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {/* NEW Submissions Management Content */}
          <div className="space-y-2">
            {submissions.length > 0 ? submissions.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium">{sub.projectName}</p>
                  <p className="text-sm text-slate-500">{sub.studentEmail}</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Submitted: {sub.submittedAt ? new Date(sub.submittedAt.toDate()).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <a href={sub.fileUrl} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm">
                      Download File
                    </Button>
                  </a>
                  {/* New Delete Button */}
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={() => handleDeleteSubmission(sub.id)}
                    disabled={loading}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )) : (
              <p className="text-slate-500 text-center py-8">No projects have been submitted yet.</p>
            )}
          </div>
          {/* NEW Feedback Management Content */}
          <TabsContent value="feedback" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MessageSquare className="w-5 h-5" />
                  <span>Student Feedback</span>
                </CardTitle>
                <CardDescription>
                  Review feedback and suggestions submitted by students.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {feedback.length > 0 ? feedback.map((fb) => (
                    <div key={fb.id} className="p-4 bg-slate-50 rounded-lg border">
                      <div className="flex justify-between items-start">
                          <div>
                              <p className="font-bold">{fb.lectureName}</p>
                              <p className="text-sm text-slate-600 mt-2">{fb.feedback}</p>
                          </div>
                          <div className="flex items-center space-x-1 text-yellow-500">
                              <span>{fb.rating}</span>
                              <Star className="w-4 h-4" fill="currentColor" />
                          </div>
                      </div>
                      <div className="text-xs text-slate-400 mt-3 pt-3 border-t">
                          <p>From: {fb.studentEmail}</p>
                          <p>Date: {fb.submittedAt ? new Date(fb.submittedAt.toDate()).toLocaleString() : 'N/A'}</p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-slate-500 text-center py-8">No feedback has been submitted yet.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          {/* Lectures Management */}
          <TabsContent value="lectures" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Video className="w-5 h-5" />
                  <span>Add New Lecture</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddLecture} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Lecture Title"
                      value={newLecture.title}
                      onChange={(e) => setNewLecture({...newLecture, title: e.target.value})}
                    />
                    <Input
                      placeholder="Duration (e.g., 45 min)"
                      value={newLecture.duration}
                      onChange={(e) => setNewLecture({...newLecture, duration: e.target.value})}
                    />
                  </div>
                  <Textarea
                    placeholder="Lecture Description"
                    value={newLecture.description}
                    onChange={(e) => setNewLecture({...newLecture, description: e.target.value})}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Video URL (Google Drive, YouTube, etc.)"
                      value={newLecture.url}
                      onChange={(e) => setNewLecture({...newLecture, url: e.target.value})}
                    />
                    <Input
                      type="date"
                      value={newLecture.date}
                      onChange={(e) => setNewLecture({...newLecture, date: e.target.value})}
                    />
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    Add Lecture
                  </Button>
                </form>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Existing Lectures</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {content.lectures?.map((lecture) => (
                    <div key={lecture.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{lecture.title}</h4>
                        <p className="text-sm text-slate-600">{lecture.description}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-slate-500">
                          <span>Duration: {lecture.duration}</span>
                          <span>Date: {lecture.date}</span>
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
                  ))}
                  {(!content.lectures || content.lectures.length === 0) && (
                    <p className="text-slate-500 text-center py-8">No lectures added yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Materials Management */}
          <TabsContent value="materials" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>Add New Material</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddMaterial} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                      placeholder="Material Title"
                      value={newMaterial.title}
                      onChange={(e) => setNewMaterial({...newMaterial, title: e.target.value})}
                    />
                    <Input
                      placeholder="Type (PDF, Slides, etc.)"
                      value={newMaterial.type}
                      onChange={(e) => setNewMaterial({...newMaterial, type: e.target.value})}
                    />
                  </div>
                  <Textarea
                    placeholder="Material Description"
                    value={newMaterial.description}
                    onChange={(e) => setNewMaterial({...newMaterial, description: e.target.value})}
                  />
                  <Input
                    placeholder="File URL (Google Drive, etc.)"
                    value={newMaterial.url}
                    onChange={(e) => setNewMaterial({...newMaterial, url: e.target.value})}
                  />
                  <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    Add Material
                  </Button>
                </form>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Existing Materials</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {content.materials?.map((material) => (
                    <div key={material.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{material.title}</h4>
                        <p className="text-sm text-slate-600">{material.description}</p>
                        <Badge variant="outline" className="mt-2">{material.type}</Badge>
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
                  ))}
                  {(!content.materials || content.materials.length === 0) && (
                    <p className="text-slate-500 text-center py-8">No materials added yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Links Management */}
          <TabsContent value="links" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <ExternalLink className="w-5 h-5" />
                  <span>Add New Link</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddLink} className="space-y-4">
                  <Input
                    placeholder="Link Title"
                    value={newLink.title}
                    onChange={(e) => setNewLink({...newLink, title: e.target.value})}
                  />
                  <Textarea
                    placeholder="Link Description"
                    value={newLink.description}
                    onChange={(e) => setNewLink({...newLink, description: e.target.value})}
                  />
                  <Input
                    placeholder="URL"
                    value={newLink.url}
                    onChange={(e) => setNewLink({...newLink, url: e.target.value})}
                  />
                  <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    Add Link
                  </Button>
                </form>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Existing Links</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {content.links?.map((link) => (
                    <div key={link.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium">{link.title}</h4>
                        <p className="text-sm text-slate-600">{link.description}</p>
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                          {link.url}
                        </a>
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
                  ))}
                  {(!content.links || content.links.length === 0) && (
                    <p className="text-slate-500 text-center py-8">No links added yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes Management */}
          <TabsContent value="notes" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <StickyNote className="w-5 h-5" />
                  <span>Add New Note</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddNote} className="space-y-4">
                  <Input
                    placeholder="Note Title"
                    value={newNote.title}
                    onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                  />
                  <Textarea
                    placeholder="Note Content"
                    value={newNote.content}
                    onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                    rows={4}
                  />
                  <Button type="submit" disabled={loading}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                    Add Note
                  </Button>
                </form>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Existing Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {content.notes?.map((note) => (
                    <div key={note.id} className="flex items-start justify-between p-4 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                      <div className="flex-1">
                        <h4 className="font-medium">{note.title}</h4>
                        <p className="text-sm text-slate-700 mt-1">{note.content}</p>
                        <p className="text-xs text-slate-500 mt-2">Added: {note.date}</p>
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
                  ))}
                  {(!content.notes || content.notes.length === 0) && (
                    <p className="text-slate-500 text-center py-8">No notes added yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Google Drive Integration */}
          <TabsContent value="drive" className="space-y-6">
            <GoogleDriveSync onContentUpdate={setContent} />
          </TabsContent>
        </Tabs>
      </main>
      {/* NEW: Evaluation Dialog (Pop-up Form) */}
      <Dialog open={isEvalDialogOpen} onOpenChange={setIsEvalDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Evaluation</DialogTitle>
            <DialogDescription>
              Update the score and feedback for {currentEval.studentEmail}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSaveEvaluation}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="score" className="text-right">Score</label>
                <Input
                  id="score"
                  type="number"
                  value={currentEval.score}
                  onChange={(e) => setCurrentEval({ ...currentEval, score: parseInt(e.target.value) || 0 })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="feedback" className="text-right">Feedback</label>
                <Textarea
                  id="feedback"
                  value={currentEval.feedback}
                  onChange={(e) => setCurrentEval({ ...currentEval, feedback: e.target.value })}
                  className="col-span-3"
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPanel;