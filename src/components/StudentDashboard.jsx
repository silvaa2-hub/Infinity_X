import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getDashboardContent } from '../lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Link } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  Sparkles,
  Award,
  UploadCloud,
  Menu,
  MessageSquare
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

  const aiBackgroundStyle = {
    backgroundColor: '#020617', // slate-950
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231e293b' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
  };

  if (loading) {
    return (
      <div style={aiBackgroundStyle} className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={aiBackgroundStyle} className="min-h-screen text-slate-50">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md shadow-sm border-b border-slate-700/50 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">AI Diploma Portal</h1>
                  <p className="text-sm text-slate-400 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    Powered by InfinityX
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-300 font-medium">{user?.email}</span>
              </div>
              <Button onClick={logout} variant="outline" size="sm" className="flex items-center space-x-2 bg-slate-800 border-slate-600 hover:bg-slate-700 hover:text-white">
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </Button>

              {/* NEW NAVIGATION MENU */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="bg-slate-800 border-slate-600 hover:bg-slate-700 hover:text-white">
                    <Menu className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700 text-slate-50">
                  <DropdownMenuItem asChild>
                    <Link to="/submit-project" className="flex items-center cursor-pointer">
                      <UploadCloud className="mr-2 h-4 w-4" />
                      <span>Submit Project</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-evaluation" className="flex items-center cursor-pointer">
                      <Award className="mr-2 h-4 w-4" />
                      <span>My Evaluation</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/feedback" className="flex items-center cursor-pointer">
                      <MessageSquare className="mr-2 h-4 w-4" />
                      <span>Submit Feedback</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <h2 className="text-3xl font-bold text-white mb-2">Welcome back! 👋</h2>
          <p className="text-slate-400">Continue your AI learning journey. Access your lectures, materials, and resources below.</p>
        </div>

        {/* REMOVED the submit project button from here */}

        <Tabs defaultValue="lectures" className="w-full animate-in fade-in slide-in-from-top-8 duration-500">
          <TabsList className="bg-slate-800/50 border border-slate-700">
            <TabsTrigger value="lectures" className="flex items-center space-x-2 text-slate-300">
              <Video className="w-4 h-4" />
              <span>Recorded Lectures</span>
            </TabsTrigger>
            <TabsTrigger value="materials" className="flex items-center space-x-2 text-slate-300">
              <FileText className="w-4 h-4" />
              <span>Lecture Materials</span>
            </TabsTrigger>
            <TabsTrigger value="links" className="flex items-center space-x-2 text-slate-300">
              <ExternalLink className="w-4 h-4" />
              <span>Important Links</span>
            </TabsTrigger>
            <TabsTrigger value="notes" className="flex items-center space-x-2 text-slate-300">
              <StickyNote className="w-4 h-4" />
              <span>Instructor Notes</span>
            </TabsTrigger>
             {/* REMOVED the evaluation tab from here */}
          </TabsList>

          <TabsContent value="lectures" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {content.lectures && content.lectures.length > 0 ? (
                content.lectures.map((lecture, index) => (
                  <Card key={index} className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 text-white hover:border-slate-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4" style={{animationDelay: `${index * 100}ms`}}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg text-slate-50">{lecture.title}</CardTitle>
                          <CardDescription className="mt-1 text-slate-400">{lecture.description}</CardDescription>
                        </div>
                        <Badge variant="outline" className="ml-2 border-slate-600 text-slate-300">{lecture.duration || 'N/A'}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2 text-sm text-slate-400">
                          <Calendar className="w-4 h-4" />
                          <span>{lecture.date || 'No date'}</span>
                        </div>
                        <a href={lecture.url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Play className="w-4 h-4" />
                            <span>Watch</span>
                          </Button>
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="md:col-span-2 bg-slate-900/50 backdrop-blur-sm border border-slate-800">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <Video className="w-12 h-12 text-slate-600 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-300">No Lectures Available</h3>
                    <p className="text-slate-500">New lectures will be added soon. Please check back later!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="materials" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {content.materials && content.materials.length > 0 ? (
                content.materials.map((material, index) => (
                  <Card key={index} className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 text-white hover:border-slate-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4" style={{animationDelay: `${index * 100}ms`}}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center space-x-2 text-slate-50">
                        <BookOpen className="w-5 h-5 text-blue-400" />
                        <span>{material.title}</span>
                      </CardTitle>
                      <CardDescription className="text-slate-400">{material.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="border-slate-600 text-slate-300">{material.type || 'PDF'}</Badge>
                        <a href={material.url} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline" className="flex items-center space-x-2 bg-slate-800 border-slate-600 hover:bg-slate-700">
                            <Download className="w-4 h-4" />
                            <span>Download</span>
                          </Button>
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="md:col-span-2 bg-slate-900/50 backdrop-blur-sm border border-slate-800">
                  <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                    <FileText className="w-12 h-12 text-slate-600 mb-4" />
                    <h3 className="text-lg font-semibold text-slate-300">No Materials Available</h3>
                    <p className="text-slate-500">Course materials will appear here as they are released.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="links" className="mt-6">
            <Card className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 text-white">
              <CardContent className="p-4">
                {content.links && content.links.length > 0 ? (
                  <div className="space-y-3">
                    {content.links.map((link, index) => (
                      <div key={index}>
                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-800 transition-colors group">
                          <ExternalLink className="w-5 h-5 text-green-400" />
                          <div className="flex-1">
                            <p className="font-medium text-slate-50 group-hover:text-green-400">{link.title}</p>
                            {link.description && (<p className="text-sm text-slate-400">{link.description}</p>)}
                          </div>
                        </a>
                        {index < content.links.length - 1 && <Separator className="bg-slate-700" />}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <ExternalLink className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-slate-300">No Links Available</h3>
                    <p className="text-slate-500">Important links will be posted here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notes" className="mt-6">
            <div className="space-y-4">
              {content.notes && content.notes.length > 0 ? (
                content.notes.map((note, index) => (
                  <Card key={index} className="overflow-hidden bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 text-white">
                    <div className="p-4 bg-amber-900/10 border-l-4 border-amber-500">
                      <div className="flex items-start space-x-3">
                        <StickyNote className="w-5 h-5 text-amber-500 mt-0.5" />
                        <div className="flex-1">
                          <h4 className="font-medium text-slate-50 mb-1">{note.title}</h4>
                          <p className="text-sm text-slate-300">{note.content}</p>
                          {note.date && (
                            <div className="flex items-center space-x-1 mt-2 text-xs text-slate-400">
                              <Clock className="w-3 h-3" />
                              <span>{note.date}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))
              ) : (
                <Card className="bg-slate-900/50 backdrop-blur-sm border border-slate-800">
                  <CardContent className="text-center py-12">
                    <StickyNote className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                    <h3 className="text-lg font-semibold text-slate-300">No Notes Available</h3>
                    <p className="text-slate-500">Check back for notes from your instructor.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default StudentDashboard;