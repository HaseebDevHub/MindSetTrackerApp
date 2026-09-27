# Progressive Journey plans

Reviewed 2026-09-26. All nine durations are retained. These are structured practice challenges, not treatment programs or promises of permanent habit formation. Introduction dates and small task durations are editorial choices; no source validates this exact sequence. Foundations repeat after introduction, with at most three tasks per day (four for mornings).

| Journey | Progression | Rationale and limits |
| --- | --- | --- |
| Walking · 30 days | Day 1 comfortable walk; day 4 gentle stretch; day 8 a little extra movement | WHO supports starting with achievable movement and reducing inactivity. Shorter walks count; no universal step target. Stretching is a gentle comfort activity, not a claim to prevent injuries. |
| Sleep · 14 days | Day 1 screen-free wind-down; day 4 prepare tomorrow; day 7 consistent bedtime | CDC recommends consistent sleep timing and switching devices off at least 30 minutes before bed. Preparation is practical support, not a sleep treatment. Avoid a universal 11 PM deadline or fixed eight-hour requirement. |
| Sugar · 21 days | Day 1 swap one sugary drink; day 5 whole-food snack; day 10 read a label | NHS recommends reducing free sugars with manageable swaps and checking labels. This is not eliminating fruit, carbohydrates, or all sugar. |
| Meditation · 14 days | Day 1 natural breathing for a minute; day 5 brief seated practice; day 9 reflection | NCCIH reports mixed evidence and possible negative experiences. Keep practice short and stop if distressed; no forced breathing or promise of treating anxiety. Reflection is a supportive exercise. |
| Confidence · 21 days | Day 1 recognize a strength; day 4 acknowledge a win; day 8 small challenge | NHS guidance includes recognizing positives, self-kindness and achievable challenges. No guarantee of psychological improvement. |
| Balanced eating · 30 days | Day 1 plan balanced meals; day 5 regular hydration; day 12 notice hunger/fullness | Replaces the old fasting/effortless weight-loss framing. NHS supports balanced meals and hydration; NIDDK describes fasting risks with diabetes and medication. No fasting window, calorie target, skipped meal or weight-loss promise. Hunger reflection is awareness, not a restriction rule. Persisted `fasting` IDs are retained. |
| Phone use · 14 days | Day 1 ten minutes without scrolling; day 5 quiet focus block; day 9 park phone before bed | A randomized trial supports reducing continuous mobile internet exposure, but its two-week blocking intervention is not equivalent to our lighter tasks. CDC supports reducing bedtime device use. Essential calls remain available. |
| Morning · 21 days | Day 1 water; day 2 balanced breakfast; day 6 gentle movement; day 12 one priority | NHS supports hydration and balanced breakfasts; WHO supports manageable movement. Timing water immediately after waking has no special claimed benefit. Priority-setting is organizational support. |
| Office · 14 days | Day 1 break up sitting; day 4 walking break; day 8 gentle shoulder movement | WHO recommends reducing sedentary time. Seated movement is explicitly included. No claim that these tasks alone meet activity guidelines. |

## Sources

- [WHO: Physical activity](https://www.who.int/news-room/fact-sheets/detail/physical-activity): any movement counts, gradually increase activity, limit sedentary time. Applies to walking, office and morning plans.
- [CDC: About sleep](https://www.cdc.gov/sleep/about/): consistent bed/wake times and reducing bedtime device exposure. Applies to sleep and phone plans.
- [NHS: How to cut down on sugar](https://www.nhs.uk/live-well/eat-well/how-to-eat-a-balanced-diet/how-to-cut-down-on-sugar-in-your-diet/): gradual substitutions and label awareness.
- [NHS: Eight tips for healthy eating](https://www.nhs.uk/live-well/eat-well/how-to-eat-a-balanced-diet/eight-tips-for-healthy-eating/): balanced food, breakfast and fluids. Applies to morning and balanced eating.
- [NCCIH: Meditation and mindfulness, effectiveness and safety](https://www.nccih.nih.gov/health/meditation-and-mindfulness-effectiveness-and-safety): evidence limitations and possible distress.
- [NHS: Raising low self-esteem](https://www.nhs.uk/mental-health/self-help/tips-and-support/raise-low-self-esteem/): strengths, kindness and challenges.
- [NIDDK: Fasting safely with diabetes](https://www.niddk.nih.gov/health-information/professionals/diabetes-discoveries-practice/fasting-safely-with-diabetes): risks of fasting and medication adjustments; rationale for avoiding prescribed fasting in a general app.
- [Castelo et al., PNAS Nexus (2025)](https://doi.org/10.1093/pnasnexus/pgaf017): randomized mobile-internet-blocking trial. Supports the broad direction of reducing constant access, not the efficacy of our exact task schedule.

## State and compatibility

`journeyPlans.ts` owns reusable task definitions and deterministic daily ID assignments. Task IDs and Journey IDs remain unchanged. `getJourneyDays` resolves an enrollment's requirements and calendar dates; analytics and screen rows use this same resolver.

Database schema 7 adds nullable `plan_version`. Newly created enrollments use version 1. Existing enrollments and old backups use version 0 and retain their original three daily requirements, so a previously partial day cannot become complete simply because the progressive Day 1 requires one task. The new breakfast does not enter legacy morning requirements. Historical task records are retained. Content wording is updated for safety in both versions. Removing and re-adding a Journey preserves its enrollment, original start date, plan version and history, matching existing product behavior.

Completion remains keyed by enrollment ID + local date key + task ID. UI and store reject past/future edits. The store validates current-day assignment and rechecks the clock after queued writes. The UI prevents duplicate taps while a save is pending; failed saves show the existing error toast without optimistic completion. Date keys use existing local calendar helpers, never UTC conversion of an instant. Focus, foreground and periodic checks refresh the local date while the screen is mounted.

The original summary reports current-day progress. The grid counts fully completed days; consistency divides completed assigned tasks by elapsed assigned opportunities. Ending the configured duration retains the existing completed/read-only behavior even with missed days. Backups retain plan version and accept schema 5/6/7, rejecting unknown versions.

## Validation

- `npm run typecheck`: passed.
- `npm run lint`: passed without warnings.
- `npm test -- --watch=false`: 50 suites, 299 tests passed.
- Progression/date tests: 18 passed under each of `TZ=America/Los_Angeles` and `TZ=Asia/Karachi`, including DST, leap-day and year boundaries.
- No stale data-module imports, flat `journey.habits` references, hardcoded component colors or untyped `any` additions remain.
- Android emulator: existing version-0 enrollment remained intact after schema migration; completion survived full app termination/relaunch and was then undone. New morning enrollment showed one task on Day 1, water plus breakfast on Day 2, increasing requirements on later days, and 1/21 finished after completing Day 1. Future preview controls stayed disabled and unchecked. Removal returned to Journey Home successfully.
- Inspected native screenshots for English/dark, English/light and Urdu/light: mirrored header, grid, date layout, icons, checkboxes and long text; no overlapping rows. Expanded and collapsed actual FlashList rows repeatedly. No ReactNativeJS warnings/errors from the app process during these checks. Automated renderer tests also cover Urdu/dark.
- Restored the original English/dark settings, undid test completions, and removed the newly started test Journey using the existing menu. Removal retains its archived enrollment by design.

No reference screenshots were attached or found in the workspace, so visual matching is based on the written requirements. iOS-specific validation remains unperformed because Xcode's simulator tools are unavailable here.
