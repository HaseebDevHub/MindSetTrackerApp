# Mindset Tracker — React Native UI Implementation Instructions

## 0. ROLE

You are a senior React Native engineer and UI implementation agent.

Your task is to build the complete frontend UI and user interaction flow for an application called:

# Mindset Tracker

The original reference application is documented as "Habit Tracker / TICK IT".

The provided reverse-engineering specification is the source of truth for the UI, screen structure, visual language, navigation flow, interactions, and animations.

You must recreate the documented application as closely as reasonably possible in React Native.

IMPORTANT:

This phase is UI/UX ONLY.

Do NOT implement:

- Backend
- Next.js API
- Authentication
- Cloud synchronization
- Push notifications
- Notification scheduling
- Real payment processing
- Real subscriptions
- Real Google/Apple login
- Remote database
- Analytics
- Server APIs

Use local/mock data and local UI state wherever necessary.

The architecture must, however, be clean enough that a Next.js backend can be connected later without rewriting the UI.

---

# 1. PRIMARY OBJECTIVE

Build the complete Mindset Tracker mobile application UI from scratch.

The application must contain:

1. Onboarding flow
2. Plan generation animation
3. Value proposition screen
4. Main Today dashboard
5. Journey screen
6. History screen
7. All Habits history screen
8. Achievements history screen
9. Me/Profile screen
10. Habit creation UI
11. Habit action menu
12. Habit completion interaction
13. Journey detail UI
14. Settings sub-screens
15. Premium/paywall UI mock
16. Calendar UI
17. Metric cards
18. Interactive local state
19. Proper navigation
20. Responsive iOS and Android layouts

The app should feel like one coherent production application rather than a collection of unrelated screens.

---

# 2. SOURCE OF TRUTH

Use the supplied reverse-engineering documentation as the primary specification.

Do not arbitrarily redesign the application.

Do not introduce a different visual style unless required for usability or because the specification does not define something.

Where the specification provides:

- exact text
- exact colors
- dimensions
- screen names
- navigation
- interaction
- animation
- spacing
- component behavior

follow those specifications.

The application name must be changed to:

Mindset Tracker

Do not display:

- Habit Tracker
- TICK IT

in visible application UI unless explicitly required internally.

---

# 3. IMPLEMENTATION STRATEGY

Work incrementally.

DO NOT attempt to generate the entire application in one giant implementation.

Implement in the following order:

PHASE 1
Foundation + Design System

PHASE 2
Onboarding S01-S04

PHASE 3
Plan Generator S05

PHASE 4
Value Proposition S06

PHASE 5
Main Navigation + Today S07

PHASE 6
Journey S08

PHASE 7
History S09 + sub-tabs

PHASE 8
Me S10 + settings

PHASE 9
Habit creation/edit/note flows

PHASE 10
Animations + polish + responsive behavior

PHASE 11
Final UI QA

After each phase:

1. Run TypeScript validation.
2. Run linting if configured.
3. Verify navigation.
4. Verify all interactions.
5. Fix errors before continuing.
6. Do not leave broken imports.
7. Do not create placeholder screens where a real UI is required.

---

# 4. TECH STACK

Use:

- React Native
- TypeScript
- React Navigation
- React Native Reanimated
- React Native Gesture Handler
- Zustand
- react-native-svg
- lucide-react-native

If the project is already configured with compatible versions, use the existing versions.

Do not unnecessarily upgrade or downgrade the project dependencies.

Use functional components and hooks.

Avoid class components.

Use strict TypeScript.

Avoid `any` unless absolutely unavoidable.

---

# 5. PROJECT STRUCTURE

Create a clean structure similar to:

