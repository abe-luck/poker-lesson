import type { HandCategory, LogEntry, Mode, Persona, Street, Suit } from "@/engine/types";
import type { Dictionary } from "./ja";

const n = (value: number) => value.toLocaleString("en-US");

const RANK_WORDS: Record<string, [string, string]> = {
  A: ["Ace", "Aces"],
  K: ["King", "Kings"],
  Q: ["Queen", "Queens"],
  J: ["Jack", "Jacks"],
  "10": ["Ten", "Tens"],
  "9": ["Nine", "Nines"],
  "8": ["Eight", "Eights"],
  "7": ["Seven", "Sevens"],
  "6": ["Six", "Sixes"],
  "5": ["Five", "Fives"],
  "4": ["Four", "Fours"],
  "3": ["Three", "Threes"],
  "2": ["Two", "Twos"],
};
const plural = (rank: string) => RANK_WORDS[rank]?.[1] ?? rank;
const single = (rank: string) => RANK_WORDS[rank]?.[0] ?? rank;
/** 文の途中の "You" は小文字にする */
const mid = (name: string) => (name === "You" ? "you" : name);
const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);
const ordinal = (i: number) => ["highest", "second-highest", "third-highest", "fourth-highest", "fifth-highest"][i] ?? `${i + 1}th-highest`;

const categoryNames = {
  0: "High Card",
  1: "One Pair",
  2: "Two Pair",
  3: "Three of a Kind",
  4: "Straight",
  5: "Flush",
  6: "Full House",
  7: "Four of a Kind",
  8: "Straight Flush",
  9: "Royal Flush",
} satisfies Record<HandCategory, string>;

