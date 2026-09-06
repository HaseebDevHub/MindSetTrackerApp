import type { ImageSourcePropType } from 'react-native';
import type { JourneyId } from '../types/models';

export const journeyImages: Record<JourneyId, ImageSourcePropType> = {
  walk: require('./assets/walkEveryDay.webp'),
  sleep: require('./assets/Bedtimeforsleep.webp'),
  sugar: require('./assets/saygoodbyetosugar.webp'),
  meditation: require('./assets/meditationforpeaceofmind.webp'),
  confidence: require('./assets/selfconfidencebooster.webp'),
  fasting: require('./assets/fastingtoloseweight.webp'),
  phone: require('./assets/lessphonemoreprogress.webp'),
  morning: require('./assets/energyboostingmorningroutine.webp'),
  office: require('./assets/keepfitatOffice.webp'),
};
