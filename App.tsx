
import React, { useState } from 'react';
import { AnalysisState, AppView, LinkedInProfileData, OptimizedContent } from './types';
import { scrapeLinkedInProfile } from './services/apifyService';
import { optimizeProfile, regenerateSection, generatePost } from './services/geminiService';

const App: React.FC = () => {
  const [url, setUrl] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{role: 'user'|'ai', text: string}[]>([]);
  const [state, setState] = useState<AnalysisState>({
    status: 'idle',
    message: '',
    view: 'onboarding'
  });

  const renderSafe = (val: any): string => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'string' || typeof val === 'number') return String(val);
    if (typeof val === 'object') {
      if (val.text) return val.text;
      if (val.linkedinText) return val.linkedinText;
      if (val.name) return val.name;
      if (val.label) return val.label;
      return ""; 
    }
    return String(val);
  };

  const getImageUrl = (img: any): string => {
    if (!img) return '';
    if (typeof img === 'string') return img;
    if (typeof img === 'object' && img.url) return img.url;
    return '';
  };

  const getProfileImage = (d: LinkedInProfileData | undefined): string => {
    if (!d) return 'https://via.placeholder.com/150';
    const imgUrl = getImageUrl(d.profilePicture || d.photo || d.displayImage || d.profilePicUrl || d.imgUrl);
    return imgUrl || 'https://via.placeholder.com/150';
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.includes('linkedin.com/in/')) {
      setState(prev => ({ ...prev, status: 'error', message: 'Invalid LinkedIn URL' }));
      return;
    }

    try {
      setState(prev => ({ ...prev, status: 'scraping', message: 'Fetching complete profile data...' }));
      const data = await scrapeLinkedInProfile(url);
      setState(prev => ({ 
        ...prev, 
        status: 'success', 
        view: 'profile-view', 
        data 
      }));
    } catch (err: any) {
      setState(prev => ({ ...prev, status: 'error', message: err.message }));
    }
  };

  const handleEnhance = async () => {
    if (!state.data) return;
    try {
      setState(prev => ({ ...prev, status: 'analyzing', message: 'Optimizing strategy...' }));
      const optimized = await optimizeProfile(state.data);
      setState(prev => ({ 
        ...prev, 
        status: 'success', 
        view: 'ai-optimizer', 
        optimized 
      }));
    } catch (err: any) {
      setState(prev => ({ ...prev, status: 'error', message: err.message }));
    }
  };

  const handleRegen = async (section: keyof OptimizedContent, feedback: string) => {
    if (!state.optimized || !state.data) return;
    try {
      const newText = await regenerateSection(section, feedback, state.data);
      setState(prev => ({
        ...prev,
        optimized: {
          ...prev.optimized!,
          [section]: section === 'experienceBullets' ? [newText] : newText
        }
      }));
    } catch (err) {
      console.error(err);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', text: userMsg }]);
    
    try {
      const aiResponse = await generatePost(userMsg, chatHistory);
      setChatHistory(prev => [...prev, { role: 'ai', text: aiResponse }]);
    } catch (err) {
      console.error(err);
    }
  };

  const SectionHeader = ({ icon, title }: { icon: string, title: string }) => (
    <h3 className="text-lg font-bold flex items-center gap-2 mb-4 mt-8 first:mt-0">
      <span className="material-symbols-outlined text-primary">{icon}</span>
      {title}
    </h3>
  );

  const InfoCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`p-4 bg-slate-800/50 border border-slate-800 rounded-xl ${className}`}>
      {children}
    </div>
  );

  const renderOnboarding = () => (
    <div className="flex h-screen w-full flex-col bg-background-dark overflow-hidden mesh-gradient relative">
      <div className="flex flex-col items-center px-6 pt-24 pb-8">
        <div className="mb-6 flex size-20 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xl">
          <span className="material-symbols-outlined text-[40px]">rocket_launch</span>
        </div>
        <h1 className="text-white tracking-tight text-[32px] font-bold leading-tight text-center pb-3">
          Crack the <br/><span className="text-primary">LinkedIn Game</span>
        </h1>
        <p className="text-slate-400 text-base font-normal leading-relaxed text-center px-4 max-w-[320px]">
          AI-powered insights to transform your profile into a high-converting landing page.
        </p>
      </div>

      <div className="flex flex-col gap-6 px-6 py-4 mt-auto mb-16 z-10">
        <div className="flex flex-col gap-2">
          <form onSubmit={handleAnalyze}>
            <label className="flex flex-col group">
              <span className="text-slate-400 text-xs font-bold uppercase tracking-widest pb-2 pl-1">Your LinkedIn Profile URL</span>
              <div className="flex w-full items-stretch transition-all duration-200">
                <div className="flex items-center justify-center pl-4 pr-2 bg-[#192233] border border-r-0 border-[#324467] rounded-l-xl group-focus-within:border-primary">
                  <span className="material-symbols-outlined text-[#92a4c9] text-[20px]">link</span>
                </div>
                <input 
                  className="form-input flex w-full min-w-0 flex-1 rounded-r-xl border border-l-0 border-[#324467] bg-[#192233] text-white focus:ring-0 focus:border-primary h-14 placeholder:text-[#92a4c9] pr-4 text-base transition-colors"
                  placeholder="linkedin.com/in/username" 
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
            </label>
            <p className="text-[11px] text-slate-500 px-1 flex items-center gap-1 mt-2">
              <span className="material-symbols-outlined text-[14px]">lock</span>
              Your data is secure. We never post on your behalf.
            </p>
            {state.status === 'error' && <p className="text-red-400 text-xs px-1 mt-1">{state.message}</p>}
            
            <button 
              type="submit"
              disabled={state.status === 'scraping'}
              className="flex w-full cursor-pointer items-center justify-center rounded-xl h-14 px-5 bg-primary text-white text-base font-bold shadow-lg active:scale-[0.98] transition-all disabled:opacity-50 mt-6"
            >
              <span className="truncate">{state.status === 'scraping' ? 'Analyzing...' : 'Analyze Profile'}</span>
              <span className="material-symbols-outlined ml-2 text-[20px]">{state.status === 'scraping' ? 'sync' : 'bolt'}</span>
            </button>
          </form>
        </div>
      </div>
      
      <div className="absolute -top-24 -right-24 size-64 bg-primary/10 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="absolute top-1/2 -left-32 size-64 bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>
    </div>
  );

  const renderProfileView = () => {
    const d = state.data;
    if (!d) return null;

    const ensureArray = (val: any): any[] => {
      if (Array.isArray(val)) return val;
      if (typeof val === 'string' && val.trim()) return [val];
      return [];
    };

    const experienceData = ensureArray(d.experience || d.experiences);
    const educationData = ensureArray(d.education);
    const coverUrl = getImageUrl(d.coverPicture || d.backgroundPicture);

    return (
      <div className="bg-background-dark text-slate-100 min-h-screen pb-40">
        <header className="sticky top-0 z-50 bg-[#101622]/80 backdrop-blur-md border-b border-slate-800">
          <div className="flex items-center justify-between px-4 h-14">
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-full hover:bg-slate-800">
              <span className="material-symbols-outlined">menu</span>
            </button>
            <h1 className="text-base font-semibold">Extracted Profile</h1>
            <button onClick={() => setState(prev => ({ ...prev, view: 'onboarding', status: 'idle' }))} className="p-2 rounded-full hover:bg-slate-800">
              <span className="material-symbols-outlined text-sm">logout</span>
            </button>
          </div>
        </header>

        {/* Cover Photo */}
        <div className="relative h-32 w-full bg-slate-800/50 overflow-hidden">
          {coverUrl ? (
            <img 
              src={coverUrl} 
              className="w-full h-full object-cover opacity-60" 
              alt="Cover" 
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (
            <div className="w-full h-full bg-slate-900/50"></div>
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background-dark"></div>
        </div>

        <main className="px-4 -mt-16 relative z-10 space-y-8">
          {/* Profile Header */}
          <section className="flex flex-col items-center text-center">
            <div className="relative mb-4">
              <div className="w-32 h-32 rounded-full border-4 border-background-dark p-0.5 bg-background-dark overflow-hidden">
                <img 
                  src={getProfileImage(d)}
                  alt="Profile"
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150'; }}
                />
              </div>
              {d.verified && (
                <div className="absolute bottom-2 right-2 bg-primary text-white p-1 rounded-full border-2 border-background-dark">
                  <span className="material-symbols-outlined text-[16px] block">verified</span>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">{renderSafe(d.fullName || (d.firstName + ' ' + d.lastName))}</h2>
              <p className="text-primary font-medium text-sm leading-snug max-w-sm mx-auto">{renderSafe(d.headline)}</p>
              
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                <div className="flex items-center gap-1 text-slate-400 text-xs">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  <span>{renderSafe(d.location)}</span>
                </div>
                {d.premium && (
                  <div className="flex items-center gap-1 text-amber-500 text-xs font-bold uppercase tracking-wider">
                    <span className="material-symbols-outlined text-sm">workspace_premium</span>
                    <span>Premium</span>
                  </div>
                )}
                {d.influencer && (
                  <div className="flex items-center gap-1 text-primary text-xs font-bold uppercase tracking-wider">
                    <span className="material-symbols-outlined text-sm">star</span>
                    <span>Influencer</span>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Followers Stats */}
          <section className="grid grid-cols-2 gap-3">
            <InfoCard>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Followers</span>
              <span className="text-2xl font-bold block">{renderSafe(d.followerCount || '0')}</span>
            </InfoCard>
            <InfoCard>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Connections</span>
              <span className="text-2xl font-bold block">{renderSafe(d.connectionsCount || '0')}</span>
            </InfoCard>
          </section>

          {/* About */}
          {d.about && (
            <section>
              <SectionHeader icon="person" title="About" />
              <InfoCard>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-line">{renderSafe(d.about)}</p>
              </InfoCard>
            </section>
          )}

          {/* Experience */}
          {experienceData.length > 0 && (
            <section>
              <SectionHeader icon="work" title="Experience" />
              <div className="space-y-3">
                {experienceData.map((exp, i) => {
                  const companyLogoUrl = getImageUrl(exp.companyLogo || exp.logoUrl || exp.logo);
                  const title = exp.position || exp.title;
                  const company = exp.companyName || exp.company;
                  const startDate = renderSafe(exp.startDate);
                  const endDate = renderSafe(exp.endDate || 'Present');

                  return (
                    <InfoCard key={i} className="flex flex-col gap-4">
                      <div className="flex gap-4 items-start">
                        <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {companyLogoUrl ? (
                            <img 
                              src={companyLogoUrl} 
                              className="w-full h-full object-cover" 
                              onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="material-symbols-outlined text-slate-500">domain</span>'; }} 
                              alt="Logo" 
                            />
                          ) : (
                            <span className="material-symbols-outlined text-slate-500">domain</span>
                          )}
                        </div>
                        <div className="flex flex-col gap-0.5 flex-1">
                          <h4 className="font-bold text-sm">{renderSafe(title)}</h4>
                          <p className="text-slate-300 text-xs font-medium">{renderSafe(company)}</p>
                          <p className="text-[10px] text-slate-500">{startDate} — {endDate} {exp.duration ? `(${exp.duration})` : ''}</p>
                          {exp.location && <p className="text-[10px] text-slate-500">{renderSafe(exp.location)}</p>}
                        </div>
                      </div>
                      {exp.description && (
                        <div className="mt-2 pl-16">
                          <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line">{renderSafe(exp.description)}</p>
                        </div>
                      )}
                    </InfoCard>
                  );
                })}
              </div>
            </section>
          )}

          {/* Education */}
          {educationData.length > 0 && (
            <section>
              <SectionHeader icon="school" title="Education" />
              <div className="space-y-3">
                {educationData.map((edu, i) => {
                  const schoolLogoUrl = getImageUrl(edu.schoolLogo || edu.logoUrl || edu.logo || edu.companyLogo);
                  return (
                    <InfoCard key={i} className="flex gap-4 items-start">
                      <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {schoolLogoUrl ? (
                          <img 
                            src={schoolLogoUrl} 
                            className="w-full h-full object-cover" 
                            alt="Logo"
                            onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement!.innerHTML = '<span class="material-symbols-outlined text-slate-500">school</span>'; }}
                          />
                        ) : (
                          <span className="material-symbols-outlined text-slate-500">school</span>
                        )}
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <h4 className="font-bold text-sm">{renderSafe(edu.schoolName)}</h4>
                        <p className="text-slate-300 text-xs">{renderSafe(edu.degreeName)} {edu.fieldOfStudy ? `• ${renderSafe(edu.fieldOfStudy)}` : ''}</p>
                        <p className="text-[10px] text-slate-500">{renderSafe(edu.startDate)} — {renderSafe(edu.endDate)}</p>
                      </div>
                    </InfoCard>
                  );
                })}
              </div>
            </section>
          )}

          {/* Skills Section */}
          {(ensureArray(d.topSkills).length > 0 || ensureArray(d.skills).length > 0) && (
            <section>
              <SectionHeader icon="bolt" title="Skills" />
              <div className="flex flex-wrap gap-2">
                {[...ensureArray(d.topSkills), ...ensureArray(d.skills)].map((skill, i) => (
                  <span key={i} className="px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-[11px] font-bold tracking-tight">
                    {renderSafe(skill.name || skill)}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Featured Content */}
          {ensureArray(d.featured).length > 0 && (
            <section>
              <SectionHeader icon="star" title="Featured" />
              <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
                {ensureArray(d.featured).map((feat, i) => (
                  <InfoCard key={i} className="min-w-[200px] flex-shrink-0">
                    {feat.image && <img src={feat.image} className="w-full h-24 object-cover rounded mb-2" />}
                    <h4 className="font-bold text-xs line-clamp-2">{renderSafe(feat.title || feat.description)}</h4>
                    {feat.url && <a href={feat.url} className="text-primary text-[10px] mt-1 block">View Resource</a>}
                  </InfoCard>
                ))}
              </div>
            </section>
          )}
        </main>

        <footer className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-8 pt-4 bg-gradient-to-t from-background-dark via-background-dark to-transparent">
          <div className="max-w-md mx-auto">
            <button 
              onClick={handleEnhance}
              className="w-full bg-primary text-white font-bold py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
              {state.status === 'analyzing' ? 'Processing...' : 'Enhance Your Profile with AI'}
            </button>
          </div>
        </footer>
      </div>
    );
  };

  const renderAIOptimizer = () => {
    const o = state.optimized;
    if (!o) return null;
    return (
      <div className="bg-background-dark text-slate-100 min-h-screen pb-32">
        <header className="sticky top-0 z-10 bg-background-dark/80 backdrop-blur-md flex items-center p-4 justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="material-symbols-outlined cursor-pointer">menu</button>
            <h2 className="text-lg font-bold leading-tight tracking-tight">AI Profile Optimizer</h2>
          </div>
          <div className="p-2 rounded-full bg-primary/10 text-primary">
            <span className="material-symbols-outlined text-xl">auto_awesome</span>
          </div>
        </header>

        <div className="flex flex-col gap-6 p-4">
          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Headline</h3>
            <div className="magic-border">
              <div className="magic-inner p-4 shadow-xl space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <p className="text-white text-base font-semibold leading-relaxed">{renderSafe(o.headline)}</p>
                  <button onClick={() => handleRegen('headline', 'make it more punchy')} className="shrink-0 p-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors">
                    <span className="material-symbols-outlined text-xl">autorenew</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">About Summary</h3>
            <div className="bg-card-dark border border-border-dark rounded-xl p-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3">
                <button onClick={() => handleRegen('about', 'more professional')} className="p-2 rounded-lg text-slate-500 hover:text-primary transition-colors">
                  <span className="material-symbols-outlined text-xl">autorenew</span>
                </button>
              </div>
              <p className="text-slate-300 text-sm leading-relaxed pr-8">{renderSafe(o.about)}</p>
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Experience Highlights</h3>
            <div className="bg-card-dark border border-border-dark rounded-xl p-4 space-y-4">
              <div className="space-y-2 pl-2 border-l-2 border-primary/30">
                {o.experienceBullets.map((bullet, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-primary text-xs mt-1">check_circle</span>
                    <p className="text-sm text-slate-300">{renderSafe(bullet)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <footer className="fixed bottom-0 left-0 right-0 p-4 bg-background-dark/80 backdrop-blur-xl border-t border-slate-800">
          <button className="w-full bg-primary text-white h-14 rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all">
            <span className="material-symbols-outlined">publish</span>
            Apply to LinkedIn
          </button>
        </footer>
      </div>
    );
  };

  const renderPostGenerator = () => (
    <div className="relative flex flex-col h-screen max-w-md mx-auto overflow-hidden bg-background-dark">
      <header className="sticky top-0 z-20 flex items-center justify-between px-4 h-16 bg-background-dark/80 ios-blur border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsSidebarOpen(true)} className="material-symbols-outlined">menu</button>
          <h1 className="text-lg font-bold tracking-tight">AI Post Generator</h1>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pt-6 pb-48 space-y-6 hide-scrollbar">
        {chatHistory.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-primary text-white' : 'bg-[#192233] border border-slate-800 text-slate-200'}`}>
              <p className="text-sm whitespace-pre-wrap">{renderSafe(msg.text)}</p>
            </div>
          </div>
        ))}
      </main>

      <div className="absolute bottom-0 inset-x-0 z-30 flex flex-col pt-4 pb-8 bg-gradient-to-t from-background-dark via-background-dark to-transparent border-t border-slate-800">
        <div className="px-4">
          <div className="relative flex items-end gap-2 p-2 rounded-2xl bg-[#192233] border border-slate-700 shadow-lg">
            <textarea 
              className="flex-1 max-h-32 bg-transparent border-0 focus:ring-0 text-slate-100 placeholder-slate-400 text-sm py-2 px-1 resize-none overflow-y-auto" 
              placeholder="Describe what you want to share..." 
              rows={1}
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChat(); } }}
            />
            <button onClick={handleChat} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-white shadow-md active:scale-90 transition-all">
              <span className="material-symbols-outlined">arrow_upward</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSidebar = () => {
    if (!isSidebarOpen) return null;
    const views: {id: AppView, icon: string, label: string}[] = [
      { id: 'profile-view', icon: 'person', label: 'Profile Overview' },
      { id: 'ai-optimizer', icon: 'auto_awesome', label: 'AI Enhancer' },
      { id: 'post-generator', icon: 'chat', label: 'Post Generator' }
    ];

    return (
      <div className="fixed inset-0 z-[100] flex">
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
        <div className="relative w-72 bg-background-dark border-r border-slate-800 h-full flex flex-col p-6 animate-slide-in-left">
          <div className="flex items-center gap-3 mb-10">
             <div className="w-12 h-12 rounded-full border-2 border-primary overflow-hidden bg-slate-700">
                <img src={getProfileImage(state.data)} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150'; }} />
             </div>
             <div>
               <h4 className="font-bold text-white leading-tight">{renderSafe(state.data?.fullName || 'User')}</h4>
             </div>
          </div>
          <nav className="flex-1 space-y-1">
            {views.map(v => (
              <button 
                key={v.id}
                onClick={() => { setState(prev => ({ ...prev, view: v.id })); setIsSidebarOpen(false); }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all ${state.view === v.id ? 'bg-primary text-white' : 'text-slate-400 hover:bg-slate-800'}`}
              >
                <span className="material-symbols-outlined">{v.icon}</span>
                <span className="font-semibold text-sm">{v.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto relative min-h-screen overflow-x-hidden">
      {state.view === 'onboarding' && renderOnboarding()}
      {state.view === 'profile-view' && renderProfileView()}
      {state.view === 'ai-optimizer' && renderAIOptimizer()}
      {state.view === 'post-generator' && renderPostGenerator()}
      {renderSidebar()}
    </div>
  );
};

export default App;
