import React, { useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import {
  Search, Settings, LayoutDashboard, Briefcase,
  TrendingUp, Database, Code, Users, CheckCircle2,
  AlertCircle, Loader2, Download, ExternalLink, RefreshCw, Key
} from 'lucide-react';

type SkillMetric = { name: string; demand: number };
type JobDataset = {
  hardSkills: SkillMetric[];
  softSkills: SkillMetric[];
  stats: { totalJobs: number; avgSalary: string };
};
type JobListing = {
  title?: string;
  description?: string;
  skills?: string[];
  companyName?: string;
  company?: string;
  location?: string;
  url?: string;
  jobUrl?: string;
};
type ApiConfig = {
  runEndpoint: string;
  datasetEndpoint: string;
  token: string;
};

const mockData: Record<string, JobDataset> = {
  'VLSI Engineer': {
    hardSkills: [
      { name: 'Verilog', demand: 92 },
      { name: 'SystemVerilog', demand: 86 },
      { name: 'UVM', demand: 78 },
      { name: 'ASIC', demand: 70 },
      { name: 'FPGA', demand: 64 },
      { name: 'VHDL', demand: 58 },
      { name: 'Synopsys', demand: 52 },
    ],
    softSkills: [
      { name: 'Problem Solving', demand: 90 },
      { name: 'Analytical Thinking', demand: 84 },
      { name: 'Teamwork', demand: 76 },
      { name: 'Communication', demand: 70 },
    ],
    stats: { totalJobs: 4850, avgSalary: '$110k - $160k' }
  },
  'Software Engineer': {
    hardSkills: [
      { name: 'JavaScript', demand: 88 },
      { name: 'React', demand: 82 },
      { name: 'TypeScript', demand: 75 },
      { name: 'Node.js', demand: 68 },
      { name: 'SQL', demand: 60 },
      { name: 'Python', demand: 55 },
      { name: 'AWS', demand: 50 },
    ],
    softSkills: [
      { name: 'Problem Solving', demand: 92 },
      { name: 'Communication', demand: 85 },
      { name: 'Teamwork', demand: 80 },
      { name: 'Agile/Scrum', demand: 70 },
    ],
    stats: { totalJobs: 12450, avgSalary: '$115k - $155k' }
  },
  default: {
    hardSkills: [
      { name: 'VLSI', demand: 90 },
      { name: 'Verilog', demand: 85 },
      { name: 'SystemVerilog', demand: 78 },
      { name: 'ASIC', demand: 70 },
      { name: 'FPGA', demand: 65 },
    ],
    softSkills: [
      { name: 'Problem Solving', demand: 90 },
      { name: 'Communication', demand: 85 },
      { name: 'Analytical Skills', demand: 80 },
    ],
    stats: { totalJobs: 6500, avgSalary: '$70k - $95k' }
  }
};

const MOCK_JOB_LISTINGS: JobListing[] = [
  { title: 'Senior VLSI Design Engineer', companyName: 'Intel', location: 'Bengaluru, India', url: 'https://linkedin.com' },
  { title: 'ASIC Verification Engineer', companyName: 'NVIDIA', location: 'Hyderabad, India', url: 'https://linkedin.com' },
  { title: 'FPGA Design Engineer', companyName: 'Qualcomm', location: 'Bengaluru, India', url: 'https://linkedin.com' },
  { title: 'Physical Design Engineer', companyName: 'AMD', location: 'Bengaluru, India', url: 'https://linkedin.com' },
  { title: 'SystemVerilog / UVM Engineer', companyName: 'Texas Instruments', location: 'Bengaluru, India', url: 'https://linkedin.com' },
];

const COLORS = ['#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#ec4899'];
const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'you', 'that', 'this', 'have', 'from', 'are', 'your',
  'will', 'our', 'work', 'experience', 'team', 'skills', 'job', 'role', 'looking',
  'ability', 'working', 'knowledge', 'years', 'strong', 'required', 'preferred',
  'degree', 'bachelor', 'master', 'equivalent', 'responsibilities', 'qualifications',
  'management', 'support', 'development', 'business', 'design', 'solutions', 'system',
  'systems', 'engineering', 'engineer', 'developer', 'analyst', 'position', 'company',
  'senior', 'junior', 'lead', 'staff', 'principal', 'intern', 'associate', 'director',
  'manager', 'software', 'hardware', 'firmware', 'fullstack', 'frontend', 'backend',
  'india', 'remote', 'hybrid', 'onsite', 'full-time', 'part-time', 'contract', 'opportunity'
]);
const TECH_DICTIONARY = [
  'VLSI', 'Verilog', 'SystemVerilog', 'ASIC', 'FPGA', 'UVM', 'C++', 'Linux',
  'Python', 'SQL', 'React', 'JavaScript', 'AWS', 'Java', 'Node.js', 'C#',
  'Cadence', 'Synopsys', 'TypeScript', 'Machine Learning', 'Tcl', 'Perl',
  'MATLAB', 'Docker', 'Kubernetes', 'Git', 'Power BI', 'Tableau', 'Excel'
];

