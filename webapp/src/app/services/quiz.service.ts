import { Injectable } from '@angular/core';

export interface QuizQuestion {
  id: string;
  type: 'period' | 'location' | 'keyword' | 'sequence';
  question: string;
  options: string[];
  correctAnswer: string;
}

@Injectable({ providedIn: 'root' })
export class QuizService {

  generateQuestions(event: any, allEvents: any[]): QuizQuestion[] {
    if (!event) return [];
    const questions: QuizQuestion[] = [];

    const periodQ = this.buildPeriodQuestion(event);
    if (periodQ) questions.push(periodQ);

    const locationQ = this.buildLocationQuestion(event, allEvents);
    if (locationQ) questions.push(locationQ);

    const keywordQ = this.buildKeywordQuestion(event);
    if (keywordQ) questions.push(keywordQ);

    const sequenceQ = this.buildSequenceQuestion(event, allEvents);
    if (sequenceQ) questions.push(sequenceQ);

    return this.shuffle(questions).slice(0, 3);
  }

  private buildPeriodQuestion(event: any): QuizQuestion | null {
    if (!event.date?.period) return null;
    const correct = event.date.period;
    const pool = ['史前時代', '荷西時期', '鄭氏時期', '清治時期', '日治時期', '戰後時期', '民主化時期', '當代'];
    const distractors = this.shuffle(pool.filter(p => p !== correct)).slice(0, 3);
    const options: string[] = this.shuffle([...distractors, correct]);
    return {
      id: `period-${event.id}`,
      type: 'period',
      question: `「${event.title}」發生於哪個時期？`,
      options,
      correctAnswer: correct
    };
  }

  private buildLocationQuestion(event: any, allEvents: any[]): QuizQuestion | null {
    if (!event.location?.name) return null;
    const correct = event.location.name;
    const others = allEvents
      .filter(e => e.id !== event.id && e.location?.name && e.location.name !== correct)
      .map(e => e.location.name);
    const picked: string[] = this.shuffle([...new Set(others)]).slice(0, 3);
    if (picked.length < 3) return null;
    const options: string[] = this.shuffle([...picked, correct]);
    return {
      id: `location-${event.id}`,
      type: 'location',
      question: `「${event.title}」發生在何處？`,
      options,
      correctAnswer: correct
    };
  }

  private buildKeywordQuestion(event: any): QuizQuestion | null {
    const keywords = event.keywords || [];
    if (keywords.length === 0) return null;
    const correct: string = this.pickRandom(keywords) as string;
    const pool = ['荷蘭', '清朝', '日本', '民主化', '抗日', '原住民', '貿易', '移民', '現代化', '土地改革', '戒嚴', '學運', '經濟', '農業', '戰爭', '殖民', '工業化', '選舉'];
    const filtered: string[] = pool.filter(k => !keywords.includes(k));
    const picked: string[] = this.shuffle(filtered).slice(0, 3);
    const options: string[] = this.shuffle([...picked, correct]);
    return {
      id: `keyword-${event.id}`,
      type: 'keyword',
      question: `以下哪個關鍵詞與「${event.title}」最相關？`,
      options,
      correctAnswer: correct
    };
  }

  private buildSequenceQuestion(event: any, allEvents: any[]): QuizQuestion | null {
    const eventYear = this.parseYear(event.date?.start);
    if (eventYear === null) return null;

    const next = allEvents
      .filter(e => e.id !== event.id)
      .map(e => ({ event: e, year: this.parseYear(e.date?.start) }))
      .filter(e => e.year !== null && e.year > eventYear)
      .sort((a, b) => (a.year as number) - (b.year as number))[0]?.event;

    if (!next) return null;
    const correct = next.title;

    const distractors: string[] = this.shuffle(
      allEvents
        .filter(e => e.id !== event.id && e.id !== next.id)
        .map(e => e.title)
    ).slice(0, 3);
    if (distractors.length < 3) return null;

    const options: string[] = this.shuffle([...distractors, correct]);
    return {
      id: `sequence-${event.id}`,
      type: 'sequence',
      question: `「${event.title}」之後緊接著哪個事件？`,
      options,
      correctAnswer: correct
    };
  }

  private parseYear(dateStr: string | undefined): number | null {
    if (!dateStr) return null;
    if (dateStr.startsWith('-')) {
      const year = parseInt(dateStr.substring(1).split('-')[0], 10);
      return isNaN(year) ? null : -year;
    }
    const year = parseInt(dateStr.split('-')[0], 10);
    return isNaN(year) ? null : year;
  }

  private shuffle<T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  private pickRandom(arr: any[]): string {
    return arr[Math.floor(Math.random() * arr.length)] as string;
  }
}