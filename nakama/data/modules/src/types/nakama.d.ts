// Minimal Nakama runtime type definitions
declare namespace nkruntime {
  interface Context {
    env: { [key: string]: string };
    executionMode: string;
    matchId: string;
    userId: string;
    username: string;
    sessionId: string;
  }

  interface Logger {
    debug(format: string, ...args: any[]): void;
    info(format: string, ...args: any[]): void;
    warn(format: string, ...args: any[]): void;
    error(format: string, ...args: any[]): void;
  }

  interface Nakama {
    matchCreate(module: string, params?: any): string;
    storageRead(keys: StorageReadRequest[]): StorageObject[];
    storageWrite(writes: StorageWriteRequest[]): StorageWriteAck[];
    storageDelete(deletes: StorageDeleteRequest[]): void;
    storageList(userId: string, collection: string, limit: number, cursor: string): StorageObjectList;
    leaderboardCreate(id: string, authoritative: boolean, sortOrder: string, operator: string, resetSchedule: string): void;
    leaderboardRecordWrite(id: string, ownerId: string, username?: string, score?: number, subscore?: number, metadata?: any): LeaderboardRecord;
    leaderboardRecordsList(id: string, ownerIds?: string[], limit?: number, cursor?: string, overrideExpiry?: number): LeaderboardRecordList;
    accountGetId(userId: string): Account;
  }

  interface Account {
    user: User;
    wallet: string;
    email: string;
    devices: any[];
    customId: string;
    verifyTime: number;
    disableTime: number;
  }

  interface User {
    userId: string;
    username: string;
    displayName: string;
    avatarUrl: string;
    langTag: string;
    location: string;
    timezone: string;
    metadata: { [key: string]: any };
    facebookId: string;
    googleId: string;
    gamecenterId: string;
    steamId: string;
    online: boolean;
    edgeCount: number;
    createTime: number;
    updateTime: number;
  }

  interface Initializer {
    registerRpc(id: string, fn: RpcFunction): void;
    registerMatch(name: string, handlers: MatchHandler): void;
    registerBeforeRt(id: string, fn: RtBeforeFunction): void;
    registerAfterRt(id: string, fn: RtAfterFunction): void;
  }

  interface MatchDispatcher {
    broadcastMessage(opCode: number, data: string | Uint8Array, presences?: Presence[] | null, sender?: Presence | null, reliable?: boolean): void;
    broadcastMessageDeferred(opCode: number, data: string | Uint8Array, presences?: Presence[] | null, sender?: Presence | null, reliable?: boolean): void;
    matchKick(presences: Presence[]): void;
    matchLabelUpdate(label: string): void;
  }

  interface Match {
    matchId: string;
    label: MatchLabel;
    size: number;
  }

  interface MatchLabel {
    open?: boolean;
    [key: string]: any;
  }

  interface Presence {
    userId: string;
    sessionId: string;
    username: string;
    node: string;
  }

  interface MatchMessage {
    sender: Presence;
    opCode: number;
    data: Uint8Array;
    reliable: boolean;
    receiveTime: number;
  }

  interface StorageReadRequest {
    collection: string;
    key: string;
    userId: string;
  }

  interface StorageWriteRequest {
    collection: string;
    key: string;
    userId: string;
    value: { [key: string]: any };  // Nakama expects object, handles JSON serialization
    version?: string;
    permissionRead?: number;
    permissionWrite?: number;
  }

  interface StorageDeleteRequest {
    collection: string;
    key: string;
    userId: string;
    version?: string;
  }

  interface StorageObject {
    collection: string;
    key: string;
    userId: string;
    value: { [key: string]: any };  // Nakama returns parsed object
    version: string;
    permissionRead: number;
    permissionWrite: number;
    createTime: number;
    updateTime: number;
  }

  interface StorageObjectList {
    objects: StorageObject[];
    cursor: string;
  }

  interface StorageWriteAck {
    collection: string;
    key: string;
    userId: string;
    version: string;
  }

  interface LeaderboardRecord {
    leaderboardId: string;
    ownerId: string;
    username: string;
    score: number;
    subscore: number;
    numScore: number;
    metadata: any;
    createTime: number;
    updateTime: number;
    expiryTime: number;
    rank: number;
    maxNumScore: number;
  }

  interface LeaderboardRecordList {
    records: LeaderboardRecord[];
    ownerRecords: LeaderboardRecord[];
    nextCursor: string;
    prevCursor: string;
  }

  type RpcFunction = (
    ctx: Context,
    logger: Logger,
    nk: Nakama,
    payload: string
  ) => string;

  type RtBeforeFunction = (
    ctx: Context,
    logger: Logger,
    nk: Nakama,
    envelope: any
  ) => any;

  type RtAfterFunction = (
    ctx: Context,
    logger: Logger,
    nk: Nakama,
    envelope: any
  ) => void;

  interface MatchHandler {
    matchInit: (
      ctx: Context,
      logger: Logger,
      nk: Nakama,
      params: { [key: string]: any }
    ) => { state: any; tickRate: number; label: string };

    matchJoinAttempt: (
      ctx: Context,
      logger: Logger,
      nk: Nakama,
      dispatcher: MatchDispatcher,
      tick: number,
      state: any,
      presence: Presence,
      metadata: { [key: string]: any }
    ) => { state: any; accept: boolean; rejectMessage?: string } | null;

    matchJoin: (
      ctx: Context,
      logger: Logger,
      nk: Nakama,
      dispatcher: MatchDispatcher,
      tick: number,
      state: any,
      presences: Presence[]
    ) => { state: any } | null;

    matchLeave: (
      ctx: Context,
      logger: Logger,
      nk: Nakama,
      dispatcher: MatchDispatcher,
      tick: number,
      state: any,
      presences: Presence[]
    ) => { state: any } | null;

    matchLoop: (
      ctx: Context,
      logger: Logger,
      nk: Nakama,
      dispatcher: MatchDispatcher,
      tick: number,
      state: any,
      messages: MatchMessage[]
    ) => { state: any } | null;

    matchTerminate: (
      ctx: Context,
      logger: Logger,
      nk: Nakama,
      dispatcher: MatchDispatcher,
      tick: number,
      state: any,
      graceSeconds: number
    ) => { state: any } | null;

    matchSignal: (
      ctx: Context,
      logger: Logger,
      nk: Nakama,
      dispatcher: MatchDispatcher,
      tick: number,
      state: any,
      data: string
    ) => { state: any; data?: string } | null;
  }
}

// Module initialization
declare function InitModule(
  ctx: nkruntime.Context,
  logger: nkruntime.Logger,
  nk: nkruntime.Nakama,
  initializer: nkruntime.Initializer
): void;