src/
├── assets/
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── components/
│   ├── common/
│   │   ├── AppButton.tsx
│   │   ├── AppCard.tsx
│   │   ├── AppHeader.tsx
│   │   ├── AppInput.tsx
│   │   ├── Checkbox.tsx
│   │   ├── Divider.tsx
│   │   └── ScreenContainer.tsx
│   │
│   ├── onboarding/
│   │   ├── OnboardingProgress.tsx
│   │   ├── TimeWheelPicker.tsx
│   │   ├── GoalCard.tsx
│   │   └── PresetHabitCard.tsx
│   │
│   ├── habit/
│   │   ├── HabitCard.tsx
│   │   ├── HabitMenu.tsx
│   │   ├── HabitCreationSheet.tsx
│   │   └── HabitNoteSheet.tsx
│   │
│   ├── history/
│   │   ├── MetricCard.tsx
│   │   ├── CalendarGrid.tsx
│   │   ├── HistoryTabs.tsx
│   │   └── AchievementBadge.tsx
│   │
│   ├── journey/
│   │   ├── JourneyCard.tsx
│   │   ├── RecommendedJourneyCard.tsx
│   │   └── JourneyListItem.tsx
│   │
│   └── navigation/
│       └── BottomTabBar.tsx
│
├── constants/
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   ├── dimensions.ts
│   └── theme.ts
│
├── navigation/
│   ├── RootNavigator.tsx
│   ├── OnboardingNavigator.tsx
│   ├── MainTabNavigator.tsx
│   ├── TodayNavigator.tsx
│   ├── JourneyNavigator.tsx
│   ├── HistoryNavigator.tsx
│   └── MeNavigator.tsx
│
├── screens/
│   ├── onboarding/
│   │   ├── WakeTimeScreen.tsx
│   │   ├── BedTimeScreen.tsx
│   │   ├── GoalsScreen.tsx
│   │   ├── FirstHabitScreen.tsx
│   │   ├── PlanGeneratorScreen.tsx
│   │   └── ValuePropositionScreen.tsx
│   │
│   ├── today/
│   │   ├── TodayScreen.tsx
│   │   ├── CreateHabitScreen.tsx
│   │   ├── EditHabitScreen.tsx
│   │   └── HabitDetailScreen.tsx
│   │
│   ├── journey/
│   │   ├── JourneyScreen.tsx
│   │   └── JourneyDetailScreen.tsx
│   │
│   ├── history/
│   │   ├── HistoryScreen.tsx
│   │   ├── AllHabitsScreen.tsx
│   │   └── AchievementsScreen.tsx
│   │
│   └── me/
│       ├── MeScreen.tsx
│       ├── NotificationSettingsScreen.tsx
│       ├── GeneralSettingsScreen.tsx
│       ├── LanguageSettingsScreen.tsx
│       ├── FeedbackScreen.tsx
│       └── PremiumScreen.tsx
│
├── store/
│   ├── appStore.ts
│   ├── onboardingStore.ts
│   └── habitStore.ts
│
├── types/
│   ├── navigation.ts
│   ├── habit.ts
│   ├── journey.ts
│   └── user.ts
│
└── utils/
    ├── dates.ts
    ├── formatting.ts
    └── calculations.ts

---

# 6. DESIGN SYSTEM

Create centralized design tokens.

NEVER hard-code colors repeatedly throughout components.

Use:

src/constants/colors.ts

Primary:

#3B82F6

Background:

#12161E

Main surface:

#1E232E

Secondary surface:

#252A34

Divider:

#2A2F3D

Primary text:

#FFFFFF

Secondary text:

#A0AEC0

Muted:

#4A5568

Red:

#EF4444

Yellow:

#F59E0B

Green:

#10B981

Dark blue:

#1D4ED8

Selected blue:

#2563EB

Create typography tokens:

Heading XL:
28px / 34px / Bold

Heading L:
24px / 30px / Bold

Heading M:
20px / 26px / SemiBold

Body Large:
16px / 22px / SemiBold

Body Medium:
14px / 20px / Regular

Caption:
12px / 16px / Regular

Metric Number:
36px / 42px / ExtraBold

Spacing:

screenHorizontal = 20

cardPadding = 16

small = 8

medium = 12

large = 16

extraLarge = 24

Card radius:

16

Button pill radius:

27

Standard rounded button:

12

---

# 7. GLOBAL UI RULES

Every screen must:

- respect Safe Area
- support small and large phones
- support iOS and Android
- use dark background
- avoid content clipping
- avoid keyboard overlap
- use consistent horizontal margins
- use centralized typography
- use reusable components

Do not use random margins to fix layout problems.

Do not duplicate design constants.

Use Flexbox correctly.

Use ScrollView/FlatList when content can exceed viewport.

Avoid fixed heights unless specified by the documentation.

---

# 8. NAVIGATION ARCHITECTURE

Implement:

