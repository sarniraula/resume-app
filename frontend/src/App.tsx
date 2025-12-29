import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { motion } from 'framer-motion';
import { FileUpload } from './components/FileUpload';
import { Loader2, Sparkles, AlertCircle, CheckCircle2 } from 'lucide-react';
import clsx from 'clsx';

// Type definitions
interface AnalysisResult {
  overall_score: number;
  keyword_matches: string[];
  missing_keywords: string[];
  formatting_tips: string[];
  improvement_suggestions: string[];
  highlighted_resume: string;
}

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function App() {
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [jdFile, setJdFile] = useState<File | null>(null);

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      if (resumeFile) formData.append('resume', resumeFile);
      if (jdFile) formData.append('jd', jdFile);

      // Add text fallback if needed, but we rely on files for now
      // formData.append('resumeText', '');
      console.log(API_BASE_URL)

      const res = await axios.post(`${API_BASE_URL}/analyze`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data as AnalysisResult;
    }
  });

  const handleAnalyze = () => {
    if (!resumeFile || !jdFile) return;
    analyzeMutation.mutate();
  };

  const result = analyzeMutation.data;

  return (
    <div className="min-h-screen text-gray-100 p-6 md:p-12 relative">
      {/* Background Mesh */}
      <div className="mesh-bg" />

      <div className="max-w-6xl mx-auto space-y-12 relative z-10">

        {/* Header */}
        <header className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 rounded-full px-4 py-1.5 backdrop-blur-md"
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span className="text-sm font-medium text-purple-200">AI-Powered ATS Analyst</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 tracking-tight"
          >
            Resume Check
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-gray-400 max-w-2xl mx-auto"
          >
            Optimize your resume for Applicant Tracking Systems with AI-driven insights.
            Upload your resume and job description to get started.
          </motion.p>
        </header>

        {/* Input Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-2 gap-8"
        >
          <div className="space-y-6">
            <FileUpload
              label="Upload Resume (PDF/DOCX)"
              accept={{ 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'] }}
              value={resumeFile}
              onChange={setResumeFile}
              disabled={analyzeMutation.isPending}
            />
          </div>
          <div className="space-y-6">
            <FileUpload
              label="Job Description"
              accept={{ 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'text/plain': ['.txt'] }}
              value={jdFile}
              onChange={setJdFile}
              disabled={analyzeMutation.isPending}
            />
          </div>
        </motion.div>

        {/* Action Button */}
        <div className="flex justify-center">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAnalyze}
            disabled={!resumeFile || !jdFile || analyzeMutation.isPending}
            className={clsx(
              "px-10 py-4 rounded-2xl text-lg font-bold shadow-2xl shadow-blue-500/20 transition-all flex items-center space-x-3",
              (!resumeFile || !jdFile)
                ? "bg-gray-800 text-gray-500 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-purple-500/30"
            )}
          >
            {analyzeMutation.isPending ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                <span>Analyzing Profile...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-6 h-6" />
                <span>Analyze Match</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Error Message */}
        {analyzeMutation.isError && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="bg-red-500/10 border border-red-500/20 text-red-200 p-4 rounded-xl text-center flex items-center justify-center space-x-2"
          >
            <AlertCircle className="w-5 h-5" />
            <span>{analyzeMutation.error instanceof Error ? analyzeMutation.error.message : 'Analysis failed. Please try again.'}</span>
          </motion.div>
        )}

        {/* Results Section */}
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="grid md:grid-cols-3 gap-6">
              {/* Score Card */}
              <div className="glass-panel p-8 rounded-2xl flex flex-col items-center justify-center text-center md:col-span-1">
                <h3 className="text-gray-400 font-medium mb-4 uppercase tracking-wider text-sm">Match Score</h3>
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-gray-700" />
                    <circle
                      cx="80" cy="80" r="70"
                      stroke="currentColor" strokeWidth="10" fill="transparent"
                      strokeDasharray={440}
                      strokeDashoffset={440 - (440 * result.overall_score) / 100}
                      className={clsx(
                        "transition-all duration-1000 ease-out",
                        result.overall_score > 75 ? "text-green-500" : result.overall_score > 50 ? "text-yellow-500" : "text-red-500"
                      )}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-bold text-white">{result.overall_score}</span>
                    <span className="text-sm text-gray-400">/ 100</span>
                  </div>
                </div>
              </div>

              {/* Keywords Card */}
              <div className="glass-panel p-8 rounded-2xl md:col-span-2 space-y-6">
                <div>
                  <h3 className="text-green-400 font-medium mb-3 flex items-center">
                    <CheckCircle2 className="w-5 h-5 mr-2" /> Matched Keywords
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.keyword_matches.map(kw => (
                      <span key={kw} className="px-3 py-1 rounded-lg bg-green-500/10 text-green-300 text-sm border border-green-500/20">
                        {kw}
                      </span>
                    ))}
                    {result.keyword_matches.length === 0 && <span className="text-gray-500 italic">No exact matches found.</span>}
                  </div>
                </div>
                <div>
                  <h3 className="text-red-400 font-medium mb-3 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2" /> Missing Keywords
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {result.missing_keywords.map(kw => (
                      <span key={kw} className="px-3 py-1 rounded-lg bg-red-500/10 text-red-300 text-sm border border-red-500/20">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Suggestions Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="glass-panel p-6 rounded-2xl">
                <h3 className="text-xl font-semibold mb-4 text-blue-200">Formatting Tips</h3>
                <ul className="space-y-3">
                  {result.formatting_tips.map((tip, i) => (
                    <li key={i} className="flex items-start text-gray-300 text-sm">
                      <span className="mr-2 mt-1 text-blue-500">•</span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="glass-panel p-6 rounded-2xl">
                <h3 className="text-xl font-semibold mb-4 text-purple-200">Improvement Strategy</h3>
                <ul className="space-y-3">
                  {result.improvement_suggestions.map((suggestion, i) => (
                    <li key={i} className="flex items-start text-gray-300 text-sm">
                      <span className="mr-2 mt-1 text-purple-500">→</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default App;