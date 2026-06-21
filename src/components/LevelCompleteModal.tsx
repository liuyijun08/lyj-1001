import { useGameStore } from "@/store/gameStore"
import { getLevelById, LEVELS } from "@/config/levels"
import { Star, Trophy, Coins, ArrowRight, RotateCcw, Home } from "lucide-react"

interface LevelCompleteModalProps {
  onSelectLevel: () => void
  onFreePlay: () => void
}

export default function LevelCompleteModal({ onSelectLevel, onFreePlay }: LevelCompleteModalProps) {
  const currentLevelId = useGameStore(s => s.level.currentLevelId)
  const showLevelComplete = useGameStore(s => s.level.showLevelComplete)
  const completedStars = useGameStore(s => s.level.completedStars)
  const results = useGameStore(s => s.level.results)
  const closeLevelComplete = useGameStore(s => s.closeLevelComplete)
  const startLevel = useGameStore(s => s.startLevel)
  const exitLevel = useGameStore(s => s.exitLevel)

  if (!showLevelComplete || !currentLevelId) return null

  const level = getLevelById(currentLevelId)
  if (!level) return null

  const result = results[currentLevelId]
  const bestStars = result?.bestStars ?? 0
  const isNewBest = completedStars >= bestStars && completedStars > 0

  const nextLevelId = currentLevelId + 1
  const nextLevel = LEVELS.find(l => l.id === nextLevelId)
  const nextLevelUnlocked = nextLevel ? results[nextLevelId]?.unlocked : false

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="w-[420px] max-w-[90vw] bg-gradient-to-br from-[#0d1220] to-[#0a0e1a] border border-[#00d4ff33] rounded-2xl p-6 shadow-[0_0_60px_rgba(0,212,255,0.2)] animate-[fadeIn_0.3s_ease-out]">
        <div className="text-center mb-5">
          <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-[#ffd70022] to-[#ff8c0022] border border-[#ffd70033] flex items-center justify-center">
            <Trophy size={32} className="text-[#ffd700]" />
          </div>
          <h2 className="text-2xl font-bold text-[#d4cfc4] mb-1" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
            关卡通关！
          </h2>
          <p className="text-sm text-[#6a7a9a]">{level.name}</p>
        </div>

        <div className="flex justify-center gap-3 mb-5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-500 ${
                i <= completedStars
                  ? "bg-gradient-to-br from-[#ffd70022] to-[#ff8c0022] border border-[#ffd70055]"
                  : "bg-[#1a2540] border border-[#2a3550]"
              }`}
              style={{
                animationDelay: `${i * 0.15}s`,
                transform: i <= completedStars ? "scale(1)" : "scale(0.9)",
              }}
            >
              <Star
                size={28}
                className={
                  i <= completedStars
                    ? "text-[#ffd700] fill-[#ffd700] drop-shadow-[0_0_8px_rgba(255,215,0,0.6)]"
                    : "text-[#3a4a5a]"
                }
              />
            </div>
          ))}
        </div>

        {isNewBest && completedStars > 0 && (
          <div className="text-center mb-4">
            <span className="inline-block text-xs px-3 py-1 rounded-full bg-[#00ff8822] border border-[#00ff8844] text-[#00ff88] font-bold">
              🎉 新纪录！最佳星级
            </span>
          </div>
        )}

        {level.reward.credits && level.reward.credits > 0 && (
          <div className="flex items-center justify-center gap-2 mb-5 py-2.5 px-4 rounded-lg bg-[#ffd70011] border border-[#ffd70033]">
            <Coins size={18} className="text-[#ffd700]" />
            <span className="text-sm font-bold text-[#ffd700]" style={{ fontFamily: "Orbitron, monospace" }}>
              奖励金币 +{level.reward.credits}
            </span>
          </div>
        )}

        <div className="space-y-2.5">
          {nextLevel && nextLevelUnlocked && (
            <button
              onClick={() => {
                closeLevelComplete()
                startLevel(nextLevelId)
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-[#00d4ff] to-[#00ff88] text-[#0a0e1a] font-bold text-sm hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all"
            >
              <span>挑战下一关: {nextLevel.name}</span>
              <ArrowRight size={16} />
            </button>
          )}

          <div className="flex gap-2.5">
            <button
              onClick={() => {
                closeLevelComplete()
                startLevel(currentLevelId)
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#0d1220] border border-[#1a2540] text-[#6a7a9a] hover:text-[#00d4ff] hover:border-[#00d4ff44] text-sm font-medium transition-all"
            >
              <RotateCcw size={14} />
              <span>重玩本关</span>
            </button>
            <button
              onClick={() => {
                closeLevelComplete()
                onSelectLevel()
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-[#0d1220] border border-[#1a2540] text-[#6a7a9a] hover:text-[#ffd700] hover:border-[#ffd70044] text-sm font-medium transition-all"
            >
              <Home size={14} />
              <span>选关</span>
            </button>
          </div>

          <button
            onClick={() => {
              closeLevelComplete()
              exitLevel()
              onFreePlay()
            }}
            className="w-full py-2.5 rounded-xl text-[11px] text-[#4a5a7a] hover:text-[#6a7a9a] transition-colors"
          >
            进入自由模式继续游戏
          </button>
        </div>
      </div>
    </div>
  )
}
