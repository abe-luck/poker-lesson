import { createDeck, cryptoRng, shuffle } from "./cards";
import { compareHands, evaluateBest } from "./evaluator";
import { buildPots } from "./pots";
import type {
  Action,
  AwardedPot,
  Blinds,
  Card,
  CpuLevel,
  GameState,
  HandRank,
  LegalActions,
  LogEntry,
  Mode,
  Player,
  Rng,
} from "./types";

export const MIN_PLAYERS = 2;
export const MAX_PLAYERS = 6;

export type NewGameOptions = {
  mode: Mode;
  players: { id: string; name: string; isHuman: boolean; cpuLevel?: CpuLevel }[];
  startingStack: number;
  blinds: Blinds;
  /** 最初のハンドのディーラー位置 (省略時 0) */
  dealerIndex?: number;
};

export type StartHandOptions = {
  rng?: Rng;
  /** 配る順に並べた山札 (先頭から配る)。チュートリアルとテスト用 */
  deck?: Card[];
};

export function createGame(options: NewGameOptions): GameState {
  const { players, startingStack, blinds } = options;
  if (players.length < MIN_PLAYERS || players.length > MAX_PLAYERS) {
    throw new Error(`プレイヤーは${MIN_PLAYERS}〜${MAX_PLAYERS}人にしてください`);
  }
  return {
    mode: options.mode,
    blinds: { ...blinds },
    handNumber: 0,
    street: "preflop",
    isHandOver: true,
    deck: [],
    board: [],
    players: players.map((p) => ({
      ...p,
      stack: startingStack,
      holeCards: [],
      currentBet: 0,
      totalBet: 0,
      hasActed: false,
      status: "active",
    })),
    dealerIndex: options.dealerIndex ?? 0,
    toActIndex: null,
    currentBet: 0,
    minRaise: blinds.big,
    log: [],
    result: null,
  };
}

// ---------- 席まわりのヘルパー ----------

const inHand = (p: Player) => p.status !== "out";
const canAct = (p: Player) => p.status === "active";
const isContending = (p: Player) => p.status === "active" || p.status === "allin";

/** from の次の席から時計回りに探す (from 自身は最後に調べる) */
function nextIndex(players: Player[], from: number, predicate: (p: Player) => boolean): number | null {
  for (let k = 1; k <= players.length; k++) {
    const i = (from + k) % players.length;
    if (predicate(players[i])) return i;
  }
  return null;
}

/** ディーラーの左から時計回りの席順 */
function seatOrderFromDealer(state: GameState): Player[] {
  const n = state.players.length;
  return Array.from({ length: n }, (_, k) => state.players[(state.dealerIndex + 1 + k) % n]);
}

function needsToAct(state: GameState, player: Player): boolean {
  if (!canAct(player)) return false;
  if (player.currentBet < state.currentBet) return true;
  // 額はそろっていても、まだ行動していなければ番が回る (相手が行動できる場合のみ)
  return !player.hasActed && state.players.filter(canAct).length >= 2;
}

function draw(state: GameState): Card {
  const card = state.deck.shift();
  if (!card) throw new Error("山札がありません");
  return card;
}

function commit(player: Player, totalForStreet: number) {
  const paid = totalForStreet - player.currentBet;
  player.stack -= paid;
  player.currentBet = totalForStreet;
  player.totalBet += paid;
  if (player.stack === 0) player.status = "allin";
  return paid;
}

function pushLog(state: GameState, player: Player, type: LogEntry["type"], paid: number) {
  state.log.push({ street: state.street, playerId: player.id, type, paid, total: player.currentBet });
}

// ---------- ハンドの開始 ----------

