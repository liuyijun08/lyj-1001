import { useGameStore } from "@/store/gameStore"
import { MINERAL_NAMES, MINERAL_COLORS, MINERAL_PRICES, MineralType, CART_STATUS_LABELS } from "@/types/game"
import { NEW_CART_COST } from "@/config/gameConfig"
import ConflictPanel from "@/components/ConflictPanel"
import {
  Mountain, Truck, Route, Battery, Package, AlertTriangle,
  Play, Square, ShoppingCart, Info, BatteryCharging
} from "lucide-react"

const mineralTypes: MineralType[] = ["he3", "titanium", "iron", "silicon"]

export default function SidePanel() {
  const selectedNodeId = useGameStore(s => s.selectedNodeId)
  const selectedCartId = useGameStore(s => s.selectedCartId)
  const trackBuildMode = useGameStore(s => s.trackBuildMode)
  const toggleTrackBuild = useGameStore(s => s.toggleTrackBuild)
  const mineNodes = useGameStore(s => s.mineNodes)
  const tracks = useGameStore(s => s.tracks)
  const carts = useGameStore(s => s.carts)
  const basePosition = useGameStore(s => s.basePosition)
  const assignCartToMine = useGameStore(s => s.assignCartToMine)
  const unassignCart = useGameStore(s => s.unassignCart)
  const forceReturnCart = useGameStore(s => s.forceReturnCart)
  const buyCart = useGameStore(s => s.buyCart)
  const resources = useGameStore(s => s.resources)
  const conflicts = useGameStore(s => s.conflicts)

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

      {selectedMine && (
        <div className="p-3 border-b border-[#1a2540]">
          <h2 className="text-[#d4cfc4] text-sm font-bold mb-2 flex items-center gap-2" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
            <Mountain size={14} style={{ color: MINERAL_COLORS[selectedMine.mineralType] }} />
            矿点信息
          </h2>
          <div className="bg-[#0a0e1a] rounded-lg p-3 border border-[#1a2540]">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[#d4cfc4] text-sm font-medium">{selectedMine.name}</span>
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
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#6a7a9a]">日产量</span>
                <span className="text-[#d4cfc4]" style={{ fontFamily: "Orbitron, monospace" }}>{selectedMine.dailyYield}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#6a7a9a]">剩余储量</span>
                <span className="text-[#d4cfc4]" style={{ fontFamily: "Orbitron, monospace" }}>{Math.round(selectedMine.remaining)}/{selectedMine.maxReserve}</span>
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
                      backgroundColor: MINERAL_COLORS[selectedMine.mineralType],
                    }}
                  />
                </div>
              </div>
            </div>
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
                  <span>速度 {cart.speed}</span>
                </div>

                {cart.status === "idle" && isSelected && (
                  <div>
                    {isLowBattery ? (
                      <div className="bg-[#ff444411] border border-[#ff444433] rounded p-2 mb-2">
                        <p className="text-[10px] text-[#ff6666] font-medium">电量低于20%，禁止派遣新任务</p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            forceReturnCart(cart.id)
                          }}
                          className="mt-1.5 w-full flex items-center justify-center gap-1 py-1.5 rounded text-[10px] font-bold bg-[#ff444422] border border-[#ff4444] text-[#ff4444] hover:bg-[#ff444433] transition-colors"
                        >
                          <BatteryCharging size={10} />
                          立即充电
                        </button>
                      </div>
                    ) : (
                      <>
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
                      </>
                    )}
                  </div>
                )}

                {cart.status !== "idle" && cart.status !== "charging" && (
                  <div className="flex gap-1.5">
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
              </div>
            )
          })}
        </div>
      </div>

      <ConflictPanel />
    </div>
  )
}
