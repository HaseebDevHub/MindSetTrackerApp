# Progressive Journey plans

Updated 2026-09-27. All nine existing program durations are retained. New enrollments use plan version 2. All supported enrollments, including missing-version, version 0 and version 1 records, now use the current progressive schedule. Enrollment IDs, start dates and recorded completions are preserved, including after removal, reactivation and backup restoration.

## Schedule for all enrollments

| Program day | Daily habits |
| --- | --- |
| 1 | 1 |
| 2–4 | 2 |
| 5–7 | 3 |
| 8–15 | 4 |
| 16–30 | 5 |

Every introduced habit repeats daily, in introduction order. Days 12–15 continue the four-habit stage. Programs stop at their existing duration: 14-day programs end with four habits; 21- and 30-day programs reach five. Day 26 does not introduce another habit.

This pacing is a product design choice, not a clinically validated habit-formation deadline. Tasks are general wellbeing practices, not treatment or guaranteed outcomes.

## Habits in introduction order

| Program | Duration | Day 1 → day 2 → day 5 → day 8 → day 16 |
| --- | --- | --- |
| Walking | 30 days | Comfortable walk → extra movement → gentle stretch → break up sitting → plan the next walk |
| Sleep | 14 days | Screen-free wind-down → prepare tomorrow → consistent bedtime → consistent wake time |
| Added sugar | 21 days | Swap a sugary drink → whole-food snack → read a label → lower-sugar breakfast → less sugary sauce |
| Meditation | 14 days | Natural breathing → short meditation → reflection → notice surroundings |
| Confidence | 21 days | Name a strength → small brave step → celebrate a win → kinder self-talk → express a need |
| Balanced eating | 30 days | Plan meals → hydration → hunger/fullness awareness → vegetables → wholegrain option |
| Phone use | 14 days | Phone-free morning minutes → focus block → park phone at bedtime → quiet nonessential notifications |
| Morning | 21 days | Water → balanced breakfast → gentle movement → daily priority → regular wake time |
| Office | 14 days | Break up sitting → walking break → shoulder stretch → screen break |

Practical planning tasks support the routines; evidence for broad health guidance does not establish effectiveness of this exact sequence. No calorie targets, mandatory fasting windows, universal step goals, or promises of permanent habit formation are added. Existing persisted IDs remain unchanged.

## Research basis

Sources reviewed on 2026-09-27:

- [WHO: Every move counts](https://www.who.int/news/item/25-11-2020-every-move-counts-towards-better-health-says-who): achievable movement and reducing sedentary time underpin walking, office and morning tasks. Planning a route is organizational support.
- [CDC: About sleep](https://www.cdc.gov/sleep/about/): consistent sleep/wake times, reducing bedtime device use, and a restful bedroom inform sleep and morning additions.
- [NHS: How to cut down on sugar](https://www.nhs.uk/live-well/eat-well/how-to-eat-a-balanced-diet/how-to-cut-down-on-sugar-in-your-diet/): gradual substitutions, less sugary cereals/sauces and label awareness inform sugar tasks.
- [NHS: Eight tips for healthy eating](https://www.nhs.uk/live-well/eat-well/how-to-eat-a-balanced-diet/eight-tips-for-healthy-eating/): vegetables, wholegrains, hydration and breakfast inform eating and morning tasks.
- [NHS: Mindfulness](https://www.nhs.uk/mental-health/self-help/tips-and-support/mindfulness/): noticing everyday sensations informs the meditation additions. The existing short meditation includes stopping if distressed.
- [NHS: Raising low self-esteem](https://www.nhs.uk/mental-health/self-help/tips-and-support/raise-low-self-esteem/): strengths, self-kindness, manageable challenges and assertiveness inform confidence tasks.
- [Harvard Health: Staying focused in the era of digital distractions](https://www.health.harvard.edu/healthy-aging-and-longevity/staying-focused-in-the-era-of-digital-distractions): distracting alerts inform quieting nonessential notifications. Essential calls remain available.
- [HSE: Work routine and breaks](https://www.hse.gov.uk/msd/dse/work-routine.htm): screen breaks inform the office addition.

## Shared scheduling and compatibility

`journeyPlans.ts` owns task definitions and the current schedule. `getJourneyDayTasks` accepts versions 0, 1 and 2 and resolves all of them using introduction days 1, 2, 5, 8 and 16; missing enrollment versions are treated as version 0. Unknown versions return no assigned tasks. The old schedule selection has been removed. Morning breakfast remains second in the new schedule without reordering the original task definitions.

New enrollments save version 2 using the existing nullable `plan_version` column. No schema migration is required. Backup validation accepts versions 0, 1 and 2, and continues rejecting unknown versions. Rejoining an archived enrollment retains its version and start date.

`ActiveJourneyScreen`, day cards, progress grid and store write validation share the same resolver. The schedule is not separately implemented in the UI. Local calendar days determine the current requirements. Completion remains keyed by enrollment, local date and task ID; yesterday's checks never check today's tasks. Past/future editing restrictions, pending-save guards, error handling, pagination, RTL and existing styles remain unchanged.

Daily percentage remains completed assigned habits divided by today's assigned habits. The finished-days count requires every assigned habit to be checked. Streak and consistency use the current assigned requirements. Historical percentages and finished-day counts may change under the revised schedule. Stored checkmarks for tasks that are not assigned on their recorded day are retained but excluded from progress calculations.

New task titles and descriptions are localized in English, French, German, Spanish and Urdu. Regression tests cover every day of every program across all supported enrollment versions, additive ordering, existing checkmark retention, per-habit percentages, daily check reset, completion boundaries and backup version validation. Native device interaction has not been revalidated for this schedule update.
