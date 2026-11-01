export type Language = "en" | "ur";

export interface Dictionary {
  common: {
    appName: string;
    tagline: string;
    loading: string;
    save: string;
    saving: string;
    saved: string;
    cancel: string;
    edit: string;
    next: string;
    back: string;
    finish: string;
    optional: string;
    required: string;
    comingSoon: string;
    signOut: string;
    signIn: string;
    signUp: string;
    dashboard: string;
    profile: string;
    home: string;
    nutrition: string;
    workouts: string;
    progress: string;
    aiCoach: string;
    settings: string;
    language: string;
    theme: string;
    light: string;
    dark: string;
    system: string;
    english: string;
    urdu: string;
    error: string;
    success: string;
  };
  auth: {
    welcomeBack: string;
    loginTitle: string;
    loginSubtitle: string;
    registerTitle: string;
    registerSubtitle: string;
    fullName: string;
    fullNamePlaceholder: string;
    email: string;
    emailPlaceholder: string;
    password: string;
    passwordPlaceholder: string;
    confirmPassword: string;
    alreadyHaveAccount: string;
    dontHaveAccount: string;
    loginButton: string;
    registerButton: string;
    loggingIn: string;
    registering: string;
    showPassword: string;
    hidePassword: string;
    invalidCredentials: string;
    registrationSuccess: string;
  };
  landing: {
    heroTitle: string;
    heroHighlight: string;
    heroSubtitle: string;
    getStarted: string;
    goToDashboard: string;
    feature1Title: string;
    feature1Desc: string;
    feature2Title: string;
    feature2Desc: string;
    feature3Title: string;
    feature3Desc: string;
    badge: string;
  };
  onboarding: {
    title: string;
    subtitle: string;
    step1Title: string;
    step2Title: string;
    step3Title: string;
    step4Title: string;
    dob: string;
    gender: string;
    male: string;
    female: string;
    other: string;
    preferNotToSay: string;
    height: string;
    heightUnit: string;
    weight: string;
    weightUnit: string;
    country: string;
    city: string;
    currency: string;
    fitnessGoal: string;
    fitnessExperience: string;
    activityLevel: string;
    availableEquipment: string;
    dietaryPreferences: string;
    allergies: string;
    dietaryRestrictions: string;
    completeOnboarding: string;
  };
  dashboard: {
    greeting: string;
    subtitle: string;
    profileCompleted: string;
    profileIncompleteAlert: string;
    completeProfileNow: string;
    profileSummary: string;
    quickStats: string;
    height: string;
    weight: string;
    goal: string;
    experience: string;
    activity: string;
    location: string;
    upcomingFeatures: string;
    nutritionDesc: string;
    workoutsDesc: string;
    progressDesc: string;
    aiCoachDesc: string;
    exploreModule: string;
  };
  profile: {
    title: string;
    subtitle: string;
    personalTab: string;
    fitnessTab: string;
    lifestyleTab: string;
    editProfile: string;
    saveChanges: string;
    updateSuccess: string;
    accountDetails: string;
    joined: string;
  };
  goals: Record<string, string>;
  activityLevels: Record<string, string>;
  experiences: Record<string, string>;
}

