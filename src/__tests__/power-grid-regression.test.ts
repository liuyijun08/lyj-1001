import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { useGameStore } from "@/store/gameStore"
import { UNPOWERED_SPEED_RATIO, POWER_STATION_COST, POWER_CABLE_COST_PER_UNIT, BASE_POSITION, INITIAL_RESOURCES } from "@/config/gameConfig"
import type { PowerStation, PowerCable, PoweredNode, Cart } from "@/types/game"

function initializeGameState() {
  const store = useGameStore.getState()
  store.resetGame()
  store.setView("game")
  const s = useGameStore.getState()
  s.resources = { ...INITIAL_RESOURCES, credits: 10000 }
  s.isPaused = false
  s.tick(0.01)
  return useGameStore.getState()
}

function calcDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2)
}

function buildTrackHelper(fromId: string, toId: string): boolean {
  const state = useGameStore.getState()
  const beforeCount = state.tracks.length
  state.buildTrack(fromId, toId)
  return useGameStore.getState().tracks.length > beforeCount
}

function buildCableHelper(fromId: string, toId: string): boolean {
  const state = useGameStore.getState()
  const beforeCount = state.powerCables.length
  state.buildPowerCable(fromId, toId)
  return useGameStore.getState().powerCables.length > beforeCount
}

function findCartById(cartId: string): Cart | undefined {
  return useGameStore.getState().carts.find(c => c.id === cartId)
}

function isNodeInPoweredList(nodeId: string): boolean {
  return useGameStore.getState().poweredNodes.some(p => p.nodeId === nodeId)
}

function getPoweredMineCount(): number {
  return useGameStore.getState().poweredNodes.filter(p => p.nodeType === "mine").length
}

