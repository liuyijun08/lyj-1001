export type MineralType = "he3" | "titanium" | "iron" | "silicon"

export type CartStatus = "idle" | "toMine" | "mining" | "toBase" | "unloading" | "charging"

export interface MineNode {
  id: string
  name: string
  mineralType: MineralType
  dailyYield: number
  remaining: number
  maxReserve: number
  x: number
  y: number
}

export interface Track {
  id: string
  fromId: string
  toId: string
  length: number
  buildCost: number
}

export interface CartRoute {
  id: string
  cartId: string
  mineId: string
  trackIds: string[]
}

export interface Cart {
  id: string
  name: string
  maxLoad: number
  currentLoad: number
  currentMineral: MineralType | null
  maxBattery: number
  currentBattery: number
  batteryPerUnit: number
  speed: number
  status: CartStatus
  routeId: string | null
  assignedMineId: string | null
  currentTrackId: string | null
  trackProgress: number
  direction: "forward" | "backward"
  miningProgress: number
  x: number
  y: number
  isPaused: boolean
  pauseRemaining: number
  departureDelay: number
}

export interface Resources {
  credits: number
  he3: number
  titanium: number
  iron: number
  silicon: number
}

export interface DayLog {
  day: number
  income: number
  expense: number
  collected: Record<MineralType, number>
}

export interface ConflictInfo {
  id: string
  cartId1: string
  cartId2: string
  trackId: string
  duration: number
  firstSeenDay: number
}

export interface GameState {
  day: number
  dayProgress: number
  resources: Resources
  mineNodes: MineNode[]
  tracks: Track[]
  carts: Cart[]
  routes: CartRoute[]
  dayLogs: DayLog[]
  basePosition: { x: number; y: number }
  gameSpeed: number
  isPaused: boolean
  selectedNodeId: string | null
  trackBuildMode: boolean
  trackStartId: string | null
  selectedCartId: string | null
  conflicts: ConflictInfo[]
  showSettlement: boolean
  lastSettlementDay: number
  dailyCollected: Record<MineralType, number>
  notification: { message: string; type: "success" | "error" | "info"; visible: boolean }
}

export const MINERAL_COLORS: Record<MineralType, string> = {
  he3: "#00d4ff",
  titanium: "#ff8c00",
  iron: "#c44d3f",
  silicon: "#88c999",
}

export const MINERAL_NAMES: Record<MineralType, string> = {
  he3: "氦-3",
  titanium: "钛矿",
  iron: "铁矿",
  silicon: "硅矿",
}

export const MINERAL_PRICES: Record<MineralType, number> = {
  he3: 50,
  titanium: 30,
  iron: 10,
  silicon: 20,
}

export const CART_STATUS_LABELS: Record<CartStatus, string> = {
  idle: "待命",
  toMine: "前往矿区",
  mining: "采矿中",
  toBase: "返回基地",
  unloading: "卸载中",
  charging: "充电中",
}
