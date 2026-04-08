export const LOGIN_USERS = [
  {
    name: 'Admin',
    role: 'Admin',
    avatar: 'AD',
    description: 'Manage all clubs, approve proposals, and oversee platform operations.',
    color: '#0f3d73',
  },
  {
    name: 'Mila',
    role: 'Club Leader',
    avatar: 'MI',
    clubId: 'robotics-club',
    description: 'Lead the Robotics Club — manage members, events, and announcements.',
    color: '#4b7bec',
  },
  {
    name: 'Alex',
    role: 'Member',
    avatar: 'AL',
    description: 'Browse clubs, request membership, and follow your clubs\' activities.',
    color: '#6c5ce7',
  },
];

export const navItems = [
  { id: 'home',   label: 'Home',      short: 'HM' },
  { id: 'clubs',  label: 'Clubs',     short: 'CL' },
  { id: 'manage', label: 'Manage',    short: 'MG', showBadge: true },
];

export const initialClubs = [
  {
    id: 'robotics-club',
    name: 'Robotics Club',
    category: 'Engineering',
    summary:
      'Build prototypes, host coding nights, and prepare student teams for regional competitions.',
    leader: 'Mila',
    accent: '#4b7bec',
    health: 'Excellent',
    nextEvent: 'Autonomous Systems Lab, 12 Apr',
    groupPlatform: 'WhatsApp',
    groupLink: 'https://chat.whatsapp.com/robotics-ius-demo',
    announcementsCount: 3,
    members: [
      { id: 'robotics-1', name: 'Mila', role: 'Club Leader', program: 'Software Engineering' },
      { id: 'robotics-2', name: 'Noah', role: 'Vice Leader', program: 'Mechanical Engineering' },
      { id: 'robotics-3', name: 'Lana', role: 'Member', program: 'Computer Science' },
      { id: 'robotics-4', name: 'Alex', role: 'Member', program: 'Computer Science' },
    ],
  },
  {
    id: 'media-lab',
    name: 'Creative Media Lab',
    category: 'Media & Design',
    summary:
      'Produce visual campaigns, document campus events, and mentor students in photo and video editing.',
    leader: 'Nina',
    accent: '#f78fb3',
    health: 'Active',
    nextEvent: 'Photo Walk, 14 Apr',
    groupPlatform: 'WhatsApp',
    groupLink: 'https://chat.whatsapp.com/media-lab-ius-demo',
    announcementsCount: 2,
    members: [
      { id: 'media-1', name: 'Nina', role: 'Club Leader', program: 'Visual Arts' },
      { id: 'media-2', name: 'Omar', role: 'Content Lead', program: 'Media Studies' },
      { id: 'media-3', name: 'Iva', role: 'Member', program: 'Architecture' },
    ],
  },
  {
    id: 'debate-society',
    name: 'Debate Society',
    category: 'Public Speaking',
    summary:
      'Run debate sessions, organize public forums, and help students grow their presentation confidence.',
    leader: 'Leo',
    accent: '#6c5ce7',
    health: 'Growing',
    nextEvent: 'Policy Debate Night, 16 Apr',
    groupPlatform: 'WhatsApp',
    groupLink: 'https://chat.whatsapp.com/debate-ius-demo',
    announcementsCount: 4,
    members: [
      { id: 'debate-1', name: 'Leo', role: 'Club Leader', program: 'Law' },
      { id: 'debate-2', name: 'Maya', role: 'Moderator', program: 'Political Science' },
      { id: 'debate-3', name: 'Eli', role: 'Member', program: 'International Relations' },
    ],
  },
];

export const initialClubRequests = [
  {
    id: 'request-1',
    name: 'Green Campus Initiative',
    category: 'Sustainability',
    proposedBy: 'Zara',
    mission:
      'Coordinate sustainability actions, campus clean-up drives, and awareness campaigns for students.',
  },
  {
    id: 'request-2',
    name: 'Entrepreneurship Circle',
    category: 'Business',
    proposedBy: 'Nolan',
    mission:
      'Support student founders with startup talks, pitch practice, and mentor matching.',
  },
];

export const initialMembershipRequests = [
  {
    id: 'member-request-1',
    clubId: 'media-lab',
    student: 'Tara',
    program: 'Digital Communication',
    reason: 'I would like to help with photography coverage for university events.',
  },
  {
    id: 'member-request-2',
    clubId: 'debate-society',
    student: 'Arman',
    program: 'Law',
    reason: 'Interested in debate training and moderating future student forums.',
  },
];

export const initialAnnouncements = [
  {
    id: 'announcement-1',
    clubId: 'robotics-club',
    title: 'Prototype sprint moved to Friday',
    body: 'The lab session has been moved to Friday so the hardware kit delivery can arrive first.',
    audience: 'All members',
    author: 'Mila',
    date: '7 Apr 2026',
  },
  {
    id: 'announcement-2',
    clubId: 'media-lab',
    title: 'Volunteer call for Spring Festival coverage',
    body: 'We need two photographers and one editor for the student festival content package.',
    audience: 'Content team',
    author: 'Nina',
    date: '6 Apr 2026',
  },
  {
    id: 'announcement-3',
    clubId: 'debate-society',
    title: 'Public speaking workshop registration is open',
    body: 'Members can reserve a speaking slot before Thursday evening from the club dashboard.',
    audience: 'Open to campus',
    author: 'Leo',
    date: '5 Apr 2026',
  },
];

export const initialEvents = [
  {
    id: 'event-1',
    clubId: 'robotics-club',
    title: 'Autonomous Systems Lab',
    date: '2026-04-12',
    location: 'Innovation Lab 2',
    rsvp: ['Mila', 'Noah', 'Alex'],
  },
  {
    id: 'event-2',
    clubId: 'media-lab',
    title: 'Photo Walk',
    date: '2026-04-14',
    location: 'Campus Courtyard',
    rsvp: ['Nina', 'Omar'],
  },
  {
    id: 'event-3',
    clubId: 'debate-society',
    title: 'Policy Debate Night',
    date: '2026-04-16',
    location: 'Seminar Hall B',
    rsvp: ['Leo', 'Maya'],
  },
];
