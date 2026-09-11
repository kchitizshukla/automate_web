// UI taxonomy & marketing content (not domain data — domain data comes from the API).

export interface ServiceCategory {
  key: string;
  label: string;
  icon: string;
  blurb: string;
  gradient: string; // tailwind gradient classes
}

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  { key: 'General Service', label: 'Periodic Service', icon: '🧰', blurb: 'Scheduled maintenance & checkups', gradient: 'from-indigo-500 to-violet-500' },
  { key: 'Oil Change', label: 'Oil Change', icon: '🛢️', blurb: 'Engine oil & filter replacement', gradient: 'from-amber-500 to-orange-500' },
  { key: 'Brake Repair', label: 'Brake Repair', icon: '🛞', blurb: 'Pads, discs & brake fluid', gradient: 'from-rose-500 to-red-500' },
  { key: 'Tyre Replacement', label: 'Tyres & Wheels', icon: '⚙️', blurb: 'Balancing, alignment & fitting', gradient: 'from-slate-600 to-slate-800' },
  { key: 'Battery', label: 'Battery', icon: '🔋', blurb: 'Testing, jumpstart & replacement', gradient: 'from-emerald-500 to-teal-500' },
  { key: 'AC Service', label: 'AC Service', icon: '❄️', blurb: 'Gas refill, cooling & cleaning', gradient: 'from-sky-500 to-cyan-500' },
  { key: 'Engine Diagnostics', label: 'Diagnostics', icon: '🔍', blurb: 'Scan, detect & fix faults', gradient: 'from-fuchsia-500 to-purple-500' },
  { key: 'Bodywork', label: 'Denting & Painting', icon: '🎨', blurb: 'Body repair & premium finish', gradient: 'from-pink-500 to-rose-500' },
];

export interface Offer {
  title: string;
  desc: string;
  code: string;
  gradient: string;
  icon: string;
}

export const OFFERS: Offer[] = [
  { title: 'Flat 20% OFF', desc: 'On your first periodic service booking', code: 'FIRST20', gradient: 'from-indigo-600 via-violet-600 to-sky-500', icon: '🎉' },
  { title: 'Free Wash & Detail', desc: 'With any brake or AC service this month', code: 'SHINE', gradient: 'from-emerald-600 via-teal-600 to-cyan-500', icon: '🚿' },
  { title: '₹500 Cashback', desc: 'On payments above ₹3,000 via wallet', code: 'CASH500', gradient: 'from-amber-600 via-orange-600 to-rose-500', icon: '💸' },
];

// Hero / banner background imagery (Unsplash). Overlaid with a dark gradient so it
// always degrades gracefully to the slate base if a request fails.
export const IMG = {
  hero: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1600&q=60',
  garage: 'https://images.unsplash.com/photo-1530046339160-ce3e530c7d2f?auto=format&fit=crop&w=1200&q=60',
};
