import type { HandCategory, LogEntry, Mode, Persona, Street, Suit } from "@/engine/types";

/** 数字の区切り (例: 1,000) */
const n = (value: number) => value.toLocaleString("ja-JP");

/**
 * 画面の文言 (日本語)。英語版 (en.ts) も同じ形にする。
 * `**太字**` と書いた部分は <Rich> で太字になる。
 */
export const ja = {
  locale: "ja" as const,
  htmlLang: "ja",
  formatChips: n,

  meta: {
    description: "ルールを覚えながらテキサス・ホールデムを遊べるポーカーアプリ。初心者モードとプロモードがあります。",
    titles: {
      play: "モードを選ぶ",
      setup: "ゲーム設定",
      game: "ゲーム",
      tutorial: "チュートリアル",
      practice: "練習問題",
      rules: "ルール説明",
      hands: "役一覧",
      stats: "成績",
      settings: "設定",
    },
  },

  common: {
    back: "戻る",
    quit: "やめる",
    close: "閉じる",
    cancel: "やめる",
    next: "次へ",
    you: "あなた",
    loading: "読み込み中…",
    backToTop: "トップに戻る",
    hands: "役一覧",
    rules: "ルール",
    rulesFull: "ルール説明",
    dealer: "ディーラー",
    handNumber: (hand: number) => `ハンド #${hand}`,
    handLabel: "ハンド",
    blinds: "ブラインド",
    disclaimer: "このアプリはゲームです。実際のお金を賭けるものではありません。",
    modeNames: { beginner: "初心者モード", pro: "プロモード" } satisfies Record<Mode, string>,
    streetNames: { preflop: "プリフロップ", flop: "フロップ", turn: "ターン", river: "リバー", showdown: "ショーダウン" } satisfies Record<
      Street,
      string
    >,
    signed: (value: number) => `${value > 0 ? "+" : value < 0 ? "−" : "±"}${n(Math.abs(value))}`,
    list: (items: string[]) => items.join(" と "),
    languageSwitch: { label: "English", href: "/en" },
  },

  /** CPU の名前と性格 */
  personas: {
    cautious: { name: "タナカ", trait: "慎重", description: "弱い手ではすぐに降ります" },
    aggressive: { name: "サトウ", trait: "強気", description: "よくベットやレイズをします" },
    balanced: { name: "スズキ", trait: "バランス", description: "手の強さどおりに打ちます" },
    stubborn: { name: "ヤマダ", trait: "粘り強い", description: "なかなか降りず、よくコールします" },
    tricky: { name: "コバヤシ", trait: "ブラフ好き", description: "弱い手でも仕掛けてきます" },
  } satisfies Record<Persona, { name: string; trait: string; description: string }>,

  cards: {
    suitNames: { s: "スペード", h: "ハート", d: "ダイヤ", c: "クラブ" } satisfies Record<Suit, string>,
    cardLabel: (suit: string, rank: string) => `${suit}の${rank}`,
    boardCount: (count: number) => `場のカード ${count} 枚`,
  },

  hands: {
    categoryNames: {
      0: "ハイカード",
      1: "ワンペア",
      2: "ツーペア",
      3: "スリーカード",
      4: "ストレート",
      5: "フラッシュ",
      6: "フルハウス",
      7: "フォーカード",
      8: "ストレートフラッシュ",
      9: "ロイヤルフラッシュ",
    } satisfies Record<HandCategory, string>,
    /** 文章の中で使う役名 (英語では冠詞や小文字が変わる) */
    categoryPhrase: (category: HandCategory) => ja.hands.categoryNames[category],
    /** r0, r1: 役を作る数字 (tiebreak の先頭から) */
    name: (category: HandCategory, r0: string, r1: string) => {
      const name = ja.hands.categoryNames[category];
      switch (category) {
        case 1:
          return `${name}（${r0}のペア）`;
        case 2:
        case 6:
          return `${name}（${r0}と${r1}）`;
        case 3:
        case 7:
          return `${name}（${r0}）`;
        case 4:
        case 8:
          return `${name}（${r0}まで）`;
        case 0:
        case 5:
          return `${name}（${r0}が一番上）`;
        default:
          return name;
      }
    },
    preflopPair: (rank: string) => `ワンペア（${rank}のペア）`,
    preflopHigh: (rank: string) => `ハイカード（${rank}が一番上）`,
  },

  actions: {
    fold: "フォールド",
    check: "チェック",
    call: "コール",
    bet: "ベット",
    raise: "レイズ",
    allin: "オールイン",
    label: (entry: Pick<LogEntry, "type" | "paid" | "total">) => {
      switch (entry.type) {
        case "fold":
          return "フォールド";
        case "check":
          return "チェック";
        case "call":
          return `コール ${n(entry.paid)}`;
        case "bet":
          return `ベット ${n(entry.total)}`;
        case "raise":
          return `レイズ ${n(entry.total)}`;
        case "allin":
          return `オールイン ${n(entry.total)}`;
        case "smallBlind":
          return `SB ${n(entry.paid)}`;
        case "bigBlind":
          return `BB ${n(entry.paid)}`;
      }
    },
    sentence: (name: string, entry: LogEntry) => {
      switch (entry.type) {
        case "fold":
          return `${name} がフォールドしました`;
        case "check":
          return `${name} がチェックしました`;
        case "call":
          return `${name} が ${n(entry.paid)} コールしました`;
        case "bet":
          return `${name} が ${n(entry.total)} ベットしました`;
        case "raise":
          return `${name} が ${n(entry.total)} にレイズしました`;
        case "allin":
          return `${name} がオールインしました（${n(entry.total)}）`;
        case "smallBlind":
          return `${name} がスモールブラインド ${n(entry.paid)} を出しました`;
        case "bigBlind":
          return `${name} がビッグブラインド ${n(entry.paid)} を出しました`;
      }
    },
  },

  top: {
    kicker: "テキサス・ホールデム",
    lead: ["ルールを覚えながら、テキサス・ホールデムを遊べます。", "はじめてでも、ガイドに沿って1ハンドずつ進められます。"],
    start: "はじめる",
    resume: (mode: string, hand: number) => `続きから（${mode}・ハンド #${hand}）`,
    menu: {
      rules: { title: "ルール説明", description: "流れと用語を図で説明" },
      hands: { title: "役一覧", description: "10種類の役を強い順に" },
      stats: { title: "成績", description: "勝率と収支を確認" },
      settings: { title: "設定", description: "テーマ・効果音など" },
    },
  },

  modeSelect: {
    title: "モードを選ぶ",
    subtitle: "ゲームを始めるたびに選べます。",
    modes: {
      beginner: {
        tag: "はじめての方に",
        description: "ガイドを見ながら、ルールを覚えて進めます。",
        features: ["今の段階と、できることを説明", "今の役と、手の強さを表示", "おすすめのアクションと理由", "ハンド後に勝ち負けの理由を解説"],
      },
      pro: {
        tag: "経験者向け",
        description: "ヒントなしで、テンポよく本格的に遊びます。",
        features: ["CPUの強さを2段階から選択", "トーナメント形式と持ち時間", "ポットオッズ表示（任意）", "ハンド履歴と成績の記録"],
      },
    } satisfies Record<Mode, { tag: string; description: string; features: string[] }>,
    playWith: (mode: string) => `${mode}で遊ぶ`,
    tutorialAgain: "チュートリアル（3ハンドの練習）をもう一度やる",
    tutorialFirst: "初心者モードを初めて選ぶと、3ハンドの練習から始まります。",
  },

  setup: {
    title: "ゲーム設定",
    cpuCount: "CPUの人数",
    startingStack: "最初のチップ",
    blinds: "ブラインド",
    startingBlinds: "最初のブラインド",
    blindsSub: "毎ハンド、2人が強制的に出すチップ",
    cpuLevel: "CPUの強さ",
    cpuLevels: { normal: "ふつう", hard: "強い" },
    beginnerCpu: "初心者モードでは「弱い」に固定されます",
    easy: "弱い",
    format: "形式",
    formats: { cash: "キャッシュゲーム", tournament: "トーナメント" },
    tournamentSub: (hands: number) => `${hands}ハンドごとにブラインドが上がり、最後の1人になれば優勝です`,
    cashSub: "ブラインドは最後まで変わりません",
    timeLimit: "持ち時間",
    timeLimitSub: "時間切れはチェック、できなければフォールド",
    timeOptions: (seconds: number) => (seconds === 0 ? "なし" : `${seconds}秒`),
    potOdds: "ポットオッズを表示",
    potOddsSub: "コールに必要な勝率を数字で表示します",
    start: "ゲーム開始",
  },

  game: {
    noGame: "進行中のゲームがありません。",
    startGame: "ゲームを始める",
    tournament: "トーナメント",
    level: (level: number) => `レベル ${level}`,
    nextLevel: (hands: number) => `次のレベルまで ${hands} ハンド`,
    soundOn: "効果音をオンにする",
    soundOff: "効果音をオフにする",
    soundState: (on: boolean) => `効果音: ${on ? "オン" : "オフ"}`,
    handLog: "流れ",
    handLogTitle: "このハンドの流れ",
    guideTitle: "ガイド",
    thinking: (name: string) => `${name} が考えています…`,
    thinkingShort: "考え中…",
    thinkingFlow: "考え中",
    yourTurn: "あなたの番です",
    out: "脱落",
    folded: "フォールド",
    allin: "オールイン",
    pot: (amount: number) => `ポット ${n(amount)}`,
    currentHand: "今の役",
    foldWarningCheck: "今はチェックできるので、チップを払わずに次へ進めます。本当にフォールドしますか？",
    foldWarningStrong: (strength: string) =>
      `今の手は「${strength}」です。フォールドすると、このハンドで出したチップは戻りません。本当にフォールドしますか？`,
  },

  actionBar: {
    toCall: (amount: number) => `続けるには ${n(amount)} 払ってコールします`,
    canCheck: "チェックして様子を見ることができます",
    timeLeft: (seconds: number) => `残り ${seconds}秒`,
    timerLabel: (seconds: number) => `残り ${seconds} 秒`,
    captionFold: "このハンドを降ります",
    captionCheck: "何も出さずに次へ進みます",
    captionCall: (amount: number) => `${n(amount)} 払って続けます`,
    captionBet: (min: number) => `最初に賭けます（${n(min)} 以上）`,
    captionRaise: (min: number) => `${n(min)} 以上に上げます`,
    requiredEquity: (percent: number) => `必要な勝率 ${percent}%`,
    presets: { third: "1/3 ポット", half: "1/2 ポット", pot: "ポット" },
    amountLabel: (label: string) => `${label}額`,
    confirmFoldTitle: "フォールドしますか？",
    checkInstead: "チェックする",
    foldAnyway: "フォールドする",
  },

  result: {
    tie: (names: string) => `${names} で引き分け`,
    youWin: "あなたの勝ち",
    wins: (name: string) => `${name} の勝ち`,
    mainPot: "メインポット",
    sidePot: (i: number) => `サイドポット${i}`,
    pot: "ポット",
    potLine: (potName: string, amount: number, winners: string) => `${potName} ${n(amount)} → ${winners}`,
    withHand: (name: string, hand: string) => `${name}（${hand}）`,
    separator: "・",
    everyoneFolded: "ほかの全員がフォールドしました",
    nextHand: "次のハンドへ",
    rebuy: "チップを補充して続ける",
    playAgain: "もう一度遊ぶ",
    place: (place: number) => `${place}位で終了しました`,
    busted: "チップがなくなりました",
    champion: "優勝しました！",
    beatEveryone: "全員に勝ちました！",
  },

  review: {
    title: (hand: number) => `ハンド #${hand} の振り返り`,
    viewTable: "テーブルを見る",
    net: "このハンドの収支",
    stack: "残りチップ",
    won: "勝ち",
    cardsNote: "役に使った5枚を表示しています。青い枠は、その人の手札のカードです。",
    why: "なぜこの結果になったの？",
    openHands: "役一覧で強さの順番を見る",
  },

  guide: {
    title: "ガイド",
    stage: (stage: number) => `段階 ${stage} / 5`,
    situation: "いま起きていること",
    flow: "このラウンドの流れ",
    recommendation: "おすすめ",
    disclaimer: "おすすめは目安です。自分で決めてかまいません。",
    showRecommendation: "おすすめを表示",
    summary: (street: string, stage: number) => `ガイド · ${street}（${stage} / 5）`,
    recommendationSummary: (label: string) => `おすすめ: ${label}`,
    details: "くわしく",
    strengthLabel: "手の強さ",
    strengths: ["弱い", "ふつう", "強い", "とても強い"],
  },

  /** ガイドの文章 (状況説明・おすすめの理由・振り返り) */
  explain: {
    handOver: "ハンドが終わりました。結果を確認して、次のハンドへ進みましょう。",
    preflop: "手札が2枚ずつ配られました。今は手札だけを見て、勝負を続けるかを決める段階です。",
    blindRole: (big: boolean, amount: number) => `あなたは${big ? "ビッグブラインド" : "スモールブラインド"}として ${n(amount)} を自動で出しています。`,
    flop: "場に3枚のカードが開きました。手札2枚と場のカードを合わせて、一番強い5枚で役を作ります。",
    turn: "場に4枚目のカード（ターン）が開きました。場のカードは残り1枚です。",
    river: "最後の5枚目のカード（リバー）が開きました。このベットが終わると、残った人で手札を見せ合います。",
    youFolded: "あなたはこのハンドを降りました。残りの人の勝負を見て、流れを覚えましょう。",
    youAllin: "あなたはオールインしています。これ以上チップを出す必要はなく、最後まで勝負に参加します。",
    cpuThinking: (name: string) => `${name} が行動を考えています。`,
    yourTurnCheck: "あなたの番です。追加で払う必要がないので、チェックできます。",
    yourTurnCall: (amount: number) => `あなたの番です。続けるには ${n(amount)} 払ってコールします。`,

    currentHandFallback: "今の手",
    chance: (percent: number) => `勝てる見込みは約${percent}%`,
    reasonAggressive: (hand: string, chance: string, label: string) => `${hand}で、${chance}と高いためです。${label}してポットを大きくしましょう。`,
    reasonCheckWeak: (hand: string, chance: string) => `チップを払わずに次へ進めます。${hand}で${chance}なので、無理に賭ける必要はありません。`,
    reasonCheck: (hand: string, chance: string) => `チップを払わずに次へ進めます。${hand}で${chance}です。`,
    potOddsDetail: (call: number, pot: number, percent: number) =>
      `コールに必要な勝率 = 払う額 ${n(call)} ÷（ポット ${n(pot)} ＋ ${n(call)}）＝ 約${percent}%`,
    reasonCall: (hand: string, chance: string, need: number) => `${hand}で、${chance}です。コールに必要な勝率（約${need}%）を上回っているためです。`,
    reasonFold: (hand: string, chance: string, need: number) =>
      `${hand}で、${chance}です。コールに必要な勝率（約${need}%）に届かないため、降りるのがおすすめです。`,

    kicker: "残りのカード（キッカー）",
    nthHighest: (index: number) => (index === 0 ? "一番大きいカード" : `${index + 1}番目に大きいカード`),
    pair: "ペア",
    higherPair: "大きい方のペア",
    lowerPair: "小さい方のペア",
    threeCards: "3枚そろったカード",
    twoCards: "2枚そろったカード",
    fourCards: "4枚そろったカード",
    topCard: "一番上のカード",
    differentCategory: (winner: string, wHand: string, loser: string, lHand: string) =>
      `${winner} は${wHand}、${loser} は${lHand}でした。${wHand}の方が強い役なので、${winner} の勝ちです。`,
    split: (a: string, b: string, hand: string) => `${a} と ${b} はどちらも同じ強さの${hand}なので、ポットを山分けしました。`,
    sameCategory: (hand: string, sameRanks: boolean, meaning: string, a: string, b: string, winner: string) =>
      `どちらも${hand}でした。${sameRanks ? "役の数字も同じなので、" : ""}${meaning}で比べると、${a} と ${b} で ${a} の方が強いので、${winner} の勝ちです。`,
    foldWinYou: (amount: number) => `ほかの全員がフォールドしたので、あなたが手札を見せずにポット ${n(amount)} を獲得しました。`,
    foldWin: (name: string, amount: number) => `ほかの全員がフォールドしたので、${name} が手札を見せずにポット ${n(amount)} を獲得しました。`,
    whatIf: (yourHand: string, name: string, theirHand: string, outcome: "win" | "lose" | "tie") =>
      outcome === "lose"
        ? `もし降りずに最後まで残っていたら、あなたの${yourHand}は ${name} の${theirHand}に負けていました。降りて正解です。`
        : outcome === "win"
          ? `もし降りずに最後まで残っていたら、あなたの${yourHand}が ${name} の${theirHand}に勝っていました。ただし、結果ではなく、そのときの見込みで判断することが大切です。`
          : `もし降りずに最後まで残っていたら、あなたの${yourHand}と ${name} の${theirHand}で引き分けでした。`,
    youLostBets: (amount: number) => `あなたは途中で降りたため、出したチップ（${n(amount)}）は戻りません。`,
    sidePot: (i: number, amount: number, names: string) =>
      `サイドポット${i}（${n(amount)}）は、オールインした人より多く賭けた人どうしで争い、${names} が獲得しました。`,
  },

  handRanking: {
    descriptions: [
      "同じマークの 10・J・Q・K・A",
      "同じマークで数字が5つ連続",
      "同じ数字が4枚",
      "同じ数字3枚 ＋ 同じ数字2枚",
      "同じマークが5枚（数字はばらばらでよい）",
      "数字が5つ連続（マークはばらばらでよい）",
      "同じ数字が3枚",
      "同じ数字2枚の組が2つ",
      "同じ数字が2枚",
      "役なし。一番大きいカードで比べる",
    ],
    notes: [
      "上にあるほど強い役です。1が一番強く、10が一番弱い役です。",
      "数字は A が一番強く、K・Q・J・10…と続き、2 が一番弱くなります。",
      "A-2-3-4-5 もストレートです（この場合は 5 が一番上として扱います）。",
      "同じ役どうしは、役を作る数字 → 残りのカード（キッカー）の順に比べます。マークに強さはありません。",
      "青い枠のカードが役を作っている部分です（5枚すべてで作る役には枠を付けていません）。",
    ],
    pageLead: "手札2枚と場のカード5枚から、一番強い5枚で役を作ります。",
  },

  rules: {
    goal: {
      title: "1. 目的",
      paragraphs: [
        "テキサス・ホールデムは、自分だけの**手札2枚**と、全員で使う**場のカード5枚**を合わせた7枚から、一番強い5枚の役を作って競うゲームです。",
        "勝つとテーブルの中央に集まったチップ（**ポット**）をもらえます。最後まで残って一番強い役を見せるか、ほかの全員を降ろせば勝ちです。",
      ],
    },
    flow: {
      title: "2. 1ハンドの流れ",
      intro: "毎回、ディーラーの左の2人が**ブラインド**という決まった額を先に出してから始まります（左隣がスモールブラインド、その次がビッグブラインド）。",
      streets: [
        "手札が2枚ずつ配られ、1回目のベット",
        "場に3枚開いて、2回目のベット",
        "4枚目が開いて、3回目のベット",
        "5枚目が開いて、最後のベット",
      ],
      outro: "リバーのベットが終わって2人以上残っていれば、手札を見せ合います（**ショーダウン**）。一番強い役の人がポットをもらいます。",
    },
    actions: {
      title: "3. 自分の番にできること",
      rows: [
        ["フォールド", "このハンドを降ります。それまでに出したチップは戻りません。"],
        ["チェック", "チップを出さずに次の人へ回します。まだ誰もベットしていないときだけできます。"],
        ["コール", "前の人と同じ額を出して、勝負を続けます。"],
        ["ベット", "まだ誰も賭けていないときに、最初にチップを賭けます。"],
        ["レイズ", "前の人の額より多く出して、額を上げます。"],
        ["オールイン", "手持ちのチップを全部出します。足りなくても最後まで勝負に参加できます。"],
      ] as [string, string][],
      outro: "全員の出した額がそろうと、次の段階へ進みます。",
    },
    position: {
      title: "4. 順番とポジション",
      paragraphs: [
        "**D**（ディーラー）のマークは1ハンドごとに左へ移ります。プリフロップはビッグブラインドの左の人から、フロップ以降はディーラーの左の人から、時計回りに行動します。",
        "後から行動するほど、ほかの人の行動を見てから決められるので有利です。",
      ],
    },
    terms: {
      title: "5. 覚えておきたい言葉",
      rows: [
        ["ポット", "テーブルの中央に集まったチップ。勝った人がもらいます。"],
        ["キッカー", "同じ役どうしで比べるときに使う、役に関係しない残りのカード。"],
        ["サイドポット", "オールインした人より多く賭けた人どうしで争う、別のポット。"],
        ["山分け", "同じ強さの役なら、ポットを等分します。"],
      ] as [string, string][],
    },
    pageButtons: { hands: "役一覧を見る", tutorial: "チュートリアルで練習する", play: "遊んでみる" },
  },

  settings: {
    title: "設定",
    display: "表示",
    language: "言語 / Language",
    theme: "テーマ",
    themes: { light: "ライト", dark: "ダーク", system: "端末に合わせる" },
    fourColor: "4色デッキ",
    fourColorSub: "♦ を青、♣ を緑で表示して見分けやすくします",
    motion: "アニメーション",
    motionSub: "端末の「視差効果を減らす」がオンのときは動きを止めます",
    motions: { normal: "通常", short: "短め", none: "なし" },
    sound: "効果音",
    soundSub: "ゲーム画面のスピーカーボタンからも切り替えられます",
    volume: "音量",
    volumes: { low: "小", medium: "中", high: "大" },
    hints: "ヒント",
    showRecommendation: "初心者モードで、おすすめを表示",
    proShowHand: "プロモードで、今の役を表示",
    data: "データ",
    clear: "成績・履歴・設定を消去",
    cleared: "消去しました",
    irreversible: "この操作は取り消せません",
    clearButton: "消去する",
    confirmTitle: "データを消去しますか？",
    confirmBody: "成績、ハンド履歴、途中のゲーム、設定をすべて消して、最初の状態（テーマ: 端末に合わせる、効果音: オフ）に戻します。",
  },

  stats: {
    title: "成績",
    mode: "モード",
    handsPlayed: "遊んだハンド",
    handsWon: "勝ったハンド",
    handsCount: (count: number) => `${n(count)} ハンド`,
    net: "収支（チップ）",
    biggestWin: "1ハンドの最大の勝ち",
    showdownWin: "ショーダウンで勝った割合",
    showdownCount: (count: number) => `${n(count)} 回見せ合い`,
    vpipSub: "プリフロップで自分からチップを出した割合",
    pfrSub: "プリフロップでベット・レイズした割合",
    style: "スタイル",
    styles: { loose: "積極的", tight: "慎重", standard: "標準的" },
    styleSub: "20ハンド以上遊ぶと表示します（VPIP から判定）",
    history: "ハンド履歴",
    historyNote: "両モード合わせて直近50ハンドまで保存します",
    empty: (mode: string) => `${mode}で遊んだ記録はまだありません。`,
    play: "遊んでみる",
    noHistory: "このモードの履歴は残っていません。",
    yourHand: (hand: string) => `あなた: ${hand}`,
    holeCards: "手札",
    board: "場のカード",
    date: (d: Date) => `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
  },

  tutorial: {
    badge: "チュートリアル",
    skip: "スキップ",
    coach: "案内",
    cpuTurn: (name: string) => `${name} の番です…`,
    onlyPrompted: "チュートリアルでは、案内された操作だけを押せます",
    nextLesson: (next: number, total: number) => `次の練習へ（${next} / ${total}）`,
    playBeginner: "初心者モードで遊ぶ",
    hands: [
      {
        title: "ハンドの流れ",
        intro: [
          "ようこそ！ここでは3回のハンドで、ポーカーの基本を練習します。",
          "テーブルには、あなたと CPU が2人。「D」マークの人がディーラーで、その左の2人が「ブラインド」という決まった額を先に出します。今回は CPU1 が 5、CPU2 が 10 を出しました。",
          "あなたの手札は A と K です。手札は自分にしか見えません。",
        ],
        prompts: [
          "あなたの番です。ビッグブラインドと同じ 10 を出して勝負を続ける「コール」を押してみましょう。",
          "場に3枚のカード（フロップ）が開きました。場の A とあなたの A で「ワンペア」ができています。誰もチップを出していないので、「チェック」で様子を見ましょう。",
          "4枚目のカード（ターン）が開きました。ここもチェックで進めます。",
          "最後の5枚目（リバー）です。チェックすると、残った人で手札を見せ合います。",
        ],
        outro: [
          "あなたの勝ちです！",
          "最後まで残った人で手札を見せ合い、一番強い役の人がポットをもらいます。同じ「ワンペア」どうしなので数字で比べ、あなたの「A のペア」が CPU2 の「8 のペア」より強かったので勝ちました。",
        ],
      },
      {
        title: "役を作る",
        intro: [
          "2回目は「役」の練習です。役の強さの順番は、上の「役一覧」でいつでも確認できます。",
          "ディーラーが左に移り、今回はあなたがビッグブラインドとして 10 を出しています。",
        ],
        prompts: [
          "全員の額が 10 にそろいました。あなたはビッグブラインドですでに 10 を出しているので、追加で払わずに「チェック」できます。",
          "ハートが4枚そろいました（手札2枚＋場2枚）。あと1枚ハートが来れば「フラッシュ」です。チェックで次のカードを待ちましょう。",
          "K♥ が開いて、同じマークが5枚そろう「フラッシュ」ができました！CPU2 が 20 ベットしたので、「コール」しましょう。",
          "フラッシュはとても強い役です。今度はあなたから「ベット」して、ポットを大きくしましょう。",
        ],
        outro: [
          "あなたの勝ちです！",
          "あなたの「フラッシュ」は、CPU1 の「ワンペア（K のペア）」よりずっと強い役です。役の種類が違うときは、数字に関係なく強い役を持っている方が勝ちます。",
        ],
      },
      {
        title: "賭け方",
        intro: [
          "最後は「賭け方」の練習です。",
          "ベットやレイズで額を上げると、ほかの人は「コール」して続けるか、「フォールド」して降りるかを選ばなければなりません。",
        ],
        prompts: [
          "A のペアはとても強い手札です。「レイズ」して、額を 40 に上げてみましょう。",
          "場に A が開いて「スリーカード」になりました。「ベット」して、相手に続けるかどうかを決めさせましょう。",
        ],
        outro: [
          "あなたの勝ちです！",
          "ほかの全員がフォールドしたので、手札を見せずにポットを獲得しました。強い手ではベットやレイズでチップを増やし、弱い手では無理をせず降りるのが基本です。",
          "これでチュートリアルは終わりです。初心者モードで実際に遊んでみましょう！",
        ],
      },
    ],
  },

  practice: {
    title: "練習問題",
    lead: "1問ずつ場面が出ます。「自分ならどうするか」を選ぶと、おすすめと同じ考え方で解説します。1回 8 問、数分で終わります。",
    start: "はじめる",
    counter: (current: number, total: number) => `第 ${current} 問 / 全 ${total} 問`,
    prompt: "あなたならどうしますか？",
    grades: { correct: "正解", close: "惜しい", wrong: "考え直してみましょう" },
    answerWas: (label: string) => `おすすめは「${label}」でした`,
    yourAnswer: (label: string) => `あなたの答え: 「${label}」`,
    next: "次の問題",
    finish: "結果を見る",
    resultTitle: "練習の結果",
    score: (correct: number, total: number) => `${total} 問中 ${correct} 問 正解`,
    closeCount: (count: number) => `惜しい: ${count} 問`,
    comment: (rate: number): string =>
      rate >= 0.8
        ? "よくできました。実際のゲームでも同じ考え方で判断してみましょう。"
        : rate >= 0.5
          ? "いい調子です。「コールに必要な勝率」と「勝てる見込み」を比べる練習を続けましょう。"
          : "まずはルール説明と役一覧を見直してから、もう一度ためしてみましょう。",
    again: "もう一度",
    toGame: "初心者モードで遊ぶ",
    tableNote: "あなたの番です。相手の行動はテーブルに出ています。",
  },

  notFound: {
    title: "ページが見つかりません",
    body: "URL が間違っているか、ページが移動した可能性があります。",
    home: "トップへ",
  },
};

/** 文言の形 (日本語版を基準にする) */
export type Dictionary = Omit<typeof ja, "locale"> & { locale: "ja" | "en" };