RootNavigator
│
├── OnboardingNavigator
│   ├── WakeTime
│   ├── BedTime
│   ├── Goals
│   ├── FirstHabit
│   ├── PlanGenerator
│   └── ValueProposition
│
└── MainTabNavigator
    ├── Today
    ├── Journey
    ├── History
    └── Me

Bottom tabs:

TODAY
JOURNEY
HISTORY
ME

Bottom navigation:

height approximately 64dp plus safe area.

Background:

#1A1D24

Top border:

#2A2F3D

Selected:

white / #3B82F6

Unselected:

#717D96

Use Lucide icons.

---

# 9. ONBOARDING — S01

SCREEN:

Wake Time

Title:

"What time do you usually get up?"

Subtitle:

"Choose the time you usually start a new day"

Show:

- four-segment progress indicator
- time wheel picker
- NEXT button
- "Already using TICK IT?"
- "Restore existing data"

Important:

Although the source application says TICK IT, the visible product name should be Mindset Tracker.

Therefore change:

"Already using TICK IT?"

to:

"Already using Mindset Tracker?"

unless there is a strong reason to preserve the original text.

Time wheel:

- hours column
- minutes column
- selected item centered
- selected value bold
- selected row has blue top/bottom lines
- surrounding values fade

Default example:

08:00

Scrolling must update local state.

NEXT navigates to BedTime.

Restore button can be UI-only for now.

Do not implement actual restore functionality.

---

# 10. ONBOARDING — S02

Title:

"What time do you usually end you day?"

Preserve this exact source wording unless correcting it would be explicitly requested.

Subtitle:

"We'll remind you to finish your checklist before that"

Use same wheel picker component.

Default:

22:00

Back button returns to S01.

NEXT navigates to S03.

---

# 11. ONBOARDING — S03

Title:

"What's your target?"

Subtitle:

"Help us understand your needs better"

Create six selectable cards:

1. Live healthier
2. Relieve pressure
3. Try new things
4. Be more focused
5. Better relationship
6. Sleep better

Grid:

2 columns

3 rows

12dp gap

20dp horizontal padding

Card:

#252A34

Radius:

12

Selected:

#2563EB

Selected card contains a white circular check badge.

Multiple selections must be allowed.

Tapping an already selected card deselects it.

Add subtle press animation:

scale 1 → 0.96 → 1

Use Reanimated.

NEXT navigates to S04.

---

# 12. ONBOARDING — S04

Title:

"Choose the first habit that you'd like to build"

Preset habits:

- Sleep over 8h
- Have a healthy meal
- Drink 8 cups of water
- Workout
- Walking

Each item:

height ~52dp

background #252A34

rounded 12dp

left icon

white title

Selected item should visually stand out.

Provide:

"Or type your own"

Text input.

When input has text, display circular blue confirmation button.

Example custom habit:

"Drink 8 glasses of water a day"

Buttons:

SKIP
NEXT

NEXT proceeds to PlanGenerator.

SKIP also proceeds to PlanGenerator.

Store selected habit locally.

---

# 13. PLAN GENERATOR — S05

Create a full-screen loading experience.

Title:

"Generating your habit plan..."

Circular progress:

200dp diameter

12dp stroke

Track:

#252A34

Active:

#3B82F6

Center percentage:

36px ExtraBold

Progress sequence:

0
20
60
71
100

Messages:

20%:
"Analyzing your time schedule..."

60%:
"Selecting habits for your target..."

71%:
"Preparing your first habit..."

100%:
"Finished!"

At 100%:

Title becomes:

"Everything is done!"

Animate the progress using Reanimated/SVG.

Total animation should be approximately 3.5 seconds.

Use smooth easing.

Text should cross-fade between messages.

When progress reaches 100% automatically navigate to Value Proposition.

Do not require user interaction.

---

# 14. VALUE PROPOSITION — S06

Build the marketing/value screen.

Hero image area:

approximately 40% screen height.

If exact reference assets are unavailable, use a visually appropriate local placeholder/illustration rather than breaking the layout.

Title:

"Meet the better you"

Subtitle:

"Enjoy your journey of becoming a better you"

Benefits:

1. Plan daily routine with a habit list
2. Regulate your life with smart reminders
3. Join scientifically designed journeys
4. Keep your streak and consolidate results

Each row:

left icon

right text

Primary CTA:

"START NOW!"

Button:

full width minus 40dp

height 54dp

radius 27dp

background #3B82F6

START NOW navigates to Today.

---

