export const LOGIN_USERS = [
  {
    name: 'Platform Admin',
    role: 'Admin',
    avatar: 'PA',
    description: 'Manage all clubs, approve proposals, and oversee platform operations.',
    color: '#0f3d73',
  },
  {
    name: 'Amina Hadzic',
    role: 'Club Leader',
    avatar: 'AH',
    clubId: 'robotics-club',
    description: 'Lead the Robotics Club — manage members, events, and announcements.',
    color: '#4b7bec',
  },
  {
    name: 'Demo Student',
    role: 'Member',
    avatar: 'DS',
    description: 'Browse clubs, request membership, and follow your clubs\' activities.',
    color: '#6c5ce7',
  },
];

export const navItems = [
  { id: 'dashboard',  label: 'Dashboard',         short: 'DB' },
  { id: 'clubs',      label: 'Club Directory',     short: 'CD' },
  { id: 'operations', label: 'Operations Center',  short: 'OC', showBadge: true },
];

export const initialClubs = [
  {
    id: 'robotics-club',
    name: 'Robotics Club',
    category: 'Engineering',
    summary:
      'Build prototypes, host coding nights, and prepare student teams for regional competitions.',
    leader: 'Amina Hadzic',
    accent: '#4b7bec',
    health: 'Excellent',
    nextEvent: 'Autonomous Systems Lab, 12 Apr',
    announcementsCount: 3,
    members: [
      { id: 'robotics-1', name: 'Amina Hadzic', role: 'Club Leader', program: 'Software Engineering' },
      { id: 'robotics-2', name: 'Tarik Zeco', role: 'Vice Leader', program: 'Mechanical Engineering' },
      { id: 'robotics-3', name: 'Lejla Music', role: 'Member', program: 'Computer Science' },
      { id: 'robotics-4', name: 'Demo Student', role: 'Member', program: 'Computer Science' },
    ],
  },
  {
    id: 'media-lab',
    name: 'Creative Media Lab',
    category: 'Media & Design',
    summary:
      'Produce visual campaigns, document campus events, and mentor students in photo and video editing.',
    leader: 'Sara Kovacevic',
    accent: '#f78fb3',
    health: 'Active',
    nextEvent: 'Photo Walk, 14 Apr',
    announcementsCount: 2,
    members: [
      { id: 'media-1', name: 'Sara Kovacevic', role: 'Club Leader', program: 'Visual Arts' },
      { id: 'media-2', name: 'Emir Basic', role: 'Content Lead', program: 'Media Studies' },
      { id: 'media-3', name: 'Ajla Husic', role: 'Member', program: 'Architecture' },
    ],
  },
  {
    id: 'debate-society',
    name: 'Debate Society',
    category: 'Public Speaking',
    summary:
      'Run debate sessions, organize public forums, and help students grow their presentation confidence.',
    leader: 'Haris Alic',
    accent: '#6c5ce7',
    health: 'Growing',
    nextEvent: 'Policy Debate Night, 16 Apr',
    announcementsCount: 4,
    members: [
      { id: 'debate-1', name: 'Haris Alic', role: 'Club Leader', program: 'Law' },
      { id: 'debate-2', name: 'Mina Selimovic', role: 'Moderator', program: 'Political Science' },
      { id: 'debate-3', name: 'Dino Vatres', role: 'Member', program: 'International Relations' },
    ],
  },
];

export const initialClubRequests = [
  {
    id: 'request-1',
    name: 'Green Campus Initiative',
    category: 'Sustainability',
    proposedBy: 'Nejla Osmanovic',
    mission:
      'Coordinate sustainability actions, campus clean-up drives, and awareness campaigns for students.',
  },
  {
    id: 'request-2',
    name: 'Entrepreneurship Circle',
    category: 'Business',
    proposedBy: 'Ahmed Smajic',
    mission:
      'Support student founders with startup talks, pitch practice, and mentor matching.',
  },
];

export const initialMembershipRequests = [
  {
    id: 'member-request-1',
    clubId: 'media-lab',
    student: 'Lamija Kurtic',
    program: 'Digital Communication',
    reason: 'I would like to help with photography coverage for university events.',
  },
  {
    id: 'member-request-2',
    clubId: 'debate-society',
    student: 'Adnan Begovic',
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
    author: 'Amina Hadzic',
    date: '7 Apr 2026',
  },
  {
    id: 'announcement-2',
    clubId: 'media-lab',
    title: 'Volunteer call for Spring Festival coverage',
    body: 'We need two photographers and one editor for the student festival content package.',
    audience: 'Content team',
    author: 'Sara Kovacevic',
    date: '6 Apr 2026',
  },
  {
    id: 'announcement-3',
    clubId: 'debate-society',
    title: 'Public speaking workshop registration is open',
    body: 'Members can reserve a speaking slot before Thursday evening from the club dashboard.',
    audience: 'Open to campus',
    author: 'Haris Alic',
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
    rsvp: ['Amina Hadzic', 'Tarik Zeco', 'Demo Student'],
  },
  {
    id: 'event-2',
    clubId: 'media-lab',
    title: 'Photo Walk',
    date: '2026-04-14',
    location: 'Campus Courtyard',
    rsvp: ['Sara Kovacevic', 'Emir Basic'],
  },
  {
    id: 'event-3',
    clubId: 'debate-society',
    title: 'Policy Debate Night',
    date: '2026-04-16',
    location: 'Seminar Hall B',
    rsvp: ['Haris Alic', 'Mina Selimovic'],
  },
];

const NOW = Date.now();

export const initialMessages = [
  {
    id: 'msg-1',
    clubId: 'robotics-club',
    author: 'Amina Hadzic',
    text: 'Reminder to bring your laptops to Friday\'s session — we\'re testing the new motor controllers.',
    ts: NOW - 3_600_000,
  },
  {
    id: 'msg-2',
    clubId: 'robotics-club',
    author: 'Tarik Zeco',
    text: 'Got it! Should we bring the breadboard kits too?',
    ts: NOW - 2_700_000,
  },
  {
    id: 'msg-3',
    clubId: 'robotics-club',
    author: 'Demo Student',
    text: 'I can bring extra jumper wires if anyone needs them.',
    ts: NOW - 1_800_000,
  },
  {
    id: 'msg-4',
    clubId: 'media-lab',
    author: 'Sara Kovacevic',
    text: 'All camera gear is reserved for the photo walk on Monday. See you all there!',
    ts: NOW - 7_200_000,
  },
  {
    id: 'msg-5',
    clubId: 'debate-society',
    author: 'Haris Alic',
    text: 'The topic for Thursday\'s policy debate is now confirmed: AI Regulation in Higher Education.',
    ts: NOW - 10_800_000,
  },
];
