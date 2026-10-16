// Realistic SVG fundus generator for Drishti Patient Portal
export function generateFundusSvg(type = 'normal') {
  const isMildDR = type === 'mild';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
    <defs>
      <radialGradient id="retinaBg" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#b85d19" />
        <stop offset="45%" stop-color="#8a360a" />
        <stop offset="85%" stop-color="#541b02" />
        <stop offset="100%" stop-color="#240a01" />
      </radialGradient>
      <radialGradient id="opticDisc" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#fff2c2" />
        <stop offset="70%" stop-color="#f5ce75" />
        <stop offset="100%" stop-color="#d49b39" />
      </radialGradient>
      <radialGradient id="fovea" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#3b1102" stop-opacity="0.9" />
        <stop offset="70%" stop-color="#591c05" stop-opacity="0.4" />
        <stop offset="100%" stop-color="#591c05" stop-opacity="0" />
      </radialGradient>
      <filter id="blurFilter" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2" />
      </filter>
    </defs>
    <!-- Dark Eye Rim -->
    <circle cx="250" cy="250" r="248" fill="#110501" stroke="#220b02" stroke-width="3"/>
    <!-- Retinal Orange Glow -->
    <circle cx="250" cy="250" r="240" fill="url(#retinaBg)"/>
    
    <!-- Optic Disc (Nasal side) -->
    <circle cx="310" cy="250" r="32" fill="url(#opticDisc)"/>
    <circle cx="310" cy="250" r="22" fill="#fff7d6" opacity="0.85"/>
    <circle cx="308" cy="250" r="10" fill="#ffffff" opacity="0.6"/>

    <!-- Macula / Fovea (Temporal center) -->
    <circle cx="195" cy="250" r="26" fill="url(#fovea)"/>
    <circle cx="195" cy="250" r="7" fill="#2b0a00" opacity="0.85"/>

    <!-- Retinal Blood Vessels (Arcades) -->
    <!-- Superior Temporal Arcade -->
    <path d="M 310 240 Q 280 180 200 160 T 110 180" fill="none" stroke="#7e1700" stroke-width="5" stroke-linecap="round" opacity="0.85" filter="url(#blurFilter)"/>
    <path d="M 310 240 Q 280 180 200 160 T 110 180" fill="none" stroke="#ba2202" stroke-width="3" stroke-linecap="round" opacity="0.9"/>
    <!-- Inferior Temporal Arcade -->
    <path d="M 310 260 Q 280 320 200 340 T 110 320" fill="none" stroke="#7e1700" stroke-width="5" stroke-linecap="round" opacity="0.85" filter="url(#blurFilter)"/>
    <path d="M 310 260 Q 280 320 200 340 T 110 320" fill="none" stroke="#ba2202" stroke-width="3" stroke-linecap="round" opacity="0.9"/>
    <!-- Nasal Arterioles -->
    <path d="M 315 235 Q 360 190 410 180" fill="none" stroke="#ba2202" stroke-width="3" stroke-linecap="round" opacity="0.85"/>
    <path d="M 315 265 Q 360 310 410 320" fill="none" stroke="#ba2202" stroke-width="3" stroke-linecap="round" opacity="0.85"/>
    <!-- Smaller Branches -->
    <path d="M 240 168 Q 230 130 190 100" fill="none" stroke="#b31e00" stroke-width="2" opacity="0.75"/>
    <path d="M 235 332 Q 220 370 170 390" fill="none" stroke="#b31e00" stroke-width="2" opacity="0.75"/>
    <path d="M 180 165 Q 160 200 140 220" fill="none" stroke="#b31e00" stroke-width="1.8" opacity="0.7"/>
    <path d="M 175 335 Q 150 290 130 270" fill="none" stroke="#b31e00" stroke-width="1.8" opacity="0.7"/>

    ${isMildDR ? `
    <!-- Microaneurysms / Mild DR Indicators -->
    <circle cx="160" cy="190" r="3.5" fill="#e60000" opacity="0.95"/>
    <circle cx="152" cy="198" r="2.5" fill="#ff1a1a" opacity="0.9"/>
    <circle cx="170" cy="290" r="3" fill="#e60000" opacity="0.9"/>
    <circle cx="140" cy="305" r="3.5" fill="#cc0000" opacity="0.9"/>
    <circle cx="230" cy="210" r="2" fill="#ff2200" opacity="0.85"/>
    <circle cx="130" cy="215" r="2.5" fill="#ff2200" opacity="0.85"/>
    ` : ''}

    <!-- Watermark / Scan Grid overlay -->
    <circle cx="250" cy="250" r="230" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1" stroke-dasharray="4 6"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

// Heatmap / Explainability overlay (Patient friendly "AI-highlighted areas")
export function generateHeatmapSvg(type = 'mild') {
  const isMildDR = type === 'mild';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
    <defs>
      <radialGradient id="heatPrimary" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ff0000" stop-opacity="0.85" />
        <stop offset="40%" stop-color="#ff5500" stop-opacity="0.65" />
        <stop offset="75%" stop-color="#ffbb00" stop-opacity="0.35" />
        <stop offset="100%" stop-color="#00ff88" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="heatSecondary" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#ff3300" stop-opacity="0.75" />
        <stop offset="50%" stop-color="#ff9900" stop-opacity="0.45" />
        <stop offset="100%" stop-color="#ffff00" stop-opacity="0" />
      </radialGradient>
      <radialGradient id="heatNormal" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#059669" stop-opacity="0.4" />
        <stop offset="60%" stop-color="#10b981" stop-opacity="0.2" />
        <stop offset="100%" stop-color="#10b981" stop-opacity="0" />
      </radialGradient>
    </defs>
    <!-- Semi-transparent overlay mask -->
    <circle cx="250" cy="250" r="240" fill="rgba(0, 0, 0, 0.25)"/>

    ${isMildDR ? `
    <!-- Highlighted microaneurysm zones in temporal arcade -->
    <ellipse cx="155" cy="195" rx="55" ry="40" fill="url(#heatPrimary)" transform="rotate(-15 155 195)"/>
    <ellipse cx="150" cy="300" rx="48" ry="35" fill="url(#heatSecondary)" transform="rotate(20 150 300)"/>
    <ellipse cx="230" cy="210" rx="30" ry="25" fill="url(#heatSecondary)"/>
    ` : `
    <!-- Uniform healthy pattern with faint green confirmation zones -->
    <circle cx="195" cy="250" r="80" fill="url(#heatNormal)"/>
    <circle cx="310" cy="250" r="70" fill="url(#heatNormal)"/>
    `}
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const INITIAL_PATIENT_PROFILE = {
  id: 'DR-PAT-2026-0042',
  firstName: 'Aryan',
  lastName: 'Mehta',
  fullName: 'Aryan Mehta',
  email: 'aryan.mehta@example.com',
  phone: '+91 98765 43210',
  dob: '1982-05-14',
  age: 44,
  gender: 'Male',
  bloodGroup: 'B+',
  diabetesStatus: 'Diagnosed',
  hasDiabetes: 'Yes',
  diabetesType: 'Type 2 Diabetes',
  diabetesDuration: '4 Years',
  village: 'Shivajinagar',
  district: 'Pune',
  state: 'Maharashtra',
  lastHbA1c: '6.8% (Normal target)',
  emergencyContact: '+91 98220 11223 (Pooja Mehta - Spouse)',
};

export const INITIAL_SCREENINGS = [
  {
    id: 'DR-004',
    date: '12 Sep 2026',
    time: '10:45 AM',
    eye: 'Both Eyes',
    result: 'No DR Detected',
    severity: 'No DR',
    severityLevel: 0,
    status: 'Completed',
    confidence: '94%',
    confidenceNum: 94,
    requiresFollowUp: false,
    followUpStatusText: 'No follow-up required at this time.',
    doctorName: 'Dr. Shalini Sharma (MBBS, MS Ophthalmology)',
    facility: 'Apollo Eye Institute, Pune',
    doctorReviewStatus: 'Reviewed & Verified',
    fundusImage: generateFundusSvg('normal'),
    heatmapImage: generateHeatmapSvg('normal'),
    findingsSummary: 'Healthy retina with clear foveal reflex and intact vasculature.',
    clinicalGuidance: 'Your retinal scan shows healthy blood vessels with no signs of microaneurysms, hemorrhages, or swelling. Routine annual screening is recommended in 12 months.',
    highlightedDescription: 'Drishti AI verified clear retinal vascular architecture without abnormal lesions.',
  },
  {
    id: 'DR-003',
    date: '04 Aug 2026',
    time: '03:15 PM',
    eye: 'Right Eye',
    result: 'Mild DR Detected',
    severity: 'Mild DR',
    severityLevel: 1,
    status: 'Completed',
    confidence: '91%',
    confidenceNum: 91,
    requiresFollowUp: true,
    followUpStatusText: 'Doctor review recommended',
    doctorName: 'Dr. Arvind Rao (Senior Vitreo-Retinal Surgeon)',
    facility: 'Pune Regional Eye Care Center',
    doctorReviewStatus: 'Doctor Review Recommended',
    fundusImage: generateFundusSvg('mild'),
    heatmapImage: generateHeatmapSvg('mild'),
    findingsSummary: 'Isolated microaneurysms noted in the upper temporal quadrant.',
    clinicalGuidance: 'Early microvascular changes detected in the right eye. We advise scheduling an in-person eye exam within 3 months to monitor retinal health.',
    highlightedDescription: 'AI highlighted small clustered microvascular stress areas in the temporal quadrant.',
  },
  {
    id: 'DR-002',
    date: '15 Feb 2026',
    time: '11:00 AM',
    eye: 'Both Eyes',
    result: 'No DR Detected',
    severity: 'No DR',
    severityLevel: 0,
    status: 'Completed',
    confidence: '96%',
    confidenceNum: 96,
    requiresFollowUp: false,
    followUpStatusText: 'No follow-up required at this time.',
    doctorName: 'Dr. Shalini Sharma (MBBS, MS Ophthalmology)',
    facility: 'Apollo Eye Institute, Pune',
    doctorReviewStatus: 'Reviewed & Verified',
    fundusImage: generateFundusSvg('normal'),
    heatmapImage: generateHeatmapSvg('normal'),
    findingsSummary: 'Clear optic cup and intact macular region without diabetic changes.',
    clinicalGuidance: 'No retinopathy detected. Blood pressure and blood glucose maintenance recommended.',
    highlightedDescription: 'AI confirmed regular retinal structure with no markers of retinal damage.',
  },
  {
    id: 'DR-001',
    date: '20 Oct 2025',
    time: '09:30 AM',
    eye: 'Left Eye',
    result: 'No DR Detected',
    severity: 'No DR',
    severityLevel: 0,
    status: 'Completed',
    confidence: '95%',
    confidenceNum: 95,
    requiresFollowUp: false,
    followUpStatusText: 'No follow-up required at this time.',
    doctorName: 'Dr. Arvind Rao (Senior Vitreo-Retinal Surgeon)',
    facility: 'Pune Regional Eye Care Center',
    doctorReviewStatus: 'Baseline Recorded',
    fundusImage: generateFundusSvg('normal'),
    heatmapImage: generateHeatmapSvg('normal'),
    findingsSummary: 'Baseline retinal screening completed successfully.',
    clinicalGuidance: 'Baseline scan established healthy retinal status.',
    highlightedDescription: 'Clear retinal vessels and healthy disc parameters.',
  },
];

export const INITIAL_APPOINTMENTS = [
  {
    id: 'APT-108',
    doctor: 'Dr. Shalini Sharma',
    role: 'Retina & Diabetic Eye Specialist',
    facility: 'Apollo Eye Institute, Shivajinagar, Pune',
    date: '24 Oct 2026',
    time: '10:30 AM',
    status: 'Confirmed',
    purpose: 'Routine Retinal Health & Dilation Exam',
    room: 'Room 304, Eye OPD',
    contact: '+91 20 6602 1000',
  },
  {
    id: 'APT-092',
    doctor: 'Dr. Arvind Rao',
    role: 'Senior Ophthalmologist',
    facility: 'Pune Regional Eye Care Center',
    date: '10 Aug 2026',
    time: '02:00 PM',
    status: 'Completed',
    purpose: 'Mild DR Verification & Glycemic Counseling',
    room: 'Room 102',
    contact: '+91 20 2553 4400',
  },
];

export const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif-1',
    title: 'Screening Result Ready',
    message: 'Your AI retinal screening report #DR-004 is ready and verified.',
    type: 'result',
    time: '2 hours ago',
    read: false,
    date: '12 Sep 2026',
  },
  {
    id: 'notif-2',
    title: 'Doctor Review Recommended',
    message: 'Your screening #DR-003 shows mild microvascular indicators. Consider scheduling a checkup.',
    type: 'alert',
    time: 'Yesterday',
    read: false,
    date: '11 Sep 2026',
  },
  {
    id: 'notif-3',
    title: 'Follow-up Reminder',
    message: 'Upcoming retina consultation on 24 Oct 2026 at Apollo Eye Institute.',
    type: 'reminder',
    time: '3 days ago',
    read: true,
    date: '09 Sep 2026',
  },
  {
    id: 'notif-4',
    title: 'Eye Care Health Tip',
    message: 'Drinking water and maintaining steady HbA1c helps preserve small retinal blood vessels.',
    type: 'info',
    time: '1 week ago',
    read: true,
    date: '05 Sep 2026',
  },
];