# 15. TODAY SCREEN — S07

This is the primary application screen.

Header:

TODAY

Date:

Use the current date dynamically.

Example:

Aug 18

Right side:

circular plus button.

Calendar strip:

SUN
MON
TUE
WED
THU
FRI
SAT

Highlight selected day.

Selected day uses blue highlight/underline.

Allow horizontal date interaction.

Local state should update selected date.

---

# 16. TIME FILTERS

Create horizontally scrollable filter chips:

MORNING
AFTERNOON
EVENING

Selected chip:

#2563EB

White text.

Unselected:

dark surface

gray text

Each chip may contain an appropriate Lucide icon.

Filtering should work against local habit data.

Also support ANYTIME habits where appropriate.

---

# 17. HABIT CARD

Create reusable HabitCard.

Example:

"drink 8 glass of water a day"

Appearance:

background #2563EB

white text

left circular checkbox

habit icon

overflow button on right

Completed state:

- checkbox becomes checked
- check animation
- title gets strikethrough
- card becomes darker
- show "Finished"
- show small check icon

Use Reanimated for completion animation.

Add haptic feedback if a suitable package is already available.

Do not introduce unnecessary dependencies just for haptics.

---

# 18. HABIT ACTION MENU

When user taps "..." on a habit:

show floating popover.

Options:

UNDO
TAKE A NOTE
EDIT

The popover should:

- appear near the habit card
- have dark surface
- rounded corners
- subtle elevation/shadow
- dismiss when tapping outside

UNDO:

If completed, mark incomplete.

TAKE A NOTE:

Open note UI.

EDIT:

Open edit habit UI.

---

# 19. CREATE NEW HABIT

When user taps:

"CREATE A NEW HABIT"

or the top "+" button:

open a habit creation screen/modal/bottom sheet.

The source documentation strongly infers this behavior.

Build a polished habit creation UI.

Include:

- habit title input
- icon selection
- time-of-day selection
- optional reminder UI placeholder
- save button
- cancel/close

Reminder scheduling must NOT be implemented.

The UI can show reminder configuration, but it should be clearly local/mock state only.

Saving creates a local habit.

The new habit must immediately appear in Today.

---

# 20. JOURNEY SCREEN — S08

Header:

"JOURNEY"

Section:

"RECOMMENDED FOR YOU"

Horizontal carousel.

Example card:

"WALK EVERYDAY FOR HEALTH"

Badge:

"30 Days"

Use visually rich image cards.

If source images are unavailable:

use bundled placeholder assets or gradients.

Do not use broken remote image URLs.

Next section:

"ALL JOURNEYS"

Vertical list.

Use:

- Bedtime ritual for a sweet sleep
- Say goodbye to sugar
- Meditation for peace of mind
- Self confidence booster
- Fasting to lose weight easily
- Less phone, more progress
- Energy-boosting morning routine
- Keep fit at the office

Each card:

large image/background

dark overlay

title

rounded corners

Tap should navigate to JourneyDetail.

---

# 21. JOURNEY DETAIL

The original documentation says the exact detail page was not visible.

Therefore create a reasonable polished detail screen consistent with the existing design system.

Include:

- hero image
- journey title
- duration
- description
- list of included habits
- START JOURNEY button

This is UI-only.

Do not implement backend enrollment.

---

# 22. HISTORY — S09

Header:

"HISTORY"

Top tabs:

Calendar
All Habits
Achievements

Active tab:

white

blue bottom indicator

Inactive:

gray

Switch content without breaking bottom navigation.

---

# 23. HISTORY METRIC CARDS

Create horizontally scrollable cards.

Card 1:

CURRENT STREAK

0

Best Streak: 0

Blue:

#2563EB

Card 2:

HABIT FINISHED

0

This week: 0

Red:

#EF4444

Card 3:

COMPLETION RATE

0%

0/1 habits

Yellow:

#F59E0B

Card 4:

PERFECT DAYS

0

This week: 0

Green:

#10B981

Metric numbers use:

36px ExtraBold.

---

# 24. HISTORY CALENDAR

Create a monthly calendar.

Example:

August 2026

Week labels:

S M T W T F S

Use dark card background:

#1E232A

Allow:

- previous month
- next month
- date selection

Completed habit days should have an appropriate visual indicator.

The calendar must remain usable on small devices.

---

# 25. ALL HABITS HISTORY

