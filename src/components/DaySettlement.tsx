import { useGameStore } from "@/store/gameStore"
import { MINERAL_NAMES, MINERAL_COLORS, MineralType, MINERAL_PRICES } from "@/types/game"
import { TRACK_MAINTENANCE_PER_UNIT, CART_MAINTENANCE, WAREHOUSE_CAPACITY } from "@/config/gameConfig"
import { X, TrendingUp, TrendingDown, Package, Gem, Warehouse, Trash2, CheckCircle2, AlertCircle } from "lucide-react"

const mineralTypes: MineralType[] = ["he3", "titanium", "iron", "silicon"]

export default function DaySettlement() {
  const showSettlement = useGameStore(s => s.showSettlement)
  const day = useGameStore(s => s.day)
  const resources = useGameStore(s => s.resources)
  const tracks = useGameStore(s => s.tracks)
  const carts = useGameStore(s => s.carts)
  const dayLogs = useGameStore(s => s.dayLogs)
  const dailyCollected = useGameStore(s => s.dailyCollected)
  const endDay = useGameStore(s => s.endDay)
  const closeSettlement = useGameStore(s => s.closeSettlement)
  const sellMinerals = useGameStore(s => s.sellMinerals)
  const inventoryBatches = useGameStore(s => s.inventoryBatches)
  const dailyDiscarded = useGameStore(s => s.dailyDiscarded)

  if (!showSettlement) return null

  const trackMaint = Math.round(tracks.reduce((s, t) => s + t.length * TRACK_MAINTENANCE_PER_UNIT, 0))
  const cartMaint = carts.length * CART_MAINTENANCE
  const totalExpense = trackMaint + cartMaint

  const todayIncome = mineralTypes.reduce(
    (sum, type) => sum + (dailyCollected[type] || 0) * MINERAL_PRICES[type],
    0
  )
  const netProfit = todayIncome - totalExpense

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
              <Gem size={12} className="text-[#00d4ff]" />
              当日采集
            </h3>
            <div className="bg-[#0a0e1a] rounded-lg p-3 border border-[#1a2540]">
              {mineralTypes.some(t => dailyCollected[t] > 0) ? (
                <div className="space-y-1.5">
                  {mineralTypes.filter(t => dailyCollected[t] > 0).map(type => (
                    <div key={type} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: MINERAL_COLORS[type] }} />
                        <span className="text-[#d4cfc4]">{MINERAL_NAMES[type]}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span style={{ color: MINERAL_COLORS[type], fontFamily: "Orbitron, monospace" }}>
                          +{Math.round(dailyCollected[type])}
                        </span>
                        <span className="text-[#6a7a9a]">× {MINERAL_PRICES[type]}</span>
                        <span className="text-[#ffd700] w-16 text-right" style={{ fontFamily: "Orbitron, monospace" }}>
                          +{Math.round(dailyCollected[type] * MINERAL_PRICES[type])}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-[#1a2540] pt-1.5 flex justify-between text-xs font-bold">
                    <span className="text-[#d4cfc4]">采集收入合计</span>
                    <span className="text-[#00ff88]" style={{ fontFamily: "Orbitron, monospace" }}>
                      +{todayIncome}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-2 text-[#4a5a7a] text-xs">
                  当日无采集记录，请调度矿车运输矿物
                </div>
              )}
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
            <div className="bg-[#0a0e1a] rounded-lg p-3 border border-[#1a2540] space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#6a7a9a]">当日采集收入</span>
                <span className="text-[#00ff88]" style={{ fontFamily: "Orbitron, monospace" }}>+{todayIncome}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-[#6a7a9a]">当日维护支出</span>
                <span className="text-[#ff4444]" style={{ fontFamily: "Orbitron, monospace" }}>-{totalExpense}</span>
              </div>
              <div className="border-t border-[#1a2540] pt-2 flex justify-between text-xs font-bold">
                <span className="text-[#d4cfc4]">当日净收益</span>
                <span
                  style={{ fontFamily: "Orbitron, monospace" }}
                  className={netProfit >= 0 ? "text-[#00ff88]" : "text-[#ff4444]"}
                >
                  {netProfit >= 0 ? "+" : ""}{netProfit}
                </span>
              </div>
              <div className="border-t border-[#1a2540] pt-2 text-center">
                <span className="text-[#6a7a9a] text-xs">当前资金</span>
                <div className="text-2xl font-bold text-[#ffd700]" style={{ fontFamily: "Orbitron, monospace" }}>
                  {Math.round(resources.credits)}
                </div>
              </div>
            </div>
          </div>

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
              <Warehouse size={12} className="text-[#b88eff]" />
              仓库容量
            </h3>
            {(() => {
              const usage = inventoryBatches.reduce((sum, b) => sum + b.amount, 0)
              const ratio = WAREHOUSE_CAPACITY > 0 ? usage / WAREHOUSE_CAPACITY : 0
              const isFull = ratio >= 1
              const isNearFull = ratio >= 0.9
              return (
                <div className="bg-[#0a0e1a] rounded-lg p-3 border border-[#1a2540]">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[#d4cfc4] text-sm font-bold" style={{ fontFamily: "Orbitron, monospace" }}>
                      {Math.round(usage)} / {WAREHOUSE_CAPACITY}
                    </span>
                    {isFull ? (
                      <span className="flex items-center gap-1 text-[10px] text-[#ff4444] bg-[#ff444422] px-2 py-0.5 rounded-full border border-[#ff444444]">
                        <AlertCircle size={10} />
                        仓库已满
                      </span>
                    ) : isNearFull ? (
                      <span className="flex items-center gap-1 text-[10px] text-[#ffb432] bg-[#ffb43222] px-2 py-0.5 rounded-full border border-[#ffb43244]">
                        <AlertCircle size={10} />
                        即将满载
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] text-[#00ff88] bg-[#00ff8822] px-2 py-0.5 rounded-full border border-[#00ff8844]">
                        <CheckCircle2 size={10} />
                        容量充足
                      </span>
                    )}
                  </div>
                  <div className="h-2 bg-[#1a2540] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isFull ? "bg-[#ff4444]" : isNearFull ? "bg-[#ffb432]" : "bg-[#b88eff]"
                      }`}
                      style={{ width: `${Math.min(100, ratio * 100)}%` }}
                    />
                  </div>
                  {isNearFull && (
                    <div className="text-[10px] text-[#ffb432] mt-2">
                      💡 建议出售或丢弃低价矿石（铁矿/硅矿）腾出空间
                    </div>
                  )}
                </div>
              )
            })()}
          </div>

          <div>
            <h3 className="text-[#6a7a9a] text-xs font-bold mb-2 flex items-center gap-1.5">
              <CheckCircle2 size={12} className="text-[#00d4ff]" />
              跨日库存变化验证
            </h3>
            <div className="bg-[#0a0e1a] rounded-lg p-3 border border-[#1a2540]">
              {(() => {
                const mineralTypes: MineralType[] = ["he3", "titanium", "iron", "silicon"]
                const mineralAmounts: Record<MineralType, number> = {
                  he3: 0, titanium: 0, iron: 0, silicon: 0,
                }
                for (const b of inventoryBatches) {
                  mineralAmounts[b.mineralType] += b.amount
                }

                return (
                  <div className="space-y-2">
                    {mineralTypes.map(mt => {
                      const added = dailyCollected[mt] || 0
                      const discarded = dailyDiscarded[mt] || 0
                      const endAmount = Math.round(mineralAmounts[mt])
                      const startAmount = Math.max(0, endAmount - added + discarded)
                      const isVerified = Math.abs(startAmount + added - discarded - endAmount) < 1

                      return (
                        <div
                          key={mt}
                          className="rounded p-2 border"
                          style={{
                            borderColor: isVerified ? "#00ff8833" : "#ff444433",
                            backgroundColor: isVerified ? "#00ff8808" : "#ff444408",
                          }}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: MINERAL_COLORS[mt] }} />
                              <span className="text-[11px] font-bold text-[#d4cfc4]">{MINERAL_NAMES[mt]}</span>
                            </div>
                            {isVerified ? (
                              <span className="flex items-center gap-1 text-[9px] text-[#00ff88]">
                                <CheckCircle2 size={9} />
                                数据一致
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-[9px] text-[#ff4444]">
                                <AlertCircle size={9} />
                                数据异常
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-4 gap-1 text-[9px]">
                            <div className="text-center">
                              <div className="text-[#4a5a7a]">期初</div>
                              <div className="text-[#d4cfc4] font-bold" style={{ fontFamily: "Orbitron, monospace" }}>{startAmount}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-[#4a5a7a]">+入库</div>
                              <div className="text-[#00ff88] font-bold" style={{ fontFamily: "Orbitron, monospace" }}>+{Math.round(added)}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-[#4a5a7a]">-丢弃</div>
                              <div className="text-[#ff4444] font-bold" style={{ fontFamily: "Orbitron, monospace" }}>-{discarded}</div>
                            </div>
                            <div className="text-center">
                              <div className="text-[#4a5a7a]">=期末</div>
                              <div style={{ color: MINERAL_COLORS[mt], fontFamily: "Orbitron, monospace" }} className="font-bold">{endAmount}</div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })()}
            </div>
          </div>

          {Object.values(dailyDiscarded).some(v => v > 0) && (
            <div>
              <h3 className="text-[#6a7a9a] text-xs font-bold mb-2 flex items-center gap-1.5">
                <Trash2 size={12} className="text-[#ff4444]" />
                今日丢弃记录
              </h3>
              <div className="bg-[#0a0e1a] rounded-lg p-3 border border-[#1a2540]">
                <div className="space-y-1">
                  {mineralTypes.filter(mt => (dailyDiscarded[mt] || 0) > 0).map(mt => (
                    <div key={mt} className="flex items-center justify-between text-[10px]">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: MINERAL_COLORS[mt] }} />
                        <span className="text-[#d4cfc4]">{MINERAL_NAMES[mt]}</span>
                      </div>
                      <span className="text-[#ff4444] font-bold" style={{ fontFamily: "Orbitron, monospace" }}>
                        -{dailyDiscarded[mt]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

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
