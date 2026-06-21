import type { Level } from "@/types/game"

export const LEVELS: Level[] = [
  {
    id: 1,
    name: "初探月面",
    description: "学习铺设轨道并连通第一个矿点",
    icon: "🚀",
    targets: [
      { id: "tracks-1", type: "tracks", label: "铺设轨道数量", value: 2 },
      { id: "mines-1", type: "minesConnected", label: "连通矿点数量", value: 1 },
      { id: "credits-1", type: "credits", label: "累计采矿收益（金币）", value: 100 },
    ],
    starConditions: [
      {
        stars: 1,
        label: "达成所有基础目标",
        condition: [
          { targetId: "tracks-1", value: 2 },
          { targetId: "mines-1", value: 1 },
          { targetId: "credits-1", value: 100 },
        ],
      },
      {
        stars: 2,
        label: "5天内完成，收益达200金币",
        condition: [
          { targetId: "tracks-1", value: 2 },
          { targetId: "mines-1", value: 1 },
          { targetId: "credits-1", value: 200 },
        ],
      },
      {
        stars: 3,
        label: "收益达400金币，连通2个矿点",
        condition: [
          { targetId: "tracks-1", value: 3 },
          { targetId: "mines-1", value: 2 },
          { targetId: "credits-1", value: 400 },
        ],
      },
    ],
    reward: { credits: 100, unlockLevel: [2] },
    initialResources: { credits: 500 },
    initialMineIds: ["mine-1", "mine-5"],
  },
  {
    id: 2,
    name: "矿脉扩张",
    description: "连通多个矿点，建立采矿网络",
    icon: "⛏️",
    targets: [
      { id: "tracks-2", type: "tracks", label: "铺设轨道数量", value: 4 },
      { id: "mines-2", type: "minesConnected", label: "连通矿点数量", value: 3 },
      { id: "credits-2", type: "credits", label: "累计采矿收益（金币）", value: 500 },
    ],
    starConditions: [
      {
        stars: 1,
        label: "达成所有基础目标",
        condition: [
          { targetId: "tracks-2", value: 4 },
          { targetId: "mines-2", value: 3 },
          { targetId: "credits-2", value: 500 },
        ],
      },
      {
        stars: 2,
        label: "收益达800金币",
        condition: [
          { targetId: "tracks-2", value: 5 },
          { targetId: "mines-2", value: 3 },
          { targetId: "credits-2", value: 800 },
        ],
      },
      {
        stars: 3,
        label: "收益达1200金币，连通5个矿点",
        condition: [
          { targetId: "tracks-2", value: 7 },
          { targetId: "mines-2", value: 5 },
          { targetId: "credits-2", value: 1200 },
        ],
      },
    ],
    reward: { credits: 200, unlockLevel: [3] },
    initialResources: { credits: 600 },
  },
  {
    id: 3,
    name: "钛矿开采",
    description: "专注钛矿采集，获取高额利润",
    icon: "💎",
    targets: [
      { id: "tracks-3", type: "tracks", label: "铺设轨道数量", value: 5 },
      { id: "titanium-3", type: "minerals", label: "累计采集钛矿", value: 50, mineralType: "titanium" },
      { id: "credits-3", type: "credits", label: "累计采矿收益（金币）", value: 1000 },
    ],
    starConditions: [
      {
        stars: 1,
        label: "达成所有基础目标",
        condition: [
          { targetId: "tracks-3", value: 5 },
          { targetId: "titanium-3", value: 50 },
          { targetId: "credits-3", value: 1000 },
        ],
      },
      {
        stars: 2,
        label: "钛矿达100，收益达1500",
        condition: [
          { targetId: "tracks-3", value: 6 },
          { targetId: "titanium-3", value: 100 },
          { targetId: "credits-3", value: 1500 },
        ],
      },
      {
        stars: 3,
        label: "钛矿达200，收益达2500",
        condition: [
          { targetId: "tracks-3", value: 8 },
          { targetId: "titanium-3", value: 200 },
          { targetId: "credits-3", value: 2500 },
        ],
      },
    ],
    reward: { credits: 300, unlockLevel: [4] },
    initialResources: { credits: 700 },
  },
  {
    id: 4,
    name: "氦-3战略",
    description: "采集珍贵的氦-3资源",
    icon: "✨",
    targets: [
      { id: "tracks-4", type: "tracks", label: "铺设轨道数量", value: 6 },
      { id: "he3-4", type: "minerals", label: "累计采集氦-3", value: 30, mineralType: "he3" },
      { id: "credits-4", type: "credits", label: "累计采矿收益（金币）", value: 1500 },
    ],
    starConditions: [
      {
        stars: 1,
        label: "达成所有基础目标",
        condition: [
          { targetId: "tracks-4", value: 6 },
          { targetId: "he3-4", value: 30 },
          { targetId: "credits-4", value: 1500 },
        ],
      },
      {
        stars: 2,
        label: "氦-3达60，收益达2500",
        condition: [
          { targetId: "tracks-4", value: 7 },
          { targetId: "he3-4", value: 60 },
          { targetId: "credits-4", value: 2500 },
        ],
      },
      {
        stars: 3,
        label: "氦-3达100，收益达4000",
        condition: [
          { targetId: "tracks-4", value: 9 },
          { targetId: "he3-4", value: 100 },
          { targetId: "credits-4", value: 4000 },
        ],
      },
    ],
    reward: { credits: 500, unlockLevel: [5] },
    initialResources: { credits: 800 },
  },
  {
    id: 5,
    name: "月球霸主",
    description: "建立完整采矿帝国，征服所有资源",
    icon: "👑",
    targets: [
      { id: "tracks-5", type: "tracks", label: "铺设轨道数量", value: 10 },
      { id: "mines-5", type: "minesConnected", label: "连通矿点数量", value: 8 },
      { id: "credits-5", type: "credits", label: "累计采矿收益（金币）", value: 3000 },
      { id: "silicon-5", type: "minerals", label: "累计采集硅矿", value: 100, mineralType: "silicon" },
      { id: "iron-5", type: "minerals", label: "累计采集铁矿", value: 150, mineralType: "iron" },
    ],
    starConditions: [
      {
        stars: 1,
        label: "达成所有基础目标",
        condition: [
          { targetId: "tracks-5", value: 10 },
          { targetId: "mines-5", value: 8 },
          { targetId: "credits-5", value: 3000 },
          { targetId: "silicon-5", value: 100 },
          { targetId: "iron-5", value: 150 },
        ],
      },
      {
        stars: 2,
        label: "收益达5000金币",
        condition: [
          { targetId: "tracks-5", value: 12 },
          { targetId: "mines-5", value: 8 },
          { targetId: "credits-5", value: 5000 },
          { targetId: "silicon-5", value: 150 },
          { targetId: "iron-5", value: 200 },
        ],
      },
      {
        stars: 3,
        label: "收益达8000金币，资源满仓",
        condition: [
          { targetId: "tracks-5", value: 15 },
          { targetId: "mines-5", value: 8 },
          { targetId: "credits-5", value: 8000 },
          { targetId: "silicon-5", value: 250 },
          { targetId: "iron-5", value: 300 },
        ],
      },
    ],
    reward: { credits: 1000 },
    initialResources: { credits: 1000 },
  },
]

export function getLevelById(id: number): Level | undefined {
  return LEVELS.find(l => l.id === id)
}
