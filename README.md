# FindMyProf

FindMyProf is a React Native mobile application that gives students real-time visibility into faculty availability, office location, and contact options — without requiring a personal phone number or a lucky corridor encounter. Faculty members use the same app to manage their own availability status, office hours, and direct message preferences from a personal dashboard.

## Motivation

In most universities, reaching a faculty member outside of class depends on word of mouth, an unanswered office phone, or waiting outside a door that may or may not be occupied. Students have no reliable way to know whether a faculty member is on campus, in a meeting, or available for a walk-in visit. FindMyProf addresses this directly: it makes faculty presence and availability a live, queryable data point rather than a guessing game. Any student with the app can check the directory before walking across campus, book an office hours slot, send a quick "I'm heading over" notification, or open a direct chat — all without exchanging personal contact details.

---

## Features

### Student Features

- Browse a searchable faculty directory, filterable by name and department, with real-time availability status visible on each card
- View a faculty detail page showing location, email, optionally a phone number (if the faculty has enabled it), current status badge, and posted office hours
- Send a one-tap "heading to your office" system notification to a faculty member via the in-app chat system
- Request an office hours booking slot; real-time indicators show which slots are already taken
- Open a direct message thread with a faculty member (only if the faculty member has enabled direct messages)
- View all personal bookings with live status updates (Pending, Confirmed, Cancelled) from the Profile tab
- View all active chat threads from the Profile tab with last-message preview and timestamp
- Edit profile fields (name, department, semester) inline without a modal, with per-field Save confirmation
- Toggle between light and dark modes, with preference persisted across app restarts

### Faculty Features

- Sign up and automatically claim a pre-seeded directory record by email match, preserving all existing profile data
- Set current availability status (Available, In Class, On Leave, Busy) from the profile dashboard; status is reflected immediately across the directory
- Manage office hours: add and delete time slots with day, start time, and end time
- Set and update office location (building block, floor if applicable, cubicle or room number)
- Add and update a phone number, with a toggle to control whether it is visible to students in the directory
- Toggle whether to accept direct messages from students
- View and manage all incoming office hour booking requests; confirm or cancel each booking individually
- View all active chat threads and respond to student messages

---

## Tech Stack

| Technology | Purpose |
|---|---|
| React Native 0.81 | Core mobile framework |
| Expo SDK 54 | Build tooling, native module access, and dev server |
| Expo Router 6 | File-system-based navigation with typed routes |
| Firebase Auth | Email/password authentication with AsyncStorage persistence |
| Cloud Firestore | Primary database; real-time listeners via `onSnapshot` |
| `@react-native-async-storage/async-storage` | Theme preference persistence; Firebase Auth session storage |
| `expo-secure-store` | Secure storage for user role and UID across sessions |
| `@expo/vector-icons` (Feather) | Icon set used throughout the UI |
| `react-native-safe-area-context` | Safe area inset handling for notch and tab bar offsets |
| `react-native-reanimated` | Animation infrastructure (used transitively) |
| `react-native-gesture-handler` | Gesture support |
| `expo-splash-screen` | Splash screen control on initial load |
| `expo-status-bar` | Status bar style switching for light/dark mode |
| `expo-haptics` | Haptic feedback (available, not wired to interactions yet) |
| `dotenv` | Loads Firebase credentials into the seed script environment |
| TypeScript | Type definitions for layout and hook files |

---

## Project Structure

