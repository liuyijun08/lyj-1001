import { useGameStore } from "@/store/gameStore"
import { MINERAL_NAMES, MINERAL_COLORS, MineralType, MINERAL_PRICES } from "@/types/game"
import { TRACK_MAINTENANCE_PER_UNIT, CART_MAINTENANCE } from "@/config/gameConfig"
import { X, TrendingUp, TrendingDown, Package } from "lucide-react"

const mineralTypes: MineralType[] = ["he3", "titanium", "iron", "silicon"]

export default function DaySettlement() {
  const showSettlement = useGameStore(s => s.showSettlement)
  const day = useGameStore(s => s.day)
  const resources = useGameStore(s => s.resources)
  const tracks = useGameStore(s => s.tracks)
  const carts = useGameStore(s => s.carts)
  const dayLogs = useGameStore(s => s.dayLogs)
  const endDay = useGameStore(s => s.endDay)
  const closeSettlement = useGameStore(s => s.closeSettlement)
  const sellMinerals = useGameStore(s => s.sellMinerals)

  if (!showSettlement) return null

  const trackMaint = Math.round(tracks.reduce((s, t) => s + t.length * TRACK_MAINTENANCE_PER_UNIT, 0))
  const cartMaint = carts.length * CART_MAINTENANCE
  const totalExpense = trackMaint + cartMaint

  const currentLog = dayLogs.find(l => l.day === day)

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-[#0d1220] border border-[#1a2540] rounded-2xl w-[520px] max-h-[80vh] overflow-hidden shadow-2xl shadow-[#00d4ff11]">
        <div className="flex items-center justify-between p-4 border-b border-[#1a2540]">
          <h2 className="text-[#d4cfc4] text-lg font-bold flex items-center gap-2" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
            <Package size={18} className="text-[#00d4ff]" />
            第 {day} 日结算
          </h2>
          <button onClick={closeSettlement} className="p-1 rounded-lg hover:bg-[#1a2540] transition-colors">
            <X size={16} className="text-[#6a7a9a]" />
          </button>
        </div>

        <div className="p-4 space-y-4 overflow-y-auto max-h-[60vh]">
          <div>
            <h3 className="text-[#6a7a9a] text-xs font-bold mb-2 flex items-center gap-1.5">
              <Package size={12} />
              矿物库存
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {mineralTypes.map(type => (
                <div
                  key={type}
                  className="bg-[#0a0e1a] rounded-lg p-3 border border-[#1a2540]"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium" style={{ color: MINERAL_COLORS[type] }}>
                      {MINERAL_NAMES[type]}
                    </span>
                    <span className="text-xs text-[#6a7a9a]">
                      单价 {MINERAL_PRICES[type]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold" style={{ color: MINERAL_COLORS[type], fontFamily: "Orbitron, monospace" }}>
                      {Math.round(resources[type])}
                    </span>
                    <button
                      onClick={() => {
                        const amount = resources[type]
                        if (amount > 0) sellMinerals(type, amount)
                      }}
                      disabled={resources[type] <= 0}
                      className={`text-[10px] px-2 py-1 rounded font-bold transition-colors ${
                        resources[type] > 0
                          ? "bg-[#ffd70022] border border-[#ffd70044] text-[#ffd700] hover:bg-[#ffd70033]"
                          : "bg-[#0a0e1a] border border-[#1a2540] text-[#3a4a5a] cursor-not-allowed"
                      }`}
                    >
                      全部出售
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-[#6a7a9a] text-xs font-bold mb-2 flex items-center gap-1.5">
              <TrendingDown size={12} />
              每日维护支出
            </h3>
            <div className="bg-[#0a0e1a] rounded-lg p-3 border border-[#1a2540] space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-[#6a7a9a]">轨道维护 ({tracks.length} 条)</span>
                <span className="text-[#ff8c00]" style={{ fontFamily: "Orbitron, monospace" }}>-{trackMaint}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#6a7a9a]">矿车维护 ({carts.length} 辆)</span>
                <span className="text-[#ff8c00]" style={{ fontFamily: "Orbitron, monospace" }}>-{cartMaint}</span>
              </div>
              <div className="border-t border-[#1a2540] pt-1.5 flex justify-between text-xs font-bold">
                <span className="text-[#d4cfc4]">总计</span>
                <span className="text-[#ff4444]" style={{ fontFamily: "Orbitron, monospace" }}>-{totalExpense}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-[#6a7a9a] text-xs font-bold mb-2 flex items-center gap-1.5">
              <TrendingUp size={12} />
              资金状况
            </h3>
            <div className="bg-[#0a0e1a] rounded-lg p-3 border border-[#1a2540]">
              <div className="text-center">
                <span className="text-[#6a7a9a] text-xs">当前资金</span>
                <div className="text-2xl font-bold text-[#ffd700]" style={{ fontFamily: "Orbitron, monospace" }}>
                  {Math.round(resources.credits)}
                </div>
              </div>
            </div>
          </div>

          {dayLogs.length > 0 && (
            <div>
              <h3 className="text-[#6a7a9a] text-xs font-bold mb-2">历史记录</h3>
              <div className="bg-[#0a0e1a] rounded-lg p-2 border border-[#1a2540] max-h-32 overflow-y-auto">
                {dayLogs.slice(-5).reverse().map(log => (
                  <div key={log.day} className="flex justify-between text-[10px] py-1 border-b border-[#1a2540] last:border-0">
                    <span className="text-[#6a7a9a]">第 {log.day} 日</span>
                    <span className="text-[#ff8c00]" style={{ fontFamily: "Orbitron, monospace" }}>
                      收入 {log.income} / 支出 {log.expense}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-[#1a2540]">
          <button
            onClick={endDay}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#00d4ff] to-[#00ff88] text-[#0a0e1a] font-bold text-sm hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all"
            style={{ fontFamily: "'Noto Sans SC', sans-serif" }}
          >
            进入第 {day + 1} 日
          </button>
          <p className="text-[10px] text-[#4a5a7a] text-center mt-2">
            结算后矿点将恢复日产量，所有矿车返回基地
          </p>
        </div>
      </div>
    </div>
  )
}
