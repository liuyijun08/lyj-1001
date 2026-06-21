import { useGameStore } from "@/store/gameStore"
import { MINERAL_NAMES, MINERAL_COLORS, MINERAL_PRICES, MineralType, CART_STATUS_LABELS, REPAIR_VEHICLE_STATUS_LABELS, TRACK_STATUS_LABELS, CABLE_STATUS_LABELS } from "@/types/game"
import { NEW_CART_COST, SUPPLY_PLAN_COST, NEW_REPAIR_VEHICLE_COST, POWER_STATION_COST, POWER_CABLE_COST_PER_UNIT, UNPOWERED_SPEED_RATIO, WAREHOUSE_CAPACITY, DISCARDABLE_MINERALS } from "@/config/gameConfig"
import ConflictPanel from "@/components/ConflictPanel"
import {
  Mountain, Truck, Route, Battery, Package, AlertTriangle,
  ShoppingCart, Info, BatteryCharging, Droplets,
  X, Clock, CheckCircle, TrendingUp, Wrench, Zap, History,
  Warehouse, Trash2, Archive
} from "lucide-react"

export default function SidePanel() {
  const selectedNodeId = useGameStore(s => s.selectedNodeId)
  const selectedCartId = useGameStore(s => s.selectedCartId)
  const trackBuildMode = useGameStore(s => s.trackBuildMode)
  const toggleTrackBuild = useGameStore(s => s.toggleTrackBuild)
  const mineNodes = useGameStore(s => s.mineNodes)
  const tracks = useGameStore(s => s.tracks)
  const carts = useGameStore(s => s.carts)
  const assignCartToMine = useGameStore(s => s.assignCartToMine)
  const unassignCart = useGameStore(s => s.unassignCart)
  const forceReturnCart = useGameStore(s => s.forceReturnCart)
  const buyCart = useGameStore(s => s.buyCart)
  const requestSupplyPlan = useGameStore(s => s.requestSupplyPlan)
  const cancelSupplyPlan = useGameStore(s => s.cancelSupplyPlan)
  const resources = useGameStore(s => s.resources)
  const conflicts = useGameStore(s => s.conflicts)
  const supplyQueue = useGameStore(s => s.supplyQueue)
  const dailyRecoveryDetails = useGameStore(s => s.dailyRecoveryDetails)
  const day = useGameStore(s => s.day)
  const repairVehicles = useGameStore(s => s.repairVehicles)
  const selectedRepairVehicleId = useGameStore(s => s.selectedRepairVehicleId)
  const accidents = useGameStore(s => s.accidents)
  const buyRepairVehicle = useGameStore(s => s.buyRepairVehicle)
  const dispatchRepairVehicle = useGameStore(s => s.dispatchRepairVehicle)
  const triggerMeteorShower = useGameStore(s => s.triggerMeteorShower)
  const selectRepairVehicle = useGameStore(s => s.selectRepairVehicle)
  const meteorCooldown = useGameStore(s => s.meteorCooldown)
  const powerStations = useGameStore(s => s.powerStations)
  const powerCables = useGameStore(s => s.powerCables)
  const poweredNodes = useGameStore(s => s.poweredNodes)
  const powerBuildMode = useGameStore(s => s.powerBuildMode)
  const selectedPowerStationId = useGameStore(s => s.selectedPowerStationId)
  const togglePowerBuildMode = useGameStore(s => s.togglePowerBuildMode)
  const validatePowerGrid = useGameStore(s => s.validatePowerGrid)
  const selectPowerStation = useGameStore(s => s.selectPowerStation)
  const isMinePowered = useGameStore(s => s.isMinePowered)
  const isNodePowered = useGameStore(s => s.isNodePowered)
  const inventoryBatches = useGameStore(s => s.inventoryBatches)
  const warehouseCapacity = useGameStore(s => s.warehouseCapacity)
  const dailyDiscarded = useGameStore(s => s.dailyDiscarded)
  const discardMinerals = useGameStore(s => s.discardMinerals)
  const discardBatch = useGameStore(s => s.discardBatch)
  const getWarehouseUsage = useGameStore(s => s.getWarehouseUsage)
  const dayLogs = useGameStore(s => s.dayLogs)

  const selectedMine = selectedNodeId && selectedNodeId !== "base"
    ? mineNodes.find(m => m.id === selectedNodeId)
    : null

  const selectedCart = selectedCartId
    ? carts.find(c => c.id === selectedCartId)
    : null

  const reachableMines = selectedCart && selectedCart.status === "idle"
    ? mineNodes.filter(mine => {
      const visited = new Set<string>()
      const queue = ["base"]
      visited.add("base")
      while (queue.length > 0) {
        const nodeId = queue.shift()!
        for (const t of tracks) {
          if (t.status === "broken") continue
          const neighbor = t.fromId === nodeId ? t.toId : t.toId === nodeId ? t.fromId : null
          if (neighbor && !visited.has(neighbor)) {
            visited.add(neighbor)
            queue.push(neighbor)
          }
        }
      }
      return visited.has(mine.id)
    })
    : []

  return (
    <div className="w-[320px] min-w-[320px] h-full bg-[#0d1220] border-l border-[#1a2540] overflow-y-auto flex flex-col">
      <div className="p-3 border-b border-[#1a2540]">
        <h2 className="text-[#d4cfc4] text-sm font-bold mb-3 flex items-center gap-2" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
          <Route size={14} className="text-[#00d4ff]" />
          轨道建设
        </h2>
        <button
          onClick={toggleTrackBuild}
          className={`w-full py-2 rounded-lg text-sm font-bold transition-all ${
            trackBuildMode
              ? "bg-[#00d4ff22] border border-[#00d4ff] text-[#00d4ff] shadow-[0_0_12px_rgba(0,212,255,0.2)]"
              : "bg-[#0a0e1a] border border-[#1a2540] text-[#6a7a9a] hover:border-[#3a4a6a]"
          }`}
        >
          {trackBuildMode ? "取消铺设" : "铺设轨道"}
        </button>
        <p className="text-[#4a5a7a] text-xs mt-2">
          {trackBuildMode ? "在地图上依次点击两个节点来铺设轨道" : "点击上方按钮进入轨道铺设模式"}
        </p>
      </div>

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

        {(() => {
          const stats = validatePowerGrid()
          const poweredMinesCount = mineNodes.filter(m => isMinePowered(m.id)).length
          return (
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
          )
        })()}

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

      <div className="p-3 border-b border-[#1a2540]">
        <h2 className="text-[#d4cfc4] text-sm font-bold mb-3 flex items-center gap-2" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
          <Warehouse size={14} className="text-[#b88eff]" />
          月基仓库
        </h2>

        {(() => {
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
            <>
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
            </>
          )
        })()}
      </div>

      {selectedMine && (
        <div className="p-3 border-b border-[#1a2540]">
          <h2 className="text-[#d4cfc4] text-sm font-bold mb-2 flex items-center gap-2" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
            <Mountain size={14} style={{ color: MINERAL_COLORS[selectedMine.mineralType] }} />
            矿点信息
          </h2>
          <div className="bg-[#0a0e1a] rounded-lg p-3 border border-[#1a2540]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#d4cfc4] text-sm font-medium">{selectedMine.name}</span>
              <div className="flex items-center gap-1.5">
                {selectedMine.remaining / selectedMine.maxReserve < 0.2 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#ff444422] text-[#ff4444] border border-[#ff444444] animate-pulse flex items-center gap-1">
                    <AlertTriangle size={9} />
                    枯竭预警
                  </span>
                )}
                <span
                  className="text-xs px-2 py-0.5 rounded-full border"
                  style={{
                    color: MINERAL_COLORS[selectedMine.mineralType],
                    borderColor: `${MINERAL_COLORS[selectedMine.mineralType]}44`,
                    backgroundColor: `${MINERAL_COLORS[selectedMine.mineralType]}11`,
                  }}
                >
                  {MINERAL_NAMES[selectedMine.mineralType]}
                </span>
              </div>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#6a7a9a]">日产量</span>
                <span className="text-[#d4cfc4]" style={{ fontFamily: "Orbitron, monospace" }}>{selectedMine.dailyYield}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6a7a9a]">剩余储量</span>
                <span
                  className={selectedMine.remaining / selectedMine.maxReserve < 0.2 ? "text-[#ff4444]" : "text-[#d4cfc4]"}
                  style={{ fontFamily: "Orbitron, monospace" }}
                >{Math.round(selectedMine.remaining)}/{selectedMine.maxReserve}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6a7a9a]">单价</span>
                <span className="text-[#ffd700]" style={{ fontFamily: "Orbitron, monospace" }}>{MINERAL_PRICES[selectedMine.mineralType]}</span>
              </div>
              <div className="mt-2">
                <div className="h-1.5 bg-[#1a2540] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(selectedMine.remaining / selectedMine.maxReserve) * 100}%`,
                      backgroundColor: selectedMine.remaining / selectedMine.maxReserve < 0.2 ? "#ff4444" : MINERAL_COLORS[selectedMine.mineralType],
                    }}
                  />
                </div>
              </div>
            </div>
            <div className="mt-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <h3 className="text-[11px] font-bold text-[#d4cfc4] flex items-center gap-1">
                  <Droplets size={10} className="text-[#00d4ff]" />
                  补给队列管理
                </h3>
                <span className="text-[9px] text-[#4a5a7a]">当前第 {day} 天</span>
              </div>

              {selectedMine.pendingSupply && selectedMine.currentSupplyId ? (
                (() => {
                  const supply = supplyQueue.find(s => s.id === selectedMine.currentSupplyId)
                  if (!supply) return null
                  return (
                    <div className="bg-[#00d4ff08] border border-[#00d4ff33] rounded p-2 mb-2">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <Clock size={10} className="text-[#00d4ff]" />
                          <span className="text-[10px] text-[#00d4ff] font-bold">待补给中</span>
                        </div>
                        <span className="text-[9px] text-[#4a5a7a]">申请日: 第{supply.requestDay}天</span>
                      </div>
                      <div className="text-[9px] text-[#6a7a9a] space-y-0.5 mb-1.5">
                        <div className="flex justify-between">
                          <span>补给量:</span>
                          <span className="text-[#d4cfc4]">+{supply.supplyAmount} 储量/日</span>
                        </div>
                        <div className="flex justify-between">
                          <span>花费:</span>
                          <span className="text-[#ffd700]">{supply.cost} 金币</span>
                        </div>
                        <div className="flex justify-between">
                          <span>预计生效:</span>
                          <span className="text-[#00ff88]">跨日结算后</span>
                        </div>
                      </div>
                      <button
                        onClick={() => cancelSupplyPlan(supply.id)}
                        className="w-full flex items-center justify-center gap-1 py-1 rounded text-[9px] font-bold bg-[#ff444411] border border-[#ff444444] text-[#ff6666] hover:bg-[#ff444422] transition-colors"
                      >
                        <X size={9} />
                        取消补给 (退还 {supply.refundAmount} 金币)
                      </button>
                    </div>
                  )
                })()
              ) : selectedMine.remaining / selectedMine.maxReserve < 0.2 ? (
                <button
                  onClick={() => requestSupplyPlan(selectedMine.id)}
                  disabled={resources.credits < SUPPLY_PLAN_COST}
                  className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded text-[10px] font-bold transition-colors ${
                    resources.credits >= SUPPLY_PLAN_COST
                      ? "bg-[#ffd70022] border border-[#ffd700] text-[#ffd700] hover:bg-[#ffd70033]"
                      : "bg-[#0a0e1a] border border-[#1a2540] text-[#3a4a5a] cursor-not-allowed"
                  }`}
                >
                  <Droplets size={10} />
                  申请补给计划 ({SUPPLY_PLAN_COST} 金币)
                </button>
              ) : (
                <div className="text-[9px] text-[#4a5a7a] text-center py-1.5 border border-dashed border-[#1a2540] rounded">
                  储量充足，无需补给
                </div>
              )}

              <div className="mt-2 p-2 bg-[#0a0e1a] border border-[#1a2540] rounded">
                <div className="flex items-center gap-1 mb-1">
                  <Info size={9} className="text-[#6a7a9a]" />
                  <span className="text-[9px] font-bold text-[#6a7a9a]">金币退还规则</span>
                </div>
                <div className="text-[8px] text-[#4a5a7a] space-y-0.5">
                  <div className="flex items-start gap-1">
                    <span className="text-[#ffd700]">•</span>
                    <span>申请补给: 扣除 {SUPPLY_PLAN_COST} 金币</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="text-[#00ff88]">•</span>
                    <span>生效前取消: 退还 70% ({Math.round(SUPPLY_PLAN_COST * 0.7)} 金币)</span>
                  </div>
                  <div className="flex items-start gap-1">
                    <span className="text-[#ff4444]">•</span>
                    <span>跨日生效后: 不可取消，不退还</span>
                  </div>
                </div>
              </div>
            </div>

            {(() => {
              const mineHistory = supplyQueue.filter(s => s.mineId === selectedMine.id && s.status !== "pending")
              if (mineHistory.length === 0) return null
              return (
                <div className="mt-2">
                  <h3 className="text-[10px] font-bold text-[#6a7a9a] mb-1 flex items-center gap-1">
                    <CheckCircle size={9} className="text-[#00ff88]" />
                    历史补给记录
                  </h3>
                  <div className="space-y-1 max-h-20 overflow-y-auto">
                    {mineHistory.slice().reverse().slice(0, 5).map(supply => (
                      <div key={supply.id} className="flex items-center justify-between text-[8px] bg-[#0a0e1a] rounded px-1.5 py-1">
                        <div className="flex items-center gap-1">
                          {supply.status === "completed" ? (
                            <CheckCircle size={8} className="text-[#00ff88]" />
                          ) : (
                            <X size={8} className="text-[#ff4444]" />
                          )}
                          <span className={supply.status === "completed" ? "text-[#00ff88]" : "text-[#ff4444]"}>
                            {supply.status === "completed" ? "已生效" : "已取消"}
                          </span>
                        </div>
                        <div className="text-[#4a5a7a]">
                          {supply.status === "completed"
                            ? `第${supply.completedDay}天生效`
                            : `第${supply.cancelledDay}天取消, 退${supply.refundAmount}`}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {(() => {
              const mineRecovery = dailyRecoveryDetails.filter(d => d.mineId === selectedMine.id)
              if (mineRecovery.length === 0) return null
              return (
                <div className="mt-2">
                  <h3 className="text-[10px] font-bold text-[#6a7a9a] mb-1 flex items-center gap-1">
                    <TrendingUp size={9} className="text-[#00d4ff]" />
                    跨日恢复明细
                  </h3>
                  <div className="space-y-1 max-h-24 overflow-y-auto">
                    {mineRecovery.slice().reverse().slice(0, 5).map(detail => (
                      <div key={`${detail.day}-${detail.mineId}`} className="bg-[#0a0e1a] rounded px-1.5 py-1.5 text-[8px]">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[#d4cfc4] font-bold">第{detail.day}天结算</span>
                          <span className="text-[#00ff88]">+{detail.totalRecovery}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[#4a5a7a]">
                          <span>基础: +{detail.baseRecovery}</span>
                          {detail.supplyBonus > 0 && (
                            <span className="text-[#00d4ff]">补给: +{detail.supplyBonus}</span>
                          )}
                        </div>
                        <div className="text-[#4a5a7a] mt-0.5">
                          剩余: {Math.round(detail.remainingAfter)}/{detail.maxReserve}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      <div className="p-3 border-b border-[#1a2540] flex-1">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[#d4cfc4] text-sm font-bold flex items-center gap-2" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
            <Truck size={14} className="text-[#ff8c00]" />
            矿车调度
          </h2>
          <button
            onClick={buyCart}
            disabled={resources.credits < NEW_CART_COST}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-colors ${
              resources.credits >= NEW_CART_COST
                ? "bg-[#00ff8822] border border-[#00ff88] text-[#00ff88] hover:bg-[#00ff8833]"
                : "bg-[#0a0e1a] border border-[#1a2540] text-[#3a4a5a] cursor-not-allowed"
            }`}
          >
            <ShoppingCart size={10} />
            购买 ({NEW_CART_COST})
          </button>
        </div>

        <div className="space-y-2">
          {carts.map(cart => {
            const isSelected = selectedCartId === cart.id
            const batteryRatio = cart.currentBattery / cart.maxBattery
            const loadRatio = cart.maxLoad > 0 ? cart.currentLoad / cart.maxLoad : 0
            const isConflicting = conflicts.some(c => c.cartId1 === cart.id || c.cartId2 === cart.id)
            const isLowBattery = batteryRatio < 0.2
            const isDraggable = cart.status === "idle" && !isLowBattery

            return (
              <div
                key={cart.id}
                draggable={isDraggable}
                onDragStart={(e) => {
                  if (!isDraggable) { e.preventDefault(); return }
                  e.dataTransfer.setData("text/plain", cart.id)
                  e.dataTransfer.effectAllowed = "move"
                  useGameStore.getState().selectCart(cart.id)
                }}
                onDragEnd={() => {}}
                onClick={() => useGameStore.getState().selectCart(cart.id)}
                className={`rounded-lg p-2.5 border transition-all select-none ${
                  isSelected
                    ? "bg-[#00d4ff0a] border-[#00d4ff44]"
                    : "bg-[#0a0e1a] border-[#1a2540]"
                } ${isDraggable ? "cursor-grab active:cursor-grabbing hover:border-[#00d4ff33]" : "cursor-pointer"}`}
                title={isDraggable ? "拖拽到地图上的矿点分配路线" : undefined}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[#d4cfc4] text-xs font-bold">{cart.name}</span>
                  <div className="flex items-center gap-1.5">
                    {isConflicting && <AlertTriangle size={12} className="text-[#ff4444] animate-pulse" />}
                    {isLowBattery && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#ff444422] text-[#ff4444] border border-[#ff444444] animate-pulse">低电</span>}
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        cart.status === "idle"
                          ? "bg-[#6a7a9a22] text-[#6a7a9a] border border-[#6a7a9a33]"
                          : cart.status === "mining"
                          ? "bg-[#ff8c0022] text-[#ff8c00] border border-[#ff8c0033]"
                          : cart.status === "charging"
                          ? "bg-[#ffd70022] text-[#ffd700] border border-[#ffd70033]"
                          : "bg-[#00d4ff22] text-[#00d4ff] border border-[#00d4ff33]"
                      }`}
                    >
                      {CART_STATUS_LABELS[cart.status]}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 mb-1.5">
                  <div className="flex-1">
                    <div className="flex items-center gap-1 mb-0.5">
                      <Battery size={8} className={!isLowBattery ? "text-[#00ff88]" : "text-[#ff4444]"} />
                      <span className="text-[10px] text-[#6a7a9a]">电量</span>
                    </div>
                    <div className="h-1 bg-[#1a2540] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${!isLowBattery ? "bg-[#00ff88]" : "bg-[#ff4444]"}`}
                        style={{ width: `${batteryRatio * 100}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1 mb-0.5">
                      <Package size={8} className="text-[#ff8c00]" />
                      <span className="text-[10px] text-[#6a7a9a]">载重</span>
                    </div>
                    <div className="h-1 bg-[#1a2540] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#ff8c00] rounded-full transition-all"
                        style={{ width: `${loadRatio * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-[10px] text-[#6a7a9a] mb-1.5">
                  <span>载重 {Math.round(cart.currentLoad)}/{cart.maxLoad}</span>
                  <span>·</span>
                  <span>电量 {Math.round(cart.currentBattery)}/{cart.maxBattery}</span>
                  <span>·</span>
                  <span className={cart.isPowered ? "text-[#00ff88]" : "text-[#ff6666]"}>
                    ⚡{cart.speed}{!cart.isPowered && " (降速)"}
                  </span>
                </div>

                {isLowBattery && cart.status === "idle" && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      forceReturnCart(cart.id)
                    }}
                    className="w-full flex items-center justify-center gap-1 py-1.5 rounded text-[10px] font-bold bg-[#ff444422] border border-[#ff4444] text-[#ff4444] hover:bg-[#ff444433] transition-colors mb-1.5"
                  >
                    <BatteryCharging size={10} />
                    立即充电
                  </button>
                )}

                {cart.status !== "idle" && cart.status !== "charging" && (
                  <div className="flex gap-1.5 mb-1.5">
                    {isLowBattery && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          forceReturnCart(cart.id)
                        }}
                        className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-[10px] font-bold bg-[#ff444422] border border-[#ff4444] text-[#ff4444] hover:bg-[#ff444433] transition-colors"
                      >
                        <BatteryCharging size={10} />
                        强制返航
                      </button>
                    )}
                    <button
                      onClick={() => unassignCart(cart.id)}
                      className={`${isLowBattery ? "flex-1" : "w-full"} text-[10px] px-2 py-1 rounded bg-[#ff444422] border border-[#ff444444] text-[#ff4444] hover:bg-[#ff444433] transition-colors`}
                    >
                      召回矿车
                    </button>
                  </div>
                )}

                {cart.status === "idle" && isSelected && !isLowBattery && (
                  <div>
                    <p className="text-[10px] text-[#6a7a9a] mb-1.5">分配到矿区：</p>
                    <div className="flex flex-wrap gap-1">
                      {reachableMines.map(mine => (
                        <button
                          key={mine.id}
                          onClick={() => assignCartToMine(cart.id, mine.id)}
                          className="text-[10px] px-2 py-1 rounded border transition-colors hover:bg-opacity-20"
                          style={{
                            color: MINERAL_COLORS[mine.mineralType],
                            borderColor: `${MINERAL_COLORS[mine.mineralType]}44`,
                            backgroundColor: `${MINERAL_COLORS[mine.mineralType]}11`,
                          }}
                        >
                          {mine.name}
                        </button>
                      ))}
                      {reachableMines.length === 0 && (
                        <span className="text-[10px] text-[#4a5a7a]">暂无可达矿点，请先铺设轨道</span>
                      )}
                    </div>
                  </div>
                )}

                {cart.status === "idle" && isSelected && isLowBattery && (
                  <p className="text-[10px] text-[#ff6666] text-center">
                    电量低于20%，禁止派遣新任务
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="p-3 border-b border-[#1a2540]">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[#d4cfc4] text-sm font-bold flex items-center gap-2" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
            <Wrench size={14} className="text-[#ffb432]" />
            维修车管理
          </h2>
          <button
            onClick={buyRepairVehicle}
            disabled={resources.credits < NEW_REPAIR_VEHICLE_COST}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-bold transition-colors ${
              resources.credits >= NEW_REPAIR_VEHICLE_COST
                ? "bg-[#ffb43222] border border-[#ffb432] text-[#ffb432] hover:bg-[#ffb43233]"
                : "bg-[#0a0e1a] border border-[#1a2540] text-[#3a4a5a] cursor-not-allowed"
            }`}
          >
            <ShoppingCart size={10} />
            购买 ({NEW_REPAIR_VEHICLE_COST})
          </button>
        </div>

        <div className="space-y-2">
          {repairVehicles.map(rv => {
            const isSelected = selectedRepairVehicleId === rv.id
            const brokenTracks = tracks.filter(t => t.status === "broken" && !t.repairVehicleId)
            const repairPct = rv.status === "repairing" && rv.repairDuration > 0
              ? Math.min(1, rv.repairProgress / rv.repairDuration) : 0

            return (
              <div
                key={rv.id}
                onClick={() => selectRepairVehicle(rv.id)}
                className={`rounded-lg p-2.5 border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#ffb4320a] border-[#ffb43244]"
                    : "bg-[#0a0e1a] border-[#1a2540] hover:border-[#ffb43233]"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[#d4cfc4] text-xs font-bold flex items-center gap-1.5">
                    <Wrench size={10} className="text-[#ffb432]" />
                    {rv.name}
                  </span>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      rv.status === "idle"
                        ? "bg-[#00ff8822] text-[#00ff88] border border-[#00ff8833]"
                        : rv.status === "repairing"
                        ? "bg-[#ffb43222] text-[#ffb432] border border-[#ffb43233]"
                        : "bg-[#00d4ff22] text-[#00d4ff] border border-[#00d4ff33]"
                    }`}
                  >
                    {REPAIR_VEHICLE_STATUS_LABELS[rv.status]}
                  </span>
                </div>

                {rv.status === "repairing" && (
                  <div className="mb-1.5">
                    <div className="h-1 bg-[#1a2540] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#ffb432] rounded-full transition-all"
                        style={{ width: `${repairPct * 100}%` }}
                      />
                    </div>
                    <div className="text-[9px] text-[#6a7a9a] mt-0.5">
                      维修进度: {Math.round(repairPct * 100)}%
                    </div>
                  </div>
                )}

                {rv.status === "idle" && brokenTracks.length > 0 && (
                  <div className="mt-1">
                    <p className="text-[10px] text-[#6a7a9a] mb-1">派往损毁轨道：</p>
                    <div className="flex flex-wrap gap-1">
                      {brokenTracks.map(track => {
                        const allNodes = [
                          { id: "base", name: "基地" },
                          ...mineNodes.map(m => ({ id: m.id, name: m.name })),
                        ]
                        const from = allNodes.find(n => n.id === track.fromId)
                        const to = allNodes.find(n => n.id === track.toId)
                        return (
                          <button
                            key={track.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              dispatchRepairVehicle(rv.id, track.id)
                            }}
                            className="text-[9px] px-1.5 py-0.5 rounded bg-[#ff444422] border border-[#ff444444] text-[#ff6666] hover:bg-[#ff444433] transition-colors"
                          >
                            {from?.name}→{to?.name} ({track.length}m)
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {rv.status === "idle" && brokenTracks.length === 0 && (
                  <p className="text-[9px] text-[#4a5a7a] text-center py-1">
                    当前无待修轨道
                  </p>
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-3 pt-3 border-t border-[#1a2540]">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] font-bold text-[#d4cfc4] flex items-center gap-1.5">
              <Zap size={10} className="text-[#ff4444]" />
              陨石雨测试
            </h3>
            {meteorCooldown > 0 && (
              <span className="text-[9px] text-[#6a7a9a]">
                冷却: {meteorCooldown.toFixed(1)}天
              </span>
            )}
          </div>
          <button
            onClick={triggerMeteorShower}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded text-[10px] font-bold bg-[#ff444422] border border-[#ff444466] text-[#ff6666] hover:bg-[#ff444433] transition-colors"
          >
            <Zap size={10} />
            触发陨石雨（测试）
          </button>
          <p className="text-[8px] text-[#4a5a7a] mt-1.5 text-center">
            游戏中每天有概率自然发生陨石雨
          </p>
        </div>
      </div>

      <div className="p-3 border-b border-[#1a2540]">
        <h2 className="text-[#d4cfc4] text-sm font-bold mb-3 flex items-center gap-2" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
          <History size={14} className="text-[#ff4444]" />
          事故记录
          {accidents.filter(a => !a.resolved).length > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#ff444422] text-[#ff4444] border border-[#ff444444] animate-pulse">
              {accidents.filter(a => !a.resolved).length} 未处理
            </span>
          )}
        </h2>
        {accidents.length === 0 ? (
          <div className="text-[10px] text-[#4a5a7a] text-center py-3 border border-dashed border-[#1a2540] rounded">
            暂无事故记录
          </div>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {accidents.slice().reverse().slice(0, 10).map(acc => {
              const track = tracks.find(t => t.id === acc.trackId)
              const allNodes = [
                { id: "base", name: "基地" },
                ...mineNodes.map(m => ({ id: m.id, name: m.name })),
              ]
              const from = track ? allNodes.find(n => n.id === track.fromId) : null
              const to = track ? allNodes.find(n => n.id === track.toId) : null
              return (
                <div
                  key={acc.id}
                  className={`rounded p-2 border text-[9px] ${
                    acc.resolved
                      ? "bg-[#00ff8808] border-[#00ff8822]"
                      : "bg-[#ff444408] border-[#ff444433]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1">
                      {acc.resolved ? (
                        <CheckCircle size={9} className="text-[#00ff88]" />
                      ) : (
                        <AlertTriangle size={9} className="text-[#ff4444]" />
                      )}
                      <span className="font-bold text-[#d4cfc4]">
                        第{acc.day}天 {acc.time.toFixed(1)}s
                      </span>
                    </div>
                    <span className={acc.resolved ? "text-[#00ff88]" : "text-[#ff4444]"}>
                      {acc.resolved ? "已修复" : track ? TRACK_STATUS_LABELS[track.status] : "断轨"}
                    </span>
                  </div>
                  <div className="text-[#6a7a9a]">
                    {from?.name} → {to?.name} ({track?.length}m)
                  </div>
                  <div className="text-[#8a8478] mt-0.5">{acc.description}</div>
                  {acc.resolved && acc.resolvedDay && (
                    <div className="text-[#00ff8888] mt-0.5">
                      修复: 第{acc.resolvedDay}天 {acc.resolvedTime?.toFixed(1)}s
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <ConflictPanel />
    </div>
  )
}
