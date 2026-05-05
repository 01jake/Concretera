import { Injectable, ApplicationRef } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ChangeDetectionService {
  constructor(private appRef: ApplicationRef) {}

  tick() {
    this.appRef.tick();
  }
}