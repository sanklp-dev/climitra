// Indian State Adjacency Model
// Maps each state to its neighboring states for geographic supplier discovery

export const STATE_ADJACENCY: Record<string, string[]> = {
  "Andhra Pradesh": ["Telangana", "Karnataka", "Tamil Nadu", "Odisha", "Chhattisgarh"],
  "Arunachal Pradesh": ["Assam", "Nagaland"],
  "Assam": ["Arunachal Pradesh", "Nagaland", "Manipur", "Mizoram", "Tripura", "Meghalaya", "West Bengal"],
  "Bihar": ["Uttar Pradesh", "Jharkhand", "West Bengal"],
  "Chhattisgarh": ["Madhya Pradesh", "Maharashtra", "Telangana", "Andhra Pradesh", "Odisha", "Jharkhand", "Uttar Pradesh"],
  "Goa": ["Maharashtra", "Karnataka"],
  "Gujarat": ["Maharashtra", "Madhya Pradesh", "Rajasthan"],
  "Haryana": ["Punjab", "Himachal Pradesh", "Uttar Pradesh", "Rajasthan", "Delhi"],
  "Himachal Pradesh": ["Jammu and Kashmir", "Punjab", "Haryana", "Uttarakhand"],
  "Jharkhand": ["Bihar", "West Bengal", "Odisha", "Chhattisgarh", "Uttar Pradesh"],
  "Karnataka": ["Maharashtra", "Goa", "Kerala", "Tamil Nadu", "Andhra Pradesh", "Telangana"],
  "Kerala": ["Karnataka", "Tamil Nadu"],
  "Madhya Pradesh": ["Rajasthan", "Uttar Pradesh", "Chhattisgarh", "Maharashtra", "Gujarat"],
  "Maharashtra": ["Gujarat", "Madhya Pradesh", "Chhattisgarh", "Telangana", "Karnataka", "Goa"],
  "Manipur": ["Assam", "Nagaland", "Mizoram"],
  "Meghalaya": ["Assam"],
  "Mizoram": ["Assam", "Manipur", "Tripura"],
  "Nagaland": ["Assam", "Arunachal Pradesh", "Manipur"],
  "Odisha": ["West Bengal", "Jharkhand", "Chhattisgarh", "Andhra Pradesh"],
  "Punjab": ["Jammu and Kashmir", "Himachal Pradesh", "Haryana", "Rajasthan"],
  "Rajasthan": ["Punjab", "Haryana", "Uttar Pradesh", "Madhya Pradesh", "Gujarat"],
  "Sikkim": ["West Bengal"],
  "Tamil Nadu": ["Kerala", "Karnataka", "Andhra Pradesh"],
  "Telangana": ["Maharashtra", "Chhattisgarh", "Andhra Pradesh", "Karnataka"],
  "Tripura": ["Assam", "Mizoram"],
  "Uttar Pradesh": ["Uttarakhand", "Himachal Pradesh", "Haryana", "Rajasthan", "Madhya Pradesh", "Chhattisgarh", "Jharkhand", "Bihar", "Delhi"],
  "Uttarakhand": ["Himachal Pradesh", "Uttar Pradesh"],
  "West Bengal": ["Sikkim", "Bihar", "Jharkhand", "Odisha", "Assam"],
  "Delhi": ["Haryana", "Uttar Pradesh"],
  "Jammu and Kashmir": ["Himachal Pradesh", "Punjab"],
};

export const ALL_STATES = Object.keys(STATE_ADJACENCY).sort();

export function getAdjacentStates(state: string): string[] {
  return STATE_ADJACENCY[state] || [];
}

export function getStateWithAdjacent(state: string): string[] {
  return [state, ...getAdjacentStates(state)];
}

// Approximate state center coordinates for map view
export const STATE_COORDINATES: Record<string, { lat: number; lng: number }> = {
  "Andhra Pradesh": { lat: 15.9129, lng: 79.74 },
  "Arunachal Pradesh": { lat: 28.218, lng: 94.7278 },
  "Assam": { lat: 26.2006, lng: 92.9376 },
  "Bihar": { lat: 25.0961, lng: 85.3131 },
  "Chhattisgarh": { lat: 21.2787, lng: 81.8661 },
  "Goa": { lat: 15.2993, lng: 74.124 },
  "Gujarat": { lat: 22.2587, lng: 71.1924 },
  "Haryana": { lat: 29.0588, lng: 76.0856 },
  "Himachal Pradesh": { lat: 31.1048, lng: 77.1734 },
  "Jharkhand": { lat: 23.6102, lng: 85.2799 },
  "Karnataka": { lat: 15.3173, lng: 75.7139 },
  "Kerala": { lat: 10.8505, lng: 76.2711 },
  "Madhya Pradesh": { lat: 22.9734, lng: 78.6569 },
  "Maharashtra": { lat: 19.7515, lng: 75.7139 },
  "Manipur": { lat: 24.6637, lng: 93.9063 },
  "Meghalaya": { lat: 25.467, lng: 91.3662 },
  "Mizoram": { lat: 23.1645, lng: 92.9376 },
  "Nagaland": { lat: 26.1584, lng: 94.5624 },
  "Odisha": { lat: 20.9517, lng: 85.0985 },
  "Punjab": { lat: 31.1471, lng: 75.3412 },
  "Rajasthan": { lat: 27.0238, lng: 74.2179 },
  "Sikkim": { lat: 27.533, lng: 88.5122 },
  "Tamil Nadu": { lat: 11.1271, lng: 78.6569 },
  "Telangana": { lat: 18.1124, lng: 79.0193 },
  "Tripura": { lat: 23.9408, lng: 91.9882 },
  "Uttar Pradesh": { lat: 26.8467, lng: 80.9462 },
  "Uttarakhand": { lat: 30.0668, lng: 79.0193 },
  "West Bengal": { lat: 22.9868, lng: 87.855 },
  "Delhi": { lat: 28.7041, lng: 77.1025 },
  "Jammu and Kashmir": { lat: 33.7782, lng: 76.5762 },
};

export const LEAD_CATEGORIES = [
  { value: "traditional_charcoal", label: "Traditional Charcoal Manufacturers" },
  { value: "maize_processing", label: "Maize Seed Processing Units" },
  { value: "artisanal_biochar", label: "Low-Tech Kon-Tiki / Artisanal Biochar Producers" },
  { value: "other_charcoal_mfg", label: "Other Charcoal-Producing Manufacturing Units" },
  { value: "briquette_torrefied", label: "Briquette & Torrefied Briquette Manufacturers" },
] as const;
