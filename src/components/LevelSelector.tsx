import { useGameStore } from "@/store/gameStore"
import { LEVELS } from "@/config/levels"
import type { Level } from "@/types/game"
import { Star, Lock, Play, ArrowLeft, Trophy } from "lucide-react"

interface LevelSelectorProps {
  onBack: () => void
}

function StarDisplay({ count, max = 3 }: { count: number; max?: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }).map((_, i) => (
        <Star
          key={i}
          size={14}
          className={i < count ? "text-[#ffd700] fill-[#ffd700]" : "text-[#3a4a5a]"}
        />
      ))}
    </div>
  )
}

export default function LevelSelector({ onBack }: LevelSelectorProps) {
  const results = useGameStore(s => s.level.results)
  const startLevel = useGameStore(s => s.startLevel)

  const totalStars = Object.values(results).reduce((sum, r) => sum + r.bestStars, 0)
  const totalPossible = LEVELS.length * 3

  return (
    <div className="h-screen w-screen flex flex-col bg-gradient-to-br from-[#0a0e1a] via-[#0d1525] to-[#0a0e1a] overflow-hidden">
      <div className="px-8 pt-8 pb-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <button
            onClick={onBack}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#0d1220] border border-[#1a2540] text-[#6a7a9a] hover:text-[#00d4ff] hover:border-[#00d4ff44] transition-all"
          >
            <ArrowLeft size={16} />
            <span className="text-sm">返回主菜单</span>
          </button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#ffd70011] border border-[#ffd70033]">
            <Trophy size={18} className="text-[#ffd700]" />
            <span className="text-sm font-bold text-[#ffd700]" style={{ fontFamily: "Orbitron, monospace" }}>
              {totalStars} / {totalPossible}
            </span>
          </div>
        </div>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-[#d4cfc4] mb-2" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
          关卡选择
        </h1>
        <p className="text-[#6a7a9a] text-sm">完成目标解锁下一关，获取更高星级</p>
      </div>

      <div className="flex-1 overflow-y-auto px-8 pb-8">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {LEVELS.map((level: Level) => {
            const result = results[level.id]
            const unlocked = level.id === 1 || result?.unlocked === true
            const bestStars = result?.bestStars ?? 0

            return (
              <div
                key={level.id}
                className={`relative rounded-2xl p-5 border transition-all ${
                  unlocked
                    ? "bg-[#0d1220] border-[#1a2540] hover:border-[#00d4ff44] hover:shadow-[0_0_30px_rgba(0,212,255,0.1)] cursor-pointer group"
                    : "bg-[#0a0e1a] border-[#1a2540] opacity-60"
                }`}
                onClick={() => {
                  if (unlocked) startLevel(level.id)
                }}
              >
                {!unlocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e1a]/80 rounded-2xl z-10">
                    <div className="text-center">
                      <Lock size={32} className="text-[#3a4a5a] mx-auto mb-2" />
                      <span className="text-xs text-[#4a5a7a]">未解锁</span>
                    </div>
                  </div>
                )}

                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#00d4ff22] to-[#00ff8822] border border-[#00d4ff33] flex items-center justify-center text-2xl">
                      {level.icon}
                    </div>
                    <div>
                      <div className="text-xs text-[#4a5a7a] mb-0.5">关卡 {level.id}</div>
                      <h3 className="text-lg font-bold text-[#d4cfc4]" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
                        {level.name}
                      </h3>
                    </div>
                  </div>
                  {unlocked && (
                    <Play
                      size={20}
                      className="text-[#3a4a5a] group-hover:text-[#00d4ff] transition-colors"
                    />
                  )}
                </div>

                <p className="text-xs text-[#6a7a9a] mb-4 leading-relaxed" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
                  {level.description}
                </p>

                <div className="flex flex-wrap gap-1.5 mb-4">
                  {level.targets.slice(0, 3).map((t, i) => (
                    <span
                      key={i}
                      className="text-[10px] px-2 py-0.5 rounded-full bg-[#1a2540] text-[#6a7a9a] border border-[#2a3550]"
                    >
                      {t.label}: {t.value}
                    </span>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#1a2540]">
                  <StarDisplay count={bestStars} />
                  {level.reward.credits && (
                    <span className="text-[10px] text-[#ffd700]">
                      奖励: +{level.reward.credits} 金币
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