Top:

ACTIVE (1)

Section:

ANYTIME

Show habit cards.

Use local habit state.

Allow tapping a habit to open detail/edit UI.

Support archived/inactive visual state if useful.

No backend.

---

# 26. ACHIEVEMENTS

Header:

"My achievements"

If no achievements:

"You haven't got any achievements yet."

Categories:

Habits Finished
Perfect Days
Best Streak

Show badge grid.

Initial badges can be disabled/grayed out.

Examples:

Finish Habit for The First Time
10 Times
20 Times
3 Perfect Days
3 Days Streak

Badges should have polished locked/unlocked visual states.

---

# 27. ME SCREEN — S10

Header:

"ME"

Backup card:

"Backup & Restore"

"Sign in and synchronize your data"

Use sync icon.

This is UI-only.

Do not implement authentication or synchronization.

Premium CTA:

"GO PREMIUM"

Blue button/card.

Crown icon.

Tapping it opens PremiumScreen.

---

# 28. ME SETTINGS

Settings:

Notification
General settings
Language Options
Share with friends
Rate us
Feedback

Each row:

- icon
- title
- chevron
- dark rounded surface

Notification screen:

UI only.

Do NOT implement push notifications.

Show settings such as:

- Daily reminder
- Reminder time
- Habit reminders
- Enable reminders

These are mock/local UI controls only.

Do not request notification permissions.

---

# 29. GENERAL SETTINGS

Create a polished settings screen.

Possible UI:

- Appearance
- Start of week
- Sound
- Haptic feedback
- Confirm completion

Use local state.

No backend.

---

# 30. LANGUAGE SETTINGS

Create a language selection screen.

Display:

English
Urdu
Spanish
French
German

The UI only needs to work visually at this stage.

Do not implement a complete localization architecture unless it can be done cleanly without slowing the main UI implementation.

---

# 31. SHARE / RATE / FEEDBACK

Share:

Create a UI action that can use the native share sheet only if trivial to support.

Rate:

UI-only placeholder is acceptable.

Feedback:

Create feedback screen with:

- title
- text input
- send button

Do not implement backend submission.

---

# 32. PREMIUM SCREEN

The exact premium pricing is unknown in the source documentation.

Therefore:

DO NOT invent real pricing or subscription behavior.

Create a UI-only premium screen containing:

- hero section
- benefits
- premium features
- CTA
- close/back button

The CTA can set local mock `isPremium = true` for UI testing.

Do not connect to App Store or Google Play billing.

---

# 33. LOCAL STATE

Use Zustand.

Create state for:

User:

wakeTime
endTime
targets
isPremium

Habits:

id
title
timeOfDay
completedDates
streakCount
iconName

Selected date.

Selected time filter.

Onboarding state.

History state can be derived from habits.

Example:

interface HabitItem {
  id: string;
  title: string;
  timeOfDay:
    | 'MORNING'
    | 'AFTERNOON'
    | 'EVENING'
    | 'ANYTIME';
  completedDates: string[];
  streakCount: number;
  iconName: string;
}

Do not couple state to API responses.

The store should be easy to replace/extend when the Next.js backend is introduced later.

---

# 34. MOCK DATA

Create realistic initial mock data.

Example:

Habit:

Drink 8 cups of water

timeOfDay:

MORNING

Other mock habits can include:

- Morning walk
- Read 10 pages
- Meditate for 10 minutes
- Sleep before 11 PM

Use enough data to demonstrate:

- Today list
- completed state
- filters
- history
- streak metrics
- achievements

Do not hardcode the UI so tightly that it only works for one habit.

---

# 35. RESPONSIVE DESIGN

The application must work on:

small iPhones
large iPhones
Android phones

Do not assume a specific device width.

Use:

Dimensions / useWindowDimensions

where appropriate.

Avoid:

absolute positioning for primary layout.

Absolute positioning is acceptable for:

- badges
- floating buttons
- overlays
- selected indicators
- decorative elements

---

# 36. SAFE AREA

Use SafeAreaView or react-native-safe-area-context.

Bottom tab navigation must respect bottom safe area.

Onboarding buttons must not overlap home indicators.

Keyboard screens must avoid input being hidden behind the keyboard.

---

# 37. ANIMATION REQUIREMENTS

Use Reanimated.

Required animations:

