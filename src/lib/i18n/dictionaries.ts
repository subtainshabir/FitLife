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
    delete: string;
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
    assessment: string;
    goals: string;
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
    metric: string;
    imperial: string;
    kg: string;
    lbs: string;
    cm: string;
    ftIn: string;
    kcal: string;
    grams: string;
    days: string;
    weeks: string;
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
    takeAssessmentNow: string;
    setGoalNow: string;
    currentBmi: string;
    bmrValue: string;
    dailyCalories: string;
    activeGoal: string;
    goalProgress: string;
    targetWeight: string;
    noAssessmentData: string;
    noGoalData: string;
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
  assessment: {
    title: string;
    subtitle: string;
    calculatorBadge: string;
    measurementsTitle: string;
    unitSelection: string;
    age: string;
    biologicalSex: string;
    whySexNeeded: string;
    whySexExplanation: string;
    heightCm: string;
    heightFtIn: string;
    weightKg: string;
    weightLbs: string;
    activityLevel: string;
    fitnessExperience: string;
    primaryGoal: string;
    calculateButton: string;
    calculating: string;
    resultsTitle: string;
    bmiTitle: string;
    bmiDisclaimer: string;
    minorScreeningNotice: string;
    bmrTitle: string;
    bmrFormula: string;
    bmrExplanation: string;
    tdeeTitle: string;
    tdeeExplanation: string;
    nutritionTitle: string;
    nutritionDisclaimer: string;
    dailyCalories: string;
    protein: string;
    carbohydrates: string;
    fat: string;
    healthyRange: string;
    historyTitle: string;
    noHistory: string;
    updateNotice: string;
  };
  goalsManagement: {
    title: string;
    subtitle: string;
    activeGoalCard: string;
    noActiveGoal: string;
    setFirstGoal: string;
    createNewGoal: string;
    goalType: string;
    currentWeight: string;
    targetWeight: string;
    desiredRate: string;
    ratePerWeek: string;
    startDate: string;
    targetDate: string;
    estimatedTime: string;
    difference: string;
    status: string;
    inProgress: string;
    completed: string;
    paused: string;
    abandoned: string;
    progressPercentage: string;
    safeRateNotice: string;
    unsafeRateWarning: string;
    underweightWarning: string;
    notes: string;
    notesPlaceholder: string;
    createGoalButton: string;
    updateGoalButton: string;
    deleteGoalConfirm: string;
    weightHistoryTitle: string;
    logNewWeight: string;
    loggedSuccess: string;
    goalCreatedSuccess: string;
    goalUpdatedSuccess: string;
    goalDeletedSuccess: string;
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
      delete: "Delete",
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
      assessment: "Body Assessment",
      goals: "Fitness Goals",
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
      metric: "Metric (kg, cm)",
      imperial: "Imperial (lbs, ft/in)",
      kg: "kg",
      lbs: "lbs",
      cm: "cm",
      ftIn: "ft/in",
      kcal: "kcal/day",
      grams: "g",
      days: "days",
      weeks: "weeks",
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
      badge: "Phase 2 Active: Body Assessment & Goal Engine",
      heroTitle: "Smart Health & Fitness,",
      heroHighlight: "Engineered For You",
      heroSubtitle:
        "FitLife AI is your all-in-one companion for personalized fitness, scientific calculations, and wellness goals. Establish your profile and step into the future of fitness.",
      getStarted: "Get Started Free",
      goToDashboard: "Go to Dashboard",
      feature1Title: "Precision Biometrics",
      feature1Desc: "Deterministic server-side BMI, Mifflin-St Jeor BMR, TDEE, and macro targets calibrated for your unique physiology.",
      feature2Title: "Dual-Language & RTL",
      feature2Desc: "First-class support for English and Urdu with full right-to-left layout compliance.",
      feature3Title: "Safe & Realistic Goals",
      feature3Desc: "Evidence-based goal planning with safeguards against extreme calorie deficits and unsafe weight-loss timelines.",
    },
    onboarding: {
      title: "Calibrate Your Fitness Profile",
      subtitle: "Provide your biometric baseline and lifestyle preferences to personalize your experience.",
      step1Title: "Personal Biometrics",
      step2Title: "Fitness Objective",
      step3Title: "Lifestyle & Gear",
      step4Title: "Diet & Nutrition",
      dob: "Date of Birth",
      gender: "Biological Sex",
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
      activityLevel: "Activity Level",
      availableEquipment: "Available Equipment",
      dietaryPreferences: "Dietary Preferences",
      allergies: "Food Allergies",
      dietaryRestrictions: "Dietary Restrictions",
      completeOnboarding: "Complete & Go to Dashboard",
    },
    dashboard: {
      greeting: "Welcome to FitLife AI Hub",
      subtitle: "Your biometric calibration is active. Explore your deterministic calculations and manage active fitness objectives.",
      profileCompleted: "Profile Calibrated",
      profileIncompleteAlert: "You have not completed your biometric assessment yet.",
      completeProfileNow: "Take Assessment Now",
      profileSummary: "Biometric Summary",
      quickStats: "Baseline Physical Metrics",
      height: "Height",
      weight: "Current Weight",
      goal: "Primary Goal",
      experience: "Experience Level",
      activity: "Activity Factor",
      location: "Location",
      upcomingFeatures: "Future Roadmap (Phase 3+)",
      nutritionDesc: "AI-driven meal planning, recipe scaling, and localized Pakistani and global nutritional targets.",
      workoutsDesc: "Adaptive home and gym resistance routines generated according to your available equipment.",
      progressDesc: "Comprehensive body measurement history, progress charts, and milestone tracking.",
      aiCoachDesc: "24/7 intelligent fitness reasoning companion grounded in clinical exercise science.",
      exploreModule: "Preview Module",
      takeAssessmentNow: "Perform Body Assessment",
      setGoalNow: "Set a Fitness Goal",
      currentBmi: "Body Mass Index (BMI)",
      bmrValue: "Basal Metabolic Rate (BMR)",
      dailyCalories: "Daily Calorie Target",
      activeGoal: "Active Fitness Goal",
      goalProgress: "Goal Progress",
      targetWeight: "Target Weight",
      noAssessmentData: "No assessment recorded yet. Calculate your BMI, BMR, and macro targets now.",
      noGoalData: "No active goal set. Create your target weight and sustainable pace.",
    },
    profile: {
      title: "User Profile & Settings",
      subtitle: "Manage your personal information, fitness objectives, and dietary preferences.",
      personalTab: "Personal Biometrics",
      fitnessTab: "Fitness & Training",
      lifestyleTab: "Nutrition & Lifestyle",
      editProfile: "Edit Profile Details",
      saveChanges: "Save Changes",
      updateSuccess: "Profile updated successfully!",
      accountDetails: "Account Details",
      joined: "Member Since",
    },
    assessment: {
      title: "Body Assessment & Fitness Calculators",
      subtitle: "Deterministic, server-verified metabolic and nutritional calculations tailored to your biometric profile.",
      calculatorBadge: "Evidence-Based & Deterministic",
      measurementsTitle: "Your Biometric Measurements",
      unitSelection: "Measurement Units",
      age: "Age",
      biologicalSex: "Biological Sex",
      whySexNeeded: "Why is biological sex requested?",
      whySexExplanation: "Biological sex is requested strictly because evidence-based physiological formulas (such as Mifflin-St Jeor) account for hormonal and average lean muscle mass differences between sexes. If preferred not to specify, a gender-neutral midpoint average is applied.",
      heightCm: "Height (cm)",
      heightFtIn: "Height (Feet & Inches)",
      weightKg: "Weight (kg)",
      weightLbs: "Weight (lbs)",
      activityLevel: "Daily Activity Level",
      fitnessExperience: "Fitness Experience",
      primaryGoal: "Primary Fitness Goal",
      calculateButton: "Calculate Assessment",
      calculating: "Calculating Biometrics...",
      resultsTitle: "Your Biometric Analysis",
      bmiTitle: "Body Mass Index (BMI)",
      bmiDisclaimer: "Screening Measure: BMI is a screening indicator calculated solely from height and weight. It does not directly quantify body fat percentage or lean muscle mass. Not intended for medical diagnosis.",
      minorScreeningNotice: "Pediatric Notice: Standard adult BMI categories do not apply to minors under 18 years of age. Pediatric growth charts and medical consultation are recommended.",
      bmrTitle: "Basal Metabolic Rate (BMR)",
      bmrFormula: "Calculated via the Mifflin-St Jeor equation",
      bmrExplanation: "Your estimated minimum daily energy requirement at complete rest.",
      tdeeTitle: "Total Daily Energy Expenditure (TDEE)",
      tdeeExplanation: "Your estimated daily maintenance calories taking your active lifestyle into account.",
      nutritionTitle: "Daily Estimated Nutrition Targets",
      nutritionDisclaimer: "Estimated Targets: All nutritional targets are evidence-based mathematical estimates, not medical prescriptions. Consult a registered dietitian for individual clinical needs.",
      dailyCalories: "Target Calories",
      protein: "Protein",
      carbohydrates: "Carbohydrates",
      fat: "Fat",
      healthyRange: "Healthy Weight Range",
      historyTitle: "Past Assessments Log",
      noHistory: "No prior assessments found. Calculate your first assessment above.",
      updateNotice: "You can recalculate and update your physical measurements anytime.",
    },
    goalsManagement: {
      title: "Fitness Goal Management",
      subtitle: "Set safe, sustainable fitness milestones, track weight changes, and visualize your projected timeline.",
      activeGoalCard: "Current Active Fitness Goal",
      noActiveGoal: "No Active Fitness Goal",
      setFirstGoal: "Set Your First Goal",
      createNewGoal: "Configure New Goal",
      goalType: "Primary Goal Type",
      currentWeight: "Current Weight",
      targetWeight: "Target Weight",
      desiredRate: "Weekly Pace / Change Rate",
      ratePerWeek: "per week",
      startDate: "Start Date",
      targetDate: "Projected Completion",
      estimatedTime: "Estimated Duration",
      difference: "Weight Delta",
      status: "Goal Status",
      inProgress: "In Progress",
      completed: "Completed",
      paused: "Paused",
      abandoned: "Abandoned",
      progressPercentage: "Completed",
      safeRateNotice: "Safe Pace Recommendation: Aim for 0.25 to 0.75 kg (0.5 to 1.5 lbs) per week for sustainable fat loss without lean muscle wasting.",
      unsafeRateWarning: "Caution: Rate exceeds 1.0 kg/week (2.2 lbs/week), which increases the risk of metabolic adaptation, nutritional deficiencies, and muscle loss.",
      underweightWarning: "Health Alert: The chosen target weight would result in an underweight BMI (<18.5). Please choose a safe, healthy target weight.",
      notes: "Goal Notes & Intentions",
      notesPlaceholder: "e.g., Target wedding date, preparing for 5K run, lean summer bulk...",
      createGoalButton: "Establish Goal",
      updateGoalButton: "Update Goal",
      deleteGoalConfirm: "Are you sure you want to delete this goal?",
      weightHistoryTitle: "Weight Progression Log",
      logNewWeight: "Log Current Weight",
      loggedSuccess: "Weight logged successfully!",
      goalCreatedSuccess: "Goal established successfully!",
      goalUpdatedSuccess: "Goal updated successfully!",
      goalDeletedSuccess: "Goal removed.",
    },
    goals: {
      weight_gain: "Healthy Weight Gain",
      weight_loss: "Weight Loss",
      muscle_building: "Muscle Building",
      fat_reduction: "Fat Reduction",
      weight_maintenance: "Weight Maintenance",
      body_recomposition: "Body Recomposition",
      strength_improvement: "Strength Improvement",
      endurance: "Endurance & Stamina",
      general_fitness: "General Fitness & Health",
    },
    activityLevels: {
      sedentary: "Sedentary (Little to no exercise, desk job)",
      lightly_active: "Lightly Active (Exercise 1-3 days/week)",
      moderately_active: "Moderately Active (Exercise 3-5 days/week)",
      very_active: "Very Active (Heavy exercise 6-7 days/week)",
      extra_active: "Extra Active (Very heavy exercise or physical job)",
    },
    experiences: {
      beginner: "Beginner (< 1 year)",
      intermediate: "Intermediate (1 - 3 years)",
      advanced: "Advanced (3+ years)",
    },
  },
  ur: {
    common: {
      appName: "فٹ لائف اے آئی",
      tagline: "ذہین فٹنس اور لائف اسٹائل ہم سفر",
      loading: "لوڈ ہو رہا ہے...",
      save: "محفوظ کریں",
      saving: "محفوظ کیا جا رہا ہے...",
      saved: "محفوظ ہو گیا!",
      cancel: "منسوخ کریں",
      edit: "ترمیم کریں",
      delete: "حذف کریں",
      next: "اگلا مرحلہ",
      back: "پیچھے",
      finish: "سیٹ اپ مکمل کریں",
      optional: "اختیاری",
      required: "لازمی",
      comingSoon: "مرحلہ 2 میں فعال",
      signOut: "سائن آؤٹ",
      signIn: "سائن ان",
      signUp: "اکاؤنٹ بنائیں",
      dashboard: "ڈیش بورڈ",
      profile: "پروفائل",
      home: "ہوم",
      assessment: "جسمانی جائزہ",
      goals: "فٹنس اہداف",
      nutrition: "غذائیت",
      workouts: "ورزشیں",
      progress: "پیش رفت",
      aiCoach: "اے آئی کوچ",
      settings: "ترتیبات",
      language: "زبان",
      theme: "تھیم",
      light: "روشن (Light)",
      dark: "تاریک (Dark)",
      system: "سسٹم تھیم",
      english: "English",
      urdu: "اردو",
      error: "کوئی خرابی پیش آئی",
      success: "کامیابی",
      metric: "میٹرک (کلوگرام، سینٹی میٹر)",
      imperial: "امپیرئیل (پاؤنڈ، فٹ/انچ)",
      kg: "کلوگرام",
      lbs: "پاؤنڈ",
      cm: "سینٹی میٹر",
      ftIn: "فٹ/انچ",
      kcal: "کیلوریز یومیہ",
      grams: "گرام",
      days: "دن",
      weeks: "ہفتے",
    },
    auth: {
      welcomeBack: "خوش آمدید",
      loginTitle: "فٹ لائف اے آئی میں سائن ان کریں",
      loginSubtitle: "اپنے صحت کے سفر کو جاری رکھیں",
      registerTitle: "اپنا فٹ لائف اے آئی سفر شروع کریں",
      registerSubtitle: "آغاز کرنے کے لیے اپنا ذاتی اکاؤنٹ بنائیں",
      fullName: "پورا نام",
      fullNamePlaceholder: "مثلاً: علی خان",
      email: "ای میل ایڈریس",
      emailPlaceholder: "ali@example.com",
      password: "پاس ورڈ",
      passwordPlaceholder: "کم از کم 8 حروف، 1 بڑا حرف، 1 عدد",
      confirmPassword: "پاس ورڈ کی تصدیق کریں",
      alreadyHaveAccount: "کیا پہلے سے اکاؤنٹ موجود ہے؟",
      dontHaveAccount: "اکاؤنٹ موجود نہیں ہے؟",
      loginButton: "سائن ان کریں",
      registerButton: "اکاؤنٹ بنائیں",
      loggingIn: "سائن ان ہو رہا ہے...",
      registering: "اکاؤنٹ بنایا جا رہا ہے...",
      showPassword: "پاس ورڈ دکھائیں",
      hidePassword: "پاس ورڈ چھپائیں",
      invalidCredentials: "غلط ای میل یا پاس ورڈ",
      registrationSuccess: "اکاؤنٹ کامیابی سے بن گیا! ترتیب پر بھیجا جا رہا ہے...",
    },
    landing: {
      badge: "مرحلہ 2 فعال: جسمانی تجزیہ اور اہداف کا انجن",
      heroTitle: "ذہین صحت اور فٹنس،",
      heroHighlight: "صرف آپ کے لیے تیار کردہ",
      heroSubtitle:
        "فٹ لائف اے آئی آپ کا ہمہ جہت ساتھی ہے جو سائنسی فارمولوں، غذائی ضروریات اور وزن کے اہداف کے لیے ڈیزائن کیا گیا ہے۔",
      getStarted: "مفت شروع کریں",
      goToDashboard: "ڈیش بورڈ پر جائیں",
      feature1Title: "درست جسمانی تجزیہ",
      feature1Desc: "سرور کی تصدیق شدہ بی ایم آئی، بی ایم آر اور میکروز کی درست تقسیم۔",
      feature2Title: "اردو اور انگریزی کی مکمل حمایت",
      feature2Desc: "دائیں سے بائیں (RTL) کے ساتھ مکمل اردو لے آؤٹ اور درست فونٹس۔",
      feature3Title: "محفوظ اور پائیدار اہداف",
      feature3Desc: "سائنسی طور پر محفوظ اہداف اور خطرناک ڈائیٹ سے تحفظ۔",
    },
    onboarding: {
      title: "اپنی پروفائل مرتب کریں",
      subtitle: "اپنی بنیادی جسمانی معلومات اور لائف اسٹائل کے اہداف فراہم کر کے اپنے تجربے کو بہتر بنائیں۔",
      step1Title: "ذاتی معلومات",
      step2Title: "فٹنس اہداف",
      step3Title: "لائف اسٹائل اور آلات",
      step4Title: "خوراک اور پرہیز",
      dob: "تاریخ پیدائش",
      gender: "حیاتیاتی جنس",
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
      subtitle: "آپ کی سائنسی پیمائش فعال ہے۔ اپنے درست نتائج دیکھیں اور فعال اہداف کا انتظام کریں۔",
      profileCompleted: "پروفائل مکمل ہے",
      profileIncompleteAlert: "آپ نے ابھی تک اپنا جسمانی جائزہ مکمل نہیں کیا ہے۔",
      completeProfileNow: "ابھی جائزہ لیں",
      profileSummary: "جسمانی خلاصہ",
      quickStats: "بنیادی جسمانی پیمائش",
      height: "قد",
      weight: "موجودہ وزن",
      goal: "بنیادی ہدف",
      experience: "تجربے کی سطح",
      activity: "سرگرمی کی سطح",
      location: "مقام",
      upcomingFeatures: "مستقبل کا لائحہ عمل (مرحلہ 3+)",
      nutritionDesc: "اے آئی کیلوری منصوبہ بندی، میکروز تقسیم اور لذیذ و روایتی پاکستانی کھانوں کے منصوبے۔",
      workoutsDesc: "گھریلو اور جم ورزشوں کے شیڈول جو آپ کے سامان کے مطابق تیار کیے گئے ہیں۔",
      progressDesc: "وزن کے چارٹس، جسمانی پیمائش اور بہتری کی تفصیلی نگرانی۔",
      aiCoachDesc: "24/7 انٹرایکٹو فٹنس اور ڈائیٹ کوچ جو جدید اے آئی پر مبنی ہے۔",
      exploreModule: "ماڈیول کا پیش منظر",
      takeAssessmentNow: "جسمانی جائزہ مکمل کریں",
      setGoalNow: "فٹنس ہدف مقرر کریں",
      currentBmi: "باڈی ماس انڈیکس (BMI)",
      bmrValue: "بنیادی میٹابولک ریٹ (BMR)",
      dailyCalories: "یومیہ ہدف کیلوریز",
      activeGoal: "فعال فٹنس ہدف",
      goalProgress: "ہدف کی پیش رفت",
      targetWeight: "ہدف وزن",
      noAssessmentData: "ابھی کوئی جائزہ محفوظ نہیں ہے۔ بی ایم آئی اور بی ایم آر کا حساب لگائیں۔",
      noGoalData: "کوئی فعال ہدف مقرر نہیں ہے۔ پائیدار ہدف اور وزن کا تعین کریں۔",
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
    assessment: {
      title: "جسمانی جائزہ اور فٹنس کیلکولیٹرز",
      subtitle: "سائنسی اور مستند فارمولوں پر مبنی جسمانی اور غذائی ضروریات کا حساب لگائیں۔",
      calculatorBadge: "سائنسی و غیر تبدیل شدہ فارمولے",
      measurementsTitle: "آپ کی جسمانی پیمائش",
      unitSelection: "پیمائش کی اکائی",
      age: "عمر",
      biologicalSex: "حیاتیاتی جنس",
      whySexNeeded: "حیاتیاتی جنس کیوں درکار ہے؟",
      whySexExplanation: "حیاتیاتی جنس کی معلومات صرف اس لیے پوچھی جاتی ہیں کیونکہ سائنسی فارمولے (جیسے مفلن سینٹ جیور) مرد و خواتین کے عضلات اور چربی کے تناسب کے فرق پر مبنی ہوتے ہیں۔ اگر آپ ظاہر نہ کرنا چاہیں تو ایک اوسط صنفی تناسب کا اطلاق کیا جاتا ہے۔",
      heightCm: "قد (سینٹی میٹر)",
      heightFtIn: "قد (فٹ اور انچ)",
      weightKg: "وزن (کلوگرام)",
      weightLbs: "وزن (پاؤنڈ)",
      activityLevel: "روزمرہ سرگرمی کی سطح",
      fitnessExperience: "فٹنس کا تجربہ",
      primaryGoal: "بنیادی فٹنس ہدف",
      calculateButton: "حساب لگائیں اور محفوظ کریں",
      calculating: "حساب لگایا جا رہا ہے...",
      resultsTitle: "آپ کا جسمانی تجزیہ",
      bmiTitle: "باڈی ماس انڈیکس (BMI)",
      bmiDisclaimer: "اسکریننگ نوٹ: بی ایم آئی صرف قد اور وزن سے حاصل کردہ اسکریننگ پیمانہ ہے، یہ جسم کی اندرونی چربی یا عضلات کی اصل صحت کی مکمل پیمائش نہیں ہے۔",
      minorScreeningNotice: "نوعمر افراد کے لیے آگاہی: 18 سال سے کم عمر افراد پر بالغوں کے بی ایم آئی زمرے لاگو نہیں ہوتے۔ پیڈیاٹرک گروتھ چارٹ سے رہنمائی لیں۔",
      bmrTitle: "بنیادی میٹابولک ریٹ (BMR)",
      bmrFormula: "مفلن سینٹ جیور (Mifflin-St Jeor) فارمولے سے حاصل کردہ",
      bmrExplanation: "مکمل آرام کی حالت میں زندہ رہنے کے لیے آپ کے جسم کو درکار کم از کم یومیہ کیلوریز۔",
      tdeeTitle: "کل یومیہ توانائی خرچ (TDEE)",
      tdeeExplanation: "آپ کی روزمرہ ورزش اور سرگرمی کو شامل کر کے موجودہ وزن برقرار رکھنے کی کیلوریز۔",
      nutritionTitle: "تخمینی یومیہ غذائی اہداف",
      nutritionDisclaimer: "تخمینہ: تمام غذائی اہداف سائنسی تخمینے ہیں، کوئی طبی نسخہ نہیں۔ اپنی خاص صحت کے لیے ماہر غذائیت سے رجوع کریں۔",
      dailyCalories: "ہدف کیلوریز",
      protein: "پروٹین",
      carbohydrates: "کاربوہائیڈریٹس",
      fat: "چکنائی (Fat)",
      healthyRange: "صحت مند وزن کی حدود",
      historyTitle: "سابقہ جائزوں کا ریکارڈ",
      noHistory: "کوئی سابقہ ریکارڈ نہیں ملا۔ اوپر نیا حساب لگائیں۔",
      updateNotice: "آپ جب چاہیں اپنی پیمائش تبدیل اور اپ ڈیٹ کر سکتے ہیں۔",
    },
    goalsManagement: {
      title: "فٹنس اہداف کا انتظام",
      subtitle: "محفوظ اور پائیدار اہداف مقرر کریں، وزن کی تبدیلی پر نظر رکھیں اور اپنی پیش رفت دیکھیں۔",
      activeGoalCard: "موجودہ فعال ہدف",
      noActiveGoal: "کوئی فعال ہدف موجود نہیں ہے",
      setFirstGoal: "پہلا ہدف مقرر کریں",
      createNewGoal: "نیا ہدف ترتیب دیں",
      goalType: "ہدف کی قسم",
      currentWeight: "موجودہ وزن",
      targetWeight: "ہدف وزن",
      desiredRate: "ہفتہ وار رفتار",
      ratePerWeek: "فی ہفتہ",
      startDate: "آغاز کی تاریخ",
      targetDate: "تخمینی تکمیل کی تاریخ",
      estimatedTime: "تخمینی دورانیہ",
      difference: "وزن کا فرق",
      status: "ہدف کی حیثیت",
      inProgress: "جاری ہے",
      completed: "مکمل ہو گیا",
      paused: "عارضی روکا گیا",
      abandoned: "چھوڑ دیا گیا",
      progressPercentage: "مکمل",
      safeRateNotice: "محفوظ رفتار کی سفارش: پائیدار نتائج اور عضلات کے تحفظ کے لیے 0.25 سے 0.75 کلوگرام فی ہفتہ وزن کم کرنے کی سفارش کی جاتی ہے۔",
      unsafeRateWarning: "انتباہ: ہفتے میں 1 کلو سے زیادہ وزن کم کرنا غیر محفوظ ہے جس سے کمزوری اور میٹابولزم سست ہونے کا خطرہ ہوتا ہے۔",
      underweightWarning: "صحت کی وارننگ: منتخب کردہ ہدف وزن آپ کو کم وزنی (BMI < 18.5) کے زمرے میں لے جائے گا۔ براہ کرم صحت مند وزن کا انتخاب کریں۔",
      notes: "ہدف کے نوٹس اور تفصیلات",
      notesPlaceholder: "مثلاً: شادی کے لیے فٹنس، 5 کلومیٹر دوڑ کی تیاری، یا عضلات کا اضافہ...",
      createGoalButton: "ہدف محفوظ کریں",
      updateGoalButton: "ہدف میں ترمیم کریں",
      deleteGoalConfirm: "کیا آپ واقعی اس ہدف کو حذف کرنا چاہتے ہیں؟",
      weightHistoryTitle: "وزن کی تاریخ اور پیش رفت",
      logNewWeight: "نیا وزن درج کریں",
      loggedSuccess: "وزن کا اندراج ہو گیا!",
      goalCreatedSuccess: "ہدف کامیابی سے مقرر ہو گیا!",
      goalUpdatedSuccess: "ہدف کامیابی سے اپ ڈیٹ ہو گیا!",
      goalDeletedSuccess: "ہدف حذف کر دیا گیا۔",
    },
    goals: {
      weight_gain: "صحت مند وزن میں اضافہ (Healthy Weight Gain)",
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
