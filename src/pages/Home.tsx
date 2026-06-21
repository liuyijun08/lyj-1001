import GameCanvas from "@/components/GameCanvas"
import TopBar from "@/components/TopBar"
import SidePanel from "@/components/SidePanel"
import DaySettlement from "@/components/DaySettlement"
import { useGameStore } from "@/store/gameStore"
import { MINERAL_NAMES, MINERAL_COLORS, MineralType } from "@/types/game"

const mineralTypes: MineralType[] = ["he3", "titanium", "iron", "silicon"]

export default function Home() {
  const isPaused = useGameStore(s => s.isPaused)
  const day = useGameStore(s => s.day)
  const togglePause = useGameStore(s => s.togglePause)
  const gameSpeed = useGameStore(s => s.gameSpeed)

  return (
    <div className="h-screen w-screen flex flex-col bg-[#0a0e1a] overflow-hidden">
      <TopBar />

      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 relative">
          <GameCanvas />

          {isPaused && (
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
          </div>
        </div>

        <SidePanel />
      </div>

      <DaySettlement />
    </div>
  )
}