1. Onboarding goal selection
2. Plan generator progress
3. Plan generator text transitions
4. Habit completion
5. Bottom tab transitions where appropriate
6. Modal presentation
7. Habit menu appearance
8. Calendar/date selection where appropriate

Animations must feel subtle and premium.

Avoid excessive animations.

---

# 38. ICONS

Use:

lucide-react-native

Prefer:

Calendar
BookOpen
BarChart3
User
ChevronLeft
ChevronRight
Plus
Check
MoreHorizontal
Sun
Moon
CloudSun
Bell
Settings
Globe
Share2
Star
Pencil
Crown
RefreshCw
CircleCheck
Lock
ArrowLeft

Do not manually draw simple icons.

---

# 39. ACCESSIBILITY

Interactive controls must have:

- accessible labels
- sensible hit areas
- sufficient contrast

Buttons should generally have at least a comfortable touch target.

Do not sacrifice the visual design.

---

# 40. NO PUSH NOTIFICATIONS

THIS IS VERY IMPORTANT.

Do NOT:

- request notification permissions
- configure Firebase messaging
- configure Expo notifications
- schedule local notifications
- create notification channels
- configure APNs
- configure FCM

The Notification settings screen may exist visually, but all controls are local/mock only.

Push notification implementation will happen later.

---

# 41. NO BACKEND

Do NOT create:

- Next.js
- API routes
- GraphQL
- REST endpoints
- PostgreSQL
- Prisma
- authentication server
- cloud sync

The React Native application should work entirely with mock/local state.

---

# 42. NO PAYMENT IMPLEMENTATION

Premium screen is UI-only.

Do not integrate:

- RevenueCat
- Google Play Billing
- StoreKit
- Stripe

A local mock premium toggle is acceptable for testing UI states.

---

# 43. ERROR PREVENTION

Before creating a new component:

Check whether an equivalent reusable component already exists.

Do not duplicate:

- buttons
- cards
- headers
- checkboxes
- spacing
- colors
- typography
- icons

Before completing each phase:

Run:

TypeScript check

Then:

lint

Then:

application build/start check.

Fix errors immediately.

Do not move to the next phase with known compile errors.

---

# 44. UI QUALITY STANDARD

The final application should look like a production-quality mobile application.

Avoid:

- default React Native styling
- unstyled TextInput
- random colors
- inconsistent corner radii
- inconsistent typography
- unnecessary borders
- excessive shadows
- placeholder-looking buttons
- broken image layouts
- clipped text
- awkward spacing
- oversized icons

Every screen should feel part of the same design system.

---

# 45. SCREEN ACCEPTANCE CHECKLIST

## S01

- [ ] Dark background
- [ ] Progress indicator
- [ ] Correct title
- [ ] Correct subtitle
- [ ] Time wheel
- [ ] Selected time state
- [ ] NEXT button
- [ ] Restore link
- [ ] Navigation works

## S02

- [ ] Back button
- [ ] Progress indicator
- [ ] Time wheel
- [ ] NEXT button
- [ ] Navigation works

## S03

- [ ] 6 goal cards
- [ ] 2-column layout
- [ ] Multi-select
- [ ] Check badge
- [ ] Selection animation
- [ ] NEXT

## S04

- [ ] Preset habits
- [ ] Custom input
- [ ] Selected state
- [ ] SKIP
- [ ] NEXT

## S05

- [ ] Circular progress
- [ ] Percentage
- [ ] Dynamic text
- [ ] Smooth animation
- [ ] Automatic transition

## S06

- [ ] Hero section
- [ ] Title
- [ ] Subtitle
- [ ] Four benefits
- [ ] START NOW
- [ ] Navigation to Today

## S07

- [ ] TODAY header
- [ ] Date
- [ ] Plus button
- [ ] Date strip
- [ ] Morning filter
- [ ] Afternoon filter
- [ ] Evening filter
- [ ] Habit cards
- [ ] Checkbox interaction
- [ ] Completion animation
- [ ] Overflow menu
- [ ] Create habit

## S08

- [ ] JOURNEY header
- [ ] Recommended carousel
- [ ] All Journeys
- [ ] Journey cards
- [ ] Journey detail navigation

## S09

- [ ] HISTORY header
- [ ] Calendar tab
- [ ] All Habits tab
- [ ] Achievements tab
- [ ] Metric cards
- [ ] Calendar
- [ ] Achievement badges

