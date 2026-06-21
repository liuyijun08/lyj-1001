export type MineralType = "he3" | "titanium" | "iron" | "silicon"

export type CartStatus = "idle" | "toMine" | "mining" | "toBase" | "unloading" | "charging"

export type SupplyStatus = "pending" | "completed" | "cancelled"

export type AccidentType = "meteor"

export type TrackStatus = "normal" | "broken" | "repairing"

export type RepairVehicleStatus = "idle" | "traveling" | "repairing" | "returning"

export type CableStatus = "normal" | "broken" | "repairing"

export type PowerNodeType = "base" | "mine" | "station"

export interface SupplyRecord {
  id: string
  mineId: string
  mineName: string
  mineralType: MineralType
  requestDay: number
  cost: number
  status: SupplyStatus
  refundAmount: number
  completedDay?: number
  cancelledDay?: number
  supplyAmount: number
}

export interface DailyRecoveryDetail {
  day: number
  mineId: string
  mineName: string
  mineralType: MineralType
  baseRecovery: number
  supplyBonus: number
  totalRecovery: number
  maxReserve: number
  remainingAfter: number
}

export interface MineNode {
  id: string
  name: string
  mineralType: MineralType
  dailyYield: number
  remaining: number
  maxReserve: number
  x: number
  y: number
  pendingSupply: boolean
  currentSupplyId: string | null
}

export interface Track {
  id: string
  fromId: string
  toId: string
  length: number
  buildCost: number
  status: TrackStatus
  breakDay?: number
  breakTime?: number
  repairVehicleId?: string | null
  repairProgress?: number
  repairDuration?: number
}

export interface AccidentRecord {
  id: string
  day: number
  time: number
  type: AccidentType
  trackId: string
  description: string
  resolved: boolean
  resolvedDay?: number
  resolvedTime?: number
}

export interface RepairVehicle {
  id: string
  name: string
  status: RepairVehicleStatus
  currentTrackId: string | null
  targetTrackId: string | null
  x: number
  y: number
  speed: number
  repairProgress: number
  repairDuration: number
  travelProgress: number
  travelFromX: number
  travelFromY: number
  travelToX: number
  travelToY: number
  travelDistance: number
}

export interface PowerStation {
  id: string
  name: string
  x: number
  y: number
  powerOutput: number
  buildCost: number
  operational: boolean
}

export interface PowerCable {
  id: string
  fromId: string
  toId: string
  length: number
  buildCost: number
  status: CableStatus
}

export interface PoweredNode {
  nodeId: string
  nodeType: PowerNodeType
  level: number
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
  baseSpeed: number
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
  isPowered: boolean
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
  supplyCompleted: SupplyRecord[]
  supplyCancelled: SupplyRecord[]
  recoveryDetails: DailyRecoveryDetail[]
  supplyRefunds: number
}

export interface ConflictInfo {
  id: string
  cartId1: string
  cartId2: string
  trackId: string
  duration: number
  firstSeenDay: number
}

export type AppView = "menu" | "levelSelect" | "game"

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
  supplyQueue: SupplyRecord[]
  dailyRecoveryDetails: DailyRecoveryDetail[]
  level: LevelState
  totalCollected: Record<MineralType, number>
  totalMiningIncome: number
  inLevelMode: boolean
  currentView: AppView
  accidents: AccidentRecord[]
  repairVehicles: RepairVehicle[]
  selectedRepairVehicleId: string | null
  meteorCooldown: number
  powerStations: PowerStation[]
  powerCables: PowerCable[]
  poweredNodes: PoweredNode[]
  powerBuildMode: "station" | "cable" | null
  powerStartNodeId: string | null
  selectedPowerStationId: string | null
  powerStationPlacementPos: { x: number; y: number } | null
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

export const TRACK_STATUS_LABELS: Record<TrackStatus, string> = {
  normal: "正常",
  broken: "断轨",
  repairing: "维修中",
}

export const REPAIR_VEHICLE_STATUS_LABELS: Record<RepairVehicleStatus, string> = {
  idle: "待命",
  traveling: "前往现场",
  repairing: "维修中",
  returning: "返回基地",
}

export const CABLE_STATUS_LABELS: Record<CableStatus, string> = {
  normal: "正常",
  broken: "断线",
  repairing: "维修中",
}

export type TargetType = "tracks" | "credits" | "minerals" | "minesConnected" | "days"

export interface LevelTarget {
  id: string
  type: TargetType
  label: string
  value: number
  mineralType?: MineralType
}

export interface StarCondition {
  stars: 1 | 2 | 3
  label: string
  condition: {
    targetId: string
    value: number
  }[]
}

export interface LevelReward {
  credits?: number
  unlockLevel?: number[]
}

export interface Level {
  id: number
  name: string
  description: string
  icon: string
  targets: LevelTarget[]
  starConditions: StarCondition[]
  reward: LevelReward
  initialResources?: Partial<Resources>
  initialMineIds?: string[]
}

export interface LevelProgress {
  targetId: string
  current: number
  completed: boolean
}

export interface LevelResult {
  levelId: number
  stars: 0 | 1 | 2 | 3
  completed: boolean
  bestStars: 0 | 1 | 2 | 3
  unlocked: boolean
  progress: LevelProgress[]
}

export interface LevelState {
  currentLevelId: number | null
  results: Record<number, LevelResult>
  showLevelComplete: boolean
  completedStars: 0 | 1 | 2 | 3
}