export const en: Dictionary = {
  locale: "en",
  htmlLang: "en",
  formatChips: n,

  meta: {
    description: "Learn the rules while you play Texas Hold'em. Choose Beginner mode with a guide, or Pro mode with no hints.",
    titles: {
      play: "Choose a mode",
      setup: "Game setup",
      game: "Game",
      tutorial: "Tutorial",
      practice: "Practice",
      rules: "Rules",
      hands: "Hand rankings",
      stats: "Stats",
      settings: "Settings",
    },
  },

  common: {
    back: "Back",
    quit: "Quit",
    close: "Close",
    cancel: "Cancel",
    next: "Next",
    you: "You",
    loading: "Loading…",
    backToTop: "Back to top",
    hands: "Hands",
    rules: "Rules",
    rulesFull: "Rules",
    dealer: "Dealer",
    handNumber: (hand: number) => `Hand #${hand}`,
    handLabel: "Hand",
    blinds: "Blinds",
    disclaimer: "This is a game. No real money is involved.",
    modeNames: { beginner: "Beginner mode", pro: "Pro mode" } satisfies Record<Mode, string>,
    streetNames: { preflop: "Preflop", flop: "Flop", turn: "Turn", river: "River", showdown: "Showdown" } satisfies Record<Street, string>,
    signed: (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : "±"}${n(Math.abs(value))}`,
    list: (items: string[]) => (items.length <= 2 ? items.join(" and ") : `${items.slice(0, -1).join(", ")} and ${items.at(-1)}`),
    languageSwitch: { label: "日本語", href: "/" },
  },

  personas: {
    cautious: { name: "Emma", trait: "Cautious", description: "Folds quickly with weak hands" },
    aggressive: { name: "Leo", trait: "Aggressive", description: "Bets and raises often" },
    balanced: { name: "Mia", trait: "Balanced", description: "Plays hands at their strength" },
    stubborn: { name: "Sam", trait: "Stubborn", description: "Rarely folds and calls a lot" },
    tricky: { name: "Max", trait: "Tricky", description: "Bluffs even with weak hands" },
  } satisfies Record<Persona, { name: string; trait: string; description: string }>,

  cards: {
    suitNames: { s: "Spades", h: "Hearts", d: "Diamonds", c: "Clubs" } satisfies Record<Suit, string>,
    cardLabel: (suit: string, rank: string) => `${single(rank)} of ${suit}`,
    boardCount: (count: number) => `${count} board ${count === 1 ? "card" : "cards"}`,
  },

  hands: {
    categoryNames,
    categoryPhrase: (category: HandCategory) =>
      ["high card", "one pair", "two pair", "three of a kind", "a straight", "a flush", "a full house", "four of a kind", "a straight flush", "a royal flush"][category],
    name: (category: HandCategory, r0: string, r1: string) => {
      const name = categoryNames[category];
      switch (category) {
        case 1:
          return `${name} (${plural(r0)})`;
        case 2:
          return `${name} (${plural(r0)} and ${plural(r1)})`;
        case 6:
          return `${name} (${plural(r0)} full of ${plural(r1)})`;
        case 3:
        case 7:
          return `${name} (${plural(r0)})`;
        case 0:
        case 4:
        case 5:
        case 8:
          return `${name} (${single(r0)}-high)`;
        default:
          return name;
      }
    },
    preflopPair: (rank: string) => `One Pair (${plural(rank)})`,
    preflopHigh: (rank: string) => `High Card (${single(rank)}-high)`,
  },

  actions: {
    fold: "Fold",
    check: "Check",
    call: "Call",
    bet: "Bet",
    raise: "Raise",
    allin: "All-in",
    label: (entry: Pick<LogEntry, "type" | "paid" | "total">) => {
      switch (entry.type) {
        case "fold":
          return "Fold";
        case "check":
          return "Check";
        case "call":
          return `Call ${n(entry.paid)}`;
        case "bet":
          return `Bet ${n(entry.total)}`;
        case "raise":
          return `Raise to ${n(entry.total)}`;
        case "allin":
          return `All-in ${n(entry.total)}`;
        case "smallBlind":
          return `SB ${n(entry.paid)}`;
        case "bigBlind":
          return `BB ${n(entry.paid)}`;
      }
    },
    sentence: (name: string, entry: LogEntry) => {
      switch (entry.type) {
        case "fold":
          return `${name} folded`;
        case "check":
          return `${name} checked`;
        case "call":
          return `${name} called ${n(entry.paid)}`;
        case "bet":
          return `${name} bet ${n(entry.total)}`;
        case "raise":
          return `${name} raised to ${n(entry.total)}`;
        case "allin":
          return `${name} went all-in (${n(entry.total)})`;
        case "smallBlind":
          return `${name} posted the small blind of ${n(entry.paid)}`;
        case "bigBlind":
          return `${name} posted the big blind of ${n(entry.paid)}`;
      }
    },
  },

  top: {
    kicker: "Texas Hold'em",
    lead: ["Learn the rules of Texas Hold'em while you play.", "Even if it's your first time, a guide walks you through every hand."],
    start: "Start playing",
    resume: (mode: string, hand: number) => `Continue (${mode}, hand #${hand})`,
    menu: {
      rules: { title: "Rules", description: "How a hand plays out, with diagrams" },
      hands: { title: "Hand rankings", description: "All 10 hands, strongest first" },
      stats: { title: "Stats", description: "Win rate and chip results" },
      settings: { title: "Settings", description: "Theme, sound, and more" },
    },
  },

  modeSelect: {
    title: "Choose a mode",
    subtitle: "You can pick a different mode every time you start a game.",
    modes: {
      beginner: {
        tag: "New to poker",
        description: "Play with a guide and learn the rules as you go.",
        features: ["Explains what's happening and what you can do", "Shows your current hand and its strength", "Suggests an action and tells you why", "Explains why you won or lost each hand"],
      },
      pro: {
        tag: "Experienced players",
        description: "No hints, faster pace, the real thing.",
        features: ["Two CPU difficulty levels", "Tournament format and shot clock", "Optional pot odds display", "Hand history and stats"],
      },
    } satisfies Record<Mode, { tag: string; description: string; features: string[] }>,
    playWith: (mode: string) => `Play ${mode}`,
    tutorialAgain: "Replay the tutorial (3 practice hands)",
    tutorialFirst: "The first time you choose Beginner mode, you'll start with 3 practice hands.",
  },

  setup: {
    title: "Game setup",
    cpuCount: "CPU opponents",
    startingStack: "Starting chips",
    blinds: "Blinds",
    startingBlinds: "Starting blinds",
    blindsSub: "Chips two players must post every hand",
    cpuLevel: "CPU difficulty",
    cpuLevels: { normal: "Normal", hard: "Hard" },
    beginnerCpu: "Beginner mode always uses Easy CPUs",
    easy: "Easy",
    format: "Format",
    formats: { cash: "Cash game", tournament: "Tournament" },
    tournamentSub: (hands: number) => `Blinds go up every ${hands} hands. Be the last player standing to win.`,
    cashSub: "Blinds stay the same the whole game",
    timeLimit: "Shot clock",
    timeLimitSub: "When time runs out you check, or fold if you can't",
    timeOptions: (seconds: number) => (seconds === 0 ? "Off" : `${seconds}s`),
    potOdds: "Show pot odds",
    potOddsSub: "Shows the equity you need to call",
    start: "Start game",
  },

  game: {
    noGame: "There's no game in progress.",
    startGame: "Start a game",
    tournament: "Tournament",
    level: (level: number) => `Level ${level}`,
    nextLevel: (hands: number) => `${hands} ${hands === 1 ? "hand" : "hands"} to next level`,
    soundOn: "Turn sound on",
    soundOff: "Turn sound off",
    soundState: (on: boolean) => `Sound: ${on ? "on" : "off"}`,
    handLog: "Log",
    handLogTitle: "This hand",
    guideTitle: "Guide",
    thinking: (name: string) => `${name} is thinking…`,
    thinkingShort: "Thinking…",
    thinkingFlow: "Thinking",
    yourTurn: "Your turn",
    out: "Out",
    folded: "Folded",
    allin: "All-in",
    pot: (amount: number) => `Pot ${n(amount)}`,
    currentHand: "Current hand",
    foldWarningCheck: "You can check right now and see the next card for free. Fold anyway?",
    foldWarningStrong: (strength: string) =>
      `Your hand is "${strength}". If you fold, you lose the chips you've already put in this hand. Fold anyway?`,
  },

  actionBar: {
    toCall: (amount: number) => `Call ${n(amount)} to stay in`,
    canCheck: "You can check and see what happens",
    timeLeft: (seconds: number) => `${seconds}s left`,
    timerLabel: (seconds: number) => `${seconds} seconds left`,
    captionFold: "Give up this hand",
    captionCheck: "Continue without betting",
    captionCall: (amount: number) => `Pay ${n(amount)} to continue`,
    captionBet: (min: number) => `Make the first bet (${n(min)} or more)`,
    captionRaise: (min: number) => `Raise to ${n(min)} or more`,
    requiredEquity: (percent: number) => `Need ${percent}% equity`,
    presets: { third: "1/3 pot", half: "1/2 pot", pot: "Pot" },
    amountLabel: (label: string) => `${label} amount`,
    confirmFoldTitle: "Fold this hand?",
    checkInstead: "Check instead",
    foldAnyway: "Fold",
  },

  result: {
    tie: (names: string) => `Split pot: ${names}`,
    youWin: "You win",
    wins: (name: string) => `${name} wins`,
    mainPot: "Main pot",
    sidePot: (i: number) => `Side pot ${i}`,
    pot: "Pot",
    potLine: (potName: string, amount: number, winners: string) => `${potName} ${n(amount)} → ${winners}`,
    withHand: (name: string, hand: string) => `${name} (${hand})`,
    separator: ", ",
    everyoneFolded: "Everyone else folded",
    nextHand: "Next hand",
    rebuy: "Refill chips and continue",
    playAgain: "Play again",
    place: (place: number) => `You finished in ${place}${place === 2 ? "nd" : place === 3 ? "rd" : "th"} place`,
    busted: "You're out of chips",
    champion: "You won the tournament!",
    beatEveryone: "You beat everyone!",
  },

  review: {
    title: (hand: number) => `Hand #${hand} review`,
    viewTable: "View table",
    net: "This hand",
    stack: "Chips",
    won: "Won",
    cardsNote: "These are the 5 cards used for each hand. Blue outlines mark that player's hole cards.",
    why: "Why did it turn out this way?",
    openHands: "See the hand rankings",
  },

  guide: {
    title: "Guide",
    stage: (stage: number) => `Stage ${stage} / 5`,
    situation: "What's happening",
    flow: "This round",
    recommendation: "Suggestion",
    disclaimer: "Suggestions are just a guide. The choice is yours.",
    showRecommendation: "Show suggestions",
    summary: (street: string, stage: number) => `Guide · ${street} (${stage} / 5)`,
    recommendationSummary: (label: string) => `Suggestion: ${label}`,
    details: "Details",
    strengthLabel: "Hand strength",
    strengths: ["Weak", "Fair", "Strong", "Very strong"],
  },

  explain: {
    handOver: "The hand is over. Check the result, then move on to the next hand.",
    preflop: "Everyone has been dealt 2 cards. Decide whether to keep playing based on your hole cards alone.",
    blindRole: (big: boolean, amount: number) => `You automatically posted the ${big ? "big blind" : "small blind"} of ${n(amount)}.`,
    flop: "Three cards are now on the board. Combine your 2 hole cards with the board to make the best 5-card hand.",
    turn: "The fourth board card (the turn) is out. One more card to come.",
    river: "The fifth and final board card (the river) is out. After this betting round, remaining players show their cards.",
    youFolded: "You folded this hand. Watch how the others play it out.",
    youAllin: "You're all-in. You don't need to put in more chips, and you stay in until the end.",
    cpuThinking: (name: string) => `${name} is deciding what to do.`,
    yourTurnCheck: "It's your turn. Nobody has bet, so you can check.",
    yourTurnCall: (amount: number) => `It's your turn. Call ${n(amount)} to stay in.`,

    currentHandFallback: "Your hand",
    chance: (percent: number) => `your chance of winning is about ${percent}%`,
    reasonAggressive: (hand: string, chance: string, label: string) => `You have ${hand} and ${chance}, which is high. ${label} to build the pot.`,
    reasonCheckWeak: (hand: string, chance: string) => `Checking is free. You have ${hand} and ${chance}, so there's no need to bet.`,
    reasonCheck: (hand: string, chance: string) => `Checking is free. You have ${hand} and ${chance}.`,
    potOddsDetail: (call: number, pot: number, percent: number) =>
      `Equity needed to call = ${n(call)} to call ÷ (pot ${n(pot)} + ${n(call)}) ≈ ${percent}%`,
    reasonCall: (hand: string, chance: string, need: number) => `You have ${hand} and ${chance}. That's more than the ${need}% you need to call.`,
    reasonFold: (hand: string, chance: string, need: number) =>
      `You have ${hand} and ${chance}. That's less than the ${need}% you need to call, so folding is best.`,

    kicker: "the remaining cards (kickers)",
    nthHighest: (index: number) => `the ${ordinal(index)} card`,
    pair: "the pair",
    higherPair: "the higher pair",
    lowerPair: "the lower pair",
    threeCards: "the three of a kind",
    twoCards: "the pair",
    fourCards: "the four of a kind",
    topCard: "the top card",
    differentCategory: (winner: string, wHand: string, loser: string, lHand: string) =>
      `${winner} had ${wHand} and ${mid(loser)} had ${lHand}. ${cap(wHand)} beats ${lHand}, so ${mid(winner)} won.`,
    split: (a: string, b: string, hand: string) => `${a} and ${mid(b)} had equally strong hands (${hand}), so the pot was split.`,
    sameCategory: (hand: string, sameRanks: boolean, meaning: string, a: string, b: string, winner: string) =>
      `Both players had ${hand}. ${sameRanks ? "The ranks that make the hand were tied, so compare" : "Compare"} ${meaning}: ${a} beats ${b}, so ${mid(winner)} won.`,
    foldWinYou: (amount: number) => `Everyone else folded, so you won the ${n(amount)} pot without showing your cards.`,
    foldWin: (name: string, amount: number) => `Everyone else folded, so ${mid(name)} won the ${n(amount)} pot without showing their cards.`,
    whatIf: (yourHand: string, name: string, theirHand: string, outcome: "win" | "lose" | "tie") =>
      outcome === "lose"
        ? `If you had stayed in, your ${yourHand} would have lost to ${name}'s ${theirHand}. Folding was right.`
        : outcome === "win"
          ? `If you had stayed in, your ${yourHand} would have beaten ${name}'s ${theirHand}. Still, judge the decision by the odds at the time, not by the result.`
          : `If you had stayed in, your ${yourHand} and ${name}'s ${theirHand} would have tied.`,
    youLostBets: (amount: number) => `You folded, so the ${n(amount)} chips you put in are lost.`,
    sidePot: (i: number, amount: number, names: string) =>
      `Side pot ${i} (${n(amount)}) was contested only by players who bet more than the all-in player. ${names} won it.`,
  },

  handRanking: {
    descriptions: [
      "10, J, Q, K, A, all the same suit",
      "Five cards in a row, all the same suit",
      "Four cards of the same rank",
      "Three of one rank plus two of another",
      "Five cards of the same suit, any ranks",
      "Five cards in a row, any suits",
      "Three cards of the same rank",
      "Two different pairs",
      "Two cards of the same rank",
      "No hand. Compare the highest card",
    ],
    notes: [
      "Hands higher on the list are stronger. #1 is the strongest, #10 the weakest.",
      "Ace is the highest rank, then K, Q, J, 10… down to 2.",
      "A-2-3-4-5 is also a straight (the 5 counts as its top card).",
      "When two players have the same hand, compare the ranks that make the hand first, then the kickers. Suits never matter.",
      "Blue outlines show the cards that make the hand (hands that use all 5 cards have no outline).",
    ],
    pageLead: "Make the best 5-card hand from your 2 hole cards and the 5 board cards.",
  },

  rules: {
    goal: {
      title: "1. The goal",
      paragraphs: [
        "In Texas Hold'em, you combine your own **2 hole cards** with **5 shared board cards** and make the best 5-card hand out of those 7.",
        "The winner takes the chips in the middle of the table (the **pot**). Win by having the best hand at the end, or by getting everyone else to fold.",
      ],
    },
    flow: {
      title: "2. How a hand plays out",
      intro: "Every hand starts with the two players to the dealer's left posting forced bets called **blinds** (first the small blind, then the big blind).",
      streets: [
        "Each player gets 2 cards, then the first betting round",
        "3 board cards are dealt, then the second betting round",
        "The 4th card is dealt, then the third betting round",
        "The 5th card is dealt, then the final betting round",
      ],
      outro: "If two or more players are left after the river, they show their cards (the **showdown**). The best hand takes the pot.",
    },
    actions: {
      title: "3. What you can do on your turn",
      rows: [
        ["Fold", "Give up the hand. Chips you've already put in are lost."],
        ["Check", "Pass without betting. Only possible when nobody has bet yet."],
        ["Call", "Match the current bet to stay in."],
        ["Bet", "Put in the first chips when nobody has bet yet."],
        ["Raise", "Put in more than the current bet."],
        ["All-in", "Bet all your chips. You stay in until the end even if it's less than the bet."],
      ] as [string, string][],
      outro: "When everyone has put in the same amount, the hand moves to the next stage.",
    },
    position: {
      title: "4. Turn order and position",
      paragraphs: [
        "The **D** (dealer) button moves one seat to the left each hand. Preflop, action starts to the left of the big blind. After that, it starts to the left of the dealer and goes clockwise.",
        "Acting later is an advantage, because you get to see what everyone else did first.",
      ],
    },
    terms: {
      title: "5. Useful terms",
      rows: [
        ["Pot", "The chips in the middle of the table. The winner takes them."],
        ["Kicker", "A card that isn't part of the hand, used to break ties between equal hands."],
        ["Side pot", "A separate pot contested only by players who bet more than an all-in player."],
        ["Split pot", "When hands are exactly equal, the pot is divided evenly."],
      ] as [string, string][],
    },
    pageButtons: { hands: "See hand rankings", tutorial: "Practice with the tutorial", play: "Play now" },
  },

  settings: {
    title: "Settings",
    display: "Display",
    language: "Language / 言語",
    theme: "Theme",
    themes: { light: "Light", dark: "Dark", system: "Match device" },
    fourColor: "Four-color deck",
    fourColorSub: "Shows ♦ in blue and ♣ in green so suits are easier to tell apart",
    motion: "Animation",
    motionSub: "Animations stop when your device's reduce motion setting is on",
    motions: { normal: "Normal", short: "Short", none: "Off" },
    sound: "Sound effects",
    soundSub: "You can also toggle this with the speaker button in the game",
    volume: "Volume",
    volumes: { low: "Low", medium: "Medium", high: "High" },
    hints: "Hints",
    showRecommendation: "Show suggestions in Beginner mode",
    proShowHand: "Show current hand in Pro mode",
    data: "Data",
    clear: "Delete stats, history, and settings",
    cleared: "Deleted",
    irreversible: "This can't be undone",
    clearButton: "Delete",
    confirmTitle: "Delete your data?",
    confirmBody: "This deletes your stats, hand history, game in progress, and settings, and resets everything (theme: match device, sound: off).",
  },

  stats: {
    title: "Stats",
    mode: "Mode",
    handsPlayed: "Hands played",
    handsWon: "Hands won",
    handsCount: (count: number) => `${n(count)} ${count === 1 ? "hand" : "hands"}`,
    net: "Net chips",
    biggestWin: "Biggest win in one hand",
    showdownWin: "Won at showdown",
    showdownCount: (count: number) => `${n(count)} ${count === 1 ? "showdown" : "showdowns"}`,
    vpipSub: "How often you voluntarily put chips in preflop",
    pfrSub: "How often you bet or raised preflop",
    style: "Style",
    styles: { loose: "Loose", tight: "Tight", standard: "Balanced" },
    styleSub: "Shown after 20 hands (based on VPIP)",
    history: "Hand history",
    historyNote: "The last 50 hands across both modes are kept",
    empty: (mode: string) => `No hands played in ${mode} yet.`,
    play: "Play now",
    noHistory: "No history left for this mode.",
    yourHand: (hand: string) => `You: ${hand}`,
    holeCards: "Hole cards",
    board: "Board",
    date: (d: Date) => `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
  },

  tutorial: {
    badge: "Tutorial",
    skip: "Skip",
    coach: "Tip",
    cpuTurn: (name: string) => `${name}'s turn…`,
    onlyPrompted: "In the tutorial, you can only press the suggested button",
    nextLesson: (next: number, total: number) => `Next lesson (${next} / ${total})`,
    playBeginner: "Play Beginner mode",
    hands: [
      {
        title: "How a hand works",
        intro: [
          "Welcome! In 3 short hands, you'll learn the basics of poker.",
          "It's you against 2 CPUs. The player with the \"D\" is the dealer, and the two players to their left post forced bets called blinds. This time CPU1 posted 5 and CPU2 posted 10.",
          "Your hole cards are an Ace and a King. Only you can see them.",
        ],
        prompts: [
          "Your turn. Press \"Call\" to match the big blind of 10 and stay in the hand.",
          "Three board cards (the flop) are out. The Ace on the board plus your Ace makes One Pair. Nobody has bet, so press \"Check\" to see what happens.",
          "The fourth card (the turn) is out. Check again.",
          "This is the fifth and final card (the river). When you check, the remaining players show their cards.",
        ],
        outro: [
          "You win!",
          "The players left at the end show their cards, and the best hand takes the pot. You both had One Pair, so the ranks decide it: your pair of Aces beats CPU2's pair of Eights.",
        ],
      },
      {
        title: "Making a hand",
        intro: [
          "This hand is about making a hand. You can check the order of hands any time with \"Hands\" at the top.",
          "The dealer button moved left, so this time you posted the big blind of 10.",
        ],
        prompts: [
          "Everyone has put in 10. You already paid 10 as the big blind, so you can \"Check\" without paying more.",
          "You have 4 hearts (2 in your hand, 2 on the board). One more heart makes a Flush. Check and wait for the next card.",
          "The K♥ gives you 5 cards of the same suit: a Flush! CPU2 bet 20, so press \"Call\".",
          "A Flush is a very strong hand. This time, press \"Bet\" to build the pot.",
        ],
        outro: [
          "You win!",
          "Your Flush is much stronger than CPU1's One Pair (Kings). When the hands are different types, the stronger hand wins no matter the ranks.",
        ],
      },
      {
        title: "Betting",
        intro: [
          "The last hand is about betting.",
          "When you bet or raise, the other players have to choose: \"Call\" to keep going, or \"Fold\" to give up.",
        ],
        prompts: [
          "A pair of Aces is a very strong starting hand. Press \"Raise\" to raise to 40.",
          "An Ace hit the board, giving you Three of a Kind. Press \"Bet\" and make your opponent decide.",
        ],
        outro: [
          "You win!",
          "Everyone else folded, so you won the pot without showing your cards. The basic idea: bet and raise with strong hands, and don't force it with weak ones.",
          "That's the end of the tutorial. Try a real game in Beginner mode!",
        ],
      },
    ],
  },

  practice: {
    title: "Practice",
    lead: "You get one spot at a time. Choose what you would do, and you get the same reasoning the in-game suggestions use. 8 questions, a few minutes.",
    start: "Start",
    counter: (current: number, total: number) => `Question ${current} of ${total}`,
    prompt: "What would you do?",
    grades: { correct: "Correct", close: "Close", wrong: "Not quite" },
    answerWas: (label: string) => `The suggested action was "${label}"`,
    yourAnswer: (label: string) => `Your answer: "${label}"`,
    next: "Next question",
    finish: "See results",
    resultTitle: "Practice results",
    score: (correct: number, total: number) => `${correct} of ${total} correct`,
    closeCount: (count: number) => `Close: ${count}`,
    comment: (rate: number) =>
      rate >= 0.8
        ? "Nicely done. Use the same reasoning in a real game."
        : rate >= 0.5
          ? "Good going. Keep comparing the equity you need to call with your chance of winning."
          : "Try reviewing the rules and hand rankings, then give it another go.",
    again: "Try again",
    toGame: "Play Beginner mode",
    tableNote: "It's your turn. What the others did is shown on the table.",
  },

  notFound: {
    title: "Page not found",
    body: "The URL may be wrong, or the page may have moved.",
    home: "Go to top",
  },
};
