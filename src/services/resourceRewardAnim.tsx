export interface ResourceRewardBundle {
  id: string;
  coins?: number;
  gems?: number;
  totyTokens?: number;
  clubTokens?: number;
  libertadoresTokens?: number;
  unlockTickets?: number;
  tickets?: number;
}

type Listener = (current: ResourceRewardBundle | null) => void;

class ResourceRewardAnimService {
  private queue: ResourceRewardBundle[] = [];
  private active: ResourceRewardBundle | null = null;
  private listeners: Set<Listener> = new Set();
  private suppressReasons: Set<string> = new Set();

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    listener(this.active);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.active));
  }

  public setSuppressed(reason: string, suppressed: boolean) {
    if (suppressed) {
      this.suppressReasons.add(reason);
    } else {
      this.suppressReasons.delete(reason);
    }
  }

  public isSuppressed(): boolean {
    return this.suppressReasons.size > 0;
  }

  public enqueue(delta: Omit<ResourceRewardBundle, 'id'>) {
    if (this.isSuppressed()) return;

    const coins = Math.max(0, Math.floor(delta.coins ?? 0));
    const gems = Math.max(0, Math.floor(delta.gems ?? 0));
    const totyTokens = Math.max(0, Math.floor(delta.totyTokens ?? 0));
    const clubTokens = Math.max(0, Math.floor(delta.clubTokens ?? 0));
    const libertadoresTokens = Math.max(0, Math.floor(delta.libertadoresTokens ?? 0));
    const unlockTickets = Math.max(0, Math.floor(delta.unlockTickets ?? 0));
    const tickets = Math.max(0, Math.floor(delta.tickets ?? 0));

    if (
      coins <= 0 &&
      gems <= 0 &&
      totyTokens <= 0 &&
      clubTokens <= 0 &&
      libertadoresTokens <= 0 &&
      unlockTickets <= 0 &&
      tickets <= 0
    ) {
      return;
    }

    const bundle: ResourceRewardBundle = {
      id: `res_pack_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      coins: coins > 0 ? coins : undefined,
      gems: gems > 0 ? gems : undefined,
      totyTokens: totyTokens > 0 ? totyTokens : undefined,
      clubTokens: clubTokens > 0 ? clubTokens : undefined,
      libertadoresTokens: libertadoresTokens > 0 ? libertadoresTokens : undefined,
      unlockTickets: unlockTickets > 0 ? unlockTickets : undefined,
      tickets: tickets > 0 ? tickets : undefined,
    };

    if (!this.active) {
      this.active = bundle;
      this.notify();
    } else {
      // Merge into active or last queued bundle if triggered in the same tick
      this.queue.push(bundle);
    }
  }

  public dismissCurrent() {
    this.active = this.queue.shift() ?? null;
    this.notify();
  }
}

export const resourceRewardAnimService = new ResourceRewardAnimService();