export function startHand(prev: GameState, options: StartHandOptions = {}): GameState {
  if (!prev.isHandOver) throw new Error("前のハンドが終わっていません");
  const state = structuredClone(prev);

  for (const p of state.players) {
    p.holeCards = [];
    p.currentBet = 0;
    p.totalBet = 0;
    p.hasActed = false;
    p.status = p.stack > 0 ? "active" : "out";
  }
  const seatedCount = state.players.filter(inHand).length;
  if (seatedCount < MIN_PLAYERS) throw new Error("チップを持っているプレイヤーが足りません");

  // 2ハンド目以降はディーラーを次の人へ
  if (state.handNumber > 0 || !inHand(state.players[state.dealerIndex])) {
    state.dealerIndex = nextIndex(state.players, state.dealerIndex, inHand)!;
  }

  state.handNumber += 1;
  state.street = "preflop";
  state.isHandOver = false;
  state.board = [];
  state.log = [];
  state.result = null;
  state.deck = options.deck ? [...options.deck] : shuffle(createDeck(), options.rng ?? cryptoRng);

  // ヘッズアップ (2人) ではディーラーがスモールブラインド
  const sb = seatedCount === 2 ? state.dealerIndex : nextIndex(state.players, state.dealerIndex, inHand)!;
  const bb = nextIndex(state.players, sb, inHand)!;
  for (const [index, amount, type] of [
    [sb, state.blinds.small, "smallBlind"],
    [bb, state.blinds.big, "bigBlind"],
  ] as const) {
    const player = state.players[index];
    const paid = commit(player, Math.min(amount, player.stack));
    pushLog(state, player, type, paid);
  }

  // ディーラーの左から1枚ずつ2周配る
  for (let round = 0; round < 2; round++) {
    let i = state.dealerIndex;
    for (let k = 0; k < seatedCount; k++) {
      i = nextIndex(state.players, i, inHand)!;
      state.players[i].holeCards.push(draw(state));
    }
  }

  state.currentBet = state.blinds.big;
  state.minRaise = state.blinds.big;
  state.toActIndex = nextIndex(state.players, bb, (p) => needsToAct(state, p));
  return state.toActIndex === null ? closeStreet(state) : state;
}

// ---------- 行動 ----------

export function getLegalActions(state: GameState): LegalActions | null {
  if (state.isHandOver || state.toActIndex === null) return null;
  const player = state.players[state.toActIndex];
  const toCall = state.currentBet - player.currentBet;
  const maxTotal = player.currentBet + player.stack;
  const othersCanAct = state.players.some((p) => p !== player && canAct(p));

  let bet: LegalActions["bet"] = null;
  let raise: LegalActions["raise"] = null;
  if (othersCanAct && player.stack > 0) {
    if (state.currentBet === 0) {
      bet = { min: Math.min(state.blinds.big, maxTotal), max: maxTotal };
    } else if (!player.hasActed && maxTotal > state.currentBet) {
      raise = { min: Math.min(state.currentBet + state.minRaise, maxTotal), max: maxTotal };
    }
  }

  return {
    fold: true,
    check: toCall <= 0,
    call: toCall > 0 ? Math.min(toCall, player.stack) : null,
    bet,
    raise,
  };
}

export function applyAction(prev: GameState, action: Action): GameState {
  const legal = getLegalActions(prev);
  if (!legal) throw new Error("今は行動できません");

  const state = structuredClone(prev);
  const index = state.toActIndex!;
  const player = state.players[index];
  let paid = 0;

  const raiseTo = (total: number) => {
    const increment = total - state.currentBet;
    // フルレイズ (または最初のベット) なら、行動済みの人にも再びレイズの権利が戻る
    if (state.currentBet === 0 || increment >= state.minRaise) {
      state.minRaise = Math.max(increment, state.blinds.big);
      for (const p of state.players) if (p !== player) p.hasActed = false;
    }
    state.currentBet = total;
    return commit(player, total);
  };

  switch (action.type) {
    case "fold":
      player.status = "folded";
      break;
    case "check":
      if (!legal.check) throw new Error("チェックできません");
      break;
    case "call":
      if (legal.call === null) throw new Error("コールできません");
      paid = commit(player, player.currentBet + legal.call);
      break;
    case "bet":
    case "raise": {
      const range = action.type === "bet" ? legal.bet : legal.raise;
      const amount = action.amount;
      if (!range) throw new Error(action.type === "bet" ? "ベットできません" : "レイズできません");
      if (amount === undefined || !Number.isInteger(amount) || amount < range.min || amount > range.max) {
        throw new Error(`額は ${range.min}〜${range.max} の範囲で指定してください`);
      }
      paid = raiseTo(amount);
      break;
    }
    case "allin": {
      const total = player.currentBet + player.stack;
      if (player.stack === 0) throw new Error("チップがありません");
      if (total <= state.currentBet) {
        paid = commit(player, total);
      } else {
        if (!(legal.bet ?? legal.raise)) throw new Error("レイズできません");
        paid = raiseTo(total);
      }
      break;
    }
  }

  player.hasActed = true;
  const loggedType =
    player.status === "allin" && action.type !== "fold" && action.type !== "check" ? "allin" : action.type;
  pushLog(state, player, loggedType, paid);

  const contenders = state.players.filter(isContending);
  if (contenders.length === 1) {
    returnUncalledBet(state);
    return finishByFold(state, contenders[0]);
  }
  state.toActIndex = nextIndex(state.players, index, (p) => needsToAct(state, p));
  return state.toActIndex === null ? closeStreet(state) : state;
}

// ---------- ストリートの終了とショーダウン ----------

