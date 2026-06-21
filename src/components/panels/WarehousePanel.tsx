import { useGameStore } from "@/store/gameStore"
import { MINERAL_NAMES, MINERAL_COLORS, MineralType } from "@/types/game"
import { DISCARDABLE_MINERALS } from "@/config/gameConfig"
import { Warehouse, Trash2, Archive, AlertTriangle } from "lucide-react"

export default function WarehousePanel() {
  const inventoryBatches = useGameStore(s => s.inventoryBatches)
  const warehouseCapacity = useGameStore(s => s.warehouseCapacity)
  const discardMinerals = useGameStore(s => s.discardMinerals)
  const discardBatch = useGameStore(s => s.discardBatch)
  const getWarehouseUsage = useGameStore(s => s.getWarehouseUsage)

  const usage = getWarehouseUsage()
  const capacity = warehouseCapacity
  const ratio = capacity > 0 ? usage / capacity : 0
  const mineralTypes: MineralType[] = ["he3", "titanium", "iron", "silicon"]

  const mineralAmounts: Record<MineralType, number> = {
    he3: 0, titanium: 0, iron: 0, silicon: 0,
  }
  for (const b of inventoryBatches) {
    mineralAmounts[b.mineralType] += b.amount
  }

  return (
    <div className="p-3 border-b border-[#1a2540]">
      <h2 className="text-[#d4cfc4] text-sm font-bold mb-3 flex items-center gap-2" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
        <Warehouse size={14} className="text-[#b88eff]" />
        月基仓库
      </h2>

      <div className="bg-[#0a0e1a] rounded-lg p-2.5 border border-[#1a2540] mb-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-bold text-[#d4cfc4]">
            容量使用
          </span>
          <span
            className={`text-[10px] font-bold ${
              ratio >= 0.9 ? "text-[#ff4444]" : ratio >= 0.7 ? "text-[#ffb432]" : "text-[#00ff88]"
            }`}
            style={{ fontFamily: "Orbitron, monospace" }}
          >
            {Math.round(usage)} / {capacity}
          </span>
        </div>
        <div className="h-2 bg-[#1a2540] rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full transition-all ${
              ratio >= 0.9 ? "bg-[#ff4444]" : ratio >= 0.7 ? "bg-[#ffb432]" : "bg-[#b88eff]"
            }`}
            style={{ width: `${Math.min(100, ratio * 100)}%` }}
          />
        </div>
        {ratio >= 0.9 && (
          <div className="text-[9px] text-[#ff4444] flex items-center gap-1 mb-1">
            <AlertTriangle size={9} />
            仓库即将满载！请出售或丢弃矿石
          </div>
        )}
        <div className="grid grid-cols-2 gap-1">
          {mineralTypes.map(mt => (
            <div key={mt} className="flex items-center justify-between text-[9px]">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: MINERAL_COLORS[mt] }} />
                <span className="text-[#6a7a9a]">{MINERAL_NAMES[mt]}</span>
              </div>
              <span style={{ color: MINERAL_COLORS[mt], fontFamily: "Orbitron, monospace" }}>
                {Math.round(mineralAmounts[mt])}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <h3 className="text-[10px] font-bold text-[#d4cfc4] mb-2 flex items-center gap-1.5">
          <Trash2 size={9} className="text-[#ff8c00]" />
          丢弃低价矿石
        </h3>
        <div className="text-[8px] text-[#4a5a7a] mb-2">
          当仓库满载时，可丢弃低价矿石（铁/硅）腾出空间
        </div>
        <div className="space-y-1.5">
          {DISCARDABLE_MINERALS.map(mt => {
            const amt = mineralAmounts[mt]
            const discardAmt = Math.min(amt, 10)
            return (
              <div key={mt} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: MINERAL_COLORS[mt] }} />
                  <span className="text-[10px] text-[#d4cfc4]">{MINERAL_NAMES[mt]}</span>
                  <span className="text-[9px] text-[#4a5a7a]">({Math.round(amt)})</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => discardMinerals(mt, discardAmt)}
                    disabled={amt < 1}
                    className={`text-[8px] px-1.5 py-0.5 rounded font-bold transition-colors ${
                      amt >= 1
                        ? "bg-[#ff444422] border border-[#ff444444] text-[#ff6666] hover:bg-[#ff444433]"
                        : "bg-[#0a0e1a] border border-[#1a2540] text-[#3a4a5a] cursor-not-allowed"
                    }`}
                  >
                    丢10
                  </button>
                  <button
                    onClick={() => discardMinerals(mt, amt)}
                    disabled={amt < 1}
                    className={`text-[8px] px-1.5 py-0.5 rounded font-bold transition-colors ${
                      amt >= 1
                        ? "bg-[#ff444422] border border-[#ff444444] text-[#ff6666] hover:bg-[#ff444433]"
                        : "bg-[#0a0e1a] border border-[#1a2540] text-[#3a4a5a] cursor-not-allowed"
                    }`}
                  >
                    全丢
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-bold text-[#d4cfc4] mb-2 flex items-center gap-1.5">
          <Archive size={9} className="text-[#00d4ff]" />
          库存批次明细
        </h3>
        {inventoryBatches.length === 0 ? (
          <div className="text-[9px] text-[#4a5a7a] text-center py-2 border border-dashed border-[#1a2540] rounded">
            暂无库存，等待矿车运输
          </div>
        ) : (
          <div className="space-y-1 max-h-36 overflow-y-auto">
            {inventoryBatches.slice().reverse().slice(0, 15).map(batch => (
              <div
                key={batch.id}
                className="bg-[#0a0e1a] rounded p-1.5 border border-[#1a2540] flex items-center justify-between"
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: MINERAL_COLORS[batch.mineralType] }} />
                  <div>
                    <div className="text-[9px] text-[#d4cfc4] font-bold">
                      {MINERAL_NAMES[batch.mineralType]} ×{batch.amount}
                    </div>
                    <div className="text-[8px] text-[#4a5a7a]">
                      第{batch.dayStored}天入库
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => discardBatch(batch.id)}
                  className="text-[8px] px-1.5 py-0.5 rounded bg-[#ff444411] border border-[#ff444433] text-[#ff6666] hover:bg-[#ff444422] transition-colors"
                  title="丢弃此批次"
                >
                  <Trash2 size={8} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