export const EDUCATION_ARTICLES = [
  {
    id: 'dr-basics',
    title: 'What is Diabetic Retinopathy?',
    subtitle: 'Understand how diabetes affects delicate retinal vessels',
    badge: 'Basics',
    readTime: '3 min read',
    icon: 'eye',
    summary: 'Diabetic retinopathy is an eye condition caused by prolonged high blood sugar levels damaging the tiny blood vessels in the retina at the back of your eye.',
    details: [
      'In early stages (Non-Proliferative), tiny blood vessels can develop microaneurysms or leak small drops of blood.',
      'In advanced stages (Proliferative), fragile new vessels grow that can bleed easily or cloud your vision.',
      'Early detection through AI retinal screening allows timely intervention long before vision loss occurs.',
    ],
    tips: [
      'Early retinopathy often has zero pain and zero visual symptoms.',
      'Yearly retinal scans can catch changes up to 5 years before noticeable vision changes.',
    ]
  },
  {
    id: 'importance',
    title: 'Why Regular Eye Screening Matters',
    subtitle: 'Catching subtle changes before they affect everyday vision',
    badge: 'Prevention',
    readTime: '2 min read',
    icon: 'activity',
    summary: '90% of severe vision loss from diabetic retinopathy can be prevented with regular yearly screenings and timely care.',
    details: [
      'Diabetic retinopathy typically develops silently without pain or blurriness in the initial years.',
      'High blood sugar weakens the microscopic capillary walls over time.',
      'A quick 2-minute retinal screening photo gives doctors an objective baseline of your eye health.',
    ],
    tips: [
      'Schedule a screening at least once every 12 months if you have Type 1 or Type 2 diabetes.',
      'Do not wait until vision becomes blurry to get screened.',
    ]
  },
  {
    id: 'preparation',
    title: 'How to Prepare for Retinal Screening',
    subtitle: 'Simple steps for capturing the clearest possible retinal image',
    badge: 'Guide',
    readTime: '2 min read',
    icon: 'camera',
    summary: 'Preparing well ensures high image quality and accurate AI screening results in under 5 minutes.',
    details: [
      'Rest your eyes in a comfortably lit or slightly dim room before scanning.',
      'Keep your eyes open and focus steadily on the camera target indicator.',
      'Ensure the fundus lens or camera adapter is clean and free of smudges.',
      'Blink gently before capturing to keep the cornea naturally hydrated.',
    ],
    tips: [
      'Avoid staring at bright sunlight or direct flash right before the scan.',
      'If wearing spectacles or contact lenses, follow the screening instructions given on screen.',
    ]
  },
  {
    id: 'results',
    title: 'Understanding Your Screening Result',
    subtitle: 'Decoding "No DR", "Mild DR", and confidence ratings',
    badge: 'Results',
    readTime: '4 min read',
    icon: 'file-text',
    summary: 'Drishti uses an explainable AI system that grades images and highlights retinal features for patient transparency.',
    details: [
      'No DR Detected: No visible microaneurysms or vascular abnormalities are present. Maintain routine annual checkups.',
      'Mild DR: Very minor microvascular changes are detected. Your ophthalmologist will advise simple lifestyle adjustments or follow-up.',
      'Moderate to Severe DR: Noticeable vessel changes require dedicated doctor assessment and possible clinical treatment.',
      'Confidence Score: Represents the AI model’s statistical certainty based on clinical training datasets.',
    ],
    tips: [
      'AI screening is an assistive screening tool, not a standalone medical diagnosis.',
      'Always share your Drishti digital report with your consulting physician.',
    ]
  },
  {
    id: 'consult',
    title: 'When to Consult a Doctor Immediately',
    subtitle: 'Urgent warning signs that require emergency eye consultation',
    badge: 'Urgent Care',
    readTime: '3 min read',
    icon: 'alert-triangle',
    summary: 'Certain visual symptoms require urgent consultation with an ophthalmologist or hospital eye clinic.',
    details: [
      'Sudden appearance of dark floating spots, webs, or flashes of light.',
      'A dark curtain or shadow pulling across any part of your vision.',
      'Sudden, unexplained blurry vision or partial vision loss in either eye.',
      'Eye pain, redness, or severe pressure around the eye socket.',
    ],
    tips: [
      'Do not wait for your scheduled screening if you experience sudden visual changes.',
      'Visit your nearest eye emergency care center promptly.',
    ]
  },
];
