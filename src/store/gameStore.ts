import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { GameState, Cart, MineNode, Track, CartRoute, ConflictInfo, MineralType, DayLog } from "@/types/game"
import { MINERAL_PRICES } from "@/types/game"
import {
  INITIAL_RESOURCES, INITIAL_MINES, INITIAL_CARTS, BASE_POSITION,
  DAY_DURATION, MINING_SPEED, MINING_TIME, UNLOAD_TIME, CHARGE_TIME,
  CHARGE_COST, TRACK_COST_PER_UNIT, TRACK_MAINTENANCE_PER_UNIT,
  CART_MAINTENANCE, BASE_CHARGE_RATE, MAP_WIDTH, MAP_HEIGHT, NEW_CART_COST,
} from "@/config/gameConfig"

function calcDistance(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}

function findPath(mineId: string, tracks: Track[], basePosition: { x: number; y: number }, mines: MineNode[]): Track[] | null {
  const adj: Record<string, { track: Track; neighbor: string }[]> = {}
  const baseId = "base"

  for (const t of tracks) {
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
}

const initialState = {
  day: 1,
  dayProgress: 0,
  resources: { ...INITIAL_RESOURCES },
  mineNodes: INITIAL_MINES.map(m => ({ ...m })),
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
        }

        set(s => ({
          tracks: [...s.tracks, newTrack],
          resources: { ...s.resources, credits: s.resources.credits - buildCost },
          trackStartId: null,
        }))
      },

      selectCart: (cartId) => set({ selectedCartId: cartId }),

      assignCartToMine: (cartId, mineId) => {
        const state = get()
        const cart = state.carts.find(c => c.id === cartId)
        if (!cart || cart.status !== "idle") return

        const path = findPath(mineId, state.tracks, state.basePosition, state.mineNodes)
        if (!path || path.length === 0) return

        const totalDist = path.reduce((sum, t) => sum + t.length, 0)
        const roundTripBattery = totalDist * 2 * cart.batteryPerUnit
        if (cart.currentBattery < roundTripBattery * 0.5) return

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
      },

      unassignCart: (cartId) => {
        const state = get()
        const cart = state.carts.find(c => c.id === cartId)
        if (!cart) return

        set(s => ({
          carts: s.carts.map(c =>
            c.id === cartId
              ? { ...c, status: "idle" as const, routeId: null, assignedMineId: null, currentTrackId: null, trackProgress: 0, x: s.basePosition.x, y: s.basePosition.y, miningProgress: 0 }
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
        let newConflicts: ConflictInfo[] = []
        let showSettlement = state.showSettlement || newDayProgress >= DAY_DURATION
        let newIsPaused = showSettlement && !state.showSettlement
        const dailyCollectedAcc: Record<MineralType, number> = { ...state.dailyCollected }

        if (newDayProgress >= DAY_DURATION) {
          showSettlement = true
          newIsPaused = true
        }

        for (let i = 0; i < newCarts.length; i++) {
          const cart = newCarts[i]

          if (cart.status === "toMine") {
            const track = state.tracks.find(t => t.id === cart.currentTrackId)
            if (!track) continue

            const progressDelta = (cart.speed * effectiveDt) / track.length
            cart.trackProgress += progressDelta
            cart.currentBattery -= cart.batteryPerUnit * (cart.speed * effectiveDt)

            const fromId = cart.direction === "forward" ? track.fromId : track.toId
            const toId = cart.direction === "forward" ? track.toId : track.fromId

            const allNodes = [
              { id: "base", x: state.basePosition.x, y: state.basePosition.y },
              ...state.mineNodes,
            ]
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
                cart.currentTrackId = route.trackIds[currentIdx + 1]
                cart.trackProgress = 0
              } else {
                cart.status = "mining"
                cart.miningProgress = 0
                cart.currentTrackId = null
                cart.trackProgress = 0
              }
            }

            if (cart.currentBattery <= cart.maxBattery * 0.15) {
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
            const track = state.tracks.find(t => t.id === cart.currentTrackId)
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

            const progressDelta = (cart.speed * effectiveDt) / track.length
            cart.trackProgress += progressDelta
            cart.currentBattery -= cart.batteryPerUnit * (cart.speed * effectiveDt) * 0.5

            const fromId = cart.direction === "backward" ? track.toId : track.fromId
            const toId = cart.direction === "backward" ? track.fromId : track.toId

            const allNodes = [
              { id: "base", x: state.basePosition.x, y: state.basePosition.y },
              ...state.mineNodes,
            ]
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
                  cart.currentTrackId = route.trackIds[nextIdx]
                  cart.trackProgress = 0
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

        const trackCartMap: Record<string, string[]> = {}
        for (const c of newCarts) {
          if (c.currentTrackId && (c.status === "toMine" || c.status === "toBase")) {
            if (!trackCartMap[c.currentTrackId]) trackCartMap[c.currentTrackId] = []
            trackCartMap[c.currentTrackId].push(c.id)
          }
        }
        for (const [trackId, cartIds] of Object.entries(trackCartMap)) {
          if (cartIds.length > 1) {
            for (let i = 0; i < cartIds.length; i++) {
              for (let j = i + 1; j < cartIds.length; j++) {
                newConflicts.push({ cartId1: cartIds[i], cartId2: cartIds[j], trackId })
              }
            }
          }
        }

        set({
          day: newDay,
          dayProgress: newDayProgress % DAY_DURATION,
          resources: newResources,
          carts: newCarts,
          mineNodes: newMines,
          conflicts: newConflicts,
          showSettlement,
          dailyCollected: dailyCollectedAcc,
          isPaused: newIsPaused || state.isPaused,
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

        const dayLog: DayLog = {
          day: state.day,
          income,
          expense,
          collected,
        }

        const newMines = state.mineNodes.map(m => ({
          ...m,
          remaining: Math.min(m.maxReserve, m.remaining + m.dailyYield),
        }))

        const newCarts = state.carts.map(c => ({
          ...c,
          x: state.basePosition.x,
          y: state.basePosition.y,
          currentTrackId: c.status === "idle" || c.status === "charging" ? null : c.currentTrackId,
        }))

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
        }))
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

      resetGame: () => {
        set({
          ...initialState,
          tracks: [],
          carts: INITIAL_CARTS.map(c => ({ ...c })),
          mineNodes: INITIAL_MINES.map(m => ({ ...m })),
          dailyCollected: { he3: 0, titanium: 0, iron: 0, silicon: 0 },
        })
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
      }),
    }
  )
)
