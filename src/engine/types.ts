export type Suit = "s" | "h" | "d" | "c";
/** 11=J, 12=Q, 13=K, 14=A */
export type Rank = 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
export type Card = { readonly rank: Rank; readonly suit: Suit };

/** 0 以上 1 未満の乱数を返す関数 */
export type Rng = () => number;

export type Street = "preflop" | "flop" | "turn" | "river" | "showdown";
export type Mode = "beginner" | "pro";
export type CpuLevel = "easy" | "normal" | "hard";
/** CPUの性格 (打ち方のくせ)。名前と説明は i18n の personas */
export type Persona = "cautious" | "aggressive" | "balanced" | "stubborn" | "tricky";

export type ActionType = "fold" | "check" | "call" | "bet" | "raise" | "allin";
/** bet / raise の amount は「このストリートで出す合計額」 */
export type Action = { type: ActionType; amount?: number };

export type PlayerStatus = "active" | "folded" | "allin" | "out";

export type Player = {
  id: string;
  name: string;
  isHuman: boolean;
  cpuLevel?: CpuLevel;
  persona?: Persona;
  stack: number;
  holeCards: Card[];
  /** このストリートで出した額 */
  currentBet: number;
  /** このハンドで出した合計 (サイドポット計算用) */
  totalBet: number;
  /** 最後のフルレイズ以降に行動したか */
  hasActed: boolean;
  status: PlayerStatus;
};

export type Blinds = { small: number; big: number };

export type Pot = { amount: number; eligiblePlayerIds: string[] };
export type AwardedPot = Pot & { winnerIds: string[] };

/** 0=ハイカード … 9=ロイヤルフラッシュ */
export type HandCategory = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type HandRank = {
  category: HandCategory;
  /** 同じ役どうしの比較用 (前から順に大きい方が強い) */
  tiebreak: number[];
  /** 役に使った5枚 (表示用に並べ替え済み) */
  bestFive: Card[];
};

export type LogEntry = {
  street: Street;
  playerId: string;
  type: ActionType | "smallBlind" | "bigBlind";
  /** この行動で出したチップ */
  paid: number;
  /** 行動後、このストリートで出している合計 */
  total: number;
};

export type HandResult = {
  pots: AwardedPot[];
  payouts: { playerId: string; amount: number }[];
  /** ショーダウンした人の役。全員が降りて決着した場合は空 */
  showdown: { playerId: string; hand: HandRank }[];
};

export type LegalActions = {
  fold: boolean;
  check: boolean;
  /** コールに必要な額 (足りなければ手持ち全部)。コール不要なら null */
  call: number | null;
  bet: { min: number; max: number } | null;
  raise: { min: number; max: number } | null;
};

export type GameState = {
  mode: Mode;
  blinds: Blinds;
  handNumber: number;
  street: Street;
  isHandOver: boolean;
  deck: Card[];
  board: Card[];
  players: Player[];
  dealerIndex: number;
  toActIndex: number | null;
  /** このストリートの最高額 */
  currentBet: number;
  /** 次のレイズで最低限上乗せする額 */
  minRaise: number;
  log: LogEntry[];
  result: HandResult | null;
};
