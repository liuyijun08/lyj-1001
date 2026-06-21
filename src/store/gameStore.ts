import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { GameState, Cart, MineNode, Track, CartRoute, ConflictInfo, MineralType, DayLog, SupplyRecord, DailyRecoveryDetail, LevelState, LevelResult, LevelProgress, AppView, RepairVehicle, AccidentRecord } from "@/types/game"
import { MINERAL_PRICES } from "@/types/game"
import {
  INITIAL_RESOURCES, INITIAL_MINES, INITIAL_CARTS, BASE_POSITION,
  DAY_DURATION, MINING_SPEED, MINING_TIME, UNLOAD_TIME, CHARGE_TIME,
  CHARGE_COST, TRACK_COST_PER_UNIT, TRACK_MAINTENANCE_PER_UNIT,
  CART_MAINTENANCE, BASE_CHARGE_RATE, MAP_WIDTH, MAP_HEIGHT, NEW_CART_COST,
  SUPPLY_PLAN_COST, METEOR_PROBABILITY_PER_DAY, METEOR_COOLDOWN_DAYS,
  REPAIR_DURATION_PER_LENGTH, NEW_REPAIR_VEHICLE_COST, createInitialRepairVehicles,
} from "@/config/gameConfig"
import { LEVELS, getLevelById } from "@/config/levels"

function calcDistance(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}

function findPath(mineId: string, tracks: Track[], basePosition: { x: number; y: number }, mines: MineNode[]): Track[] | null {
  const adj: Record<string, { track: Track; neighbor: string }[]> = {}
  const baseId = "base"

  for (const t of tracks) {
    if (t.status === "broken") continue
    if (!adj[t.fromId]) adj[t.fromId] = []
    if (!adj[t.toId]) adj[t.toId] = []
    adj[t.fromId].push({ track: t, neighbor: t.toId })
    adj[t.toId].push({ track: t, neighbor: t.fromId })
  }

  const visited = new Set<string>()
  const queue: { nodeId: string; path: Track[] }[] = [{ nodeId: baseId, path: [] }]
  visited.add(baseId)

  while (queue.length > 0) {
    const { nodeId, path } = queue.shift()!
    if (nodeId === mineId) return path

    const neighbors = adj[nodeId] || []
    for (const { track, neighbor } of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor)
        queue.push({ nodeId: neighbor, path: [...path, track] })
      }
    }
  }

  return null
}

let idCounter = Date.now()
function genId(prefix: string) {
  return `${prefix}-${++idCounter}`
}

interface GameActions {
  togglePause: () => void
  setSpeed: (speed: number) => void
  selectNode: (nodeId: string | null) => void
  toggleTrackBuild: () => void
  setTrackStart: (nodeId: string | null) => void
  buildTrack: (fromId: string, toId: string) => void
  selectCart: (cartId: string | null) => void
  assignCartToMine: (cartId: string, mineId: string) => void
  unassignCart: (cartId: string) => void
  buyCart: () => void
  tick: (dt: number) => void
  endDay: () => void
  closeSettlement: () => void
  resetGame: () => void
  sellMinerals: (type: MineralType, amount: number) => void
  showNotification: (message: string, type: "success" | "error" | "info") => void
  hideNotification: () => void
  isMineReachable: (mineId: string) => boolean
  pauseCart: (cartId: string, duration: number) => void
  resumeCart: (cartId: string) => void
  pauseLowSpeedCartInConflict: (conflictId: string) => void
  staggerDeparture: (conflictId: string) => void
  forceReturnCart: (cartId: string) => void
  requestSupplyPlan: (mineId: string) => void
  cancelSupplyPlan: (supplyId: string) => void
  startLevel: (levelId: number) => void
  exitLevel: () => void
  getLevelProgress: () => LevelProgress[]
  checkLevelComplete: () => void
  closeLevelComplete: () => void
  setInLevelMode: (mode: boolean) => void
  setView: (view: AppView) => void
  dispatchRepairVehicle: (vehicleId: string, trackId: string) => void
  buyRepairVehicle: () => void
  selectRepairVehicle: (vehicleId: string | null) => void
  triggerMeteorShower: () => void
}

function initLevelResults(): Record<number, LevelResult> {
  const results: Record<number, LevelResult> = {}
  for (const level of LEVELS) {
    results[level.id] = {
      levelId: level.id,
      stars: 0,
      completed: false,
      bestStars: 0,
      unlocked: level.id === 1,
      progress: level.targets.map(t => ({ targetId: t.id, current: 0, completed: false })),
    }
  }
  return results
}

const initialState = {
  day: 1,
  dayProgress: 0,
  resources: { ...INITIAL_RESOURCES },
  mineNodes: INITIAL_MINES.map(m => ({ ...m, currentSupplyId: null })),
  tracks: [] as Track[],
  carts: INITIAL_CARTS.map(c => ({ ...c })),
  routes: [] as CartRoute[],
  dayLogs: [] as DayLog[],
  basePosition: { ...BASE_POSITION },
  gameSpeed: 1,
  isPaused: true,
  selectedNodeId: null as string | null,
  trackBuildMode: false,
  trackStartId: null as string | null,
  selectedCartId: null as string | null,
  conflicts: [] as ConflictInfo[],
  showSettlement: false,
  lastSettlementDay: 0,
  dailyCollected: { he3: 0, titanium: 0, iron: 0, silicon: 0 } as Record<MineralType, number>,
  notification: { message: "", type: "info" as const, visible: false },
  supplyQueue: [] as SupplyRecord[],
  dailyRecoveryDetails: [] as DailyRecoveryDetail[],
  level: {
    currentLevelId: null,
    results: initLevelResults(),
    showLevelComplete: false,
    completedStars: 0,
  } as LevelState,
  totalCollected: { he3: 0, titanium: 0, iron: 0, silicon: 0 } as Record<MineralType, number>,
  totalMiningIncome: 0,
  inLevelMode: false,
  currentView: "menu" as AppView,
  accidents: [] as AccidentRecord[],
  repairVehicles: createInitialRepairVehicles(),
  selectedRepairVehicleId: null as string | null,
  meteorCooldown: 0,
}

