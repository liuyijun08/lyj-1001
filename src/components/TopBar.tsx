import { useGameStore } from "@/store/gameStore"
import { MINERAL_NAMES, MINERAL_COLORS, MINERAL_PRICES, MineralType } from "@/types/game"
import { DAY_DURATION, NEW_CART_COST, TRACK_MAINTENANCE_PER_UNIT, CART_MAINTENANCE } from "@/config/gameConfig"
import { Zap, DollarSign, Pause, Play, FastForward, RotateCcw } from "lucide-react"

const mineralTypes: MineralType[] = ["he3", "titanium", "iron", "silicon"]

export default function TopBar() {
  const resources = useGameStore(s => s.resources)
  const day = useGameStore(s => s.day)
  const dayProgress = useGameStore(s => s.dayProgress)
  const gameSpeed = useGameStore(s => s.gameSpeed)
  const isPaused = useGameStore(s => s.isPaused)
  const tracks = useGameStore(s => s.tracks)
  const carts = useGameStore(s => s.carts)
  const togglePause = useGameStore(s => s.togglePause)
  const setSpeed = useGameStore(s => s.setSpeed)
  const sellMinerals = useGameStore(s => s.sellMinerals)
  const resetGame = useGameStore(s => s.resetGame)

  const trackMaint = Math.round(tracks.reduce((s, t) => s + t.length * TRACK_MAINTENANCE_PER_UNIT, 0))
  const cartMaint = carts.length * CART_MAINTENANCE
  const dailyExpense = trackMaint + cartMaint

  return (
    <div className="flex items-center justify-between px-4 py-2 bg-[#0d1220] border-b border-[#1a2540]">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-[#0a0e1a] rounded-lg px-3 py-1.5 border border-[#1a2540]">
          <span className="text-[#6a7a9a] text-xs font-medium">第</span>
          <span className="text-[#00d4ff] font-bold text-lg" style={{ fontFamily: "Orbitron, monospace" }}>{day}</span>
          <span className="text-[#6a7a9a] text-xs font-medium">日</span>
        </div>

        <div className="flex items-center gap-1.5 min-w-[200px]">
          <div className="h-2 flex-1 bg-[#0a0e1a] rounded-full overflow-hidden border border-[#1a2540]">
            <div
              className="h-full bg-gradient-to-r from-[#00d4ff] to-[#00ff88] transition-all duration-300"
              style={{ width: `${(dayProgress / DAY_DURATION) * 100}%` }}
            />
          </div>
          <span className="text-[#6a7a9a] text-xs" style={{ fontFamily: "Orbitron, monospace" }}>
            {Math.floor((dayProgress / DAY_DURATION) * 100)}%
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5 bg-[#0a0e1a] rounded-lg px-3 py-1.5 border border-[#1a2540]">
          <DollarSign size={14} className="text-[#ffd700]" />
          <span className="text-[#ffd700] font-bold text-sm" style={{ fontFamily: "Orbitron, monospace" }}>
            {Math.round(resources.credits)}
          </span>
        </div>

        {mineralTypes.map(type => (
          <div
            key={type}
            className="flex items-center gap-1.5 bg-[#0a0e1a] rounded-lg px-2.5 py-1.5 border border-[#1a2540] cursor-pointer hover:border-opacity-60"
            style={{ borderColor: `${MINERAL_COLORS[type]}33` }}
            onClick={() => {
              const amount = resources[type]
              if (amount > 0) sellMinerals(type, amount)
            }}
            title={`点击出售全部${MINERAL_NAMES[type]}（单价 ${MINERAL_PRICES[type]}）`}
          >
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: MINERAL_COLORS[type] }} />
            <span className="text-xs font-medium" style={{ color: MINERAL_COLORS[type], fontFamily: "Orbitron, monospace" }}>
              {Math.round(resources[type])}
            </span>
          </div>
        ))}

        <div className="flex items-center gap-1.5 bg-[#0a0e1a] rounded-lg px-2.5 py-1.5 border border-[#1a2540]" title={`每日维护: ${dailyExpense}（轨道${trackMaint} + 矿车${cartMaint}）`}>
          <Zap size={12} className="text-[#ff8c00]" />
          <span className="text-[#ff8c00] text-xs" style={{ fontFamily: "Orbitron, monospace" }}>-{dailyExpense}</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={togglePause}
          className="p-1.5 rounded-lg bg-[#0a0e1a] border border-[#1a2540] hover:border-[#00d4ff] transition-colors"
          title={isPaused ? "继续" : "暂停"}
        >
          {isPaused ? <Play size={14} className="text-[#00ff88]" /> : <Pause size={14} className="text-[#ffcc00]" />}
        </button>

        {[1, 2, 3].map(speed => (
          <button
            key={speed}
            onClick={() => setSpeed(speed)}
            className={`px-2 py-1 rounded-lg border text-xs font-bold transition-colors ${
              gameSpeed === speed
                ? "bg-[#00d4ff22] border-[#00d4ff] text-[#00d4ff]"
                : "bg-[#0a0e1a] border-[#1a2540] text-[#6a7a9a] hover:border-[#3a4a6a]"
            }`}
            style={{ fontFamily: "Orbitron, monospace" }}
          >
            {speed}x
          </button>
        ))}

        <button
          onClick={resetGame}
          className="p-1.5 rounded-lg bg-[#0a0e1a] border border-[#1a2540] hover:border-[#ff4444] transition-colors"
          title="重置游戏"
        >
          <RotateCcw size={14} className="text-[#6a7a9a]" />
        </button>
      </div>
    </div>
  )
}
