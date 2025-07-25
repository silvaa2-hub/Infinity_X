import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getStudentEvaluation } from '../lib/auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowLeft, Award, Star, MessageSquare, AlertCircle } from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';

const MyEvaluationsPage = () => {
  const { user } = useAuth();
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvaluation = async () => {
      if (user?.email) {
        try {
          const evalData = await getStudentEvaluation(user.email);
          setEvaluation(evalData);
        } catch (error) {
          console.error("Failed to fetch evaluation:", error);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchEvaluation();
  }, [user]);

  // AI Themed Dark Background
  const aiBackgroundStyle = {
    backgroundColor: '#020617', // slate-950
    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%231e293b' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
  };

  const getScoreColor = (score) => {
    if (score >= 85) return '#22c55e'; // green-500
    if (score >= 70) return '#3b82f6'; // blue-500
    if (score >= 50) return '#f97316'; // orange-500
    return '#ef4444'; // red-500
  };

  if (loading) {
    return (
      <div style={aiBackgroundStyle} className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400"></div>
      </div>
    );
  }

  return (
    <div style={aiBackgroundStyle} className="min-h-screen text-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
        <Link to="/dashboard" className="inline-flex items-center text-slate-400 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Link>

        <header className="mb-8">
            <h1 className="text-4xl font-bold text-white flex items-center gap-3">
                <Award className="w-8 h-8 text-indigo-400" />
                My Performance Evaluation
            </h1>
            <p className="text-slate-400 mt-2">Here is your performance summary and feedback from the instructor.</p>
        </header>

        {evaluation ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-1 animate-in fade-in slide-in-from-left-8 duration-700">
              <Card className="bg-slate-900/50 border border-slate-700/50 h-full">
                <CardHeader>
                  <CardTitle className="text-center text-xl text-slate-300">Overall Score</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center p-6">
                  <div className="w-40 h-40">
                    <CircularProgressbar
                      value={evaluation.score}
                      text={`${evaluation.score}%`}
                      strokeWidth={8}
                      styles={buildStyles({
                        textColor: '#f8fafc', // text-slate-50
                        pathColor: getScoreColor(evaluation.score),
                        trailColor: 'rgba(255, 255, 255, 0.1)',
                      })}
                    />
                  </div>
                   <p className="text-slate-400 mt-4 text-center">Last updated on {evaluation.evaluationDate}</p>
                </CardContent>
              </Card>
            </div>
            <div className="md:col-span-2 animate-in fade-in slide-in-from-right-8 duration-700">
                <Card className="bg-slate-900/50 border border-slate-700/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl text-slate-300">
                            <MessageSquare />
                            Instructor Feedback
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-slate-300 text-lg whitespace-pre-wrap leading-relaxed">{evaluation.feedback}</p>
                    </CardContent>
                </Card>
            </div>
          </div>
        ) : (
          <Card className="bg-slate-900/50 border border-slate-800">
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                <AlertCircle className="w-16 h-16 text-slate-600 mb-4" />
                <h3 className="text-xl font-semibold text-slate-300">Evaluation Not Available</h3>
                <p className="text-slate-500 max-w-sm mt-2">Your evaluation has not been added by the instructor yet. Please check back later for updates on your performance.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MyEvaluationsPage;