const extractCleanSkills = (jobsArray: JobListing[] | undefined, userQuery: string): SkillMetric[] => {
  if (!jobsArray || jobsArray.length === 0) return [];

  const skillCounts: Record<string, number> = {};
  const totalJobs = jobsArray.length;
  const queryTokens = userQuery.split(/\s+/).filter((q: string) => q.length > 2 && !STOP_WORDS.has(q.toLowerCase()));
  const masterSkillList = Array.from(new Set([...TECH_DICTIONARY, ...queryTokens]));

  jobsArray.forEach((job: JobListing) => {
    const textToSearch = [job.title || '', job.description || '', ...(Array.isArray(job.skills) ? job.skills : [])].join(' ');
    masterSkillList.forEach((skill: string) => {
      const regex = new RegExp(`\\b${skill.replace(/\+/g, '\\+')}\\b`, 'i');
      if (regex.test(textToSearch)) {
        const formattedName = skill.length <= 4 ? skill.toUpperCase() : skill.charAt(0).toUpperCase() + skill.slice(1);
        skillCounts[formattedName] = (skillCounts[formattedName] || 0) + 1;
      }
    });
  });

  if (Object.keys(skillCounts).length < 3) {
    jobsArray.forEach((job: JobListing) => {
      const text = `${job.title || ''} ${job.description || ''}`.toLowerCase();
      const words = text.match(/\b[a-z0-9+#.-]+\b/g) || [];
      const uniqueWords = new Set(words);

      uniqueWords.forEach((word: string) => {
        if (word.length > 2 && !STOP_WORDS.has(word) && !/^\d+$/.test(word)) {
          const formattedName = word.length <= 4 ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1);
          skillCounts[formattedName] = (skillCounts[formattedName] || 0) + 1;
        }
      });
    });
  }

  return Object.keys(skillCounts)
    .map((skill: string) => ({ name: skill, demand: Math.round((skillCounts[skill] / totalJobs) * 100) }))
    .sort((a: SkillMetric, b: SkillMetric) => b.demand - a.demand)
    .slice(0, 7);
};

export default function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'settings'>('dashboard');
  const [searchQuery, setSearchQuery] = useState<string>('VLSI Engineer');
  const [location, setLocation] = useState<string>('India');
  const [activeJob, setActiveJob] = useState<string>('VLSI Engineer');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [pollingStatus, setPollingStatus] = useState<string>('');
  const [jobData, setJobData] = useState<JobDataset>(mockData['VLSI Engineer']);
  const [datasetId, setDatasetId] = useState<string>('mock-id');
  const [retrievedJobs, setRetrievedJobs] = useState<JobListing[]>(MOCK_JOB_LISTINGS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [apiConfig, setApiConfig] = useState<ApiConfig>({
    runEndpoint: 'https://api.apify.com/v2/acts/curious_coder~linkedin-jobs-scraper/runs',
    datasetEndpoint: 'https://api.apify.com/v2/acts/curious_coder~linkedin-jobs-scraper/runs/last/dataset/items',
    token: ''
  });
  const [configStatus, setConfigStatus] = useState<'success' | null>(null);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setPollingStatus('');
    setRetrievedJobs([]);

    if (!apiConfig.token || apiConfig.token.toLowerCase() === 'mock') {
      setLoadingMessage('Simulating Scraper & Analyzing Keywords...');
      setTimeout(() => {
        const queryLower = searchQuery.toLowerCase();
        const matchedKey = Object.keys(mockData).find((k: string) => k.toLowerCase() === queryLower);
        const selectedData = matchedKey ? mockData[matchedKey] : mockData.default;

        setJobData(selectedData);
        setActiveJob(searchQuery);
        setDatasetId('mock-id');
        setRetrievedJobs(MOCK_JOB_LISTINGS);
        setIsLoading(false);
        showNotification(`Simulated data loaded for "${searchQuery}".`);
      }, 1000);
      return;
    }

    try {
      setLoadingMessage('Starting Apify Actor...');
      setPollingStatus('Sending POST request to Apify API...');

      const baseUrl = apiConfig.runEndpoint.split('?')[0];
      const response = await fetch(`${baseUrl}?token=${apiConfig.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          autoConvertToAiSearch: false,
          datePosted: 'anyTime',
          keywords: searchQuery,
          limitPerSource: 50,
          location,
          scrapeCompany: true,
          splitByLocation: false,
          splitCountry: 'IN',
          under10Applicants: false
        })
      });

      const startData = (await response.json()) as { error?: { message?: string }; data?: { id?: string; defaultDatasetId?: string } };
      if (!response.ok) throw new Error(startData.error?.message || 'Failed to start actor run');

      const runId = startData.data?.id;
      const currentDatasetId = startData.data?.defaultDatasetId;
      if (!runId || !currentDatasetId) throw new Error('Missing Apify run metadata.');
      setDatasetId(currentDatasetId);

      let isRunning = true;
      let attempt = 0;
      while (isRunning) {
        attempt++;
        setPollingStatus(`Polling Apify... Status: RUNNING (Attempt ${attempt}, waiting 5s)`);
        await new Promise((resolve: (value?: unknown) => void) => setTimeout(resolve, 5000));

        const statusRes = await fetch(`https://api.apify.com/v2/acts/curious_coder~linkedin-jobs-scraper/runs/${runId}?token=${apiConfig.token}`);
        const statusData = (await statusRes.json()) as { data?: { status?: string } };
        const currentStatus = statusData.data?.status;

        if (currentStatus === 'SUCCEEDED') {
          isRunning = false;
          setPollingStatus('Status: SUCCEEDED! Fetching extracted job items...');
        } else if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(currentStatus ?? '')) {
          throw new Error(`Apify run stopped with status: ${currentStatus}`);
        }
      }

      const datasetRes = await fetch(`https://api.apify.com/v2/datasets/${currentDatasetId}/items?token=${apiConfig.token}`);
      const realJobsData = (await datasetRes.json()) as JobListing[];
      setRetrievedJobs(realJobsData);
      setActiveJob(searchQuery);

      const extractedSkills = extractCleanSkills(realJobsData, searchQuery);
      setJobData({
        hardSkills: extractedSkills.length > 0 ? extractedSkills : [{ name: searchQuery, demand: 100 }],
        softSkills: mockData.default.softSkills,
        stats: { totalJobs: realJobsData.length, avgSalary: 'Data Unavailable' }
      });
    } catch (error: unknown) {
      const err = error instanceof Error ? error : new Error(String(error));
      setLoadingMessage('Network/API error. Falling back to internal dataset...');
      setPollingStatus(`Error details: ${err.message}`);
      setTimeout(() => {
        setJobData(mockData.default);
        setRetrievedJobs(MOCK_JOB_LISTINGS);
        setActiveJob(searchQuery);
        showNotification(`Error: ${err.message}. Fallback data active.`);
      }, 1500);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadExcel = () => {
    if (!datasetId) return;
    if (datasetId === 'mock-id' || !apiConfig.token || apiConfig.token.toLowerCase() === 'mock') {
      showNotification('Demo Mode: Triggering simulated Excel download...');
      const csvContent = 'data:text/csv;charset=utf-8,Title,Company,Location\n'
        + MOCK_JOB_LISTINGS.map((j: JobListing) => `"${j.title}","${j.companyName}","${j.location}"`).join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `skillpulse_${searchQuery.replace(/\s+/g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    window.location.href = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${apiConfig.token}&format=xlsx&clean=true&attachment=true`;
  };

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl border border-slate-700 flex items-center space-x-3 text-sm animate-in fade-in duration-300">
          <AlertCircle size={18} className="text-blue-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col hidden md:flex z-10 shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center space-x-3">
          <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-200">
            <TrendingUp size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
              SkillPulse
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Job Market Intelligence</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm ${
              currentView === 'dashboard' ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setCurrentView('settings')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm ${
              currentView === 'settings' ? 'bg-blue-50 text-blue-700 font-semibold shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            <Settings size={20} />
            <span>API Config</span>
          </button>
        </nav>

        <div className="p-4 m-4 bg-slate-50 rounded-xl border border-slate-200/80">
          <div className="flex items-center space-x-2 text-xs text-slate-600 mb-2">
            <Database size={14} className="text-slate-400" />
            <span className="font-semibold uppercase tracking-wider">Scraper Engine</span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            {apiConfig.token ? (
              <span className="flex items-center text-emerald-600 font-semibold">
                <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
                Apify Scraper Live
              </span>
            ) : (
              <span className="flex items-center text-amber-600 font-semibold">
                <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                Mock / Offline Mode
              </span>
            )}
          </p>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto bg-slate-50 flex flex-col">
        <div className="md:hidden bg-white p-4 flex items-center justify-between border-b border-slate-200 shadow-sm sticky top-0 z-20">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <TrendingUp size={18} className="text-white" />
            </div>
            <h1 className="text-lg font-bold text-slate-800">SkillPulse</h1>
          </div>
          <div className="flex space-x-1">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`p-2 rounded-lg ${currentView === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}
            >
              <LayoutDashboard size={20} />
            </button>
            <button
              onClick={() => setCurrentView('settings')}
              className={`p-2 rounded-lg ${currentView === 'settings' ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}
            >
              <Settings size={20} />
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-6 md:p-10 max-w-7xl mx-auto space-y-6 w-full flex-1">
          {currentView === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">Job Market Demand Analytics</h2>
                  <p className="text-xs md:text-sm text-slate-500 mt-1">Extract key technical skills & keywords directly from live job postings.</p>
                </div>

                <form onSubmit={handleSearch} className="w-full lg:w-auto flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
                  <div className="relative w-full sm:w-60">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Search size={16} />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Role (e.g. Data Analyst)"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  <div className="relative w-full sm:w-36">
                    <input
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      placeholder="Location"
                      className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      className="flex-1 sm:flex-none px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold rounded-xl shadow-sm shadow-blue-200 transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-70"
                      disabled={isLoading}
                    >
                      {isLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                      <span>{isLoading ? 'Processing' : 'Run Scraper'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadExcel}
                      disabled={isLoading}
                      className="px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-sm shadow-emerald-200 transition-all flex items-center justify-center space-x-1.5 text-sm disabled:opacity-50"
                      title="Download Dataset as Excel/CSV"
                    >
                      <Download size={16} />
                      <span className="hidden sm:inline">Export</span>
                    </button>
                  </div>
                </form>
              </div>

              {isLoading && (
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-xl flex items-center justify-between text-blue-700 text-sm">
                  <div className="flex items-center space-x-3">
                    <Loader2 size={18} className="animate-spin text-blue-600" />
                    <div>
                      <p className="font-semibold">{loadingMessage}</p>
                      {pollingStatus && <p className="text-xs font-mono text-blue-500 mt-0.5">{pollingStatus}</p>}
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 shrink-0">
                    <Briefcase size={22} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Target Title</p>
                    <h3 className="text-lg font-bold text-slate-800 capitalize truncate" title={activeJob}>{activeJob}</h3>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex items-center space-x-4">
                  <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 shrink-0">
                    <Database size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Postings Analyzed</p>
                    <h3 className="text-lg font-bold text-slate-800">
                      {isLoading ? <Loader2 className="animate-spin text-slate-400" size={18} /> : jobData.stats.totalJobs.toLocaleString()}
                    </h3>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex items-center space-x-4">
                  <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
                    <TrendingUp size={22} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Est. Salary Range</p>
                    <h3 className="text-lg font-bold text-slate-800">
                      {isLoading ? <Loader2 className="animate-spin text-slate-400" size={18} /> : jobData.stats.avgSalary}
                    </h3>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Code className="text-blue-500" size={18} />
                      <h3 className="text-base font-bold text-slate-800">Discovered Top Skills & Tech</h3>
                    </div>
                    <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-lg">
                      % of Postings Mentioned
                    </span>
                  </div>

                  {isLoading ? (
                    <div className="h-72 flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="animate-spin text-blue-500" size={36} />
                      <p className="text-xs text-slate-400 font-medium">{loadingMessage}</p>
                    </div>
                  ) : (
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={jobData.hardSkills} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                          <XAxis type="number" domain={[0, 100]} hide />
                          <YAxis
                            dataKey="name"
                            type="category"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#475569', fontSize: 12, fontWeight: 500 }}
                            width={110}
                          />
                          <RechartsTooltip
                            cursor={{ fill: '#f8fafc' }}
                            formatter={(value) => [`${value}% Demand`, 'Occurrence']}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          />
                          <Bar dataKey="demand" radius={[0, 6, 6, 0]} barSize={20}>
                            {jobData.hardSkills.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 flex flex-col justify-between">
                  <div className="flex items-center space-x-2 mb-4">
                    <Users className="text-indigo-500" size={18} />
                    <h3 className="text-base font-bold text-slate-800">Soft Skills Breakdown</h3>
                  </div>

                  {isLoading ? (
                    <div className="h-60 flex flex-col items-center justify-center space-y-3">
                      <Loader2 className="animate-spin text-indigo-500" size={36} />
                    </div>
                  ) : (
                    <div className="h-56 w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie data={jobData.softSkills} cx="50%" cy="50%" innerRadius={55} outerRadius={75} paddingAngle={4} dataKey="demand" stroke="none">
                            {jobData.softSkills.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col">
                        <span className="text-2xl font-bold text-slate-800">
                          {jobData.softSkills.length > 0 ? `${jobData.softSkills[0].demand}%` : '0%'}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-semibold max-w-[80px] text-center leading-tight">
                          Top Soft Skill
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 mt-2 pt-2 border-t border-slate-100">
                    {jobData.softSkills.slice(0, 3).map((skill, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <div className="flex items-center space-x-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                          <span className="text-slate-600 font-medium">{skill.name}</span>
                        </div>
                        <span className="text-slate-800 font-bold">{skill.demand}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {retrievedJobs.length > 0 && !isLoading && (
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <Briefcase className="text-blue-500" size={18} />
                      <h3 className="text-base font-bold text-slate-800">Scraped Job Listings</h3>
                    </div>
                    <span className="text-xs text-slate-400">Showing top results</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs sm:text-sm text-slate-600">
                      <thead className="bg-slate-50 text-slate-700 font-semibold uppercase text-[11px] tracking-wider border-b border-slate-200">
                        <tr>
                          <th className="p-3.5 rounded-tl-lg">Job Title</th>
                          <th className="p-3.5">Company</th>
                          <th className="p-3.5">Location</th>
                          <th className="p-3.5 rounded-tr-lg text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {retrievedJobs.slice(0, 8).map((job, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                            <td className="p-3.5 font-medium text-slate-800">{job.title || 'N/A'}</td>
                            <td className="p-3.5">{job.companyName || job.company || 'N/A'}</td>
                            <td className="p-3.5">{job.location || 'N/A'}</td>
                            <td className="p-3.5 text-right">
                              {job.url || job.jobUrl ? (
                                <a href={job.url || job.jobUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center space-x-1 text-blue-600 hover:text-blue-800 font-semibold">
                                  <span>View Job</span>
                                  <ExternalLink size={12} />
                                </a>
                              ) : <span className="text-slate-400">N/A</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {currentView === 'settings' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Apify API Configuration</h2>
                <p className="text-sm text-slate-500 mt-1">Configure your personal Apify token to execute live scraping actors.</p>
              </div>

              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200/80">
                <form onSubmit={(e) => {
                  e.preventDefault();
                  setConfigStatus('success');
                  showNotification('API Configuration saved successfully!');
                  setTimeout(() => setConfigStatus(null), 3000);
                }} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Run Actor Endpoint (POST)</label>
                    <input
                      type="url"
                      value={apiConfig.runEndpoint}
                      onChange={(e) => setApiConfig({ ...apiConfig, runEndpoint: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">Get Dataset Endpoint (GET)</label>
                    <input
                      type="url"
                      value={apiConfig.datasetEndpoint}
                      onChange={(e) => setApiConfig({ ...apiConfig, datasetEndpoint: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center justify-between">
                      <span>Personal Apify API Token</span>
                      <span className="text-[11px] text-slate-400 lowercase font-normal">(Leave empty for demo mock mode)</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Key size={16} />
                      </div>
                      <input
                        type="password"
                        value={apiConfig.token}
                        onChange={(e) => setApiConfig({ ...apiConfig, token: e.target.value })}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all font-mono text-xs"
                        placeholder="apify_api_..."
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between border-t border-slate-100">
                    <button
                      type="button"
                      className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors text-xs"
                      onClick={() => {
                        setApiConfig({ ...apiConfig, token: '' });
                        showNotification('API token cleared. Switched to Mock mode.');
                      }}
                    >
                      Clear Token
                    </button>

                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-200 flex items-center space-x-2 text-xs"
                    >
                      <CheckCircle2 size={16} />
                      <span>Save Configuration</span>
                    </button>
                  </div>

                  {configStatus === 'success' && (
                    <div className="p-3.5 bg-emerald-50 text-emerald-700 rounded-xl flex items-center space-x-2 border border-emerald-100 text-xs">
                      <CheckCircle2 size={16} className="text-emerald-500" />
                      <p className="font-medium">Settings saved! You can now run searches on the Dashboard.</p>
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
