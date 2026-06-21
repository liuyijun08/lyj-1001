import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { useGameStore } from "@/store/gameStore"
import { INITIAL_RESOURCES } from "@/config/gameConfig"
import type { Track, AccidentRecord, RepairVehicle, Cart } from "@/types/game"

function initializeGameState() {
  const store = useGameStore.getState()
  store.resetGame()
  store.setView("game")
  const s = useGameStore.getState()
  s.resources = { ...INITIAL_RESOURCES, credits: 5000 }
  return useGameStore.getState()
}

function buildTrackHelper(fromId: string, toId: string): boolean {
  const state = useGameStore.getState()
  const beforeCount = state.tracks.length
  state.buildTrack(fromId, toId)
  return useGameStore.getState().tracks.length > beforeCount
}

function findBrokenTrack(): Track | undefined {
  return useGameStore.getState().tracks.find(t => t.status === "broken")
}

function findIdleRepairVehicle(): RepairVehicle | undefined {
  return useGameStore.getState().repairVehicles.find(rv => rv.status === "idle")
}

function findCartByName(name: string): Cart | undefined {
  return useGameStore.getState().carts.find(c => c.name === name)
}

describe("事故回归测试：陨石雨 → 断轨 → 维修车修复 → 恢复运输", () => {
  beforeEach(() => {
    vi.useFakeTimers()
    initializeGameState()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("TC-ACC-01: 初始化状态验证 - 无事故、无断轨、维修车待命", () => {
    const state = useGameStore.getState()

    expect(state.accidents).toHaveLength(0)
    expect(state.tracks.filter(t => t.status === "broken")).toHaveLength(0)
    expect(state.tracks.filter(t => t.status === "repairing")).toHaveLength(0)

    const idleRepairVehicles = state.repairVehicles.filter(rv => rv.status === "idle")
    expect(idleRepairVehicles.length).toBeGreaterThan(0)
    expect(state.meteorCooldown).toBe(0)
  })

  it("TC-ACC-02: 触发陨石雨 - 生成断轨和事故记录", () => {
    buildTrackHelper("base", "mine-1")

    const stateBefore = useGameStore.getState()
    const normalTracksBefore = stateBefore.tracks.filter(t => t.status === "normal").length
    const accidentCountBefore = stateBefore.accidents.length

    stateBefore.triggerMeteorShower()

    const stateAfter = useGameStore.getState()
    const brokenTracks = stateAfter.tracks.filter(t => t.status === "broken")
    const newAccidents = stateAfter.accidents.filter(a => !a.resolved)

    expect(brokenTracks.length).toBe(1)
    expect(normalTracksBefore - stateAfter.tracks.filter(t => t.status === "normal").length).toBe(1)
    expect(newAccidents.length).toBe(accidentCountBefore + 1)

    const accident = newAccidents[newAccidents.length - 1]
    expect(accident.type).toBe("meteor")
    expect(accident.trackId).toBe(brokenTracks[0].id)
    expect(accident.resolved).toBe(false)
    expect(accident.description).toContain("陨石雨")
    expect(stateAfter.meteorCooldown).toBeGreaterThan(0)
  })

  it("TC-ACC-03: 触发陨石雨无轨道时 - 不应产生事故", () => {
    const state = useGameStore.getState()
    expect(state.tracks.length).toBe(0)

    state.triggerMeteorShower()

    const afterState = useGameStore.getState()
    expect(afterState.accidents).toHaveLength(0)
    expect(afterState.tracks.filter(t => t.status === "broken")).toHaveLength(0)
  })

  it("TC-ACC-04: 断轨检测 - 矿车遇到断轨应紧急停运", () => {
    buildTrackHelper("base", "mine-6")

    const state0 = useGameStore.getState()
    const cartId = state0.carts[0].id
    state0.assignCartToMine(cartId, "mine-6")
    state0.isPaused = false
    state0.tick(0.1)

    const state1 = useGameStore.getState()
    const tracks = state1.tracks.filter(t => t.status === "normal")
    expect(tracks.length).toBeGreaterThan(0)

    const targetTrack = tracks[0]
    const state2 = useGameStore.getState()
    state2.tracks = state2.tracks.map(t =>
      t.id === targetTrack.id
        ? { ...t, status: "broken", breakDay: state2.day, breakTime: state2.dayProgress, repairVehicleId: null, repairProgress: 0 }
        : t
    )
    state2.accidents = [...state2.accidents, {
      id: "acc-test-04",
      day: state2.day,
      time: state2.dayProgress,
      type: "meteor",
      trackId: targetTrack.id,
      description: "测试断轨",
      resolved: false,
    }]

    const state3 = useGameStore.getState()
    state3.isPaused = false
    state3.tick(0.1)

    const state4 = useGameStore.getState()
    const cartInTransit = state4.carts.find(c => c.id === cartId)
    if (cartInTransit && (cartInTransit.status === "toMine" || cartInTransit.status === "toBase")) {
      if (cartInTransit.currentTrackId === targetTrack.id) {
        expect(cartInTransit.isPaused).toBe(true)
        expect(cartInTransit.pauseRemaining).toBeGreaterThan(1000)
      }
    }
  })

  it("TC-ACC-05: 派遣维修车 - 验证状态流转", () => {
    buildTrackHelper("base", "mine-1")
    const state1 = useGameStore.getState()
    state1.triggerMeteorShower()

    const brokenTrack = findBrokenTrack()
    const idleVehicle = findIdleRepairVehicle()
    expect(brokenTrack).toBeDefined()
    expect(idleVehicle).toBeDefined()

    const state2 = useGameStore.getState()
    state2.dispatchRepairVehicle(idleVehicle!.id, brokenTrack!.id)

    const stateAfterDispatch = useGameStore.getState()
    const vehicle = stateAfterDispatch.repairVehicles.find(rv => rv.id === idleVehicle!.id)
    const track = stateAfterDispatch.tracks.find(t => t.id === brokenTrack!.id)

    expect(vehicle?.status).toBe("traveling")
    expect(vehicle?.targetTrackId).toBe(brokenTrack!.id)
    expect(track?.repairVehicleId).toBe(idleVehicle!.id)
  })

  it("TC-ACC-06: 重复派遣维修车 - 同一轨道不应重复派遣", () => {
    buildTrackHelper("base", "mine-1")
    const s1 = useGameStore.getState()
    s1.triggerMeteorShower()
    s1.buyRepairVehicle()

    const brokenTrack = findBrokenTrack()!
    const vehicles = useGameStore.getState().repairVehicles.filter(rv => rv.status === "idle")
    expect(vehicles.length).toBeGreaterThanOrEqual(2)

    const s2 = useGameStore.getState()
    s2.dispatchRepairVehicle(vehicles[0].id, brokenTrack.id)

    const s3 = useGameStore.getState()
    s3.dispatchRepairVehicle(vehicles[1].id, brokenTrack.id)

    const finalState = useGameStore.getState()
    const v1 = finalState.repairVehicles.find(rv => rv.id === vehicles[0].id)
    const v2 = finalState.repairVehicles.find(rv => rv.id === vehicles[1].id)
    const track = finalState.tracks.find(t => t.id === brokenTrack.id)

    expect(v1?.status).toBe("traveling")
    expect(v2?.status).toBe("idle")
    expect(track?.repairVehicleId).toBe(vehicles[0].id)
  })

  it("TC-ACC-07: 维修车完整流程 - 到达→维修→返回→事故解除", () => {
    buildTrackHelper("base", "mine-6")
    const s0 = useGameStore.getState()
    s0.triggerMeteorShower()

    const brokenTrack = findBrokenTrack()!
    const vehicle = findIdleRepairVehicle()!
    const s1 = useGameStore.getState()
    s1.dispatchRepairVehicle(vehicle.id, brokenTrack.id)

    const s = useGameStore.getState()
    s.isPaused = false
    for (let i = 0; i < 500; i++) {
      useGameStore.getState().tick(0.1)
    }

    const s2 = useGameStore.getState()
    const t2 = s2.tracks.find(t => t.id === brokenTrack.id)
    const acc = s2.accidents.find(a => a.trackId === brokenTrack.id)

    expect(t2?.status).toBe("normal")
    expect(t2?.repairVehicleId).toBeNull()
    expect(acc?.resolved).toBe(true)
    expect(acc?.resolvedDay).toBeDefined()

    for (let i = 0; i < 100; i++) {
      useGameStore.getState().tick(0.1)
    }

    const finalState = useGameStore.getState()
    const finalVehicle = finalState.repairVehicles.find(rv => rv.id === vehicle.id)
    expect(finalVehicle?.status).toBe("idle")
    expect(finalVehicle?.x).toBe(finalState.basePosition.x)
    expect(finalVehicle?.y).toBe(finalState.basePosition.y)
  })

  it("TC-ACC-08: 修复完成后矿车自动恢复运输", () => {
    buildTrackHelper("base", "mine-6")

    const s0 = useGameStore.getState()
    const cartId = s0.carts[0].id
    s0.assignCartToMine(cartId, "mine-6")

    const s1 = useGameStore.getState()
    s1.triggerMeteorShower()

    const brokenTrack = findBrokenTrack()!
    const repairVehicle = findIdleRepairVehicle()!
    const s2 = useGameStore.getState()
    s2.dispatchRepairVehicle(repairVehicle.id, brokenTrack.id)

    const s = useGameStore.getState()
    s.isPaused = false
    for (let i = 0; i < 400; i++) {
      useGameStore.getState().tick(0.1)
    }

    const finalState = useGameStore.getState()
    const track = finalState.tracks.find(t => t.id === brokenTrack.id)
    expect(track?.status).toBe("normal")

    const cart = finalState.carts.find(c => c.id === cartId)
    expect(cart?.isPaused).toBe(false)
  })

  it("TC-ACC-09: 跨日结算 - 断轨状态应保持", () => {
    buildTrackHelper("base", "mine-6")
    buildTrackHelper("base", "mine-5")

    const s0 = useGameStore.getState()
    s0.triggerMeteorShower()

    const s0After = useGameStore.getState()
    const brokenTrackBefore = findBrokenTrack()!
    const accidentBefore = s0After.accidents.find(a => a.trackId === brokenTrackBefore.id)!
    expect(accidentBefore).toBeDefined()

    const s1 = useGameStore.getState()
    s1.dayProgress = 59.9
    s1.isPaused = false
    s1.tick(0.2)

    const s2 = useGameStore.getState()
    if (s2.showSettlement) {
      s2.endDay()
    }

    const afterSettlement = useGameStore.getState()
    const trackAfter = afterSettlement.tracks.find(t => t.id === brokenTrackBefore.id)
    const accidentAfter = afterSettlement.accidents.find(a => a.id === accidentBefore.id)

    expect(trackAfter).toBeDefined()
    expect(accidentAfter).toBeDefined()
    expect(trackAfter?.status).toBe("broken")
    expect(accidentAfter?.resolved).toBe(false)
    expect(afterSettlement.day).toBe(2)
  })

  it("TC-ACC-10: 多条轨道 - 陨石雨只损毁一条", () => {
    buildTrackHelper("base", "mine-1")
    buildTrackHelper("base", "mine-2")
    buildTrackHelper("base", "mine-3")
    buildTrackHelper("mine-1", "mine-6")

    const s0 = useGameStore.getState()
    const normalBefore = s0.tracks.filter(t => t.status === "normal").length

    s0.triggerMeteorShower()

    const s1 = useGameStore.getState()
    const brokenAfter = s1.tracks.filter(t => t.status === "broken").length
    const normalAfter = s1.tracks.filter(t => t.status === "normal").length

    expect(brokenAfter).toBe(1)
    expect(normalAfter).toBe(normalBefore - 1)
  })
})
