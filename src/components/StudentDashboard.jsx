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
  MessageSquare,
  Target // Icon for Homework
} from 'lucide-react';

const StudentDashboard = () => {
  const { user, logout } = useAuth();
  const [content, setContent] = useState({
    lectures: [],
    materials: [],
    links: [],
    notes: [],
    homeworks: [] // NEW: Add homeworks array
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
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Left side - Logo and title */}
            <div className="flex items-center space-x-2 sm:space-x-4 min-w-0 flex-1">
              <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg flex-shrink-0">
                  <Brain className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-base sm:text-xl font-bold text-white truncate">AI Diploma Portal</h1>
                  <p className="text-xs sm:text-sm text-slate-400 flex items-center gap-1 truncate">
                    <Sparkles className="w-2 h-2 sm:w-3 sm:h-3 text-purple-400 flex-shrink-0" />
                    <span className="truncate">Powered by InfinityX</span>
                  </p>
                </div>
              </div>
            </div>
            
            {/* Right side - User info and actions */}
            <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
              {/* User email - hidden on small screens */}
              <div className="hidden md:flex items-center space-x-2">
                <User className="w-4 h-4 text-slate-400" />
                <span className="text-sm text-slate-300 font-medium truncate max-w-32 lg:max-w-none">{user?.email}</span>
              </div>
              
              {/* Logout button - responsive */}
              <Button 
                onClick={logout} 
                variant="outline" 
                size="sm" 
                className="flex items-center space-x-1 sm:space-x-2 bg-slate-800 border-slate-600 hover:bg-slate-700 hover:text-white text-xs sm:text-sm px-2 sm:px-3"
              >
                <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Logout</span>
              </Button>

              {/* Navigation menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-slate-800 border-slate-600 hover:bg-slate-700 hover:text-white p-2"
                  >
                    <Menu className="h-3 w-3 sm:h-4 sm:w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-slate-800 border-slate-700 text-slate-50" align="end">
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
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8">
        {/* Welcome section */}
        <div className="mb-6 sm:mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Welcome back! 👋</h2>
          <p className="text-slate-400 text-sm sm:text-base">Continue your AI learning journey. Access your lectures, materials, and resources below.</p>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="lectures" className="w-full animate-in fade-in slide-in-from-top-8 duration-500">
          {/* Tab List - Responsive - Updated to include Homework */}
          <TabsList className="bg-slate-800/50 border border-slate-700 w-full grid grid-cols-2 sm:grid-cols-5 gap-1 h-auto p-1">
            <TabsTrigger 
              value="lectures" 
              className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 text-slate-300 py-2 px-1 text-xs sm:text-sm"
            >
              <Video className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-center leading-tight">Recorded<br className="sm:hidden" /> Lectures</span>
            </TabsTrigger>
            <TabsTrigger 
              value="materials" 
              className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 text-slate-300 py-2 px-1 text-xs sm:text-sm"
            >
              <FileText className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-center leading-tight">Lecture<br className="sm:hidden" /> Materials</span>
            </TabsTrigger>
            <TabsTrigger 
              value="homework" 
              className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 text-slate-300 py-2 px-1 text-xs sm:text-sm"
            >
              <Target className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-center leading-tight">Homework<br className="sm:hidden" /> Assignments</span>
            </TabsTrigger>
            <TabsTrigger 
              value="links" 
              className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 text-slate-300 py-2 px-1 text-xs sm:text-sm"
            >
              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-center leading-tight">Important<br className="sm:hidden" /> Links</span>
            </TabsTrigger>
            <TabsTrigger 
              value="notes" 
              className="flex flex-col sm:flex-row items-center justify-center space-y-1 sm:space-y-0 sm:space-x-2 text-slate-300 py-2 px-1 text-xs sm:text-sm"
            >
              <StickyNote className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="text-center leading-tight">Instructor<br className="sm:hidden" /> Notes</span>
            </TabsTrigger>
          </TabsList>

          {/* Lectures Tab */}
          <TabsContent value="lectures" className="mt-4 sm:mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {content.lectures && content.lectures.length > 0 ? (
                content.lectures.map((lecture, index) => (
                  <Card 
                    key={index} 
                    className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 text-white hover:border-slate-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4" 
                    style={{animationDelay: `${index * 100}ms`}}
                  >
                    <CardHeader className="pb-3 p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between space-y-2 sm:space-y-0">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base sm:text-lg text-slate-50 break-words">{lecture.title}</CardTitle>
                          <CardDescription className="mt-1 text-slate-400 text-sm break-words">{lecture.description}</CardDescription>
                        </div>
                        <Badge variant="outline" className="border-slate-600 text-slate-300 text-xs self-start sm:ml-2 flex-shrink-0">
                          {lecture.duration || 'N/A'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                        <div className="flex items-center space-x-2 text-sm text-slate-400">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">{lecture.date || 'No date'}</span>
                        </div>
                        <a href={lecture.url} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                          <Button size="sm" className="flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white w-full sm:w-auto">
                            <Play className="w-4 h-4" />
                            <span>Watch</span>
                          </Button>
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="lg:col-span-2 bg-slate-900/50 backdrop-blur-sm border border-slate-800">
                  <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 text-center p-4">
                    <Video className="w-10 h-10 sm:w-12 sm:h-12 text-slate-600 mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold text-slate-300">No Lectures Available</h3>
                    <p className="text-slate-500 text-sm sm:text-base">New lectures will be added soon. Please check back later!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials" className="mt-4 sm:mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {content.materials && content.materials.length > 0 ? (
                content.materials.map((material, index) => (
                  <Card 
                    key={index} 
                    className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 text-white hover:border-slate-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4" 
                    style={{animationDelay: `${index * 100}ms`}}
                  >
                    <CardHeader className="pb-3 p-4 sm:p-6">
                      <CardTitle className="text-base sm:text-lg flex items-center space-x-2 text-slate-50 break-words">
                        <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0" />
                        <span className="min-w-0">{material.title}</span>
                      </CardTitle>
                      <CardDescription className="text-slate-400 text-sm break-words">{material.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                        <Badge variant="outline" className="border-slate-600 text-slate-300 text-xs self-start">
                          {material.type || 'PDF'}
                        </Badge>
                        <a href={material.url} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                          <Button size="sm" variant="outline" className="flex items-center justify-center space-x-2 bg-slate-800 border-slate-600 hover:bg-slate-700 w-full sm:w-auto">
                            <Download className="w-4 h-4" />
                            <span>Download</span>
                          </Button>
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="lg:col-span-2 bg-slate-900/50 backdrop-blur-sm border border-slate-800">
                  <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 text-center p-4">
                    <FileText className="w-10 h-10 sm:w-12 sm:h-12 text-slate-600 mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold text-slate-300">No Materials Available</h3>
                    <p className="text-slate-500 text-sm sm:text-base">Course materials will appear here as they are released.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* NEW: Homework Tab */}
          <TabsContent value="homework" className="mt-4 sm:mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {content.homeworks && content.homeworks.length > 0 ? (
                content.homeworks.map((homework, index) => (
                  <Card 
                    key={index} 
                    className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 text-white hover:border-slate-500 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-4" 
                    style={{animationDelay: `${index * 100}ms`}}
                  >
                    <CardHeader className="pb-3 p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between space-y-2 sm:space-y-0">
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-base sm:text-lg flex items-center space-x-2 text-slate-50 break-words">
                            <Target className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 flex-shrink-0" />
                            <span className="min-w-0">{homework.title}</span>
                          </CardTitle>
                          <CardDescription className="mt-1 text-slate-400 text-sm break-words">{homework.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
                        <div className="flex items-center space-x-2 text-sm text-slate-400">
                          <Calendar className="w-4 h-4 flex-shrink-0" />
                          <span className="truncate">Due: {homework.dueDate || 'No due date'}</span>
                        </div>
                        <a href={homework.url} target="_blank" rel="noopener noreferrer" className="w-full sm:w-auto">
                          <Button size="sm" className="flex items-center justify-center space-x-2 bg-amber-600 hover:bg-amber-700 text-white w-full sm:w-auto">
                            <ExternalLink className="w-4 h-4" />
                            <span>Start Assignment</span>
                          </Button>
                        </a>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="lg:col-span-2 bg-slate-900/50 backdrop-blur-sm border border-slate-800">
                  <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 text-center p-4">
                    <Target className="w-10 h-10 sm:w-12 sm:h-12 text-slate-600 mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold text-slate-300">No Homework Available</h3>
                    <p className="text-slate-500 text-sm sm:text-base">New homework assignments will appear here when available.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Links Tab */}
          <TabsContent value="links" className="mt-4 sm:mt-6">
            <Card className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 text-white">
              <CardContent className="p-3 sm:p-4">
                {content.links && content.links.length > 0 ? (
                  <div className="space-y-2 sm:space-y-3">
                    {content.links.map((link, index) => (
                      <div key={index}>
                        <a 
                          href={link.url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-800 transition-colors group"
                        >
                          <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-slate-50 group-hover:text-green-400 text-sm sm:text-base break-words">{link.title}</p>
                            {link.description && (
                              <p className="text-xs sm:text-sm text-slate-400 break-words">{link.description}</p>
                            )}
                          </div>
                        </a>
                        {index < content.links.length - 1 && (
                          <Separator className="bg-slate-700/50 my-2 sm:my-3" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 sm:py-12 text-center">
                    <ExternalLink className="w-10 h-10 sm:w-12 sm:h-12 text-slate-600 mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold text-slate-300">No Links Available</h3>
                    <p className="text-slate-500 text-sm sm:text-base">Important links will be shared here as needed.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="mt-4 sm:mt-6">
            <div className="space-y-4 sm:space-y-6">
              {content.notes && content.notes.length > 0 ? (
                content.notes.map((note, index) => (
                  <Card 
                    key={index} 
                    className="bg-slate-900/50 backdrop-blur-sm border border-slate-700/50 text-white hover:border-slate-500 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4" 
                    style={{animationDelay: `${index * 100}ms`}}
                  >
                    <CardHeader className="pb-3 p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between space-y-2 sm:space-y-0">
                        <CardTitle className="text-base sm:text-lg flex items-center space-x-2 text-slate-50 break-words">
                          <StickyNote className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400 flex-shrink-0" />
                          <span className="min-w-0">{note.title}</span>
                        </CardTitle>
                        <Badge variant="outline" className="border-slate-600 text-slate-300 text-xs self-start sm:ml-2 flex-shrink-0">
                          {note.date || 'No date'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 sm:p-6 pt-0">
                      <p className="text-sm sm:text-base text-slate-300 whitespace-pre-wrap break-words">{note.content}</p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="bg-slate-900/50 backdrop-blur-sm border border-slate-800">
                  <CardContent className="flex flex-col items-center justify-center py-8 sm:py-12 text-center p-4">
                    <StickyNote className="w-10 h-10 sm:w-12 sm:h-12 text-slate-600 mb-4" />
                    <h3 className="text-base sm:text-lg font-semibold text-slate-300">No Notes Available</h3>
                    <p className="text-slate-500 text-sm sm:text-base">Instructor notes and announcements will appear here.</p>
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

