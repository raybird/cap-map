import { Component, OnInit } from '@angular/core';
import { EventService } from './services/event.service';
import { TimelineService } from './services/timeline.service';

@Component({
  selector: 'app-root',
  standalone: false,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'cap-map';
  showExamMode = false;

  constructor(
    private eventService: EventService,
    private timelineService: TimelineService
  ) {}

  ngOnInit(): void {
    this.eventService.loadEvents();
    this.timelineService.loadTimelinePeriods();
  }

  toggleExamMode(): void {
    this.showExamMode = !this.showExamMode;
  }
}