/** 誰にもコールされなかった分を、出した本人に返す */
function returnUncalledBet(state: GameState) {
  const sorted = [...state.players].sort((a, b) => b.currentBet - a.currentBet);
  const [top, second] = sorted;
  const excess = top.currentBet - (second?.currentBet ?? 0);
  if (excess <= 0) return;
  top.stack += excess;
  top.currentBet -= excess;
  top.totalBet -= excess;
  if (top.status === "allin") top.status = "active";
}

function closeStreet(state: GameState): GameState {
  returnUncalledBet(state);

  for (;;) {
    for (const p of state.players) {
      p.currentBet = 0;
      p.hasActed = false;
    }
    state.currentBet = 0;
    state.minRaise = state.blinds.big;

    if (state.street === "river") return showdown(state);

    draw(state); // バーン
    if (state.street === "preflop") {
      state.board.push(draw(state), draw(state), draw(state));
      state.street = "flop";
    } else {
      state.board.push(draw(state));
      state.street = state.street === "flop" ? "turn" : "river";
    }

    state.toActIndex = nextIndex(state.players, state.dealerIndex, (p) => needsToAct(state, p));
    // 行動できる人がいなければ (オールイン同士など) 次のカードを続けて開く
    if (state.toActIndex !== null) return state;
  }
}

function endHand(state: GameState, pots: AwardedPot[], showdown: { playerId: string; hand: HandRank }[]) {
  const payouts = new Map<string, number>();
  for (const pot of pots) {
    const share = Math.floor(pot.amount / pot.winnerIds.length);
    const remainder = pot.amount - share * pot.winnerIds.length;
    // 割り切れない端数は、ディーラーの左から数えて最初の勝者へ
    pot.winnerIds.forEach((id, i) => {
      payouts.set(id, (payouts.get(id) ?? 0) + share + (i < remainder ? 1 : 0));
    });
  }
  for (const [id, amount] of payouts) {
    state.players.find((p) => p.id === id)!.stack += amount;
  }

  state.result = {
    pots,
    payouts: [...payouts].map(([playerId, amount]) => ({ playerId, amount })),
    showdown,
  };
  state.isHandOver = true;
  state.toActIndex = null;
  return state;
}

function finishByFold(state: GameState, winner: Player): GameState {
  const amount = state.players.reduce((sum, p) => sum + p.totalBet, 0);
  return endHand(state, [{ amount, eligiblePlayerIds: [winner.id], winnerIds: [winner.id] }], []);
}

function showdown(state: GameState): GameState {
  state.street = "showdown";
  const order = seatOrderFromDealer(state);
  const contenders = order.filter(isContending);
  const hands = new Map(contenders.map((p) => [p.id, evaluateBest([...p.holeCards, ...state.board])]));

  const pots = buildPots(
    state.players.map((p) => ({ playerId: p.id, totalBet: p.totalBet, folded: !isContending(p) })),
  ).map((pot) => {
    const eligible = pot.eligiblePlayerIds.length > 0 ? pot.eligiblePlayerIds : contenders.map((p) => p.id);
    const best = eligible.map((id) => hands.get(id)!).reduce((a, b) => (compareHands(a, b) >= 0 ? a : b));
    const winnerIds = order
      .filter((p) => eligible.includes(p.id) && compareHands(hands.get(p.id)!, best) === 0)
      .map((p) => p.id);
    return { ...pot, winnerIds };
  });

  return endHand(
    state,
    pots,
    contenders.map((p) => ({ playerId: p.id, hand: hands.get(p.id)! })),
  );
}

/** ハンドの合間にチップを補充する (初心者モード用) */
export function rebuy(prev: GameState, playerId: string, amount: number): GameState {
  if (!prev.isHandOver) throw new Error("ハンドの途中では補充できません");
  const state = structuredClone(prev);
  const player = state.players.find((p) => p.id === playerId);
  if (!player) throw new Error("プレイヤーが見つかりません");
  player.stack = Math.max(player.stack, amount);
  if (player.status === "out") player.status = "active";
  return state;
}

// ---------- 状態の問い合わせ ----------

export function getPlayerToAct(state: GameState): Player | null {
  return state.toActIndex === null ? null : state.players[state.toActIndex];
}

export function getPotTotal(state: GameState): number {
  return state.players.reduce((sum, p) => sum + p.totalBet, 0);
}

/** 人間のチップが尽きたか、チップを持つ人が1人以下なら終了 */
export function isGameOver(state: GameState): boolean {
  if (!state.isHandOver) return false;
  const withChips = state.players.filter((p) => p.stack > 0);
  return withChips.length < MIN_PLAYERS || state.players.some((p) => p.isHuman && p.stack === 0);
}
