import type { MineNode, Cart, Resources } from "@/types/game"

export const MAP_WIDTH = 900
export const MAP_HEIGHT = 600
export const NODE_RADIUS = 20
export const BASE_RADIUS = 28
export const CART_SIZE = 12
export const DAY_DURATION = 60
export const MINING_TIME = 2
export const UNLOAD_TIME = 1
export const CHARGE_TIME = 3
export const CHARGE_COST = 5
export const TRACK_COST_PER_UNIT = 2
export const TRACK_MAINTENANCE_PER_UNIT = 0.5
export const CART_MAINTENANCE = 10
export const BASE_CHARGE_RATE = 30
export const MINING_SPEED = 5

export const INITIAL_RESOURCES: Resources = {
  credits: 500,
  he3: 0,
  titanium: 0,
  iron: 0,
  silicon: 0,
}

export const BASE_POSITION = { x: 450, y: 300 }

export const INITIAL_MINES: MineNode[] = [
  { id: "mine-1", name: "冷阱阿尔法", mineralType: "he3", dailyYield: 8, remaining: 200, maxReserve: 200, x: 130, y: 110, pendingSupply: false },
  { id: "mine-2", name: "暗影盆地", mineralType: "he3", dailyYield: 5, remaining: 150, maxReserve: 150, x: 720, y: 140, pendingSupply: false },
  { id: "mine-3", name: "泰坦岭", mineralType: "titanium", dailyYield: 10, remaining: 300, maxReserve: 300, x: 180, y: 460, pendingSupply: false },
  { id: "mine-4", name: "沙丘高原", mineralType: "titanium", dailyYield: 7, remaining: 200, maxReserve: 200, x: 620, y: 430, pendingSupply: false },
  { id: "mine-5", name: "锈谷", mineralType: "iron", dailyYield: 15, remaining: 500, maxReserve: 500, x: 100, y: 280, pendingSupply: false },
  { id: "mine-6", name: "坑洞洼地", mineralType: "iron", dailyYield: 12, remaining: 400, maxReserve: 400, x: 520, y: 130, pendingSupply: false },
  { id: "mine-7", name: "玻璃平原", mineralType: "silicon", dailyYield: 12, remaining: 350, maxReserve: 350, x: 750, y: 340, pendingSupply: false },
  { id: "mine-8", name: "芯片台地", mineralType: "silicon", dailyYield: 9, remaining: 250, maxReserve: 250, x: 350, y: 520, pendingSupply: false },
]

export const INITIAL_CARTS: Cart[] = [
  {
    id: "cart-1", name: "探路者-1", maxLoad: 20, currentLoad: 0, currentMineral: null,
    maxBattery: 100, currentBattery: 100, batteryPerUnit: 0.15, speed: 80,
    status: "idle", routeId: null, assignedMineId: null, currentTrackId: null,
    trackProgress: 0, direction: "forward", miningProgress: 0,
    x: BASE_POSITION.x, y: BASE_POSITION.y,
    isPaused: false, pauseRemaining: 0, departureDelay: 0,
  },
  {
    id: "cart-2", name: "拓荒者-2", maxLoad: 15, currentLoad: 0, currentMineral: null,
    maxBattery: 80, currentBattery: 80, batteryPerUnit: 0.2, speed: 100,
    status: "idle", routeId: null, assignedMineId: null, currentTrackId: null,
    trackProgress: 0, direction: "forward", miningProgress: 0,
    x: BASE_POSITION.x, y: BASE_POSITION.y,
    isPaused: false, pauseRemaining: 0, departureDelay: 0,
  },
  {
    id: "cart-3", name: "运载者-3", maxLoad: 30, currentLoad: 0, currentMineral: null,
    maxBattery: 120, currentBattery: 120, batteryPerUnit: 0.12, speed: 60,
    status: "idle", routeId: null, assignedMineId: null, currentTrackId: null,
    trackProgress: 0, direction: "forward", miningProgress: 0,
    x: BASE_POSITION.x, y: BASE_POSITION.y,
    isPaused: false, pauseRemaining: 0, departureDelay: 0,
  },
]

export const NEW_CART_COST = 200
export const SUPPLY_PLAN_COST = 150
