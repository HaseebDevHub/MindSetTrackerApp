import type {Journey} from '../types/models';

export const journeys: Journey[] = [
  {id: 'walk', title: 'Walk everyday for health', duration: '30 Days', description: 'Build a sustainable walking routine that improves energy, mood, and heart health.', habits: ['Take a 10 minute walk', 'Reach your daily step goal', 'Stretch after walking'], colors: ['#2563EB', '#0EA5E9']},
  {id: 'sleep', title: 'Bedtime ritual for a sweet sleep', duration: '14 Days', description: 'Wind down consistently and make restorative sleep your nightly priority.', habits: ['No screens before bed', 'Prepare tomorrow', 'Sleep before 11 PM'], colors: ['#4338CA', '#7C3AED']},
  {id: 'sugar', title: 'Say goodbye to sugar', duration: '21 Days', description: 'Reset your palate with practical, gentle daily choices.', habits: ['Skip sugary drinks', 'Choose a whole-food snack', 'Read one nutrition label'], colors: ['#DC2626', '#F97316']},
  {id: 'meditation', title: 'Meditation for peace of mind', duration: '14 Days', description: 'Create calm and improve focus through a short daily practice.', habits: ['Breathe for one minute', 'Meditate for 10 minutes', 'Write one reflection'], colors: ['#0891B2', '#10B981']},
  {id: 'confidence', title: 'Self confidence booster', duration: '21 Days', description: 'Strengthen a kinder and more confident relationship with yourself.', habits: ['Name one strength', 'Do one brave thing', 'Celebrate a small win'], colors: ['#DB2777', '#9333EA']},
  {id: 'fasting', title: 'Fasting to lose weight easily', duration: '30 Days', description: 'Explore structured eating windows mindfully and gradually.', habits: ['Plan today’s meals', 'Hydrate regularly', 'Log your eating window'], colors: ['#D97706', '#65A30D']},
  {id: 'phone', title: 'Less phone, more progress', duration: '14 Days', description: 'Reclaim your attention with intentional boundaries.', habits: ['Phone-free first hour', 'One focused work block', 'Park phone before bed'], colors: ['#475569', '#2563EB']},
  {id: 'morning', title: 'Energy-boosting morning routine', duration: '21 Days', description: 'Start your day with momentum, clarity, and energy.', habits: ['Drink water', 'Move for 5 minutes', 'Choose today’s priority'], colors: ['#EA580C', '#F59E0B']},
  {id: 'office', title: 'Keep fit at the office', duration: '14 Days', description: 'Add healthy movement to even the busiest workday.', habits: ['Stand every hour', 'Take a walking break', 'Stretch your shoulders'], colors: ['#059669', '#0D9488']},
];
