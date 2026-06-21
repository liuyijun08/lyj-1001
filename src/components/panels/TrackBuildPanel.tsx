import { useGameStore } from "@/store/gameStore"
import { Route } from "lucide-react"

export default function TrackBuildPanel() {
  const trackBuildMode = useGameStore(s => s.trackBuildMode)
  const toggleTrackBuild = useGameStore(s => s.toggleTrackBuild)

  return (
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
  )
}
