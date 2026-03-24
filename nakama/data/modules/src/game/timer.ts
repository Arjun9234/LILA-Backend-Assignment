import { TURN_TIME_LIMIT_MS, DISCONNECT_GRACE_PERIOD_MS } from '../utils/constants';

export class TurnTimer {
  static readonly TURN_TIME_LIMIT = TURN_TIME_LIMIT_MS;
  static readonly GRACE_PERIOD = DISCONNECT_GRACE_PERIOD_MS;

  static hasTimedOut(turnStartTime: number, currentTime: number): boolean {
    return (currentTime - turnStartTime) >= this.TURN_TIME_LIMIT;
  }

  static getRemainingTime(turnStartTime: number, currentTime: number): number {
    const elapsed = currentTime - turnStartTime;
    return Math.max(0, this.TURN_TIME_LIMIT - elapsed);
  }

  static isWithinGracePeriod(disconnectTime: number, currentTime: number): boolean {
    return (currentTime - disconnectTime) < this.GRACE_PERIOD;
  }
}
