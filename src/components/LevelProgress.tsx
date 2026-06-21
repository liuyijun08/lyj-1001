import { useGameStore } from "@/store/gameStore"
import { getLevelById } from "@/config/levels"
import { Target, Star, X, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import { MINERAL_COLORS } from "@/types/game"

export default function LevelProgress() {
  const currentLevelId = useGameStore(s => s.level.currentLevelId)
  const getLevelProgress = useGameStore(s => s.getLevelProgress)
  const exitLevel = useGameStore(s => s.exitLevel)
  const inLevelMode = useGameStore(s => s.inLevelMode)
  const [expanded, setExpanded] = useState(true)

  if (!inLevelMode || !currentLevelId) return null

  const level = getLevelById(currentLevelId)
  const progress = getLevelProgress()

  if (!level) return null

  const allComplete = progress.every(p => p.completed)

  return (
    <div className="absolute top-3 left-3 z-10 w-[320px] max-w-[calc(100vw-24px)]">
      <div className="bg-[#0d1220]/95 border border-[#1a2540] rounded-xl backdrop-blur-sm overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.5)]">
        <div
          className="flex items-center justify-between px-3 py-2 border-b border-[#1a2540] cursor-pointer hover:bg-[#1a2540]/30 transition-colors"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#00d4ff22] to-[#00ff8822] border border-[#00d4ff33] flex items-center justify-center text-sm">
              {level.icon}
            </div>
            <div>
              <div className="text-[10px] text-[#4a5a7a]">关卡 {level.id}</div>
              <div className="text-xs font-bold text-[#d4cfc4]" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
                {level.name}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {allComplete && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00ff8822] border border-[#00ff8844] text-[#00ff88] font-bold">
                已完成
              </span>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm("确定退出当前关卡吗？进度将保留")) {
                  exitLevel()
                }
              }}
              className="p-1 rounded hover:bg-[#ff444422] text-[#4a5a7a] hover:text-[#ff4444] transition-colors"
            >
              <X size={14} />
            </button>
            {expanded ? <ChevronUp size={14} className="text-[#4a5a7a]" /> : <ChevronDown size={14} className="text-[#4a5a7a]" />}
          </div>
        </div>

        {expanded && (
          <div className="p-3 space-y-2">
            <p className="text-[10px] text-[#6a7a9a] mb-2" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
              {level.description}
            </p>

            {level.targets.map((target, idx) => {
              const p = progress[idx]
              const ratio = p ? Math.min(1, p.current / target.value) : 0
              const isComplete = p?.completed ?? false

              return (
                <div key={target.id} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className={isComplete ? "text-[#00ff88]" : "text-[#d4cfc4]"}>
                      <Target size={10} className="inline mr-1 -mt-0.5" style={{ color: target.mineralType ? MINERAL_COLORS[target.mineralType] : undefined }} />
                      {target.label}
                    </span>
                    <span
                      className={isComplete ? "text-[#00ff88] font-bold" : "text-[#6a7a9a]"}
                      style={{ fontFamily: "Orbitron, monospace" }}
                    >
                      {p?.current ?? 0} / {target.value}
                    </span>
                  </div>
                  <div className="h-1.5 bg-[#1a2540] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isComplete ? "bg-[#00ff88]" : "bg-gradient-to-r from-[#00d4ff] to-[#00ff88]"
                      }`}
                      style={{ width: `${ratio * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}

            <div className="pt-2 mt-2 border-t border-[#1a2540]">
              <div className="text-[10px] text-[#4a5a7a] mb-1.5">星级条件</div>
              <div className="space-y-1">
                {level.starConditions.map((sc) => (
                  <div key={sc.stars} className="flex items-center gap-1.5">
                    <div className="flex">
                      {Array.from({ length: sc.stars }).map((_, i) => (
                        <Star key={i} size={10} className="text-[#ffd700] fill-[#ffd700]" />
                      ))}
                    </div>
                    <span className="text-[10px] text-[#6a7a9a]">{sc.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