```
findmyprof/
├── app/                        # All screens and navigation (Expo Router file-system routing)
│   ├── _layout.tsx             # Root layout: provider tree, splash screen, auth-based redirect guard
│   ├── index.tsx               # Entry redirect (sends users to onboarding or directory)
│   ├── onboarding.jsx          # First-launch onboarding screen; marks completion in SecureStore
│   ├── +not-found.tsx          # 404 fallback screen
│   ├── auth/
│   │   ├── _layout.jsx         # Auth stack layout
│   │   ├── login.jsx           # Shared login screen with role selector (student / faculty)
│   │   ├── student-signup.jsx  # Student registration; creates Firestore document in students collection
│   │   └── faculty-signup.jsx  # Faculty registration; claims seeded record or creates a fresh one
│   └── (tabs)/
│       ├── _layout.jsx         # Bottom tab navigator; theme toggle in header; auth gate for protected tabs
│       ├── profile.jsx         # Unified profile screen rendering student or faculty dashboard by role
│       ├── directory/
│       │   ├── index.jsx       # Searchable faculty directory list with real-time status
│       │   └── [id].jsx        # Faculty detail screen; booking, messaging, and notify actions
│       ├── messages/
│       │   ├── index.jsx       # Chat thread list for the authenticated user
│       │   └── [chatId].jsx    # Real-time direct message conversation screen
│       └── office-hours/
│           └── index.jsx       # Booking management screen; students see their requests, faculty can confirm or cancel
│
├── components/
│   ├── FacultyCard.jsx         # Directory list card with animated availability pulse, location, and status badge
│   ├── StatusBadge.jsx         # Pill badge component rendering status with theme-aware colors
│   └── AuthGateSheet.jsx       # Animated bottom sheet presented when an unauthenticated action is attempted
│
├── context/
│   ├── AuthContext.js          # Firebase Auth listener; exposes user, role, login, register, logout
│   ├── UserContext.js          # Fetches and caches the active user's Firestore profile; exposes updateProfile
│   └── ThemeContext.js         # Light/dark color palette tokens; toggleTheme with AsyncStorage persistence
│
├── services/
│   ├── firebase.js             # Firebase app initialization; Auth with AsyncStorage persistence; Firestore export
│   ├── authService.js          # Thin wrappers around Firebase Auth: signUp, signIn, signOut, getCurrentUser
│   ├── facultyService.js       # Firestore operations for the faculties collection: get, update, claim, delete
│   ├── bookingService.js       # Creates and updates booking documents in the bookings collection
│   └── chatService.js          # Chat document initialization, message sending, and quick notify system message
│
├── constants/
│   ├── blocks.js               # Building block definitions used to drive the location picker UI
│   ├── colors.js               # Legacy static color constants (superseded by ThemeContext tokens)
│   ├── strings.js              # Static string constants
│   └── theme.ts                # Legacy theme shape definition (superseded by ThemeContext)
│
├── hooks/
│   ├── use-color-scheme.ts     # Thin wrapper around React Native's useColorScheme (unused in active screens)
│   └── use-theme-color.ts      # Maps color keys to light/dark values (unused in active screens)
│
├── scripts/
│   └── seedFaculty.js          # Node script to pre-populate the faculties collection with initial records
│
├── assets/                     # Static images and fonts
├── .env                        # Firebase project credentials (not committed)
├── app.json                    # Expo project configuration
├── package.json                # Dependencies and scripts
└── tsconfig.json               # TypeScript configuration
```

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- Expo CLI: `npm install -g expo`
- The Expo Go app on a physical device, or an Android emulator / iOS Simulator
- A Firebase project with Authentication (Email/Password) and Firestore enabled

### Installation

```bash
git clone https://github.com/your-username/FindMyProf.git
cd FindMyProf
npm install
```

### Environment and Firebase Configuration

Create a `.env` file in the project root. All variables must be prefixed with `EXPO_PUBLIC_` so Expo exposes them to the client bundle:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=your_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Running the App

```bash
# Start the Expo dev server
npm start

# Open directly on Android
npm run android

# Open directly on iOS
npm run ios
```

Scan the QR code with Expo Go (Android) or the Camera app (iOS) to run on a physical device.

### Pre-populating Faculty Records

The seed script writes initial faculty records to Firestore. This is useful when faculty members will register gradually — their directory entries exist and are visible to students immediately, and each faculty member claims their own record on first login by email match.

```bash
node --experimental-vm-modules scripts/seedFaculty.js
```

The script reads credentials from `.env` via `dotenv`. Each seeded record has `isRegistered: false` until the corresponding faculty member signs up, at which point the record is claimed and linked to their Firebase Auth UID.

---

## Firebase Architecture

### Authentication

Firebase Authentication with email/password. Sessions are persisted to `AsyncStorage` via `getReactNativePersistence`. User UID and role are additionally stored in `expo-secure-store` to eliminate redirect flashes on cold launch.

### Firestore Collections

**`faculties`**

Each document represents one faculty member. The document ID is the faculty member's Firebase Auth UID once claimed; auto-generated before claim.

```
{
  name:               string,
  email:              string,
  department:         string,
  isRegistered:       boolean,
  status:             "available" | "busy" | "in_class" | "on_leave" | "unknown" | null,
  statusText:         string | null,
  acceptsMessages:    boolean,
  officeHours:        Array<{ day: string, from: string, to: string } | string>,
  phone:              string | null,
  phoneVisible:       boolean,
  location:           { block: string, floor: string | null, cubicle: string } | null,
  block:              string,          // flat field present on seeded records
  floor:              number | null,   // flat field present on seeded records
  cubicle:            string,          // flat field present on seeded records
  subjects:           string[],
  substitutionNotice: string | null,
  photoURL:           string | null,
  claimedByUid:       string,          // set on claim
  claimedAt:          string,          // ISO timestamp, set on claim
  createdAt:          string           // ISO timestamp, set on fresh registration
}
```

**`students`**

Document ID is the Firebase Auth UID.

```
{
  name:       string,
  fullName:   string,
  email:      string,
  department: string,
  semester:   string | number,
  createdAt:  string
}
```

**`bookings`**