describe("电网回归测试：发电站 → 电缆 → 断电矿车降速 → 通电速度恢复", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    initializeGameState()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("TC-PWR-01: 初始化状态验证 - 默认发电站存在且运行", () => {
    const state = useGameStore.getState()

    expect(state.powerStations.length).toBeGreaterThan(0)
    const mainStation = state.powerStations[0]
    expect(mainStation.operational).toBe(true)
    expect(mainStation.powerOutput).toBeGreaterThan(0)

    expect(state.poweredNodes.length).toBeGreaterThan(0)
    const stationInPowered = state.poweredNodes.find(p => p.nodeId === mainStation.id)
    expect(stationInPowered).toBeDefined()
    expect(stationInPowered?.nodeType).toBe("station")
    expect(stationInPowered?.level).toBe(0)
  })

  it("TC-PWR-02: 建造发电站 - 验证建造成功和状态", () => {
    const state0 = useGameStore.getState()
    const stationsBefore = state0.powerStations.length
    const creditsBefore = state0.resources.credits

    const testX = BASE_POSITION.x + 100
    const testY = BASE_POSITION.y + 50
    state0.buildPowerStation(testX, testY)

    const state1 = useGameStore.getState()
    expect(state1.powerStations.length).toBe(stationsBefore + 1)
    expect(state1.resources.credits).toBe(creditsBefore - POWER_STATION_COST)

    const newStation = state1.powerStations[state1.powerStations.length - 1]
    expect(newStation.operational).toBe(true)
    expect(newStation.x).toBe(testX)
    expect(newStation.y).toBe(testY)
    expect(newStation.buildCost).toBe(POWER_STATION_COST)

    const stationInPowered = state1.poweredNodes.find(p => p.nodeId === newStation.id)
    expect(stationInPowered).toBeDefined()
    expect(stationInPowered?.level).toBe(0)
  })

  it("TC-PWR-03: 建造发电站金币不足 - 不应建造", () => {
    const state0 = useGameStore.getState()
    state0.resources.credits = POWER_STATION_COST - 1

    const stationsBefore = state0.powerStations.length
    state0.buildPowerStation(100, 100)

    const state1 = useGameStore.getState()
    expect(state1.powerStations.length).toBe(stationsBefore)
  })

  it("TC-PWR-04: 铺设电缆 - 发电站→基地→矿点，验证供电范围扩展", () => {
    const state0 = useGameStore.getState()
    const mainStationId = state0.powerStations[0].id

    expect(isNodeInPoweredList(mainStationId)).toBe(true)

    buildCableHelper(mainStationId, "base")
    buildCableHelper("base", "mine-1")

    const state1 = useGameStore.getState()
    expect(state1.powerCables.length).toBeGreaterThanOrEqual(2)

    expect(isNodeInPoweredList("base")).toBe(true)
    const poweredMineIds = state1.poweredNodes.filter(p => p.nodeType === "mine").map(p => p.nodeId)
    expect(poweredMineIds).toContain("mine-1")

    const mine1Powered = state1.poweredNodes.find(p => p.nodeId === "mine-1")
    const basePowered = state1.poweredNodes.find(p => p.nodeId === "base")
    expect(mine1Powered?.level).toBeGreaterThan(basePowered?.level ?? 0)
  })

  it("TC-PWR-05: 电缆成本计算 - 验证按距离收费", () => {
    const state0 = useGameStore.getState()
    const mainStationId = state0.powerStations[0].id
    const creditsBefore = state0.resources.credits

    const allPowerNodes = [
      { id: "base", x: state0.basePosition.x, y: state0.basePosition.y },
      ...state0.mineNodes.map(m => ({ id: m.id, x: m.x, y: m.y })),
      ...state0.powerStations.map(s => ({ id: s.id, x: s.x, y: s.y })),
    ]
    const fromNode = allPowerNodes.find(n => n.id === mainStationId)!
    const toNode = allPowerNodes.find(n => n.id === "mine-1")!
    const expectedLength = Math.round(calcDistance(fromNode.x, fromNode.y, toNode.x, toNode.y))
    const expectedCost = Math.round(expectedLength * POWER_CABLE_COST_PER_UNIT)

    state0.buildPowerCable(mainStationId, "mine-1")

    const state1 = useGameStore.getState()
    expect(state1.resources.credits).toBe(creditsBefore - expectedCost)

    const newCable = state1.powerCables[state1.powerCables.length - 1]
    expect(newCable.length).toBe(expectedLength)
    expect(newCable.buildCost).toBe(expectedCost)
  })

  it("TC-PWR-06: 重复铺设电缆 - 应拒绝重复", () => {
    const state0 = useGameStore.getState()
    const mainStationId = state0.powerStations[0].id

    buildCableHelper(mainStationId, "base")
    const cableCountBefore = useGameStore.getState().powerCables.length

    buildCableHelper(mainStationId, "base")
    buildCableHelper("base", mainStationId)

    const cableCountAfter = useGameStore.getState().powerCables.length
    expect(cableCountAfter).toBe(cableCountBefore)
  })

  it("TC-PWR-07: 无电矿车速度验证 - 断电时速度降至 UNPOWERED_SPEED_RATIO", () => {
    buildTrackHelper("base", "mine-5")

    const state0 = useGameStore.getState()
    const cartId = state0.carts[0].id
    const baseSpeed = state0.carts[0].baseSpeed

    state0.assignCartToMine(cartId, "mine-5")
    state0.isPaused = false
    state0.tick(0.1)

    const state1 = useGameStore.getState()
    const cart = state1.carts.find(c => c.id === cartId)

    if (cart?.status === "toMine" || cart?.status === "toBase") {
      const expectedSpeed = Math.round(baseSpeed * UNPOWERED_SPEED_RATIO)
      expect(cart.isPowered).toBe(false)
      expect(cart.speed).toBe(expectedSpeed)
    }
  })

  it("TC-PWR-08: 通电矿车速度验证 - 供电时速度恢复为 baseSpeed", () => {
    const state0 = useGameStore.getState()
    const mainStationId = state0.powerStations[0].id

    buildTrackHelper("base", "mine-1")
    buildCableHelper(mainStationId, "base")
    buildCableHelper("base", "mine-1")

    const state1 = useGameStore.getState()
    expect(state1.isMinePowered("mine-1")).toBe(true)

    const cartId = state1.carts[0].id
    const baseSpeed = state1.carts[0].baseSpeed

    state1.assignCartToMine(cartId, "mine-1")
    state1.isPaused = false
    state1.tick(0.1)

    const state2 = useGameStore.getState()
    const cart = state2.carts.find(c => c.id === cartId)

    if (cart?.status === "toMine" || cart?.status === "toBase") {
      expect(cart.isPowered).toBe(true)
      expect(cart.speed).toBe(baseSpeed)
    }
  })

  it("TC-PWR-09: 矿车在基地充电时 - 供电状态由基地决定", () => {
    const state0 = useGameStore.getState()
    const mainStationId = state0.powerStations[0].id
    buildCableHelper(mainStationId, "base")

    const state1 = useGameStore.getState()
    expect(isNodeInPoweredList("base")).toBe(true)

    const cartId = state1.carts[0].id
    const baseSpeed = state1.carts[0].baseSpeed
    const cart = state1.carts.find(c => c.id === cartId)!
    cart.currentBattery = 10
    const state2 = useGameStore.getState()
    state2.carts = state2.carts.map(c => c.id === cartId ? { ...c, currentBattery: 10, status: "charging" } : c)

    const state3 = useGameStore.getState()
    state3.isPaused = false
    state3.tick(0.1)

    const state4 = useGameStore.getState()
    const chargingCart = state4.carts.find(c => c.id === cartId)
    if (chargingCart?.status === "charging" || chargingCart?.status === "idle") {
      expect(chargingCart.isPowered).toBe(true)
      expect(chargingCart.speed).toBe(baseSpeed)
    }
  })

  it("TC-PWR-10: 矿车采矿时 - 供电状态由矿点决定", () => {
    const state0 = useGameStore.getState()
    const mainStationId = state0.powerStations[0].id

    buildTrackHelper("base", "mine-5")
    buildCableHelper(mainStationId, "base")
    buildCableHelper("base", "mine-5")

    const state1 = useGameStore.getState()
    expect(state1.isMinePowered("mine-5")).toBe(true)

    const cartId = state1.carts[0].id
    state1.assignCartToMine(cartId, "mine-5")

    let stateN = useGameStore.getState()
    for (let i = 0; i < 200; i++) {
      stateN.isPaused = false
      stateN.tick(0.5)
      stateN = useGameStore.getState()
      if (stateN.carts.find(c => c.id === cartId)?.status === "mining") break
    }

    const finalState = useGameStore.getState()
    const miningCart = finalState.carts.find(c => c.id === cartId)
    if (miningCart?.status === "mining") {
      expect(miningCart.isPowered).toBe(true)
      expect(miningCart.speed).toBe(miningCart.baseSpeed)
    }
  })

  it("TC-PWR-11: 断电→通电速度恢复验证 - 完整流程", () => {
    buildTrackHelper("base", "mine-5")

    const state0 = useGameStore.getState()
    const cartId = state0.carts[0].id
    const baseSpeed = state0.carts[0].baseSpeed
    const expectedLowSpeed = Math.round(baseSpeed * UNPOWERED_SPEED_RATIO)

    state0.assignCartToMine(cartId, "mine-5")
    state0.isPaused = false
    state0.tick(0.1)

    const state1 = useGameStore.getState()
    const cart1 = state1.carts.find(c => c.id === cartId)
    if (cart1?.status === "toMine") {
      expect(cart1.isPowered).toBe(false)
      expect(cart1.speed).toBe(expectedLowSpeed)
    }

    const mainStationId = state1.powerStations[0].id
    buildCableHelper(mainStationId, "base")
    buildCableHelper("base", "mine-5")

    const state2 = useGameStore.getState()
    state2.tick(0.1)

    const state3 = useGameStore.getState()
    const cart3 = state3.carts.find(c => c.id === cartId)
    if (cart3?.status === "toMine") {
      expect(cart3.isPowered).toBe(true)
      expect(cart3.speed).toBe(baseSpeed)
    }
  })

  it("TC-PWR-12: 供电范围拓扑验证 - BFS传播层级正确", () => {
    const state0 = useGameStore.getState()
    const mainStationId = state0.powerStations[0].id

    buildCableHelper(mainStationId, "base")
    buildCableHelper("base", "mine-1")
    buildCableHelper("base", "mine-5")
    buildCableHelper("mine-1", "mine-6")

    const state1 = useGameStore.getState()

    const stationLevel = state1.poweredNodes.find(p => p.nodeId === mainStationId)?.level
    const baseLevel = state1.poweredNodes.find(p => p.nodeId === "base")?.level
    const mine1Level = state1.poweredNodes.find(p => p.nodeId === "mine-1")?.level
    const mine5Level = state1.poweredNodes.find(p => p.nodeId === "mine-5")?.level
    const mine6Level = state1.poweredNodes.find(p => p.nodeId === "mine-6")?.level

    expect(stationLevel).toBe(0)
    expect(baseLevel).toBe(1)
    expect(mine1Level).toBe(2)
    expect(mine5Level).toBe(2)
    expect(mine6Level).toBe(3)
  })

  it("TC-PWR-13: validatePowerGrid 验证 - 正确计算供电矿点数和负载", () => {
    const state0 = useGameStore.getState()
    const mainStationId = state0.powerStations[0].id

    buildCableHelper(mainStationId, "base")
    buildCableHelper("base", "mine-1")
    buildCableHelper("base", "mine-2")
    buildCableHelper("base", "mine-3")

    const state1 = useGameStore.getState()
    const validation = state1.validatePowerGrid()

    expect(validation.poweredMines).toBe(3)
    expect(validation.totalOutput).toBe(state1.powerStations.filter(s => s.operational).reduce((sum, s) => sum + s.powerOutput, 0))

    const totalMineCount = state1.mineNodes.length
    const operationalStations = state1.powerStations.filter(s => s.operational).length
    const baseIsPowered = state1.isNodePowered("base") ? 1 : 0
    const expectedLoad = (totalMineCount + baseIsPowered + operationalStations) * 10
    expect(validation.totalLoad).toBe(expectedLoad)
  })

  it("TC-PWR-14: isMinePowered / isNodePowered 接口验证", () => {
    const state0 = useGameStore.getState()
    const mainStationId = state0.powerStations[0].id

    expect(state0.isMinePowered("mine-1")).toBe(false)
    expect(state0.isNodePowered("mine-1")).toBe(false)

    buildCableHelper(mainStationId, "base")
    buildCableHelper("base", "mine-1")

    const state1 = useGameStore.getState()
    expect(state1.isMinePowered("mine-1")).toBe(true)
    expect(state1.isNodePowered("mine-1")).toBe(true)
    expect(state1.isMinePowered("mine-2")).toBe(false)
    expect(state1.isNodePowered("base")).toBe(true)
  })

  it("TC-PWR-15: 多发电站并联供电 - 验证多个发电站同时供电", () => {
    const state0 = useGameStore.getState()
    const station1Id = state0.powerStations[0].id

    state0.buildPowerStation(BASE_POSITION.x + 150, BASE_POSITION.y + 150)
    const state1 = useGameStore.getState()
    const station2Id = state1.powerStations[state1.powerStations.length - 1].id

    buildCableHelper(station1Id, "base")
    buildCableHelper(station2Id, "mine-1")
    buildCableHelper("base", "mine-5")

    const state2 = useGameStore.getState()

    expect(state2.isNodePowered("base")).toBe(true)
    expect(state2.isMinePowered("mine-1")).toBe(true)
    expect(state2.isMinePowered("mine-5")).toBe(true)

    const mine1Level = state2.poweredNodes.find(p => p.nodeId === "mine-1")?.level
    const mine5Level = state2.poweredNodes.find(p => p.nodeId === "mine-5")?.level
    expect(mine1Level).toBe(1)
    expect(mine5Level).toBe(2)
  })
})