export const useGameStore = create<GameState & GameActions>()(
  persist(
    (set, get) => ({
      ...initialState,

      togglePause: () => set(s => ({ isPaused: !s.isPaused })),

      setSpeed: (speed) => set({ gameSpeed: speed }),

      selectNode: (nodeId) => set({ selectedNodeId: nodeId }),

      toggleTrackBuild: () => set(s => ({
        trackBuildMode: !s.trackBuildMode,
        trackStartId: null,
        selectedNodeId: null,
      })),

      setTrackStart: (nodeId) => set({ trackStartId: nodeId }),

      buildTrack: (fromId, toId) => {
        const state = get()
        if (fromId === toId) return

        const exists = state.tracks.some(t =>
          (t.fromId === fromId && t.toId === toId) ||
          (t.fromId === toId && t.toId === fromId)
        )
        if (exists) return

        const allNodes = [
          { id: "base", x: state.basePosition.x, y: state.basePosition.y },
          ...state.mineNodes,
        ]
        const from = allNodes.find(n => n.id === fromId)
        const to = allNodes.find(n => n.id === toId)
        if (!from || !to) return

        const length = calcDistance(from.x, from.y, to.x, to.y)
        const buildCost = Math.round(length * TRACK_COST_PER_UNIT)

        if (state.resources.credits < buildCost) return

        const newTrack: Track = {
          id: genId("track"),
          fromId,
          toId,
          length: Math.round(length),
          buildCost,
          status: "normal",
          repairVehicleId: null,
          repairProgress: 0,
        }

        set(s => ({
          tracks: [...s.tracks, newTrack],
          resources: { ...s.resources, credits: s.resources.credits - buildCost },
          trackStartId: null,
        }))

        setTimeout(() => {
          get().checkLevelComplete()
        }, 50)
      },

      selectCart: (cartId) => set({ selectedCartId: cartId }),

      assignCartToMine: (cartId, mineId) => {
        const state = get()
        const cart = state.carts.find(c => c.id === cartId)
        const mine = state.mineNodes.find(m => m.id === mineId)
        if (!cart) {
          get().showNotification("矿车不存在", "error")
          return
        }
        if (cart.status !== "idle") {
          get().showNotification(`${cart.name} 正在执行任务，无法调度`, "error")
          return
        }

        const path = findPath(mineId, state.tracks, state.basePosition, state.mineNodes)
        if (!path || path.length === 0) {
          get().showNotification(`${mine?.name || "该矿点"} 未连通轨道，请先铺设轨道`, "error")
          return
        }

        const batteryRatio = cart.currentBattery / cart.maxBattery
        if (batteryRatio < 0.2) {
          get().showNotification(`${cart.name} 电量低于20%，强制返航中，无法派遣新任务`, "error")
          return
        }

        const totalDist = path.reduce((sum, t) => sum + t.length, 0)
        const roundTripBattery = totalDist * 2 * cart.batteryPerUnit
        if (cart.currentBattery < roundTripBattery * 0.5) {
          get().showNotification(`${cart.name} 电量不足以完成往返，请等待充电`, "error")
          return
        }

        const route: CartRoute = {
          id: genId("route"),
          cartId,
          mineId,
          trackIds: path.map(t => t.id),
        }

        const firstTrack = path[0]
        set(s => ({
          routes: [...s.routes, route],
          carts: s.carts.map(c =>
            c.id === cartId
              ? { ...c, status: "toMine" as const, routeId: route.id, assignedMineId: mineId, currentTrackId: firstTrack.id, trackProgress: 0, direction: "forward" as const }
              : c
          ),
        }))
        get().showNotification(`${cart.name} 已调度到 ${mine?.name || "矿区"}`, "success")
      },

      unassignCart: (cartId) => {
        const state = get()
        const cart = state.carts.find(c => c.id === cartId)
        if (!cart) return

        const needsCharging = cart.currentBattery < cart.maxBattery * 0.5
        const newStatus = needsCharging ? "charging" as const : "idle" as const

        set(s => ({
          carts: s.carts.map(c =>
            c.id === cartId
              ? { ...c, status: newStatus, routeId: null, assignedMineId: null, currentTrackId: null, trackProgress: 0, x: s.basePosition.x, y: s.basePosition.y, miningProgress: 0 }
              : c
          ),
          routes: s.routes.filter(r => r.cartId !== cartId),
        }))
      },

      buyCart: () => {
        const state = get()
        if (state.resources.credits < NEW_CART_COST) return

        const newCart: Cart = {
          id: genId("cart"),
          name: `矿车-${state.carts.length + 1}`,
          maxLoad: 20,
          currentLoad: 0,
          currentMineral: null,
          maxBattery: 100,
          currentBattery: 100,
          batteryPerUnit: 0.15,
          speed: 80,
          status: "idle",
          routeId: null,
          assignedMineId: null,
          currentTrackId: null,
          trackProgress: 0,
          direction: "forward",
          miningProgress: 0,
          x: state.basePosition.x,
          y: state.basePosition.y,
          isPaused: false,
          pauseRemaining: 0,
          departureDelay: 0,
        }

        set(s => ({
          carts: [...s.carts, newCart],
          resources: { ...s.resources, credits: s.resources.credits - NEW_CART_COST },
        }))
      },

      tick: (dt) => {
        const state = get()
        if (state.isPaused || state.showSettlement) return

        const speed = state.gameSpeed
        const effectiveDt = dt * speed

        const newDayProgress = state.dayProgress + effectiveDt
        let newDay = state.day
        let newResources = { ...state.resources }
        let newCarts = state.carts.map(c => ({ ...c }))
        let newMines = state.mineNodes.map(m => ({ ...m }))
        let newTracks = state.tracks.map(t => ({ ...t }))
        let newAccidents = state.accidents.map(a => ({ ...a }))
        let newRepairVehicles = state.repairVehicles.map(rv => ({ ...rv }))
        let showSettlement = state.showSettlement || newDayProgress >= DAY_DURATION
        let newIsPaused = showSettlement && !state.showSettlement
        const dailyCollectedAcc: Record<MineralType, number> = { ...state.dailyCollected }
        let newMeteorCooldown = Math.max(0, state.meteorCooldown - effectiveDt / DAY_DURATION)

        if (newDayProgress >= DAY_DURATION) {
          showSettlement = true
          newIsPaused = true
        }

        const currentTimeInDay = newDayProgress % DAY_DURATION
        if (newMeteorCooldown <= 0 && !showSettlement) {
          const meteorChance = METEOR_PROBABILITY_PER_DAY * effectiveDt / DAY_DURATION
          if (Math.random() < meteorChance && newTracks.length > 0) {
            const normalTracks = newTracks.filter(t => t.status === "normal")
            if (normalTracks.length > 0) {
              const hitTrack = normalTracks[Math.floor(Math.random() * normalTracks.length)]
              const hitTrackIdx = newTracks.findIndex(t => t.id === hitTrack.id)
              if (hitTrackIdx >= 0) {
                newTracks[hitTrackIdx] = {
                  ...newTracks[hitTrackIdx],
                  status: "broken",
                  breakDay: newDay,
                  breakTime: currentTimeInDay,
                  repairVehicleId: null,
                  repairProgress: 0,
                }
                const accident: AccidentRecord = {
                  id: genId("accident"),
                  day: newDay,
                  time: currentTimeInDay,
                  type: "meteor",
                  trackId: hitTrack.id,
                  description: `陨石雨袭击了轨道段（${hitTrack.length}米），轨道损毁！`,
                  resolved: false,
                }
                newAccidents.push(accident)
                newMeteorCooldown = METEOR_COOLDOWN_DAYS
                get().showNotification(`⚠️ 陨石雨警报！一段轨道损毁，请派遣维修车`, "error")
              }
            }
          }
        }

        for (let i = 0; i < newCarts.length; i++) {
          const cart = newCarts[i]

          if (cart.isPaused && cart.pauseRemaining > 0) {
            cart.pauseRemaining = Math.max(0, cart.pauseRemaining - effectiveDt)
            if (cart.pauseRemaining <= 0) {
              cart.isPaused = false
            }
            continue
          }

          if (cart.departureDelay > 0 && cart.status === "toMine" && cart.trackProgress === 0) {
            cart.departureDelay = Math.max(0, cart.departureDelay - effectiveDt)
            continue
          }

          const allNodes = [
            { id: "base", x: state.basePosition.x, y: state.basePosition.y },
            ...newMines,
          ]

          if (cart.status === "toMine") {
            const track = newTracks.find(t => t.id === cart.currentTrackId)
            if (!track) continue

            if (track.status === "broken") {
              if (!cart.isPaused) {
                cart.isPaused = true
                cart.pauseRemaining = 9999
                get().showNotification(`${cart.name} 前方轨道损毁，紧急停运！`, "error")
              }
              continue
            }

            const progressDelta = (cart.speed * effectiveDt) / track.length
            cart.trackProgress += progressDelta
            cart.currentBattery -= cart.batteryPerUnit * (cart.speed * effectiveDt)

            const fromId = cart.direction === "forward" ? track.fromId : track.toId
            const toId = cart.direction === "forward" ? track.toId : track.fromId

            const fromNode = allNodes.find(n => n.id === fromId)
            const toNode = allNodes.find(n => n.id === toId)
            if (fromNode && toNode) {
              const p = Math.min(cart.trackProgress, 1)
              cart.x = fromNode.x + (toNode.x - fromNode.x) * p
              cart.y = fromNode.y + (toNode.y - fromNode.y) * p
            }

            if (cart.trackProgress >= 1) {
              const route = state.routes.find(r => r.id === cart.routeId)
              if (!route) continue

              const currentIdx = route.trackIds.indexOf(cart.currentTrackId!)
              if (currentIdx < route.trackIds.length - 1) {
                const nextTrackId = route.trackIds[currentIdx + 1]
                const nextTrack = newTracks.find(t => t.id === nextTrackId)
                if (nextTrack && nextTrack.status === "broken") {
                  cart.isPaused = true
                  cart.pauseRemaining = 9999
                  get().showNotification(`${cart.name} 前方轨道损毁，紧急停运！`, "error")
                } else {
                  cart.currentTrackId = nextTrackId
                  cart.trackProgress = 0
                }
              } else {
                cart.status = "mining"
                cart.miningProgress = 0
                cart.currentTrackId = null
                cart.trackProgress = 0
              }
            }

            if (cart.currentBattery <= cart.maxBattery * 0.2) {
              cart.status = "toBase"
              cart.direction = "backward"
              cart.trackProgress = 1 - cart.trackProgress
            }
          }

          else if (cart.status === "mining") {
            cart.miningProgress += effectiveDt
            const mine = newMines.find(m => m.id === cart.assignedMineId)
            if (mine && mine.remaining > 0) {
              const loadAmount = Math.min(MINING_SPEED * effectiveDt, cart.maxLoad - cart.currentLoad, mine.remaining)
              cart.currentLoad += loadAmount
              cart.currentMineral = mine.mineralType
              mine.remaining -= loadAmount

              if (cart.currentLoad >= cart.maxLoad || mine.remaining <= 0 || cart.miningProgress >= MINING_TIME) {
                cart.status = "toBase"
                cart.direction = "backward"
                const route = state.routes.find(r => r.id === cart.routeId)
                if (route && route.trackIds.length > 0) {
                  cart.currentTrackId = route.trackIds[route.trackIds.length - 1]
                  cart.trackProgress = 0
                  cart.direction = "backward"
                }
              }
            } else {
              cart.status = "toBase"
              cart.direction = "backward"
              const route = state.routes.find(r => r.id === cart.routeId)
              if (route && route.trackIds.length > 0) {
                cart.currentTrackId = route.trackIds[route.trackIds.length - 1]
                cart.trackProgress = 0
              }
            }
          }

          else if (cart.status === "toBase") {
            const track = newTracks.find(t => t.id === cart.currentTrackId)
            if (!track) {
              const route = state.routes.find(r => r.id === cart.routeId)
              if (route && route.trackIds.length > 0) {
                cart.currentTrackId = route.trackIds[route.trackIds.length - 1]
                cart.trackProgress = 0
                cart.direction = "backward"
                continue
              }
              cart.x = state.basePosition.x
              cart.y = state.basePosition.y
              cart.status = "unloading"
              continue
            }

            if (track.status === "broken") {
              if (!cart.isPaused) {
                cart.isPaused = true
                cart.pauseRemaining = 9999
                get().showNotification(`${cart.name} 前方轨道损毁，紧急停运！`, "error")
              }
              continue
            }

            const progressDelta = (cart.speed * effectiveDt) / track.length
            cart.trackProgress += progressDelta
            cart.currentBattery -= cart.batteryPerUnit * (cart.speed * effectiveDt) * 0.5

            const fromId = cart.direction === "backward" ? track.toId : track.fromId
            const toId = cart.direction === "backward" ? track.fromId : track.toId

            const fromNode = allNodes.find(n => n.id === fromId)
            const toNode = allNodes.find(n => n.id === toId)
            if (fromNode && toNode) {
              const p = Math.min(cart.trackProgress, 1)
              cart.x = fromNode.x + (toNode.x - fromNode.x) * p
              cart.y = fromNode.y + (toNode.y - fromNode.y) * p
            }

            if (cart.trackProgress >= 1) {
              const route = state.routes.find(r => r.id === cart.routeId)
              if (!route) continue

              const currentIdx = route.trackIds.indexOf(cart.currentTrackId!)

              const reachedBase = (cart.direction === "backward" && currentIdx === 0) ||
                (cart.direction === "forward" && currentIdx === route.trackIds.length - 1)

              if (reachedBase) {
                cart.x = state.basePosition.x
                cart.y = state.basePosition.y
                if (cart.currentLoad > 0) {
                  cart.status = "unloading"
                } else {
                  cart.status = cart.currentBattery < cart.maxBattery * 0.5 ? "charging" : "idle"
                  cart.routeId = null
                  cart.currentTrackId = null
                  cart.trackProgress = 0
                }
              } else {
                const nextIdx = cart.direction === "backward" ? currentIdx - 1 : currentIdx + 1
                if (nextIdx >= 0 && nextIdx < route.trackIds.length) {
                  const nextTrackId = route.trackIds[nextIdx]
                  const nextTrack = newTracks.find(t => t.id === nextTrackId)
                  if (nextTrack && nextTrack.status === "broken") {
                    cart.isPaused = true
                    cart.pauseRemaining = 9999
                    get().showNotification(`${cart.name} 前方轨道损毁，紧急停运！`, "error")
                  } else {
                    cart.currentTrackId = nextTrackId
                    cart.trackProgress = 0
                  }
                }
              }
            }
          }

          else if (cart.status === "unloading") {
            cart.miningProgress += effectiveDt
            if (cart.miningProgress >= UNLOAD_TIME) {
              if (cart.currentMineral && cart.currentLoad > 0) {
                const mineral = cart.currentMineral as MineralType
                const amount = Math.round(cart.currentLoad)
                newResources[mineral] = (newResources[mineral] || 0) + amount
                if (!dailyCollectedAcc[mineral]) dailyCollectedAcc[mineral] = 0
                dailyCollectedAcc[mineral] += amount
              }
              cart.currentLoad = 0
              cart.currentMineral = null
              cart.miningProgress = 0
              cart.status = cart.currentBattery < cart.maxBattery * 0.5 ? "charging" : "idle"
              if (cart.status === "idle") {
                cart.routeId = null
                cart.currentTrackId = null
                cart.trackProgress = 0
                cart.assignedMineId = null
              }
            }
          }

          else if (cart.status === "charging") {
            cart.miningProgress += effectiveDt
            cart.currentBattery = Math.min(cart.maxBattery, cart.currentBattery + (cart.maxBattery / CHARGE_TIME) * effectiveDt)
            if (cart.miningProgress >= CHARGE_TIME || cart.currentBattery >= cart.maxBattery) {
              cart.currentBattery = cart.maxBattery
              cart.miningProgress = 0
              cart.status = "idle"
              cart.routeId = null
              cart.currentTrackId = null
              cart.trackProgress = 0
              cart.assignedMineId = null
            }
          }

          cart.currentBattery = Math.max(0, cart.currentBattery)
        }

        for (let rvIdx = 0; rvIdx < newRepairVehicles.length; rvIdx++) {
          const rv = newRepairVehicles[rvIdx]

          if (rv.status === "traveling") {
            if (rv.travelDistance > 0) {
              rv.travelProgress += (rv.speed * effectiveDt) / rv.travelDistance
            }
            if (rv.travelProgress >= 1) {
              rv.travelProgress = 1
              rv.x = rv.travelToX
              rv.y = rv.travelToY
              rv.status = "repairing"
              rv.repairProgress = 0
              const trackIdx = newTracks.findIndex(t => t.id === rv.targetTrackId)
              if (trackIdx >= 0) {
                const track = newTracks[trackIdx]
                newTracks[trackIdx] = {
                  ...track,
                  status: "repairing",
                  repairVehicleId: rv.id,
                  repairProgress: 0,
                  repairDuration: track.length * REPAIR_DURATION_PER_LENGTH,
                }
                rv.repairDuration = track.length * REPAIR_DURATION_PER_LENGTH
                rv.currentTrackId = track.id
              }
            } else {
              rv.x = rv.travelFromX + (rv.travelToX - rv.travelFromX) * rv.travelProgress
              rv.y = rv.travelFromY + (rv.travelToY - rv.travelFromY) * rv.travelProgress
            }
          }

          else if (rv.status === "repairing") {
            rv.repairProgress += effectiveDt
            const trackIdx = newTracks.findIndex(t => t.id === rv.currentTrackId)
            if (trackIdx >= 0) {
              newTracks[trackIdx] = {
                ...newTracks[trackIdx],
                repairProgress: rv.repairProgress,
              }
            }
            if (rv.repairProgress >= rv.repairDuration) {
              rv.status = "returning"
              rv.travelFromX = rv.x
              rv.travelFromY = rv.y
              rv.travelToX = state.basePosition.x
              rv.travelToY = state.basePosition.y
              rv.travelDistance = calcDistance(rv.travelFromX, rv.travelFromY, rv.travelToX, rv.travelToY)
              rv.travelProgress = 0
              if (trackIdx >= 0) {
                newTracks[trackIdx] = {
                  ...newTracks[trackIdx],
                  status: "normal",
                  repairVehicleId: null,
                  repairProgress: 0,
                  repairDuration: undefined,
                }
              }
              const accIdx = newAccidents.findIndex(a => a.trackId === rv.currentTrackId && !a.resolved)
              if (accIdx >= 0) {
                newAccidents[accIdx] = {
                  ...newAccidents[accIdx],
                  resolved: true,
                  resolvedDay: newDay,
                  resolvedTime: currentTimeInDay,
                }
              }
              for (let ci = 0; ci < newCarts.length; ci++) {
                const c = newCarts[ci]
                if (c.isPaused && c.pauseRemaining > 1000) {
                  const route = state.routes.find(r => r.id === c.routeId)
                  if (route) {
                    const stillBlocked = route.trackIds.some(tid => {
                      const t = newTracks.find(tr => tr.id === tid)
                      return t && t.status === "broken"
                    })
                    if (!stillBlocked) {
                      newCarts[ci] = { ...c, isPaused: false, pauseRemaining: 0 }
                    }
                  }
                }
              }
              get().showNotification(`✅ 轨道修复完成，运输已恢复`, "success")
              rv.currentTrackId = null
              rv.targetTrackId = null
            }
          }

          else if (rv.status === "returning") {
            if (rv.travelDistance > 0) {
              rv.travelProgress += (rv.speed * effectiveDt) / rv.travelDistance
            }
            if (rv.travelProgress >= 1) {
              rv.travelProgress = 1
              rv.x = state.basePosition.x
              rv.y = state.basePosition.y
              rv.status = "idle"
            } else {
              rv.x = rv.travelFromX + (rv.travelToX - rv.travelFromX) * rv.travelProgress
              rv.y = rv.travelFromY + (rv.travelToY - rv.travelFromY) * rv.travelProgress
            }
          }
        }

        const trackCartMap: Record<string, string[]> = {}
        for (const c of newCarts) {
          if (c.currentTrackId && (c.status === "toMine" || c.status === "toBase") && !c.isPaused) {
            if (!trackCartMap[c.currentTrackId]) trackCartMap[c.currentTrackId] = []
            trackCartMap[c.currentTrackId].push(c.id)
          }
        }

        const prevConflictMap: Record<string, ConflictInfo> = {}
        for (const c of state.conflicts) {
          const key = [c.cartId1, c.cartId2, c.trackId].sort().join("|")
          prevConflictMap[key] = c
        }

        const newConflicts: ConflictInfo[] = []
        for (const [trackId, cartIds] of Object.entries(trackCartMap)) {
          if (cartIds.length > 1) {
            for (let i = 0; i < cartIds.length; i++) {
              for (let j = i + 1; j < cartIds.length; j++) {
                const cartId1 = cartIds[i]
                const cartId2 = cartIds[j]
                const key = [cartId1, cartId2, trackId].sort().join("|")
                const prev = prevConflictMap[key]
                newConflicts.push({
                  id: prev?.id || genId("conflict"),
                  cartId1,
                  cartId2,
                  trackId,
                  duration: prev ? prev.duration + effectiveDt : effectiveDt,
                  firstSeenDay: prev?.firstSeenDay || state.day,
                })
              }
            }
          }
        }

        const newTotalCollected = { ...state.totalCollected }
        for (const m of Object.keys(dailyCollectedAcc) as MineralType[]) {
          newTotalCollected[m] = (newTotalCollected[m] || 0) + dailyCollectedAcc[m]
        }

        set({
          day: newDay,
          dayProgress: newDayProgress % DAY_DURATION,
          resources: newResources,
          carts: newCarts,
          mineNodes: newMines,
          tracks: newTracks,
          conflicts: newConflicts,
          showSettlement,
          dailyCollected: dailyCollectedAcc,
          isPaused: newIsPaused || state.isPaused,
          totalCollected: newTotalCollected,
          accidents: newAccidents,
          repairVehicles: newRepairVehicles,
          meteorCooldown: newMeteorCooldown,
        })
      },

      endDay: () => {
        const state = get()

        const collected = { ...state.dailyCollected }
        let income = 0
        for (const mineral of Object.keys(collected) as MineralType[]) {
          income += collected[mineral] * MINERAL_PRICES[mineral]
        }
        const trackMaintenance = state.tracks.reduce((sum, t) => sum + t.length * TRACK_MAINTENANCE_PER_UNIT, 0)
        const cartMaintenance = state.carts.length * CART_MAINTENANCE
        const expense = Math.round(trackMaintenance + cartMaintenance)

        const newResources = { ...state.resources }
        newResources.credits = newResources.credits + income - expense

        const completedSupplies: SupplyRecord[] = []
        const cancelledSupplies: SupplyRecord[] = []
        const recoveryDetails: DailyRecoveryDetail[] = []
        let supplyRefunds = 0

        const newMines = state.mineNodes.map(m => {
          const supplyBonus = m.pendingSupply ? m.dailyYield : 0
          const baseRecovery = m.dailyYield
          const totalRecovery = baseRecovery + supplyBonus
          const newRemaining = Math.min(m.maxReserve, m.remaining + totalRecovery)

          if (m.pendingSupply && m.currentSupplyId) {
            const supply = state.supplyQueue.find(s => s.id === m.currentSupplyId)
            if (supply) {
              const completedSupply: SupplyRecord = {
                ...supply,
                status: "completed",
                completedDay: state.day,
              }
              completedSupplies.push(completedSupply)
            }
          }

          const detail: DailyRecoveryDetail = {
            day: state.day,
            mineId: m.id,
            mineName: m.name,
            mineralType: m.mineralType,
            baseRecovery,
            supplyBonus,
            totalRecovery,
            maxReserve: m.maxReserve,
            remainingAfter: newRemaining,
          }
          recoveryDetails.push(detail)

          return {
            ...m,
            remaining: newRemaining,
            pendingSupply: false,
            currentSupplyId: null,
          }
        })

        const newSupplyQueue = state.supplyQueue.map(s => {
          if (s.status === "pending") {
            const completed = completedSupplies.find(c => c.id === s.id)
            if (completed) return completed
          }
          return s
        })

        const dayLog: DayLog = {
          day: state.day,
          income,
          expense,
          collected,
          supplyCompleted: completedSupplies,
          supplyCancelled: cancelledSupplies,
          recoveryDetails,
          supplyRefunds,
        }

        const newCarts = state.carts.map(c => {
          const needsCharging = c.currentBattery < c.maxBattery * 0.5
          const newStatus = needsCharging ? "charging" as const : "idle" as const
          return {
            ...c,
            x: state.basePosition.x,
            y: state.basePosition.y,
            status: newStatus,
            routeId: null,
            assignedMineId: null,
            currentTrackId: null,
            trackProgress: 0,
            miningProgress: 0,
            isPaused: false,
            pauseRemaining: 0,
            departureDelay: 0,
          }
        })

        const newTotalMiningIncome = state.totalMiningIncome + income

        set(s => ({
          day: s.day + 1,
          dayProgress: 0,
          resources: newResources,
          mineNodes: newMines,
          carts: newCarts,
          dayLogs: [...s.dayLogs, dayLog],
          showSettlement: false,
          isPaused: true,
          conflicts: [],
          dailyCollected: { he3: 0, titanium: 0, iron: 0, silicon: 0 },
          supplyQueue: newSupplyQueue,
          dailyRecoveryDetails: recoveryDetails,
          totalMiningIncome: newTotalMiningIncome,
        }))

        setTimeout(() => {
          get().checkLevelComplete()
        }, 100)
      },

      closeSettlement: () => set({ showSettlement: false }),

      sellMinerals: (type, amount) => {
        const state = get()
        if (state.resources[type] < amount) return
        const price = MINERAL_PRICES[type] * amount
        set(s => ({
          resources: {
            ...s.resources,
            credits: s.resources.credits + price,
            [type]: s.resources[type] - amount,
          },
        }))
      },

      showNotification: (message, type) => {
        set({ notification: { message, type, visible: true } })
        setTimeout(() => {
          const s = get()
          if (s.notification.message === message) {
            set({ notification: { ...s.notification, visible: false } })
          }
        }, 2500)
      },

      hideNotification: () => {
        set(s => ({ notification: { ...s.notification, visible: false } }))
      },

      isMineReachable: (mineId) => {
        const s = get()
        const path = findPath(mineId, s.tracks, s.basePosition, s.mineNodes)
        return path !== null && path.length > 0
      },

      pauseCart: (cartId, duration) => {
        const state = get()
        const cart = state.carts.find(c => c.id === cartId)
        if (!cart) return

        set(s => ({
          carts: s.carts.map(c =>
            c.id === cartId
              ? { ...c, isPaused: true, pauseRemaining: Math.max(c.pauseRemaining, duration) }
              : c
          ),
        }))
        get().showNotification(`${cart.name} 已暂停 ${duration.toFixed(1)} 秒`, "info")
      },

      resumeCart: (cartId) => {
        const state = get()
        const cart = state.carts.find(c => c.id === cartId)
        if (!cart) return

        set(s => ({
          carts: s.carts.map(c =>
            c.id === cartId
              ? { ...c, isPaused: false, pauseRemaining: 0 }
              : c
          ),
        }))
        get().showNotification(`${cart.name} 已恢复运行`, "success")
      },

      pauseLowSpeedCartInConflict: (conflictId) => {
        const state = get()
        const conflict = state.conflicts.find(c => c.id === conflictId)
        if (!conflict) return

        const cart1 = state.carts.find(c => c.id === conflict.cartId1)
        const cart2 = state.carts.find(c => c.id === conflict.cartId2)
        if (!cart1 || !cart2) return

        const cart1BatteryRatio = cart1.currentBattery / cart1.maxBattery
        const cart2BatteryRatio = cart2.currentBattery / cart2.maxBattery
        const lowBatteryCart = cart1BatteryRatio <= cart2BatteryRatio ? cart1 : cart2
        const track = state.tracks.find(t => t.id === conflict.trackId)
        const pauseDuration = track ? (track.length / lowBatteryCart.speed) * 1.5 : 5

        set(s => ({
          carts: s.carts.map(c =>
            c.id === lowBatteryCart.id
              ? { ...c, isPaused: true, pauseRemaining: Math.max(c.pauseRemaining, pauseDuration) }
              : c
          ),
        }))
        get().showNotification(`已暂停低电矿车 ${lowBatteryCart.name} ${pauseDuration.toFixed(1)} 秒`, "success")
      },

      staggerDeparture: (conflictId) => {
        const state = get()
        const conflict = state.conflicts.find(c => c.id === conflictId)
        if (!conflict) return

        const cart1 = state.carts.find(c => c.id === conflict.cartId1)
        const cart2 = state.carts.find(c => c.id === conflict.cartId2)
        if (!cart1 || !cart2) return

        const cart1BatteryRatio = cart1.currentBattery / cart1.maxBattery
        const cart2BatteryRatio = cart2.currentBattery / cart2.maxBattery
        const lowBatteryCart = cart1BatteryRatio <= cart2BatteryRatio ? cart1 : cart2
        const track = state.tracks.find(t => t.id === conflict.trackId)
        const delayDuration = track ? (track.length / lowBatteryCart.speed) * 2 : 8

        set(s => ({
          carts: s.carts.map(c =>
            c.id === lowBatteryCart.id
              ? { ...c, departureDelay: Math.max(c.departureDelay, delayDuration) }
              : c
          ),
        }))
        get().showNotification(`${lowBatteryCart.name} 下次出发将延迟 ${delayDuration.toFixed(1)} 秒`, "success")
      },

      forceReturnCart: (cartId) => {
        const state = get()
        const cart = state.carts.find(c => c.id === cartId)
        if (!cart) return

        if (cart.status === "charging") {
          get().showNotification(`${cart.name} 正在充电中`, "info")
          return
        }

        if (cart.status === "idle") {
          if (cart.currentBattery >= cart.maxBattery) {
            get().showNotification(`${cart.name} 电量已满，无需充电`, "info")
            return
          }
          set(s => ({
            carts: s.carts.map(c =>
              c.id === cartId
                ? { ...c, status: "charging" as const, miningProgress: 0 }
                : c
            ),
          }))
          get().showNotification(`${cart.name} 已开始充电`, "success")
          return
        }

        if (cart.status === "toBase") {
          get().showNotification(`${cart.name} 正在返航中`, "info")
          return
        }

        if (cart.status === "toMine") {
          set(s => ({
            carts: s.carts.map(c =>
              c.id === cartId
                ? { ...c, status: "toBase" as const, direction: "backward" as const, trackProgress: 1 - c.trackProgress }
                : c
            ),
          }))
          get().showNotification(`${cart.name} 已强制返航`, "success")
          return
        }

        if (cart.status === "mining" || cart.status === "unloading") {
          const route = state.routes.find(r => r.id === cart.routeId)
          if (route && route.trackIds.length > 0) {
            set(s => ({
              carts: s.carts.map(c =>
                c.id === cartId
                  ? {
                      ...c,
                      status: "toBase" as const,
                      direction: "backward" as const,
                      currentTrackId: route.trackIds[route.trackIds.length - 1],
                      trackProgress: 0,
                      miningProgress: 0,
                    }
                  : c
              ),
            }))
            get().showNotification(`${cart.name} 已强制返航`, "success")
          }
        }
      },

      resetGame: () => {
        set({
          ...initialState,
          tracks: [],
          carts: INITIAL_CARTS.map(c => ({ ...c })),
          mineNodes: INITIAL_MINES.map(m => ({ ...m })),
          dailyCollected: { he3: 0, titanium: 0, iron: 0, silicon: 0 },
          currentView: "game",
          inLevelMode: false,
          accidents: [],
          repairVehicles: createInitialRepairVehicles(),
          selectedRepairVehicleId: null,
          meteorCooldown: 0,
        })
      },

      requestSupplyPlan: (mineId) => {
        const state = get()
        const mine = state.mineNodes.find(m => m.id === mineId)
        if (!mine) return

        if (mine.pendingSupply) {
          get().showNotification(`${mine.name} 已在补给队列中`, "info")
          return
        }

        if (state.resources.credits < SUPPLY_PLAN_COST) {
          get().showNotification("金币不足，无法执行补给计划", "error")
          return
        }

        const supplyRecord: SupplyRecord = {
          id: genId("supply"),
          mineId,
          mineName: mine.name,
          mineralType: mine.mineralType,
          requestDay: state.day,
          cost: SUPPLY_PLAN_COST,
          status: "pending",
          refundAmount: Math.round(SUPPLY_PLAN_COST * 0.7),
          supplyAmount: mine.dailyYield,
        }

        set(s => ({
          resources: { ...s.resources, credits: s.resources.credits - SUPPLY_PLAN_COST },
          mineNodes: s.mineNodes.map(m =>
            m.id === mineId ? { ...m, pendingSupply: true, currentSupplyId: supplyRecord.id } : m
          ),
          supplyQueue: [...s.supplyQueue, supplyRecord],
        }))
        get().showNotification(`${mine.name} 补给计划已安排，跨日生效`, "success")
      },

      cancelSupplyPlan: (supplyId) => {
        const state = get()
        const supply = state.supplyQueue.find(s => s.id === supplyId)
        if (!supply) return

        if (supply.status !== "pending") {
          get().showNotification("该补给已生效或已取消，无法操作", "error")
          return
        }

        const refund = supply.refundAmount
        const updatedSupply: SupplyRecord = {
          ...supply,
          status: "cancelled",
          cancelledDay: state.day,
        }

        set(s => ({
          resources: { ...s.resources, credits: s.resources.credits + refund },
          supplyQueue: s.supplyQueue.map(s =>
            s.id === supplyId ? updatedSupply : s
          ),
          mineNodes: s.mineNodes.map(m =>
            m.id === supply.mineId ? { ...m, pendingSupply: false, currentSupplyId: null } : m
          ),
        }))
        get().showNotification(`补给已取消，退还 ${refund} 金币（70%）`, "success")
      },

      setInLevelMode: (mode) => set({ inLevelMode: mode }),

      setView: (view) => set({ currentView: view }),

      startLevel: (levelId) => {
        const level = getLevelById(levelId)
        if (!level) return

        const state = get()
        const result = state.level.results[levelId]
        const unlocked = levelId === 1 || result?.unlocked === true
        if (!unlocked) {
          get().showNotification("该关卡未解锁", "error")
          return
        }

        const initialRes = { ...INITIAL_RESOURCES }
        if (level.initialResources) {
          Object.assign(initialRes, level.initialResources)
        }

        let filteredMines = INITIAL_MINES
        if (level.initialMineIds && level.initialMineIds.length > 0) {
          filteredMines = INITIAL_MINES.filter(m => level.initialMineIds!.includes(m.id))
        }

        set({
          day: 1,
          dayProgress: 0,
          resources: initialRes,
          mineNodes: filteredMines.map(m => ({ ...m, currentSupplyId: null })),
          tracks: [],
          carts: INITIAL_CARTS.map(c => ({ ...c, x: BASE_POSITION.x, y: BASE_POSITION.y })),
          routes: [],
          dayLogs: [],
          gameSpeed: 1,
          isPaused: true,
          selectedNodeId: null,
          trackBuildMode: false,
          trackStartId: null,
          selectedCartId: null,
          conflicts: [],
          showSettlement: false,
          dailyCollected: { he3: 0, titanium: 0, iron: 0, silicon: 0 },
          supplyQueue: [],
          dailyRecoveryDetails: [],
          totalCollected: { he3: 0, titanium: 0, iron: 0, silicon: 0 },
          totalMiningIncome: 0,
          inLevelMode: true,
          currentView: "game",
          level: {
            ...state.level,
            currentLevelId: levelId,
            showLevelComplete: false,
            completedStars: 0,
          },
          accidents: [],
          repairVehicles: createInitialRepairVehicles(),
          selectedRepairVehicleId: null,
          meteorCooldown: 0,
        })
        get().showNotification(`关卡 ${level.name} 开始！`, "success")
      },

      exitLevel: () => {
        set(s => ({
          level: { ...s.level, currentLevelId: null, showLevelComplete: false },
          inLevelMode: false,
        }))
      },

      getLevelProgress: () => {
        const state = get()
        if (!state.level.currentLevelId) return []
        const level = getLevelById(state.level.currentLevelId)
        if (!level) return []

        const connectedMines = state.mineNodes.filter(m => {
          const path = findPath(m.id, state.tracks, state.basePosition, state.mineNodes)
          return path !== null && path.length > 0
        })

        return level.targets.map(target => {
          let current = 0
          switch (target.type) {
            case "tracks":
              current = state.tracks.length
              break
            case "credits":
              current = state.totalMiningIncome
              break
            case "minerals":
              current = target.mineralType ? state.totalCollected[target.mineralType] : 0
              break
            case "minesConnected":
              current = connectedMines.length
              break
            case "days":
              current = state.day
              break
          }
          return {
            targetId: target.id,
            current,
            completed: current >= target.value,
          }
        })
      },

      checkLevelComplete: () => {
        const state = get()
        if (!state.level.currentLevelId || state.level.showLevelComplete) return
        if (!state.inLevelMode) return

        const level = getLevelById(state.level.currentLevelId)
        if (!level) return

        const progress = get().getLevelProgress()
        const allTargetsComplete = progress.every(p => p.completed)
        if (!allTargetsComplete) return

        let stars: 0 | 1 | 2 | 3 = 0
        const progressMap: Record<string, number> = {}
        for (const p of progress) {
          progressMap[p.targetId] = p.current
        }

        for (const sc of level.starConditions) {
          const met = sc.condition.every(c => (progressMap[c.targetId] || 0) >= c.value)
          if (met) stars = sc.stars
        }

        if (stars === 0) stars = 1

        const prevResult = state.level.results[level.id]
        const bestStars: 0 | 1 | 2 | 3 = Math.max(prevResult?.bestStars || 0, stars) as 0 | 1 | 2 | 3

        const newResults = { ...state.level.results }
        newResults[level.id] = {
          levelId: level.id,
          stars,
          completed: true,
          bestStars,
          unlocked: true,
          progress,
        }

        if (level.reward.unlockLevel) {
          for (const unlockId of level.reward.unlockLevel) {
            if (newResults[unlockId]) {
              newResults[unlockId] = { ...newResults[unlockId], unlocked: true }
            }
          }
        }

        const rewardCredits = level.reward.credits || 0

        set(s => ({
          resources: rewardCredits > 0 ? { ...s.resources, credits: s.resources.credits + rewardCredits } : s.resources,
          level: {
            ...s.level,
            results: newResults,
            showLevelComplete: true,
            completedStars: stars,
          },
          isPaused: true,
        }))

        get().showNotification(`恭喜通关！获得 ${stars} 星${rewardCredits > 0 ? `，奖励 ${rewardCredits} 金币` : ""}`, "success")
      },

      closeLevelComplete: () => set(s => ({ level: { ...s.level, showLevelComplete: false } })),

      selectRepairVehicle: (vehicleId) => set({ selectedRepairVehicleId: vehicleId }),

      dispatchRepairVehicle: (vehicleId, trackId) => {
        const state = get()
        const vehicle = state.repairVehicles.find(rv => rv.id === vehicleId)
        const track = state.tracks.find(t => t.id === trackId)
        if (!vehicle) {
          get().showNotification("维修车不存在", "error")
          return
        }
        if (vehicle.status !== "idle") {
          get().showNotification(`${vehicle.name} 正在执行任务`, "error")
          return
        }
        if (!track) {
          get().showNotification("轨道不存在", "error")
          return
        }
        if (track.status !== "broken") {
          get().showNotification("该轨道无需维修", "info")
          return
        }
        if (track.repairVehicleId) {
          get().showNotification("该轨道已有维修车前往", "info")
          return
        }

        const allNodes = [
          { id: "base", x: state.basePosition.x, y: state.basePosition.y },
          ...state.mineNodes,
        ]
        const fromNode = allNodes.find(n => n.id === track.fromId)
        const toNode = allNodes.find(n => n.id === track.toId)
        if (!fromNode || !toNode) return

        const targetX = (fromNode.x + toNode.x) / 2
        const targetY = (fromNode.y + toNode.y) / 2
        const distance = calcDistance(vehicle.x, vehicle.y, targetX, targetY)

        set(s => ({
          repairVehicles: s.repairVehicles.map(rv =>
            rv.id === vehicleId
              ? {
                  ...rv,
                  status: "traveling",
                  targetTrackId: trackId,
                  travelFromX: rv.x,
                  travelFromY: rv.y,
                  travelToX: targetX,
                  travelToY: targetY,
                  travelDistance: distance,
                  travelProgress: 0,
                }
              : rv
          ),
          tracks: s.tracks.map(t =>
            t.id === trackId ? { ...t, repairVehicleId: vehicleId } : t
          ),
        }))
        get().showNotification(`${vehicle.name} 已派往损毁轨道`, "success")
      },

      buyRepairVehicle: () => {
        const state = get()
        if (state.resources.credits < NEW_REPAIR_VEHICLE_COST) {
          get().showNotification("金币不足，无法购买维修车", "error")
          return
        }
        const newIdx = state.repairVehicles.length + 1
        const newVehicle: RepairVehicle = {
          id: genId("repair"),
          name: `维修车-${newIdx}`,
          status: "idle",
          currentTrackId: null,
          targetTrackId: null,
          x: state.basePosition.x,
          y: state.basePosition.y,
          speed: 50,
          repairProgress: 0,
          repairDuration: 0,
          travelProgress: 0,
          travelFromX: state.basePosition.x,
          travelFromY: state.basePosition.y,
          travelToX: state.basePosition.x,
          travelToY: state.basePosition.y,
          travelDistance: 0,
        }
        set(s => ({
          repairVehicles: [...s.repairVehicles, newVehicle],
          resources: { ...s.resources, credits: s.resources.credits - NEW_REPAIR_VEHICLE_COST },
        }))
        get().showNotification(`已购买 ${newVehicle.name}`, "success")
      },

      triggerMeteorShower: () => {
        const state = get()
        const normalTracks = state.tracks.filter(t => t.status === "normal")
        if (normalTracks.length === 0) {
          get().showNotification("没有可被损毁的轨道", "info")
          return
        }
        const hitTrack = normalTracks[Math.floor(Math.random() * normalTracks.length)]
        const accident: AccidentRecord = {
          id: genId("accident"),
          day: state.day,
          time: state.dayProgress,
          type: "meteor",
          trackId: hitTrack.id,
          description: `陨石雨袭击了轨道段（${hitTrack.length}米），轨道损毁！`,
          resolved: false,
        }
        set(s => ({
          tracks: s.tracks.map(t =>
            t.id === hitTrack.id
              ? {
                  ...t,
                  status: "broken",
                  breakDay: s.day,
                  breakTime: s.dayProgress,
                  repairVehicleId: null,
                  repairProgress: 0,
                }
              : t
          ),
          accidents: [...s.accidents, accident],
          meteorCooldown: METEOR_COOLDOWN_DAYS,
        }))
        get().showNotification(`⚠️ 陨石雨警报！一段轨道损毁，请派遣维修车`, "error")
      },
    }),
    {
      name: "lunar-miner-game",
      partialize: (state) => ({
        day: state.day,
        dayProgress: state.dayProgress,
        resources: state.resources,
        mineNodes: state.mineNodes,
        tracks: state.tracks,
        carts: state.carts,
        routes: state.routes,
        dayLogs: state.dayLogs,
        gameSpeed: state.gameSpeed,
        lastSettlementDay: state.lastSettlementDay,
        dailyCollected: state.dailyCollected,
        supplyQueue: state.supplyQueue,
        dailyRecoveryDetails: state.dailyRecoveryDetails,
        level: state.level,
        totalCollected: state.totalCollected,
        totalMiningIncome: state.totalMiningIncome,
        accidents: state.accidents,
        repairVehicles: state.repairVehicles,
        meteorCooldown: state.meteorCooldown,
      }),
    }
  )
)