```
{
  facultyId:   string,
  facultyName: string,
  studentId:   string,
  studentName: string,
  slot:        string,
  status:      "pending" | "confirmed" | "cancelled",
  createdAt:   Timestamp,
  updatedAt:   Timestamp
}
```

**`chats`**

Document ID is `{facultyId}_{studentId}`.

```
{
  participants:          string[],   // [facultyId, studentId]
  facultyId:             string,
  studentId:             string,
  facultyName:           string,
  studentName:           string,
  lastMessage:           string,
  lastMessageTimestamp:  Timestamp
}
```

**`chats/{chatId}/messages`** (subcollection)

```
{
  text:      string,
  senderId:  string,
  timestamp: Timestamp,
  isSystem:  boolean     // true for "heading to your office" notifications
}
```

---

## User Roles

There are three access levels in the application.

### Guest (unauthenticated)

A guest can browse the entire faculty directory and view individual faculty profiles without logging in. Attempting any protected action — sending a message, sending a notify, booking an office hours slot, or accessing the Messages, Office Hours, or Profile tabs — triggers the `AuthGateSheet` bottom sheet, which presents login and sign-up options.

### Student

Registered via the student sign-up screen. A Firestore document is created in the `students` collection using the Firebase Auth UID as the document ID. Role is written to `expo-secure-store` as `"student"` on registration and login, and read back on app launch to restore the session without a round-trip. Login validates that a matching student document exists; using student credentials on the faculty login path is rejected.

Students have access to the full directory, direct messaging (where allowed by faculty), office hours booking, personal booking history, and chat thread history.

### Faculty

Registered via the faculty sign-up screen. During registration, the app queries the `faculties` collection for a document matching the submitted email:

- If a match is found (a pre-seeded record), `claimFacultyProfile` is called: it copies all seeded data into a new document keyed by the faculty's Auth UID, deletes the old auto-ID document, and sets `isRegistered: true`. The faculty member's submitted name and department overwrite the seeded values.
- If no match is found, a new document is created directly with the Auth UID as the key.

Role is persisted as `"faculty"` in `expo-secure-store`. Login validates that a `faculties` document with a matching email exists before allowing access. Faculty members manage all profile data — status, location, office hours, phone visibility, and message settings — from the Profile tab dashboard.

---

## Navigation

The app uses a bottom tab navigator with four visible tabs:

| Tab | Route | Access |
|---|---|---|
| Directory | `/(tabs)/directory` | Public — no authentication required |
| Messages | `/(tabs)/messages` | Requires authentication |
| Office Hours | `/(tabs)/office-hours` | Requires authentication |
| Profile | `/(tabs)/profile` | Requires authentication; tab icon and title change based on auth state |

Tapping a protected tab while unauthenticated intercepts the press event and displays the `AuthGateSheet` instead of navigating. The sheet presents Login, Student Sign Up, and Faculty Sign Up options. After successful login, navigation to the originally intended route is completed.

The faculty detail screen (`/directory/[id]`) is a sub-route hidden from the tab bar. Within the detail screen, the same `AuthGateSheet` is rendered inline to gate the Send Message, Notify, and Book Slot actions independently, without leaving the current screen.

A theme toggle button (sun/moon icon) is present in the header of every tab screen. Tapping it switches between light and dark mode and persists the preference via `AsyncStorage`.

---

## Known Limitations

- **Firestore security rules** are not production-hardened. Current rules are permissive for development. Before any public deployment, rules must be scoped to `uid`-authenticated reads and writes for all protected collections.
- **Faculty status** (`available`, `in_class`, etc.) is entirely self-reported. There is no automated or scheduled status update mechanism.
- **Push notifications** are not implemented. The "heading to your office" feature writes a system message to the chat subcollection, but there is no Firebase Cloud Messaging integration to deliver a device notification to the faculty member.
- **No image uploads**. The `photoURL` field exists in the faculty data model but the app has no UI for uploading or displaying a profile photo.
- **The `axios` dependency** is listed in `package.json` but is not used anywhere in the active codebase.
- **The `hooks/` directory** contains `use-color-scheme` and `use-theme-color` files that are not consumed by any active screen or component. The theme system is handled entirely through `ThemeContext`.
- **The `constants/colors.js` and `constants/theme.ts` files** are not referenced in active screens. Color tokens are defined and consumed through `ThemeContext`.
- **Student sign-up does not validate** whether the entered email domain belongs to an institution. Any valid email address is accepted.
- **Booking confirmation** requires manual faculty action via the Office Hours tab. There is no timeout, expiry, or automated cancellation for unreviewed bookings.
- **Chat does not enforce the `acceptsMessages` flag at the database level**. The flag is read client-side and the UI blocks sending, but a user with direct Firestore access could write messages regardless of the setting.