## S10

- [ ] ME header
- [ ] Backup card
- [ ] Premium CTA
- [ ] Settings rows
- [ ] Version text

---

# 46. EXACT MAIN NAVIGATION

Bottom tabs must always be:

TODAY
JOURNEY
HISTORY
ME

Do not add a fifth tab.

Do not replace these with drawer navigation.

---

# 47. PRODUCT NAMING

Application name:

Mindset Tracker

Use this name in:

- app title where appropriate
- onboarding restore copy
- internal comments
- documentation
- UI references

Do not rename source screen concepts unnecessarily.

---

# 48. FUTURE BACKEND COMPATIBILITY

Although there is no backend in this phase:

Design interfaces so the following can later be loaded from a Next.js API:

- user profile
- habits
- habit completion history
- journeys
- achievements
- premium status
- settings

Do not put API calls directly inside presentation components.

Use store/service abstraction.

For now, services may return mock/local data.

---

# 49. FINAL DELIVERABLE

At the end of the UI implementation:

The app must launch successfully.

A fresh user should be able to:

App launch
→ Wake Time
→ Bed Time
→ Goals
→ First Habit
→ Plan Generator
→ Value Proposition
→ Today

From Today:

→ complete habit
→ undo habit
→ open habit menu
→ create habit
→ edit habit
→ take note
→ switch date
→ filter habits

Bottom navigation:

Today
→ Journey
→ History
→ Me

History:

Calendar
→ All Habits
→ Achievements

Me:

→ Premium
→ Notification Settings UI
→ General Settings
→ Language Settings
→ Feedback

All of this must work with local/mock state.

---

# 50. IMPORTANT UNKNOWN AREAS

The source documentation explicitly states that some parts were not visible in the original reference:

- Restore existing data exact behavior
- Individual Journey detail exact layout
- Achievement badge detail exact behavior
- Premium pricing
- Backend synchronization payload
- Some settings behavior

Do NOT pretend these are known.

For these areas:

create a polished UI consistent with the existing design system.

Do not invent backend behavior.

---

# 51. DEVELOPMENT ORDER

Execute implementation in this exact order.

## STEP 1

Inspect the existing project.

Determine:

- Expo or bare React Native
- existing dependencies
- existing navigation
- existing source structure
- TypeScript configuration

Do not destroy an existing working setup unnecessarily.

---

## STEP 2

Create the design system.

Implement:

colors
typography
spacing
dimensions
theme

Then create:

Button
Card
Input
Checkbox
Header
ScreenContainer

---

## STEP 3

Implement navigation.

Create:

RootNavigator
OnboardingNavigator
MainTabNavigator
TodayNavigator
JourneyNavigator
HistoryNavigator
MeNavigator

Make all routes type-safe.

---

## STEP 4

Implement onboarding:

S01
S02
S03
S04

Verify all interactions.

---

## STEP 5

Implement S05.

Verify:

0 → 20 → 60 → 71 → 100

Then automatic navigation.

---

## STEP 6

Implement S06.

Verify START NOW.

---

## STEP 7

Implement Today.

Verify:

date selection
filters
habit completion
menu
undo
note
edit
create habit

---

## STEP 8

Implement Journey.

Verify:

horizontal carousel
vertical list
detail navigation

---

## STEP 9

Implement History.

Verify:

Calendar
All Habits
Achievements

---

## STEP 10

Implement Me.

Verify:

settings navigation
premium UI
feedback UI
notification UI
language UI

---

## STEP 11

Add animation polish.

---

## STEP 12

Perform final QA.

Test:

- iOS
- Android
- small screen
- large screen
- empty habit state
- multiple habits
- completed habits
- navigation back behavior
- keyboard behavior
- modal dismissal
- scrolling
- date changes
- filters

---

# 52. FINAL RULE

DO NOT stop after creating static screens.

The UI must be interactive.

Every documented interaction that can be implemented locally must work.

The user should be able to experience the complete application flow without a backend.

Backend, authentication, notifications, synchronization, and payments will be implemented in a future phase.

For this phase, focus on:

PIXEL-ACCURATE UI
+
NAVIGATION
+
LOCAL MOCK STATE
+
INTERACTIONS
+
ANIMATIONS
+
RESPONSIVE DESIGN

Build Mindset Tracker as a polished production-quality React Native application.