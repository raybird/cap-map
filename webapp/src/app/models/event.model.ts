export interface EventLocation {
  name: string;
  coordinates: [number, number]; // [lat, lng]
  adminDivisions: string[];
}

export interface EventDate {
  start: string;
  end: string;
  period: string;
  periodId: string;
}

export interface ExamRelevance {
  importance: 'high' | 'medium' | 'low';
  questionTypes: string[];
  textbookReferences: string[];
}

export interface HistoricalEvent {
  id: string;
  title: string;
  description: string;
  date: EventDate;
  location: EventLocation;
  categories: string[];
  keywords: string[];
  relatedEvents: string[];
  examRelevance: ExamRelevance;
}
