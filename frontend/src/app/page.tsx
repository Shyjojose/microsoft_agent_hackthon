"use client";

import { useState } from 'react';
import CareerTree from '@/components/CareerTree';
import { motion } from 'framer-motion';
import { UploadCloud, FileText, Loader2, Award, Briefcase, ChevronRight } from 'lucide-react';

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:8000/api/v1/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || "Upload failed");
      }

      const result = await res.json();
      setData(result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (data) {
    return (
      <main className="flex h-screen w-full bg-slate-950 text-white overflow-hidden">
        {/* Left Sidebar Profile */}
        <motion.div 
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="w-80 border-r border-slate-800 bg-slate-900/50 backdrop-blur flex flex-col p-6 z-20 shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-tr from-blue-500 to-emerald-400 rounded-full flex items-center justify-center font-bold text-lg shadow-[0_0_15px_rgba(59,130,246,0.5)]">
              {data.profile.user_id?.substring(0, 2).toUpperCase() || 'CV'}
            </div>
            <div>
              <h1 className="font-bold text-xl leading-tight">My Career</h1>
              <p className="text-emerald-400 text-sm">Level {data.profile.experience_years} Professional</p>
            </div>
          </div>

          <div className="space-y-6 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            <div>
              <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
                <Briefcase size={14} /> Current Role
              </h3>
              <p className="font-medium text-slate-200 bg-slate-800/50 p-3 rounded-lg border border-slate-700/50">
                {data.profile.current_title}
              </p>
            </div>

            <div>
              <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
                <FileText size={14} /> Profile Summary
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                {data.profile.profile_summary}
              </p>
            </div>

            <div>
              <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2 flex items-center gap-2">
                <Award size={14} /> Extracted Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {data.profile.extracted_skills.map((skill: string, idx: number) => (
                  <span key={idx} className="bg-slate-800 border border-slate-700 text-slate-300 text-xs px-2.5 py-1 rounded-md">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setData(null)} 
            className="mt-6 w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl transition-colors border border-slate-700 text-sm font-medium"
          >
            Upload New CV
          </button>
        </motion.div>

        {/* Main Graph Area */}
        <div className="flex-1 relative">
          <CareerTree graphData={data.graph} profileData={data.profile} />
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 bg-slate-950 relative overflow-hidden">
      {/* Decorative background blur */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-[100px] pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 text-center max-w-2xl"
      >
        <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400 mb-6 drop-shadow-lg">
          Organisation Career Tree Generator
        </h1>
        <p className="text-lg text-slate-400 mb-12 font-light">
          Upload your CV to generate a dynamic, personalized skill tree mapping your future roles, required skills, and learning pathways.
        </p>

        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 p-8 rounded-3xl shadow-2xl max-w-md mx-auto relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-inner border border-slate-700">
              <UploadCloud size={32} className="text-blue-400" />
            </div>
            
            <label className="cursor-pointer mb-6 group-hover:scale-105 transition-transform">
              <span className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2">
                Select Resume (PDF/DOCX)
              </span>
              <input 
                type="file" 
                className="hidden" 
                accept=".pdf,.docx" 
                onChange={handleFileChange} 
              />
            </label>
            
            {file && (
              <div className="flex items-center gap-2 text-sm text-emerald-400 font-medium mb-6 bg-emerald-400/10 px-4 py-2 rounded-lg border border-emerald-400/20">
                <FileText size={16} />
                {file.name}
              </div>
            )}

            {error && (
              <div className="text-red-400 text-sm mb-6 bg-red-400/10 px-4 py-2 rounded-lg border border-red-400/20">
                {error}
              </div>
            )}

            <button
              onClick={handleUpload}
              disabled={!file || loading}
              className="w-full flex items-center justify-center gap-2 bg-white text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-200 transition-colors py-3 rounded-xl font-bold"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Analyzing Profile...
                </>
              ) : (
                <>
                  Generate Career Tree
                  <ChevronRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
