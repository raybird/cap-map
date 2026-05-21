import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const eventsPath = path.join(root, 'public/assets/data/events.json');
const timelinePath = path.join(root, 'public/assets/data/timeline.json');

const events = JSON.parse(fs.readFileSync(eventsPath, 'utf8'));
const periods = JSON.parse(fs.readFileSync(timelinePath, 'utf8'));

const periodMap = new Map(periods.map((period) => [period.id, period]));
const eventIds = new Set();
const errors = [];
const textbookRefPattern = /^社會科[七八九]年級[上下]冊 (臺灣史|臺灣近現代史|中國史|世界史)$/;

function parseYear(dateStr) {
  if (typeof dateStr !== 'string' || dateStr.length === 0) return null;
  if (dateStr.startsWith('-')) {
    const year = Number.parseInt(dateStr.slice(1).split('-')[0], 10);
    return Number.isNaN(year) ? null : -year;
  }
  const year = Number.parseInt(dateStr.split('-')[0], 10);
  return Number.isNaN(year) ? null : year;
}

for (const event of events) {
  if (!event.id || typeof event.id !== 'string') {
    errors.push('Event without valid id');
    continue;
  }

  if (eventIds.has(event.id)) {
    errors.push(`Duplicate event id: ${event.id}`);
  }
  eventIds.add(event.id);

  if (!event.title || !event.description) {
    errors.push(`Missing title or description: ${event.id}`);
  }

  if (!event.date?.start || !event.date?.end || !event.date?.periodId || !event.date?.period) {
    errors.push(`Missing date fields: ${event.id}`);
    continue;
  }

  const startYear = parseYear(event.date.start);
  const endYear = parseYear(event.date.end);
  if (startYear === null || endYear === null || startYear > endYear) {
    errors.push(`Invalid date range: ${event.id}`);
  }

  const matchedPeriod = periodMap.get(event.date.periodId);
  if (!matchedPeriod) {
    errors.push(`Unknown periodId ${event.date.periodId} on ${event.id}`);
  } else {
    if (matchedPeriod.label !== event.date.period) {
      errors.push(`Period label mismatch on ${event.id}: ${event.date.periodId} -> ${event.date.period}`);
    }
    const isPrehistory = event.date.periodId === 'prehistory';
    const startsTooEarly = startYear !== null && startYear < matchedPeriod.startYear;
    const startsTooLate = startYear !== null && startYear > matchedPeriod.endYear;
    if ((!isPrehistory && startsTooEarly) || startsTooLate) {
      errors.push(`Start year ${startYear} outside period ${event.date.periodId} on ${event.id}`);
    }
  }

  const coords = event.location?.coordinates;
  if (!Array.isArray(coords) || coords.length !== 2) {
    errors.push(`Invalid coordinates: ${event.id}`);
  } else {
    const [lat, lng] = coords;
    if (typeof lat !== 'number' || lat < -90 || lat > 90 || typeof lng !== 'number' || lng < -180 || lng > 180) {
      errors.push(`Coordinates out of range: ${event.id}`);
    }
  }

  if (!Array.isArray(event.relatedEvents)) {
    errors.push(`relatedEvents must be an array: ${event.id}`);
  }

  if (!Array.isArray(event.examRelevance?.textbookReferences) || event.examRelevance.textbookReferences.length === 0) {
    errors.push(`Missing textbookReferences: ${event.id}`);
  } else {
    for (const reference of event.examRelevance.textbookReferences) {
      if (!textbookRefPattern.test(reference)) {
        errors.push(`Invalid textbook reference on ${event.id}: ${reference}`);
      }
    }
  }
}

for (const event of events) {
  for (const relatedId of event.relatedEvents ?? []) {
    if (!eventIds.has(relatedId)) {
      errors.push(`Unknown related event ${relatedId} referenced by ${event.id}`);
    }
  }
}

if (errors.length > 0) {
  console.error('Event data validation failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Validated ${events.length} events across ${periods.length} periods.`);
