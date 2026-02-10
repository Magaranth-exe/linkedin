
export interface LinkedInProfileData {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  headline?: string;
  about?: string;
  location?: string | any;
  profilePicture?: string | { url: string };
  photo?: string | { url: string };
  displayImage?: string;
  profilePicUrl?: string;
  coverPicture?: string | { url: string };
  backgroundPicture?: string | { url: string };
  followerCount?: number | string;
  connectionsCount?: number | string;
  currentPosition?: string | any;
  openToWork?: boolean;
  hiring?: boolean;
  premium?: boolean;
  verified?: boolean;
  influencer?: boolean;
  id?: string;
  linkedinUrl?: string;
  publicIdentifier?: string;
  objectUrn?: string;
  registeredAt?: string;
  // Handle both singular and plural forms from different scrapers
  experience?: Array<any>;
  experiences?: Array<any>;
  education?: Array<any>;
  skills?: Array<any>;
  topSkills?: Array<any>;
  certifications?: Array<any>;
  projects?: Array<any>;
  publications?: Array<any>;
  patents?: Array<any>;
  honorsAndAwards?: Array<any>;
  languages?: Array<any>;
  volunteering?: Array<any>;
  services?: string[];
  causes?: string[];
  courses?: Array<any>;
  receivedRecommendations?: Array<any>;
  featured?: Array<any>;
  [key: string]: any;
}

export type AppView = 'onboarding' | 'profile-view' | 'ai-optimizer' | 'post-generator' | 'settings';

export interface OptimizedContent {
  headline: string;
  about: string;
  experienceBullets: string[];
}

export interface AnalysisState {
  status: 'idle' | 'scraping' | 'analyzing' | 'success' | 'error';
  message: string;
  view: AppView;
  data?: LinkedInProfileData;
  optimized?: OptimizedContent;
}
