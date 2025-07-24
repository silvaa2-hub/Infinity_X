import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardContent } from '../lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  LogOut, 
  Video, 
  FileText, 
  ExternalLink, 
  StickyNote, 
  User, 
  Calendar,
  Clock,
  Download,
  Play,
  BookOpen,
  Brain,
  Sparkles
} from 'lucide-react';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const [content, setContent] = useState({
    lectures: [],
    materials: [],
    links: [],
    notes: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const dashboardContent = await getDashboardContent();
        setContent(dashboardContent);
      } catch (error) {
        console.error('Error loading dashboard content:', error);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, []);

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">AI Diploma Portal</h1>
                  <p className="text-sm text-slate-500 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Powered by InfinityX
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-slate-500" />
                <span className="text-sm text-slate-700">{user?.email}</span>
              </div>
              <Button
                onClick={handleLogout}
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
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">
            Welcome back! 👋
          </h2>
          <p className="text-slate-600">
            Continue your AI learning journey. Access your lectures, materials, and resources below.
          </p>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Recorded Lectures Section */}
            <section>
              <div className="flex items-center space-x-2 mb-6">
                <Video className="w-6 h-6 text-purple-600" />
                <h3 className="text-2xl font-bold text-slate-900">Recorded Lectures</h3>
                <Badge variant="secondary">{content.lectures?.length || 0}</Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {content.lectures && content.lectures.length > 0 ? (
                  content.lectures.map((lecture, index) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{lecture.title}</CardTitle>
                            <CardDescription className="mt-1">
                              {lecture.description}
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            {lecture.duration || 'N/A'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-sm text-slate-500">
                            <Calendar className="w-4 h-4" />
                            <span>{lecture.date || 'No date'}</span>
                          </div>
                          <Button size="sm" className="flex items-center space-x-2">
                            <Play className="w-4 h-4" />
                            <span>Watch</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="md:col-span-2">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Video className="w-12 h-12 text-slate-300 mb-4" />
                      <p className="text-slate-500 text-center">
                        No lectures available yet. Check back soon!
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </section>

            {/* Lecture Materials Section */}
            <section>
              <div className="flex items-center space-x-2 mb-6">
                <FileText className="w-6 h-6 text-blue-600" />
                <h3 className="text-2xl font-bold text-slate-900">Lecture Materials</h3>
                <Badge variant="secondary">{content.materials?.length || 0}</Badge>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {content.materials && content.materials.length > 0 ? (
                  content.materials.map((material, index) => (
                    <Card key={index} className="hover:shadow-lg transition-shadow">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <BookOpen className="w-5 h-5 text-blue-600" />
                          <span>{material.title}</span>
                        </CardTitle>
                        <CardDescription>{material.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between">
                          <Badge variant="outline">{material.type || 'PDF'}</Badge>
                          <Button size="sm" variant="outline" className="flex items-center space-x-2">
                            <Download className="w-4 h-4" />
                            <span>Download</span>
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (
                  <Card className="md:col-span-2">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <FileText className="w-12 h-12 text-slate-300 mb-4" />
                      <p className="text-slate-500 text-center">
                        No materials available yet. Check back soon!
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </section>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-8">
            {/* Important Links Section */}
            <section>
              <div className="flex items-center space-x-2 mb-4">
                <ExternalLink className="w-5 h-5 text-green-600" />
                <h3 className="text-xl font-bold text-slate-900">Important Links</h3>
              </div>
              
              <Card>
                <CardContent className="p-4">
                  {content.links && content.links.length > 0 ? (
                    <div className="space-y-3">
                      {content.links.map((link, index) => (
                        <div key={index}>
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors group"
                          >
                            <ExternalLink className="w-4 h-4 text-green-600 group-hover:text-green-700" />
                            <div className="flex-1">
                              <p className="font-medium text-slate-900 group-hover:text-green-700">
                                {link.title}
                              </p>
                              {link.description && (
                                <p className="text-sm text-slate-500">{link.description}</p>
                              )}
                            </div>
                          </a>
                          {index < content.links.length - 1 && <Separator className="mt-3" />}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <ExternalLink className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">No links available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>

            {/* Instructor Notes Section */}
            <section>
              <div className="flex items-center space-x-2 mb-4">
                <StickyNote className="w-5 h-5 text-orange-600" />
                <h3 className="text-xl font-bold text-slate-900">Instructor Notes</h3>
              </div>
              
              <Card>
                <CardContent className="p-4">
                  {content.notes && content.notes.length > 0 ? (
                    <div className="space-y-4">
                      {content.notes.map((note, index) => (
                        <div key={index} className="p-4 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                          <div className="flex items-start space-x-3">
                            <StickyNote className="w-5 h-5 text-orange-600 mt-0.5" />
                            <div className="flex-1">
                              <h4 className="font-medium text-slate-900 mb-1">{note.title}</h4>
                              <p className="text-sm text-slate-700">{note.content}</p>
                              {note.date && (
                                <div className="flex items-center space-x-1 mt-2 text-xs text-slate-500">
                                  <Clock className="w-3 h-3" />
                                  <span>{note.date}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <StickyNote className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500">No notes available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default StudentDashboard;

