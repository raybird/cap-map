import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ElementRef, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppState } from '../store/app.state';
import * as TimelineActions from '../store/actions/timeline.actions';
import { selectPeriods, selectCurrentPeriodId, selectTimelineLoading, selectTimelineError } from '../store/selectors/timeline.selectors';
import { Subscription, Observable } from 'rxjs';

@Component({
  selector: 'app-timeline',
  templateUrl: './timeline.component.html',
  styleUrls: ['./timeline.component.css'],
  standalone: false
})
export class TimelineComponent implements OnInit, OnDestroy {
  @ViewChild('scrollContainer') scrollContainer!: ElementRef;

  periods$!: Observable<any[]>;
  currentPeriodId$!: Observable<string | null>;
  loading$!: Observable<boolean>;
  error$!: Observable<string | null>;
  events$!: Observable<any[]>;

  minYear = -5000;
  maxYear = 2025;
  pixelsPerYear = 5;
  trackWidth = (this.maxYear - this.minYear) * this.pixelsPerYear;

  yearTicks: { year: number; label: string; major: boolean }[] = [];

  private subscriptions: Subscription[] = [];

  constructor(
    private store: Store<AppState>,
  ) {
    this.generateYearTicks();
  }

  ngOnInit(): void {
    this.store.dispatch(TimelineActions.loadTimelinePeriods());

    this.periods$ = this.store.select(selectPeriods);
    this.currentPeriodId$ = this.store.select(selectCurrentPeriodId);
    this.loading$ = this.store.select(selectTimelineLoading);
    this.error$ = this.store.select(selectTimelineError);

    const periodSub = this.currentPeriodId$.subscribe(periodId => {
      console.log('Period changed to:', periodId);
    });
    this.subscriptions.push(periodSub);
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  getPixelPosition(year: number): number {
    return (year - this.minYear) * this.pixelsPerYear;
  }

  getPixelWidth(startYear: number, endYear: number): number {
    return Math.max(40, (endYear - startYear) * this.pixelsPerYear);
  }

  getEventYear(event: any): number {
    return parseInt(event.date?.start?.split('-')[0]) || this.minYear;
  }

  getEventColor(event: any): string {
    return '#c41e3a';
  }

  onPeriodChange(periodId: string): void {
    this.store.dispatch(TimelineActions.setCurrentPeriod({ periodId }));
  }

  onEventClick(event: any): void {
    // Dispatch to select event
  }

  onScroll(): void {
    // Track scroll position for syncing
  }

  getPeriodLabel(period: any): string {
    return period.label || period.id;
  }

  private generateYearTicks(): void {
    this.yearTicks = [];
    for (let year = this.minYear; year <= this.maxYear; year += 500) {
      this.yearTicks.push({
        year,
        label: year < 0 ? `公元前${Math.abs(year)}` : `${year}年`,
        major: year % 1000 === 0
      });
    }
  }
}