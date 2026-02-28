import { Innertube } from 'youtubei.js';

let youtubei;

// Singleton pattern to initialize Innertube only once per function instance
export const getYouTubei = async () => {
  if (!youtubei) {
    console.log('Initializing Innertube client for VN region...');
    youtubei = await Innertube.create({ location: 'VN' });
    console.log('Innertube client initialized.');
  }
  return youtubei;
};
