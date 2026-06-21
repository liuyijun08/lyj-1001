import GameCanvas from "@/components/GameCanvas"
import TopBar from "@/components/TopBar"
import SidePanel from "@/components/SidePanel"
import DaySettlement from "@/components/DaySettlement"
import LevelSelector from "@/components/LevelSelector"
import LevelProgress from "@/components/LevelProgress"
import LevelCompleteModal from "@/components/LevelCompleteModal"
import { useGameStore } from "@/store/gameStore"
import { MINERAL_NAMES, MINERAL_COLORS, MineralType } from "@/types/game"
import { Mountain, Play, Trophy, Rocket, Settings } from "lucide-react"

const mineralTypes: MineralType[] = ["he3", "titanium", "iron", "silicon"]

export default function Home() {
  const currentView = useGameStore(s => s.currentView)
  const isPaused = useGameStore(s => s.isPaused)
  const togglePause = useGameStore(s => s.togglePause)
  const inLevelMode = useGameStore(s => s.inLevelMode)
  const exitLevel = useGameStore(s => s.exitLevel)
  const resetGame = useGameStore(s => s.resetGame)
  const setView = useGameStore(s => s.setView)

  const handleStartFreePlay = () => {
    resetGame()
  }

  if (currentView === "levelSelect") {
    return <LevelSelector onBack={() => setView("menu")} />
  }

  if (currentView === "menu") {
    return (
      <div className="h-screen w-screen flex flex-col bg-gradient-to-br from-[#0a0e1a] via-[#0d1525] to-[#0a0e1a] overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[15%] left-[10%] w-64 h-64 bg-[#00d4ff] rounded-full opacity-5 blur-3xl" />
          <div className="absolute bottom-[20%] right-[15%] w-96 h-96 bg-[#00ff88] rounded-full opacity-5 blur-3xl" />
          <div className="absolute top-[50%] left-[50%] w-80 h-80 bg-[#ffd700] rounded-full opacity-5 blur-3xl" />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
          <div className="mb-12 text-center">
            <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-gradient-to-br from-[#00d4ff22] to-[#00ff8822] border border-[#00d4ff33] flex items-center justify-center shadow-[0_0_40px_rgba(0,212,255,0.2)]">
              <Rocket size={40} className="text-[#00d4ff]" />
            </div>
            <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00d4ff] via-[#00ff88] to-[#ffd700] mb-3" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
              月球采矿帝国
            </h1>
            <p className="text-[#6a7a9a] text-base">铺设轨道 · 调度矿车 · 建造你的采矿王国</p>
          </div>

          <div className="flex flex-col gap-4 w-full max-w-sm">
            <button
              onClick={() => setView("levelSelect")}
              className="group w-full flex items-center gap-4 px-6 py-4 rounded-2xl bg-gradient-to-r from-[#00d4ff] to-[#00ff88] text-[#0a0e1a] font-bold text-lg hover:shadow-[0_0_30px_rgba(0,212,255,0.3)] transition-all hover:scale-[1.02]"
            >
              <div className="w-11 h-11 rounded-xl bg-[#0a0e1a]/20 flex items-center justify-center">
                <Trophy size={22} />
              </div>
              <div className="text-left flex-1">
                <div className="text-base">新手关卡</div>
                <div className="text-[11px] opacity-80 font-normal">学习玩法，达成目标赢取奖励</div>
              </div>
              <Play size={18} className="opacity-70" />
            </button>

            <button
              onClick={handleStartFreePlay}
              className="group w-full flex items-center gap-4 px-6 py-4 rounded-2xl bg-[#0d1220] border border-[#1a2540] text-[#d4cfc4] font-bold text-lg hover:border-[#ffd70044] hover:shadow-[0_0_30px_rgba(255,215,0,0.1)] transition-all hover:scale-[1.02]"
            >
              <div className="w-11 h-11 rounded-xl bg-[#ffd70011] flex items-center justify-center">
                <Mountain size={22} className="text-[#ffd700]" />
              </div>
              <div className="text-left flex-1">
                <div className="text-base">自由模式</div>
                <div className="text-[11px] text-[#6a7a9a] font-normal">无限制采矿，自由探索月球</div>
              </div>
              <Play size={18} className="opacity-50" />
            </button>
          </div>

          <div className="mt-16 flex items-center gap-6">
            {mineralTypes.map(type => (
              <div key={type} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: MINERAL_COLORS[type] }} />
                <span className="text-[11px]" style={{ color: MINERAL_COLORS[type] }}>{MINERAL_NAMES[type]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="pb-6 text-center">
          <p className="text-[11px] text-[#3a4a5a]">v1.0.0 · 铺设轨道连通矿点开始采矿</p>
        </div>

        <LevelCompleteModal
          onSelectLevel={() => setView("levelSelect")}
          onFreePlay={() => {}}
        />
      </div>
    )
  }

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0e1a] overflow-hidden">
      <TopBar />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative">
          {inLevelMode && <LevelProgress />}
          <GameCanvas />

          {isPaused && !inLevelMode && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
              <div className="text-center pointer-events-auto">
                <div className="text-[#d4cfc4] text-xl font-bold mb-2" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
                  游戏暂停
                </div>
                <div className="text-[#6a7a9a] text-sm mb-4">
                  点击继续或铺设轨道开始游戏
                </div>
                <button
                  onClick={togglePause}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#00d4ff] to-[#00ff88] text-[#0a0e1a] font-bold text-sm hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all"
                >
                  继续游戏
                </button>
              </div>
            </div>
          )}

          {isPaused && inLevelMode && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none">
              <div className="text-center pointer-events-auto">
                <div className="text-[#d4cfc4] text-xl font-bold mb-2" style={{ fontFamily: "'Noto Sans SC', sans-serif" }}>
                  关卡暂停
                </div>
                <div className="text-[#6a7a9a] text-sm mb-4">
                  完成目标解锁下一关
                </div>
                <button
                  onClick={togglePause}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#00d4ff] to-[#00ff88] text-[#0a0e1a] font-bold text-sm hover:shadow-[0_0_20px_rgba(0,212,255,0.3)] transition-all"
                >
                  继续挑战
                </button>
              </div>
            </div>
          )}

          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <div className="bg-[#0d1220]/90 border border-[#1a2540] rounded-lg px-3 py-1.5 backdrop-blur-sm">
              <span className="text-[10px] text-[#6a7a9a]">图例</span>
              <div className="flex items-center gap-3 mt-1">
                {mineralTypes.map(type => (
                  <div key={type} className="flex items-center gap-1">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: MINERAL_COLORS[type] }} />
                    <span className="text-[10px]" style={{ color: MINERAL_COLORS[type] }}>{MINERAL_NAMES[type]}</span>
                  </div>
                ))}
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#e8e0d0]" />
                  <span className="text-[10px] text-[#e8e0d0]">基地</span>
                </div>
              </div>
            </div>
            {!inLevelMode && (
              <button
                onClick={() => {
                  if (confirm("返回主菜单？当前进度将丢失")) {
                    exitLevel()
                    setView("menu")
                  }
                }}
                className="bg-[#0d1220]/90 border border-[#1a2540] rounded-lg px-3 py-1.5 backdrop-blur-sm flex items-center gap-1.5 text-[10px] text-[#6a7a9a] hover:text-[#ff4444] hover:border-[#ff444444] transition-colors"
              >
                <Settings size={10} />
                主菜单
              </button>
            )}
            {inLevelMode && (
              <button
                onClick={() => {
                  if (confirm("返回选关页面？当前关卡进度将保留")) {
                    exitLevel()
                    setView("levelSelect")
                  }
                }}
                className="bg-[#0d1220]/90 border border-[#1a2540] rounded-lg px-3 py-1.5 backdrop-blur-sm flex items-center gap-1.5 text-[10px] text-[#6a7a9a] hover:text-[#00d4ff] hover:border-[#00d4ff44] transition-colors"
              >
                <Settings size={10} />
                选关
              </button>
            )}
          </div>
        </div>

        <SidePanel />
      </div>

      <DaySettlement />
      <LevelCompleteModal
        onSelectLevel={() => setView("levelSelect")}
        onFreePlay={() => exitLevel()}
      />
    </div>
  )
}
