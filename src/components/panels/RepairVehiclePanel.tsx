import { useGameStore } from "@/store/gameStore"
import { TRACK_STATUS_LABELS, REPAIR_VEHICLE_STATUS_LABELS } from "@/types/game"
import { NEW_REPAIR_VEHICLE_COST } from "@/config/gameConfig"
import {
  Wrench, ShoppingCart, Zap,
  AlertTriangle, CheckCircle
} from "lucide-react"

export default function RepairVehiclePanel() {
  const repairVehicles = useGameStore(s => s.repairVehicles)
  const selectedRepairVehicleId = useGameStore(s => s.selectedRepairVehicleId)
  const tracks = useGameStore(s => s.tracks)
  const mineNodes = useGameStore(s => s.mineNodes)
  const accidents = useGameStore(s => s.accidents)
  const resources = useGameStore(s => s.resources)
  const buyRepairVehicle = useGameStore(s => s.buyRepairVehicle)
  const dispatchRepairVehicle = useGameStore(s => s.dispatchRepairVehicle)
  const triggerMeteorShower = useGameStore(s => s.triggerMeteorShower)
  const selectRepairVehicle = useGameStore(s => s.selectRepairVehicle)
  const meteorCooldown = useGameStore(s => s.meteorCooldown)

  return (
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

      <div className="mt-3 pt-3 border-t border-[#1a2540]">
        <h2 className="text-[#d4cfc4] text-sm font-bold mb-3 flex items-center gap-2" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
          <AlertTriangle size={14} className="text-[#ff4444]" />
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
    </div>
  )
}
