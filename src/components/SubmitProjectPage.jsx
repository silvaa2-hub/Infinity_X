import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { uploadFileToCloudinary, saveSubmissionToFirestore } from '../lib/submissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router-dom';
import { ArrowLeft, UploadCloud, Loader2, FileCheck2, X } from 'lucide-react';

const SubmitProjectPage = () => {
  const { user } = useAuth();
  const [projectName, setProjectName] = useState('');
  const [projectFile, setProjectFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProjectFile(file);
    }
  };

  const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDrop = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); const file = e.dataTransfer.files[0]; if (file) { setProjectFile(file); }};

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!projectName || !projectFile) {
      setError('Please provide a project name and select a file.');
      return;
    }
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const fileUrl = await uploadFileToCloudinary(projectFile);
      if (fileUrl) {
        const submissionDetails = { studentEmail: user.email, projectName: projectName, fileUrl: fileUrl };
        const success = await saveSubmissionToFirestore(submissionDetails);
        if (success) {
          setMessage('Your project has been submitted successfully!');
          setProjectName('');
          setProjectFile(null);
          document.getElementById('projectFile').value = '';
        } else {
          setError('Failed to save your submission details. Please try again.');
        }
      } else {
        setError('Failed to upload your file. Please try again.');
      }
    } catch (err) {
      console.error('Submission error:', err);
      setError('An unexpected error occurred. Please try again.');
    }
    setLoading(false);
  };

  const aiBackgroundStyle = {
    backgroundColor: '#020617',
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231e293b' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
  };

  return (
    <div style={aiBackgroundStyle} className="min-h-screen text-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
        
        {/* ======================= TEMPORARY DEBUG BLOCK ======================= */}
        <div style={{ backgroundColor: 'yellow', color: 'black', padding: '10px', marginBottom: '20px', border: '2px solid red', fontFamily: 'monospace', wordBreak: 'break-all' }}>
          <h3 style={{ fontWeight: 'bold' }}>DEBUG INFO - VERCEL VARIABLES:</h3>
          <p>Cloud Name: "{import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}"</p>
          <p>Upload Preset: "{import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET}"</p>
          <hr style={{margin: '10px 0', borderColor: 'red'}} />
          <p>Firebase Project ID: "{import.meta.env.VITE_FIREBASE_PROJECT_ID}"</p>
        </div>
        {/* ====================================================================== */}

        <Link to="/dashboard" className="inline-flex items-center text-slate-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>
        
        <Card className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 text-white">
          <CardHeader>{/* ... CardHeader content ... */}</CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* ... form content ... */}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SubmitProjectPage;