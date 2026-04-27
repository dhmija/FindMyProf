// Run with: node --experimental-vm-modules scripts/seedFaculty.js
// Reads Firebase credentials from .env (never commit keys directly)

import { createRequire } from "module";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, setDoc, doc } from "firebase/firestore";

// Load .env using dotenv (CommonJS-compatible require in ESM context)
const require = createRequire(import.meta.url);
const dotenv = require("dotenv");
dotenv.config();

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const facultiesData = [
  // Floor 1
  {
    name: "Dr. Alice Sharma",
    department: "Computer Science",
    block: "M",
    floor: 1,
    cubicle: "M-101A",
    email: "alice.sharma@placeholder.edu",
    subjects: ["Data Structures", "Algorithms"],
    phone: "+91-9876543210",
    isRegistered: false,
    status: "unknown",
    acceptsMessages: false,
    officeHours: ["Monday 10:00 AM - 12:00 PM"],
    substitutionNotice: null,
    photoURL: null
  },
  {
    name: "Prof. Bob Singh",
    department: "Information Technology",
    block: "M",
    floor: 1,
    cubicle: "M-102B",
    email: "bob.singh@placeholder.edu",
    subjects: ["Web Development", "Computer Networks"],
    phone: null,
    isRegistered: false,
    status: "unknown",
    acceptsMessages: false,
    officeHours: ["Wednesday 2:00 PM - 4:00 PM"],
    substitutionNotice: null,
    photoURL: null
  },
  {
    name: "Dr. Catherine Dias",
    department: "Electronics",
    block: "M",
    floor: 1,
    cubicle: "M-105C",
    email: "catherine.dias@placeholder.edu",
    subjects: ["Digital Logic", "Microprocessors"],
    phone: null,
    isRegistered: false,
    status: "unknown",
    acceptsMessages: false,
    officeHours: [],
    substitutionNotice: null,
    photoURL: null
  },
  
  // Floor 2
  {
    name: "Dr. David Kumar",
    department: "Mechanical Engineering",
    block: "M",
    floor: 2,
    cubicle: "M-201A",
    email: "david.kumar@placeholder.edu",
    subjects: ["Thermodynamics", "Fluid Mechanics"],
    phone: null,
    isRegistered: false,
    status: "unknown",
    acceptsMessages: false,
    officeHours: ["Tuesday 11:00 AM - 1:00 PM"],
    substitutionNotice: null,
    photoURL: null
  },
  {
    name: "Prof. Eve Fernandez",
    department: "Computer Science",
    block: "M",
    floor: 2,
    cubicle: "M-204D",
    email: "eve.fernandez@placeholder.edu",
    subjects: ["Machine Learning", "Artificial Intelligence"],
    phone: "+91-1234567890",
    isRegistered: true,
    status: "available",
    acceptsMessages: true,
    officeHours: ["Thursday 1:00 PM - 3:00 PM"],
    substitutionNotice: null,
    photoURL: null
  },
  {
    name: "Dr. Frank Iyer",
    department: "Civil Engineering",
    block: "M",
    floor: 2,
    cubicle: "M-206B",
    email: "frank.iyer@placeholder.edu",
    subjects: ["Structural Analysis", "Surveying"],
    phone: null,
    isRegistered: false,
    status: "unknown",
    acceptsMessages: false,
    officeHours: [],
    substitutionNotice: null,
    photoURL: null
  },

  // Floor 3
  {
    name: "Prof. Grace Patel",
    department: "Mathematics",
    block: "M",
    floor: 3,
    cubicle: "M-301C",
    email: "grace.patel@placeholder.edu",
    subjects: ["Linear Algebra", "Calculus"],
    phone: null,
    isRegistered: false,
    status: "unknown",
    acceptsMessages: false,
    officeHours: ["Friday 9:00 AM - 11:00 PM"],
    substitutionNotice: null,
    photoURL: null
  },
  {
    name: "Dr. Henry Khan",
    department: "Physics",
    block: "M",
    floor: 3,
    cubicle: "M-303A",
    email: "henry.khan@placeholder.edu",
    subjects: ["Quantum Mechanics", "Electromagnetism"],
    phone: null,
    isRegistered: false,
    status: "unknown",
    acceptsMessages: false,
    officeHours: [],
    substitutionNotice: null,
    photoURL: null
  },
  {
    name: "Dr. Isabella Reddy",
    department: "Computer Science",
    block: "M",
    floor: 3,
    cubicle: "M-307B",
    email: "isabella.reddy@placeholder.edu",
    subjects: ["Cloud Computing", "Cybersecurity"],
    phone: "+91-9871236540",
    isRegistered: false,
    status: "unknown",
    acceptsMessages: false,
    officeHours: ["Monday 3:00 PM - 5:00 PM"],
    substitutionNotice: "On leave until next week.",
    photoURL: null
  },

  // N1 Block (single floor — no floor field)
  {
    name: "Dr. James Nair",
    department: "Chemistry",
    block: "N1",
    cubicle: "N1-05",
    email: "james.nair@placeholder.edu",
    subjects: ["Organic Chemistry", "Physical Chemistry"],
    phone: null,
    isRegistered: false,
    status: "unknown",
    acceptsMessages: false,
    officeHours: [],
    substitutionNotice: null,
    photoURL: null
  },
  {
    name: "Prof. Karen Mehta",
    department: "Biotechnology",
    block: "N1",
    cubicle: "N1-11",
    email: "karen.mehta@placeholder.edu",
    subjects: ["Genetics", "Cell Biology"],
    phone: null,
    isRegistered: false,
    status: "unknown",
    acceptsMessages: false,
    officeHours: ["Tuesday 10:00 AM - 12:00 PM"],
    substitutionNotice: null,
    photoURL: null
  },

  // N2 Block (single floor — no floor field)
  {
    name: "Dr. Leo Fernandes",
    department: "Business Administration",
    block: "N2",
    cubicle: "N2-03",
    email: "leo.fernandes@placeholder.edu",
    subjects: ["Marketing", "Business Strategy"],
    phone: null,
    isRegistered: false,
    status: "unknown",
    acceptsMessages: false,
    officeHours: [],
    substitutionNotice: null,
    photoURL: null
  },
  {
    name: "Prof. Mira Joshi",
    department: "Economics",
    block: "N2",
    cubicle: "N2-09",
    email: "mira.joshi@placeholder.edu",
    subjects: ["Microeconomics", "Development Economics"],
    phone: null,
    isRegistered: false,
    status: "unknown",
    acceptsMessages: false,
    officeHours: ["Friday 2:00 PM - 4:00 PM"],
    substitutionNotice: null,
    photoURL: null
  }
];

async function seedDatabase() {
  console.log("Starting faculty data seeding...");
  
  try {
    for (const faculty of facultiesData) {
      // Using email as an easy unique identifier, or let Firestore auto-generate IDs.
      // We'll use random auto-generated IDs here to keep things simple.
      const facultyRef = doc(collection(db, "faculties")); 
      await setDoc(facultyRef, faculty);
      const location = faculty.floor != null ? `Floor ${faculty.floor}` : faculty.block;
      console.log(`Successfully added: ${faculty.name} (${faculty.block} Block${faculty.floor != null ? ` · Floor ${faculty.floor}` : ''})`);
    }
    
    console.log("Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seedDatabase();
