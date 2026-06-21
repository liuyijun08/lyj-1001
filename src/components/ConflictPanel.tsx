import { useMemo, useState } from "react"
import { useGameStore } from "@/store/gameStore"
import { AlertTriangle, Pause, Clock, ChevronDown, ChevronUp, Zap } from "lucide-react"

interface ConflictDetail {
  id: string
  cart1Name: string
  cart1Speed: number
  cart1Battery: number
  cart1MaxBattery: number
  cart1Id: string
  cart2Name: string
  cart2Speed: number
  cart2Battery: number
  cart2MaxBattery: number
  cart2Id: string
  duration: number
  firstSeenDay: number
  lowBatteryCartId: string
}

interface GroupedConflict {
  trackId: string
  trackLength: number
  conflicts: ConflictDetail[]
  totalDuration: number
  cartCount: number
}

export default function ConflictPanel() {
  const conflicts = useGameStore(s => s.conflicts)
  const carts = useGameStore(s => s.carts)
  const tracks = useGameStore(s => s.tracks)
  const pauseLowSpeedCartInConflict = useGameStore(s => s.pauseLowSpeedCartInConflict)
  const staggerDeparture = useGameStore(s => s.staggerDeparture)
  const resumeCart = useGameStore(s => s.resumeCart)

  const [expanded, setExpanded] = useState(true)

  const groupedConflicts = useMemo<GroupedConflict[]>(() => {
    const trackMap = new Map<string, GroupedConflict>()

    for (const conflict of conflicts) {
      const cart1 = carts.find(c => c.id === conflict.cartId1)
      const cart2 = carts.find(c => c.id === conflict.cartId2)
      const track = tracks.find(t => t.id === conflict.trackId)
      if (!cart1 || !cart2 || !track) continue

      const cart1BatteryRatio = cart1.currentBattery / cart1.maxBattery
      const cart2BatteryRatio = cart2.currentBattery / cart2.maxBattery
      const lowBatteryCartId = cart1BatteryRatio <= cart2BatteryRatio ? cart1.id : cart2.id

      if (!trackMap.has(conflict.trackId)) {
        trackMap.set(conflict.trackId, {
          trackId: conflict.trackId,
          trackLength: track.length,
          conflicts: [],
          totalDuration: 0,
          cartCount: 0,
        })
      }

      const group = trackMap.get(conflict.trackId)!
      group.conflicts.push({
        id: conflict.id,
        cart1Name: cart1.name,
        cart1Speed: cart1.speed,
        cart1Battery: cart1.currentBattery,
        cart1MaxBattery: cart1.maxBattery,
        cart1Id: cart1.id,
        cart2Name: cart2.name,
        cart2Speed: cart2.speed,
        cart2Battery: cart2.currentBattery,
        cart2MaxBattery: cart2.maxBattery,
        cart2Id: cart2.id,
        duration: conflict.duration,
        firstSeenDay: conflict.firstSeenDay,
        lowBatteryCartId,
      })
      group.totalDuration = Math.max(group.totalDuration, conflict.duration)
    }

    const result = Array.from(trackMap.values())
    for (const group of result) {
      const cartIds = new Set<string>()
      for (const c of group.conflicts) {
        cartIds.add(c.cart1Id)
        cartIds.add(c.cart2Id)
      }
      group.cartCount = cartIds.size
    }

    return result.sort((a, b) => b.totalDuration - a.totalDuration)
  }, [conflicts, carts, tracks])

  const getBatteryColor = (ratio: number) => {
    if (ratio <= 0.15) return "#ff4444"
    if (ratio <= 0.3) return "#ff8c00"
    return "#00ff88"
  }

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`
    const mins = Math.floor(seconds / 60)
    const secs = (seconds % 60).toFixed(0)
    return `${mins}m${secs}s`
  }

  const getCartStatusBadge = (cartId: string, isLowBattery: boolean) => {
    const cart = carts.find(c => c.id === cartId)
    if (!cart) return null
    const badges: JSX.Element[] = []

    if (isLowBattery) {
      badges.push(
        <span key="low" className="text-[10px] px-1.5 py-0.5 rounded bg-[#ff444433] text-[#ff4444] border border-[#ff444455]">
          低电
        </span>
      )
    }
    if (cart.isPaused) {
      badges.push(
        <span key="pause" className="text-[10px] px-1.5 py-0.5 rounded bg-[#ffd70022] text-[#ffd700] border border-[#ffd70033]">
          暂停中
        </span>
      )
    }
    if (cart.departureDelay > 0) {
      badges.push(
        <span key="delay" className="text-[10px] px-1.5 py-0.5 rounded bg-[#00d4ff22] text-[#00d4ff] border border-[#00d4ff33]">
          延迟 {formatDuration(cart.departureDelay)}
        </span>
      )
    }
    return <>{badges}</>
  }

  const renderCartInfo = (
    name: string,
    speed: number,
    battery: number,
    maxBattery: number,
    cartId: string,
    isLowBattery: boolean,
    align: "left" | "right"
  ) => {
    const batteryRatio = battery / maxBattery
    const batteryColor = getBatteryColor(batteryRatio)

    return (
      <div className={`flex items-center gap-1.5 flex-1 ${align === "right" ? "justify-end" : ""}`}>
        {align === "left" && getCartStatusBadge(cartId, isLowBattery)}
        <div className={`flex flex-col ${align === "right" ? "items-end" : ""}`}>
          <div className="flex items-center gap-1">
            <span className="text-[11px] text-[#d4cfc4] font-medium">
              {name}
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <span className="text-[#6a7a9a]">
              速度 <span style={{ color: "#00d4ff", fontFamily: "Orbitron, monospace" }}>{speed}</span>
            </span>
            <span className="text-[#6a7a9a]">
              电量 <span style={{ color: batteryColor, fontFamily: "Orbitron, monospace" }}>{Math.round(batteryRatio * 100)}%</span>
            </span>
            <div className="w-10 h-1 bg-[#1a2540] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{ width: `${batteryRatio * 100}%`, backgroundColor: batteryColor }}
              />
            </div>
          </div>
        </div>
        {align === "right" && getCartStatusBadge(cartId, isLowBattery)}
      </div>
    )
  }

  if (conflicts.length === 0) return null

  return (
    <div className="bg-[#ff444411] border-t border-[#ff444433]">
      <div
        className="p-3 cursor-pointer flex items-center justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-1.5">
          <AlertTriangle size={14} className="text-[#ff4444]" />
          <span className="text-[#ff4444] text-xs font-bold">路线冲突</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-[#ff444422] text-[#ff6666]">
            {conflicts.length} 处
          </span>
        </div>
        {expanded ? (
          <ChevronUp size={14} className="text-[#ff4444]" />
        ) : (
          <ChevronDown size={14} className="text-[#ff4444]" />
        )}
      </div>

      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {groupedConflicts.map(group => (
            <div
              key={group.trackId}
              className="bg-[#0a0e1a] rounded-lg border border-[#ff444433] overflow-hidden"
            >
              <div className="px-2.5 py-2 bg-[#ff444411] border-b border-[#ff444422] flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-[#ff6666] text-[11px] font-bold">
                    轨道 {group.trackId.slice(-4)}
                  </span>
                  <span className="text-[10px] text-[#ff8888]">
                    {group.trackLength}m · {group.cartCount} 车
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-[#ff8888]">
                  <Clock size={10} />
                  <span>持续 {formatDuration(group.totalDuration)}</span>
                </div>
              </div>

              <div className="p-2 space-y-2.5">
                {group.conflicts.map(conflict => {
                  const lowBatteryCart = carts.find(c => c.id === conflict.lowBatteryCartId)
                  const isPaused = lowBatteryCart?.isPaused
                  const pauseTip = isPaused
                    ? `恢复 ${lowBatteryCart?.name} 的运行`
                    : `暂停电量较低的 ${lowBatteryCart?.name}，时长约 ${(group.trackLength / (lowBatteryCart?.speed || 80) * 1.5).toFixed(1)} 秒，让高电车优先通过`
                  const staggerTip = `为电量较低的 ${lowBatteryCart?.name} 设置出发延迟，时长约 ${(group.trackLength / (lowBatteryCart?.speed || 80) * 2).toFixed(1)} 秒，避免再次冲突`

                  return (
                    <div key={conflict.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        {renderCartInfo(
                          conflict.cart1Name,
                          conflict.cart1Speed,
                          conflict.cart1Battery,
                          conflict.cart1MaxBattery,
                          conflict.cart1Id,
                          conflict.cart1Id === conflict.lowBatteryCartId,
                          "left"
                        )}
                        <span className="text-[10px] text-[#ff6666] mx-1">⇄</span>
                        {renderCartInfo(
                          conflict.cart2Name,
                          conflict.cart2Speed,
                          conflict.cart2Battery,
                          conflict.cart2MaxBattery,
                          conflict.cart2Id,
                          conflict.cart2Id === conflict.lowBatteryCartId,
                          "right"
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-[10px]">
                        <Clock size={9} className="text-[#ff8888]" />
                        <span className="text-[#ff8888]">
                          冲突时长 {formatDuration(conflict.duration)}
                        </span>
                        {conflict.firstSeenDay && (
                          <>
                            <span className="mx-1 text-[#4a5a7a]">·</span>
                            <span className="text-[#6a7a9a]">
                              第 {conflict.firstSeenDay} 天出现
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex gap-1.5">
                        <button
                          title={pauseTip}
                          onClick={(e) => {
                            e.stopPropagation()
                            const cart = carts.find(c => c.id === conflict.lowBatteryCartId)
                            if (cart?.isPaused) {
                              resumeCart(conflict.lowBatteryCartId)
                            } else {
                              pauseLowSpeedCartInConflict(conflict.id)
                            }
                          }}
                          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-[10px] font-bold transition-colors ${
                            isPaused
                              ? "bg-[#ffd70022] border border-[#ffd70044] text-[#ffd700] hover:bg-[#ffd70033]"
                              : "bg-[#ff888811] border border-[#ff666633] text-[#ff6666] hover:bg-[#ff666622]"
                          }`}
                        >
                          <Pause size={10} />
                          {isPaused ? "恢复低电车" : "暂停低电车"}
                        </button>
                        <button
                          title={staggerTip}
                          onClick={(e) => {
                            e.stopPropagation()
                            staggerDeparture(conflict.id)
                          }}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-[10px] font-bold bg-[#00d4ff11] border border-[#00d4ff33] text-[#00d4ff] hover:bg-[#00d4ff22] transition-colors"
                        >
                          <Zap size={10} />
                          错峰出发
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