export const dictionaries: Record<Language, Dictionary> = {
  en: {
    common: {
      appName: "FitLife AI",
      tagline: "Intelligent Fitness & Lifestyle Companion",
      loading: "Loading...",
      save: "Save",
      saving: "Saving...",
      saved: "Saved!",
      cancel: "Cancel",
      edit: "Edit",
      next: "Next Step",
      back: "Back",
      finish: "Finish Setup",
      optional: "Optional",
      required: "Required",
      comingSoon: "Coming Soon in Phase 2",
      signOut: "Sign Out",
      signIn: "Sign In",
      signUp: "Create Account",
      dashboard: "Dashboard",
      profile: "Profile",
      home: "Home",
      nutrition: "Nutrition",
      workouts: "Workouts",
      progress: "Progress",
      aiCoach: "AI Coach",
      settings: "Settings",
      language: "Language",
      theme: "Theme",
      light: "Light",
      dark: "Dark",
      system: "System",
      english: "English",
      urdu: "اردو (Urdu)",
      error: "An error occurred",
      success: "Success",
    },
    auth: {
      welcomeBack: "Welcome back",
      loginTitle: "Sign in to FitLife AI",
      loginSubtitle: "Continue your health and wellness journey",
      registerTitle: "Start your FitLife AI Journey",
      registerSubtitle: "Create your personal account to begin",
      fullName: "Full Name",
      fullNamePlaceholder: "e.g. Alex Morgan",
      email: "Email Address",
      emailPlaceholder: "alex@example.com",
      password: "Password",
      passwordPlaceholder: "Minimum 8 chars, 1 uppercase, 1 number",
      confirmPassword: "Confirm Password",
      alreadyHaveAccount: "Already have an account?",
      dontHaveAccount: "Don't have an account?",
      loginButton: "Sign In",
      registerButton: "Create Account",
      loggingIn: "Signing in...",
      registering: "Creating account...",
      showPassword: "Show password",
      hidePassword: "Hide password",
      invalidCredentials: "Invalid email or password",
      registrationSuccess: "Account created successfully! Redirecting to setup...",
    },
    landing: {
      badge: "Phase 1: Foundation & Profile",
      heroTitle: "Smart Health & Fitness,",
      heroHighlight: "Engineered For You",
      heroSubtitle:
        "FitLife AI is your all-in-one companion for personalized fitness, nutrition tracking, and wellness goals. Establish your profile and step into the future of fitness.",
      getStarted: "Get Started Free",
      goToDashboard: "Go to Dashboard",
      feature1Title: "Precision Profiles",
      feature1Desc: "Tailor your fitness experience with comprehensive health goals, equipment availability, and dietary preferences.",
      feature2Title: "Dual-Language & RTL",
      feature2Desc: "First-class support for English and Urdu with full right-to-left layout compliance.",
      feature3Title: "Secure Foundation",
      feature3Desc: "Enterprise-grade database schema, encrypted credentials, and privacy-first user management.",
    },
    onboarding: {
      title: "Set Up Your Profile",
      subtitle: "Help us calibrate your FitLife AI experience by providing your basic physical profile and lifestyle goals.",
      step1Title: "Personal Details",
      step2Title: "Fitness Goals",
      step3Title: "Lifestyle & Equipment",
      step4Title: "Diet & Preferences",
      dob: "Date of Birth",
      gender: "Gender",
      male: "Male",
      female: "Female",
      other: "Other",
      preferNotToSay: "Prefer not to say",
      height: "Height (cm)",
      heightUnit: "cm",
      weight: "Current Weight (kg)",
      weightUnit: "kg",
      country: "Country",
      city: "City",
      currency: "Preferred Currency",
      fitnessGoal: "Primary Fitness Goal",
      fitnessExperience: "Fitness Experience",
      activityLevel: "Daily Activity Level",
      availableEquipment: "Available Equipment",
      dietaryPreferences: "Dietary Preferences",
      allergies: "Food Allergies",
      dietaryRestrictions: "Dietary Restrictions",
      completeOnboarding: "Save & Enter Dashboard",
    },
    dashboard: {
      greeting: "Welcome to your FitLife AI Hub",
      subtitle: "Your personal fitness foundation is ready. Track your profile and prepare for advanced features.",
      profileCompleted: "Profile Established",
      profileIncompleteAlert: "You have not completed your fitness profile yet.",
      completeProfileNow: "Complete Profile Now",
      profileSummary: "Profile Snapshot",
      quickStats: "Baseline Physical Metrics",
      height: "Height",
      weight: "Current Weight",
      goal: "Primary Goal",
      experience: "Experience Level",
      activity: "Activity Level",
      location: "Location",
      upcomingFeatures: "Upcoming Modules (Phase 2+)",
      nutritionDesc: "AI-guided calorie planning, macro splits, and smart Pakistani & global meal plans.",
      workoutsDesc: "Custom hypertrophy, endurance, and home workout routines tailored to your equipment.",
      progressDesc: "Weight tracking, body measurement charts, and progressive overload history.",
      aiCoachDesc: "Interactive 24/7 AI fitness and nutrition coach powered by advanced reasoning.",
      exploreModule: "Preview Module",
    },
    profile: {
      title: "User Profile & Settings",
      subtitle: "Manage your personal attributes, fitness objectives, and dietary preferences.",
      personalTab: "Personal Information",
      fitnessTab: "Fitness & Training",
      lifestyleTab: "Nutrition & Diet",
      editProfile: "Edit Information",
      saveChanges: "Save Changes",
      updateSuccess: "Profile updated successfully!",
      accountDetails: "Account Details",
      joined: "Joined",
    },
    goals: {
      weight_gain: "Weight Gain",
      weight_loss: "Weight Loss",
      muscle_building: "Muscle Building",
      fat_reduction: "Fat Reduction",
      weight_maintenance: "Weight Maintenance",
      body_recomposition: "Body Recomposition",
      strength_improvement: "Strength Improvement",
      endurance: "Endurance",
      general_fitness: "General Fitness",
    },
    activityLevels: {
      sedentary: "Sedentary (Little or no exercise)",
      lightly_active: "Lightly Active (1-3 days/week)",
      moderately_active: "Moderately Active (3-5 days/week)",
      very_active: "Very Active (6-7 days/week)",
      extra_active: "Extremely Active (Physical job or 2x training)",
    },
    experiences: {
      beginner: "Beginner (< 1 year)",
      intermediate: "Intermediate (1-3 years)",
      advanced: "Advanced (3+ years)",
    },
  },
  ur: {
    common: {
      appName: "فٹ لائف اے آئی",
      tagline: "ذہین فٹنس اور لائف اسٹائل کا ساتھی",
      loading: "لوڈ ہو رہا ہے...",
      save: "محفوظ کریں",
      saving: "محفوظ ہو رہا ہے...",
      saved: "محفوظ ہو گیا!",
      cancel: "منسوخ کریں",
      edit: "ترمیم کریں",
      next: "اگلا مرحلہ",
      back: "پیچھے",
      finish: "سیٹ اپ مکمل کریں",
      optional: "اختیاری",
      required: "لازمی",
      comingSoon: "مرحلہ 2 میں جلد دستیاب ہوگا",
      signOut: "لاگ آؤٹ",
      signIn: "لاگ ان",
      signUp: "اکاؤنٹ بنائیں",
      dashboard: "ڈیش بورڈ",
      profile: "پروفائل",
      home: "ہوم",
      nutrition: "غذائیت",
      workouts: "ورزشیں",
      progress: "پیش رفت",
      aiCoach: "اے آئی کوچ",
      settings: "ترتیبات",
      language: "زبان",
      theme: "تھیم",
      light: "روشن",
      dark: "تاریک",
      system: "سسٹم",
      english: "English",
      urdu: "اردو (Urdu)",
      error: "ایک خرابی پیش آگئی",
      success: "کامیابی",
    },
    auth: {
      welcomeBack: "خوش آمدید",
      loginTitle: "فٹ لائف اے آئی میں لاگ ان کریں",
      loginSubtitle: "اپنے صحت اور فٹنس کے سفر کو جاری رکھیں",
      registerTitle: "اپنا فٹ لائف سفر شروع کریں",
      registerSubtitle: "آغاز کرنے کے لیے اپنا ذاتی اکاؤنٹ بنائیں",
      fullName: "پورا نام",
      fullNamePlaceholder: "مثلاً علی خان",
      email: "ای میل ایڈریس",
      emailPlaceholder: "ali@example.com",
      password: "پاس ورڈ",
      passwordPlaceholder: "کم از کم 8 حروف، 1 بڑا حرف، 1 عدد",
      confirmPassword: "پاس ورڈ کی تصدیق کریں",
      alreadyHaveAccount: "کیا پہلے سے اکاؤنٹ موجود ہے؟",
      dontHaveAccount: "کیا آپ کا اکاؤنٹ نہیں ہے؟",
      loginButton: "لاگ ان کریں",
      registerButton: "اکاؤنٹ بنائیں",
      loggingIn: "لاگ ان ہو رہا ہے...",
      registering: "اکاؤنٹ بن رہا ہے...",
      showPassword: "پاس ورڈ دکھائیں",
      hidePassword: "پاس ورڈ چھپائیں",
      invalidCredentials: "غلط ای میل یا پاس ورڈ",
      registrationSuccess: "اکاؤنٹ کامیابی سے بن گیا! سیٹ اپ پر منتقل کیا جا رہا ہے...",
    },
    landing: {
      badge: "مرحلہ 1: بنیادی ڈھانچہ اور صارف پروفائل",
      heroTitle: "ذہین صحت اور فٹنس،",
      heroHighlight: "خاص آپ کے لیے تیار کردہ",
      heroSubtitle:
        "فٹ لائف اے آئی ذاتی نوعیت کی فٹنس، غذائیت کی نگرانی اور صحت کے اہداف کے لیے آپ کا ہمہ جہت ساتھی ہے۔ اپنی پروفائل قائم کریں اور فٹنس کے مستقبل میں قدم رکھیں۔",
      getStarted: "مفت آغاز کریں",
      goToDashboard: "ڈیش بورڈ پر جائیں",
      feature1Title: "جامع پروفائل",
      feature1Desc: "صحت کے اہداف، دستیاب آلات اور غذائی ترجیحات کے ساتھ اپنے فٹنس کے تجربے کو سنواریں۔",
      feature2Title: "دو لسانی اور دائیں سے بائیں (RTL)",
      feature2Desc: "اردو اور انگریزی کی مکمل حمایت مع دائیں سے بائیں درست لے آؤٹ اور فونٹ۔",
      feature3Title: "محفوظ بنیاد",
      feature3Desc: "محفوظ ڈیٹا بیس اسٹرکچر، خفیہ کردہ ڈیٹا اور صارف کی مکمل رازداری۔",
    },
    onboarding: {
      title: "اپنی پروفائل مرتب کریں",
      subtitle: "اپنی بنیادی جسمانی معلومات اور لائف اسٹائل کے اہداف فراہم کر کے اپنے تجربے کو بہتر بنائیں۔",
      step1Title: "ذاتی معلومات",
      step2Title: "فٹنس اہداف",
      step3Title: "لائف اسٹائل اور آلات",
      step4Title: "خوراک اور پرہیز",
      dob: "تاریخ پیدائش",
      gender: "جنس",
      male: "مرد",
      female: "خاتون",
      other: "دیگر",
      preferNotToSay: "ظاہر نہ کریں",
      height: "قد (سینٹی میٹر)",
      heightUnit: "سینٹی میٹر",
      weight: "موجودہ وزن (کلوگرام)",
      weightUnit: "کلوگرام",
      country: "ملک",
      city: "شہر",
      currency: "پسندیدہ کرنسی",
      fitnessGoal: "بنیادی فٹنس ہدف",
      fitnessExperience: "فٹنس کا تجربہ",
      activityLevel: "روزمرہ سرگرمی کی سطح",
      availableEquipment: "دستیاب ورزشی سامان",
      dietaryPreferences: "غذائی ترجیحات",
      allergies: "کھانے کی الرجی",
      dietaryRestrictions: "غذائی پابندیاں",
      completeOnboarding: "محفوظ کریں اور ڈیش بورڈ پر جائیں",
    },
    dashboard: {
      greeting: "فٹ لائف اے آئی ہب میں خوش آمدید",
      subtitle: "آپ کی ذاتی فٹنس پروفائل تیار ہے۔ اپنی تفصیلات دیکھیں اور جدید فیچرز کے لیے تیار رہیں۔",
      profileCompleted: "پروفائل مکمل ہے",
      profileIncompleteAlert: "آپ نے ابھی تک اپنی فٹنس پروفائل مکمل نہیں کی ہے۔",
      completeProfileNow: "ابھی پروفائل مکمل کریں",
      profileSummary: "پروفائل کا خلاصہ",
      quickStats: "بنیادی جسمانی پیمائش",
      height: "قد",
      weight: "موجودہ وزن",
      goal: "بنیادی ہدف",
      experience: "تجربے کی سطح",
      activity: "سرگرمی کی سطح",
      location: "مقام",
      upcomingFeatures: "آنے والے فیچرز (مرحلہ 2+)",
      nutritionDesc: "اے آئی کیلوری منصوبہ بندی، میکروز تقسیم اور لذیذ و روایتی پاکستانی کھانوں کے منصوبے۔",
      workoutsDesc: "گھریلو اور جم ورزشوں کے شیڈول جو آپ کے سامان کے مطابق تیار کیے گئے ہیں۔",
      progressDesc: "وزن کے چارٹس، جسمانی پیمائش اور بہتری کی تفصیلی نگرانی۔",
      aiCoachDesc: "24/7 انٹرایکٹو فٹنس اور ڈائیٹ کوچ جو جدید اے آئی پر مبنی ہے۔",
      exploreModule: "ماڈیول کا پیش منظر",
    },
    profile: {
      title: "صارف پروفائل اور ترتیبات",
      subtitle: "اپنی ذاتی معلومات، فٹنس اہداف اور غذائی ترجیحات کا انتظام کریں۔",
      personalTab: "ذاتی معلومات",
      fitnessTab: "فٹنس اور ٹریننگ",
      lifestyleTab: "غذائیت اور خوراک",
      editProfile: "معلومات میں ترمیم کریں",
      saveChanges: "تبدیلیاں محفوظ کریں",
      updateSuccess: "پروفائل کامیابی سے اپ ڈیٹ ہو گئی!",
      accountDetails: "اکاؤنٹ کی تفصیلات",
      joined: "شامل ہونے کی تاریخ",
    },
    goals: {
      weight_gain: "وزن میں اضافہ (Weight Gain)",
      weight_loss: "وزن میں کمی (Weight Loss)",
      muscle_building: "عضلات کی تعمیر (Muscle Building)",
      fat_reduction: "چربی میں کمی (Fat Reduction)",
      weight_maintenance: "وزن برقرار رکھنا (Weight Maintenance)",
      body_recomposition: "جسمانی ساخت کی بہتری (Body Recomposition)",
      strength_improvement: "طاقت میں اضافہ (Strength Improvement)",
      endurance: "برداشت اور اسٹیمینا (Endurance)",
      general_fitness: "عام فٹنس اور صحت (General Fitness)",
    },
    activityLevels: {
      sedentary: "ساکت (ورزش نہ ہونے کے برابر)",
      lightly_active: "ہلکی سرگرمی (ہفتے میں 1-3 دن ورزش)",
      moderately_active: "معتدل سرگرمی (ہفتے میں 3-5 دن ورزش)",
      very_active: "بہت فعال (ہفتے میں 6-7 دن سخت ورزش)",
      extra_active: "انتہائی فعال (مشقت والا کام یا دن میں 2 بار ورزش)",
    },
    experiences: {
      beginner: "ابتدائی (ایک سال سے کم)",
      intermediate: "درمیانہ (1 سے 3 سال)",
      advanced: "ماہر (3 سال سے زیادہ)",
    },
  },
};

