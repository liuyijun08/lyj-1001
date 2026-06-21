import { useGameStore } from "@/store/gameStore"
import { CABLE_STATUS_LABELS } from "@/types/game"
import { POWER_STATION_COST, POWER_CABLE_COST_PER_UNIT, UNPOWERED_SPEED_RATIO } from "@/config/gameConfig"
import { Zap, Info } from "lucide-react"

export default function PowerGridPanel() {
  const powerBuildMode = useGameStore(s => s.powerBuildMode)
  const togglePowerBuildMode = useGameStore(s => s.togglePowerBuildMode)
  const validatePowerGrid = useGameStore(s => s.validatePowerGrid)
  const powerStations = useGameStore(s => s.powerStations)
  const powerCables = useGameStore(s => s.powerCables)
  const poweredNodes = useGameStore(s => s.poweredNodes)
  const mineNodes = useGameStore(s => s.mineNodes)
  const isMinePowered = useGameStore(s => s.isMinePowered)
  const selectedPowerStationId = useGameStore(s => s.selectedPowerStationId)
  const selectPowerStation = useGameStore(s => s.selectPowerStation)

  const stats = validatePowerGrid()
  const poweredMinesCount = mineNodes.filter(m => isMinePowered(m.id)).length

  return (
    <div className="p-3 border-b border-[#1a2540]">
      <h2 className="text-[#d4cfc4] text-sm font-bold mb-3 flex items-center gap-2" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
        <Zap size={14} className="text-[#ffd700]" />
        电网管理
      </h2>

      <div className="grid grid-cols-2 gap-2 mb-3">
        <button
          onClick={() => togglePowerBuildMode("station")}
          className={`py-2 rounded-lg text-xs font-bold transition-all ${
            powerBuildMode === "station"
              ? "bg-[#00ff8822] border border-[#00ff88] text-[#00ff88] shadow-[0_0_12px_rgba(0,255,136,0.2)]"
              : "bg-[#0a0e1a] border border-[#1a2540] text-[#6a7a9a] hover:border-[#3a4a6a]"
          }`}
        >
          🏭 建发电站
          <div className="text-[9px] mt-0.5 font-normal opacity-70">
            {POWER_STATION_COST} 金币
          </div>
        </button>
        <button
          onClick={() => togglePowerBuildMode("cable")}
          className={`py-2 rounded-lg text-xs font-bold transition-all ${
            powerBuildMode === "cable"
              ? "bg-[#ffd70022] border border-[#ffd700] text-[#ffd700] shadow-[0_0_12px_rgba(255,215,0,0.2)]"
              : "bg-[#0a0e1a] border border-[#1a2540] text-[#6a7a9a] hover:border-[#3a4a6a]"
          }`}
        >
          🔌 铺电缆
          <div className="text-[9px] mt-0.5 font-normal opacity-70">
            {POWER_CABLE_COST_PER_UNIT} 金币/米
          </div>
        </button>
      </div>

      {powerBuildMode !== null && (
        <button
          onClick={() => togglePowerBuildMode(null)}
          className="w-full py-1.5 rounded-lg text-xs font-bold mb-3 bg-[#ff444422] border border-[#ff444444] text-[#ff6666] hover:bg-[#ff444433] transition-colors"
        >
          取消建造
        </button>
      )}

      <div className="bg-[#0a0e1a] rounded-lg p-2.5 border border-[#1a2540] mb-3">
        <h3 className="text-[11px] font-bold text-[#d4cfc4] mb-2 flex items-center gap-1.5">
          <Info size={10} className="text-[#ffd700]" />
          供电统计
        </h3>
        <div className="space-y-1 text-[10px]">
          <div className="flex justify-between">
            <span className="text-[#6a7a9a]">发电站数量</span>
            <span className="text-[#d4cfc4]" style={{ fontFamily: "Orbitron, monospace" }}>
              {powerStations.filter(s => s.operational).length} / {powerStations.length}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6a7a9a]">总发电量</span>
            <span className="text-[#00ff88]" style={{ fontFamily: "Orbitron, monospace" }}>
              {stats.totalOutput} kW
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6a7a9a]">电缆数量</span>
            <span className="text-[#d4cfc4]" style={{ fontFamily: "Orbitron, monospace" }}>
              {powerCables.length}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6a7a9a]">通电节点</span>
            <span className="text-[#ffd700]" style={{ fontFamily: "Orbitron, monospace" }}>
              {poweredNodes.length}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#6a7a9a]">通电矿点</span>
            <span className="text-[#ff8c00]" style={{ fontFamily: "Orbitron, monospace" }}>
              {poweredMinesCount} / {mineNodes.length}
            </span>
          </div>
        </div>
        <div className="mt-2 pt-2 border-t border-[#1a2540] text-[9px] text-[#4a5a7a]">
          💡 不通电的矿点矿车速度为 {Math.round(UNPOWERED_SPEED_RATIO * 100)}%
        </div>
      </div>

      <div className="mb-2">
        <h3 className="text-[10px] font-bold text-[#d4cfc4] mb-2 flex items-center gap-1.5">
          <Info size={9} className="text-[#00ff88]" />
          发电站列表
        </h3>
        <div className="space-y-1.5 max-h-28 overflow-y-auto">
          {powerStations.map(station => (
            <div
              key={station.id}
              onClick={() => selectPowerStation(station.id)}
              className={`rounded p-2 text-[9px] border cursor-pointer transition-all ${
                selectedPowerStationId === station.id
                  ? "bg-[#00ff880a] border-[#00ff8844]"
                  : "bg-[#0a0e1a] border-[#1a2540] hover:border-[#00ff8833]"
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[#d4cfc4] font-bold">
                  {station.name}
                </span>
                <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${
                  station.operational
                    ? "bg-[#00ff8822] text-[#00ff88] border border-[#00ff8844]"
                    : "bg-[#ff444422] text-[#ff4444] border border-[#ff444444]"
                }`}>
                  {station.operational ? "运行中" : "停机"}
                </span>
              </div>
              <div className="flex items-center justify-between text-[#4a5a7a]">
                <span>功率: <span className="text-[#00ff88]">{station.powerOutput}kW</span></span>
                <span>建造成本: {station.buildCost}</span>
              </div>
            </div>
          ))}
          {powerStations.length === 0 && (
            <div className="text-[9px] text-[#4a5a7a] text-center py-2 border border-dashed border-[#1a2540] rounded">
              暂无发电站
            </div>
          )}
        </div>
      </div>

      <div>
        <h3 className="text-[10px] font-bold text-[#d4cfc4] mb-2 flex items-center gap-1.5">
          <Info size={9} className="text-[#ffd700]" />
          电缆列表
        </h3>
        <div className="space-y-1.5 max-h-28 overflow-y-auto">
          {powerCables.map(cable => {
            const allNodes = [
              { id: "base", name: "基地" },
              ...mineNodes.map(m => ({ id: m.id, name: m.name })),
              ...powerStations.map(s => ({ id: s.id, name: s.name })),
            ]
            const from = allNodes.find(n => n.id === cable.fromId)
            const to = allNodes.find(n => n.id === cable.toId)
            return (
              <div
                key={cable.id}
                className="rounded p-2 text-[9px] bg-[#0a0e1a] border border-[#1a2540]"
              >
                <div className="flex items-center justify-between mb-0.5">
                  <span className="text-[#d4cfc4] truncate">
                    {from?.name ?? cable.fromId.slice(0,6)}
                    <span className="text-[#ffd700]"> → </span>
                    {to?.name ?? cable.toId.slice(0,6)}
                  </span>
                  <span className={`text-[8px] px-1 py-0.5 rounded-full shrink-0 ${
                    cable.status === "normal"
                      ? "bg-[#00ff8822] text-[#00ff88] border border-[#00ff8844]"
                      : cable.status === "broken"
                      ? "bg-[#ff444422] text-[#ff4444] border border-[#ff444444]"
                      : "bg-[#ffb43222] text-[#ffb432] border border-[#ffb43244]"
                  }`}>
                    {CABLE_STATUS_LABELS[cable.status]}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[#4a5a7a]">
                  <span>长度: <span className="text-[#d4cfc4]">{cable.length.toFixed(0)}m</span></span>
                  <span>成本: {cable.buildCost}</span>
                </div>
              </div>
            )
          })}
          {powerCables.length === 0 && (
            <div className="text-[9px] text-[#4a5a7a] text-center py-2 border border-dashed border-[#1a2540] rounded">
              暂无电缆，请铺设连接
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
