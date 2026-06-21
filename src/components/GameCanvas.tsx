import { useRef, useEffect, useCallback, useState } from "react"
import { useGameStore } from "@/store/gameStore"
import { MINERAL_COLORS } from "@/types/game"
import { MAP_WIDTH, MAP_HEIGHT, NODE_RADIUS, BASE_RADIUS, CART_SIZE } from "@/config/gameConfig"

interface Star {
  x: number
  y: number
  size: number
  brightness: number
}

function generateStars(count: number): Star[] {
  const stars: Star[] = []
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * MAP_WIDTH,
      y: Math.random() * MAP_HEIGHT,
      size: Math.random() * 1.5 + 0.5,
      brightness: Math.random() * 0.6 + 0.2,
    })
  }
  return stars
}

const STARS = generateStars(200)

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const [dragHoverMineId, setDragHoverMineId] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragInvalidMineId, setDragInvalidMineId] = useState<string | null>(null)
  const [draggingCartId, setDraggingCartId] = useState<string | null>(null)
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null)
  const dragStartPos = useRef<{ x: number; y: number } | null>(null)
  const isCanvasDrag = useRef(false)

  const store = useGameStore()
  const trackBuildMode = useGameStore(s => s.trackBuildMode)
  const notification = useGameStore(s => s.notification)
  const hideNotification = useGameStore(s => s.hideNotification)
  const carts = useGameStore(s => s.carts)

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const state = useGameStore.getState()

    ctx.fillStyle = "#0a0e1a"
    ctx.fillRect(0, 0, MAP_WIDTH, MAP_HEIGHT)

    for (const star of STARS) {
      ctx.fillStyle = `rgba(200, 210, 230, ${star.brightness})`
      ctx.beginPath()
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.strokeStyle = "rgba(100, 120, 150, 0.08)"
    ctx.lineWidth = 0.5
    for (let x = 0; x < MAP_WIDTH; x += 50) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, MAP_HEIGHT)
      ctx.stroke()
    }
    for (let y = 0; y < MAP_HEIGHT; y += 50) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(MAP_WIDTH, y)
      ctx.stroke()
    }

    for (const track of state.tracks) {
      const allNodes = [
        { id: "base", x: state.basePosition.x, y: state.basePosition.y },
        ...state.mineNodes,
      ]
      const from = allNodes.find(n => n.id === track.fromId)
      const to = allNodes.find(n => n.id === track.toId)
      if (!from || !to) continue

      const isConflict = state.conflicts.some(c => c.trackId === track.id)
      const isBroken = track.status === "broken"
      const isRepairing = track.status === "repairing"

      if (isBroken) {
        const pulse = Math.sin(Date.now() / 150) * 0.5 + 0.5
        ctx.strokeStyle = `rgba(255, 80, 80, ${0.4 + pulse * 0.4})`
        ctx.lineWidth = 5
        ctx.shadowColor = "#ff5050"
        ctx.shadowBlur = 14
        ctx.setLineDash([12, 8])
      } else if (isRepairing) {
        const pulse = Math.sin(Date.now() / 250) * 0.5 + 0.5
        ctx.strokeStyle = `rgba(255, 180, 50, ${0.5 + pulse * 0.3})`
        ctx.lineWidth = 4
        ctx.shadowColor = "#ffb432"
        ctx.shadowBlur = 10
        ctx.setLineDash([8, 4])
      } else if (isConflict) {
        const pulse = Math.sin(Date.now() / 200) * 0.5 + 0.5
        ctx.strokeStyle = `rgba(255, 60, 60, ${0.5 + pulse * 0.5})`
        ctx.lineWidth = 4
        ctx.shadowColor = "#ff3c3c"
        ctx.shadowBlur = 10
      } else {
        ctx.strokeStyle = "rgba(180, 200, 220, 0.6)"
        ctx.lineWidth = 3
        ctx.shadowColor = "rgba(180, 200, 220, 0.3)"
        ctx.shadowBlur = 6
      }

      ctx.beginPath()
      ctx.moveTo(from.x, from.y)
      ctx.lineTo(to.x, to.y)
      ctx.stroke()
      ctx.setLineDash([])
      ctx.shadowBlur = 0

      const midX = (from.x + to.x) / 2
      const midY = (from.y + to.y) / 2

      if (isBroken) {
        ctx.fillStyle = "#ff5050"
        ctx.font = "bold 10px 'Noto Sans SC', sans-serif"
        ctx.textAlign = "center"
        ctx.fillText("⚠ 断轨", midX, midY - 10)
      } else if (isRepairing && track.repairDuration && track.repairDuration > 0) {
        const repairPct = Math.min(1, (track.repairProgress || 0) / track.repairDuration)
        const barW = 40
        const barH = 4
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
        ctx.fillRect(midX - barW / 2, midY - 12, barW, barH)
        ctx.fillStyle = "#ffb432"
        ctx.fillRect(midX - barW / 2, midY - 12, barW * repairPct, barH)
        ctx.fillStyle = "#ffb432"
        ctx.font = "9px 'Noto Sans SC', sans-serif"
        ctx.textAlign = "center"
        ctx.fillText(`维修中 ${Math.round(repairPct * 100)}%`, midX, midY - 16)
      } else {
        ctx.fillStyle = "rgba(150, 170, 190, 0.7)"
        ctx.font = "10px Orbitron, monospace"
        ctx.textAlign = "center"
        ctx.fillText(`${track.length}m`, midX, midY - 8)
      }
    }

    if (state.trackBuildMode && state.trackStartId) {
      const allNodes = [
        { id: "base", x: state.basePosition.x, y: state.basePosition.y },
        ...state.mineNodes,
      ]
      const startNode = allNodes.find(n => n.id === state.trackStartId)
      if (startNode && state.selectedNodeId && state.selectedNodeId !== state.trackStartId) {
        const endNode = allNodes.find(n => n.id === state.selectedNodeId)
        if (endNode) {
          ctx.strokeStyle = "rgba(0, 212, 255, 0.4)"
          ctx.lineWidth = 2
          ctx.setLineDash([8, 4])
          ctx.beginPath()
          ctx.moveTo(startNode.x, startNode.y)
          ctx.lineTo(endNode.x, endNode.y)
          ctx.stroke()
          ctx.setLineDash([])
        }
      }
    }

    for (const mine of state.mineNodes) {
      const color = MINERAL_COLORS[mine.mineralType]
      const isSelected = state.selectedNodeId === mine.id
      const isTrackStart = state.trackStartId === mine.id
      const isDragHover = dragHoverMineId === mine.id
      const isDragInvalid = dragInvalidMineId === mine.id

      if (isDragInvalid) {
        const pulse = Math.sin(Date.now() / 120) * 0.5 + 0.5
        ctx.beginPath()
        ctx.arc(mine.x, mine.y, NODE_RADIUS + 12, 0, Math.PI * 2)
        ctx.strokeStyle = "#ff4444"
        ctx.lineWidth = 3
        ctx.shadowColor = "#ff4444"
        ctx.shadowBlur = 16 + pulse * 10
        ctx.stroke()
        ctx.shadowBlur = 0

        const label = "未连通轨道"
        ctx.font = "bold 10px 'Noto Sans SC', sans-serif"
        const labelW = ctx.measureText(label).width + 12
        const labelX = mine.x - labelW / 2
        const labelY = mine.y + NODE_RADIUS + 28
        ctx.fillStyle = "#ff444433"
        ctx.strokeStyle = "#ff444488"
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.roundRect(labelX, labelY, labelW, 18, 4)
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = "#ff6666"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(label, mine.x, labelY + 9)
        ctx.textBaseline = "alphabetic"
      } else if (isDragHover) {
        const pulse = Math.sin(Date.now() / 120) * 0.5 + 0.5
        ctx.beginPath()
        ctx.arc(mine.x, mine.y, NODE_RADIUS + 12, 0, Math.PI * 2)
        ctx.strokeStyle = "#00ff88"
        ctx.lineWidth = 3
        ctx.shadowColor = "#00ff88"
        ctx.shadowBlur = 16 + pulse * 10
        ctx.stroke()
        ctx.shadowBlur = 0

        const label = "可调度"
        ctx.font = "bold 10px 'Noto Sans SC', sans-serif"
        const labelW = ctx.measureText(label).width + 12
        const labelX = mine.x - labelW / 2
        const labelY = mine.y + NODE_RADIUS + 28
        ctx.fillStyle = "#00ff8822"
        ctx.strokeStyle = "#00ff8866"
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.roundRect(labelX, labelY, labelW, 18, 4)
        ctx.fill()
        ctx.stroke()
        ctx.fillStyle = "#00ff88"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(label, mine.x, labelY + 9)
        ctx.textBaseline = "alphabetic"
      } else if (isSelected || isTrackStart) {
        ctx.beginPath()
        ctx.arc(mine.x, mine.y, NODE_RADIUS + 8, 0, Math.PI * 2)
        ctx.strokeStyle = isTrackStart ? "#00d4ff" : "rgba(255, 255, 255, 0.5)"
        ctx.lineWidth = 2
        ctx.shadowColor = isTrackStart ? "#00d4ff" : "#ffffff"
        ctx.shadowBlur = 12
        ctx.stroke()
        ctx.shadowBlur = 0
      }

      const grad = ctx.createRadialGradient(mine.x - 4, mine.y - 4, 2, mine.x, mine.y, NODE_RADIUS)
      grad.addColorStop(0, color)
      grad.addColorStop(1, `${color}88`)
      ctx.fillStyle = grad
      ctx.shadowColor = color
      ctx.shadowBlur = 8
      ctx.beginPath()
      ctx.arc(mine.x, mine.y, NODE_RADIUS, 0, Math.PI * 2)
      ctx.fill()
      ctx.shadowBlur = 0

      ctx.strokeStyle = `${color}aa`
      ctx.lineWidth = 1.5
      ctx.beginPath()
      ctx.arc(mine.x, mine.y, NODE_RADIUS, 0, Math.PI * 2)
      ctx.stroke()

      const reserveRatio = mine.remaining / mine.maxReserve
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
      ctx.fillRect(mine.x - NODE_RADIUS, mine.y + NODE_RADIUS + 4, NODE_RADIUS * 2, 4)
      ctx.fillStyle = reserveRatio > 0.3 ? color : "#ff4444"
      ctx.fillRect(mine.x - NODE_RADIUS, mine.y + NODE_RADIUS + 4, NODE_RADIUS * 2 * reserveRatio, 4)

      ctx.fillStyle = "#d4cfc4"
      ctx.font = "bold 11px 'Noto Sans SC', sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(mine.name, mine.x, mine.y - NODE_RADIUS - 10)
      ctx.font = "9px Orbitron, monospace"
      ctx.fillStyle = color
      ctx.fillText(`${Math.round(mine.remaining)}`, mine.x, mine.y + NODE_RADIUS + 18)
    }

    const bx = state.basePosition.x
    const by = state.basePosition.y
    const baseGrad = ctx.createRadialGradient(bx - 4, by - 4, 4, bx, by, BASE_RADIUS)
    baseGrad.addColorStop(0, "#e8e0d0")
    baseGrad.addColorStop(1, "#8a8478")
    ctx.fillStyle = baseGrad
    ctx.shadowColor = "rgba(232, 224, 208, 0.5)"
    ctx.shadowBlur = 15
    ctx.beginPath()
    ctx.arc(bx, by, BASE_RADIUS, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    ctx.strokeStyle = "#d4cfc4"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(bx, by, BASE_RADIUS, 0, Math.PI * 2)
    ctx.stroke()

    ctx.fillStyle = "#0a0e1a"
    ctx.font = "bold 14px Orbitron, monospace"
    ctx.textAlign = "center"
    ctx.textBaseline = "middle"
    ctx.fillText("BASE", bx, by)
    ctx.textBaseline = "alphabetic"

    const isSelectedBase = state.selectedNodeId === "base" || state.trackStartId === "base"
    if (isSelectedBase) {
      ctx.beginPath()
      ctx.arc(bx, by, BASE_RADIUS + 8, 0, Math.PI * 2)
      ctx.strokeStyle = state.trackStartId === "base" ? "#00d4ff" : "rgba(255, 255, 255, 0.5)"
      ctx.lineWidth = 2
      ctx.shadowColor = state.trackStartId === "base" ? "#00d4ff" : "#ffffff"
      ctx.shadowBlur = 12
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    for (const cart of state.carts) {
      if (cart.status === "idle" || cart.status === "charging") {
        const offsetX = (state.carts.indexOf(cart) % 3) * 18 - 18
        const offsetY = Math.floor(state.carts.indexOf(cart) / 3) * 18 + BASE_RADIUS + 10
        cart.x = bx + offsetX
        cart.y = by + offsetY
      }

      const isBeingDragged = draggingCartId === cart.id
      const color = cart.currentMineral ? MINERAL_COLORS[cart.currentMineral] : "#d4cfc4"
      const halfSize = CART_SIZE / 2

      ctx.globalAlpha = isBeingDragged ? 0.3 : 1
      ctx.fillStyle = color
      ctx.shadowColor = color
      ctx.shadowBlur = 6
      ctx.fillRect(cart.x - halfSize, cart.y - halfSize, CART_SIZE, CART_SIZE)
      ctx.shadowBlur = 0

      ctx.strokeStyle = "rgba(255, 255, 255, 0.6)"
      ctx.lineWidth = 1
      ctx.strokeRect(cart.x - halfSize, cart.y - halfSize, CART_SIZE, CART_SIZE)

      if (cart.currentLoad > 0) {
        const loadRatio = cart.currentLoad / cart.maxLoad
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)"
        ctx.fillRect(cart.x - halfSize, cart.y + halfSize + 2, CART_SIZE, 3)
        ctx.fillStyle = color
        ctx.fillRect(cart.x - halfSize, cart.y + halfSize + 2, CART_SIZE * loadRatio, 3)
      }

      const batteryRatio = cart.currentBattery / cart.maxBattery
      ctx.fillStyle = "rgba(0, 0, 0, 0.6)"
      ctx.fillRect(cart.x - halfSize, cart.y - halfSize - 5, CART_SIZE, 3)
      ctx.fillStyle = batteryRatio > 0.3 ? "#00ff88" : "#ff4444"
      ctx.fillRect(cart.x - halfSize, cart.y - halfSize - 5, CART_SIZE * batteryRatio, 3)
      ctx.globalAlpha = 1

      if (state.selectedCartId === cart.id) {
        ctx.strokeStyle = "#00d4ff"
        ctx.lineWidth = 1.5
        ctx.setLineDash([3, 3])
        ctx.strokeRect(cart.x - halfSize - 4, cart.y - halfSize - 8, CART_SIZE + 8, CART_SIZE + 14)
        ctx.setLineDash([])
      }
    }

    for (const rv of state.repairVehicles) {
      if (rv.status === "idle") {
        const rvIdx = state.repairVehicles.indexOf(rv)
        const offsetX = (rvIdx % 2) * 24 - 12
        const offsetY = BASE_RADIUS + 56 + Math.floor(rvIdx / 2) * 20
        rv.x = bx + offsetX
        rv.y = by + offsetY
      }

      const color = "#ffb432"
      const rvHalfSize = 8

      ctx.fillStyle = color
      ctx.shadowColor = color
      ctx.shadowBlur = 8
      ctx.beginPath()
      ctx.roundRect(rv.x - rvHalfSize, rv.y - rvHalfSize, rvHalfSize * 2, rvHalfSize * 2, 2)
      ctx.fill()
      ctx.shadowBlur = 0

      ctx.strokeStyle = "#ffd98a"
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(rv.x - rvHalfSize, rv.y - rvHalfSize, rvHalfSize * 2, rvHalfSize * 2, 2)
      ctx.stroke()

      ctx.fillStyle = "#0a0e1a"
      ctx.font = "bold 9px Orbitron, monospace"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillText("R", rv.x, rv.y)
      ctx.textBaseline = "alphabetic"

      if (rv.status === "repairing" && rv.repairDuration > 0) {
        const pct = Math.min(1, rv.repairProgress / rv.repairDuration)
        const barW = 24
        const barH = 3
        ctx.fillStyle = "rgba(0, 0, 0, 0.6)"
        ctx.fillRect(rv.x - barW / 2, rv.y - rvHalfSize - 7, barW, barH)
        ctx.fillStyle = "#ffb432"
        ctx.fillRect(rv.x - barW / 2, rv.y - rvHalfSize - 7, barW * pct, barH)
      }

      if (state.selectedRepairVehicleId === rv.id) {
        ctx.strokeStyle = "#00d4ff"
        ctx.lineWidth = 1.5
        ctx.setLineDash([3, 3])
        ctx.strokeRect(rv.x - rvHalfSize - 4, rv.y - rvHalfSize - 4, rvHalfSize * 2 + 8, rvHalfSize * 2 + 8)
        ctx.setLineDash([])
      }
    }

    // 拖拽中绘制虚拟矿车和连线
    if (draggingCartId && mousePos) {
      const dragCart = state.carts.find(c => c.id === draggingCartId)
      if (dragCart) {
        // 从原位置到鼠标位置的虚线
        ctx.setLineDash([6, 6])
        ctx.strokeStyle = "rgba(0, 212, 255, 0.5)"
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(dragCart.x, dragCart.y)
        ctx.lineTo(mousePos.x, mousePos.y)
        ctx.stroke()
        ctx.setLineDash([])

        // 跟随鼠标的虚拟矿车
        const vHalf = CART_SIZE / 2
        const vColor = dragCart.currentMineral ? MINERAL_COLORS[dragCart.currentMineral] : "#d4cfc4"
        ctx.fillStyle = vColor
        ctx.shadowColor = vColor
        ctx.shadowBlur = 12
        ctx.fillRect(mousePos.x - vHalf, mousePos.y - vHalf, CART_SIZE, CART_SIZE)
        ctx.shadowBlur = 0
        ctx.strokeStyle = "#00d4ff"
        ctx.lineWidth = 2
        ctx.strokeRect(mousePos.x - vHalf, mousePos.y - vHalf, CART_SIZE, CART_SIZE)
      }
    }

    for (const conflict of state.conflicts) {
      const cart1 = state.carts.find(c => c.id === conflict.cartId1)
      const cart2 = state.carts.find(c => c.id === conflict.cartId2)
      if (cart1 && cart2) {
        const pulse = Math.sin(Date.now() / 150) * 0.5 + 0.5
        ctx.strokeStyle = `rgba(255, 60, 60, ${0.3 + pulse * 0.4})`
        ctx.lineWidth = 1.5
        ctx.setLineDash([4, 4])
        ctx.beginPath()
        ctx.moveTo(cart1.x, cart1.y)
        ctx.lineTo(cart2.x, cart2.y)
        ctx.stroke()
        ctx.setLineDash([])
      }
    }

    if (state.trackBuildMode) {
      ctx.fillStyle = "rgba(0, 212, 255, 0.15)"
      ctx.fillRect(0, 0, MAP_WIDTH, 30)
      ctx.fillStyle = "#00d4ff"
      ctx.font = "bold 12px 'Noto Sans SC', sans-serif"
      ctx.textAlign = "center"
      ctx.fillText(
        state.trackStartId ? "请点击目标节点完成轨道铺设" : "请点击起始节点开始铺设轨道",
        MAP_WIDTH / 2,
        20
      )
    }
  }, [dragHoverMineId, dragInvalidMineId, isDragging, draggingCartId, mousePos])

  const handleDragOver = useCallback((e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = MAP_WIDTH / rect.width
    const scaleY = MAP_HEIGHT / rect.height
    const mx = (e.clientX - rect.left) * scaleX
    const my = (e.clientY - rect.top) * scaleY

    const state = useGameStore.getState()
    let hoverId: string | null = null
    let invalidId: string | null = null
    for (const mine of state.mineNodes) {
      const dist = Math.sqrt((mx - mine.x) ** 2 + (my - mine.y) ** 2)
      if (dist <= NODE_RADIUS + 10) {
        const reachable = state.isMineReachable(mine.id)
        if (reachable) {
          hoverId = mine.id
        } else {
          invalidId = mine.id
        }
        break
      }
    }
    setDragHoverMineId(hoverId)
    setDragInvalidMineId(invalidId)
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragHoverMineId(null)
    setDragInvalidMineId(null)
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    const cartId = e.dataTransfer.getData("text/plain")
    setDragHoverMineId(null)
    setDragInvalidMineId(null)
    setIsDragging(false)
    if (!cartId) return

    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = MAP_WIDTH / rect.width
    const scaleY = MAP_HEIGHT / rect.height
    const mx = (e.clientX - rect.left) * scaleX
    const my = (e.clientY - rect.top) * scaleY

    const state = useGameStore.getState()
    let dropped = false
    for (const mine of state.mineNodes) {
      const dist = Math.sqrt((mx - mine.x) ** 2 + (my - mine.y) ** 2)
      if (dist <= NODE_RADIUS + 10) {
        state.assignCartToMine(cartId, mine.id)
        dropped = true
        break
      }
    }
    if (!dropped) {
      state.showNotification("请将矿车拖到矿点上", "info")
    }
  }, [])

  useEffect(() => {
    const loop = (time: number) => {
      if (lastTimeRef.current > 0) {
        const dt = Math.min((time - lastTimeRef.current) / 1000, 0.1)
        const state = useGameStore.getState()
        if (!state.isPaused) {
          state.tick(dt)
        }
      }
      lastTimeRef.current = time
      render()
      animRef.current = requestAnimationFrame(loop)
    }
    animRef.current = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(animRef.current)
  }, [render])

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (trackBuildMode) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = MAP_WIDTH / rect.width
    const scaleY = MAP_HEIGHT / rect.height
    const mx = (e.clientX - rect.left) * scaleX
    const my = (e.clientY - rect.top) * scaleY

    const state = useGameStore.getState()
    dragStartPos.current = { x: mx, y: my }
    isCanvasDrag.current = false

    // 检查是否点中了待命的矿车
    for (const cart of state.carts) {
      if (cart.status !== "idle" && cart.status !== "charging") continue
      const dist = Math.sqrt((mx - cart.x) ** 2 + (my - cart.y) ** 2)
      if (dist <= CART_SIZE + 5) {
        setDraggingCartId(cart.id)
        setMousePos({ x: mx, y: my })
        setIsDragging(true)
        state.selectCart(cart.id)
        return
      }
    }
    setDraggingCartId(null)
  }, [trackBuildMode])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = MAP_WIDTH / rect.width
    const scaleY = MAP_HEIGHT / rect.height
    const mx = (e.clientX - rect.left) * scaleX
    const my = (e.clientY - rect.top) * scaleY

    // 检查是否超过拖拽阈值
    if (dragStartPos.current && !isCanvasDrag.current) {
      const dist = Math.sqrt((mx - dragStartPos.current.x) ** 2 + (my - dragStartPos.current.y) ** 2)
      if (dist > 5) isCanvasDrag.current = true
    }

    if (draggingCartId) {
      setMousePos({ x: mx, y: my })
      const state = useGameStore.getState()
      let hoverId: string | null = null
      let invalidId: string | null = null
      for (const mine of state.mineNodes) {
        const dist = Math.sqrt((mx - mine.x) ** 2 + (my - mine.y) ** 2)
        if (dist <= NODE_RADIUS + 10) {
          const reachable = state.isMineReachable(mine.id)
          if (reachable) hoverId = mine.id
          else invalidId = mine.id
          break
        }
      }
      setDragHoverMineId(hoverId)
      setDragInvalidMineId(invalidId)
    }
  }, [draggingCartId])

  const handleMouseUp = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!draggingCartId) {
      dragStartPos.current = null
      return
    }
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = MAP_WIDTH / rect.width
    const scaleY = MAP_HEIGHT / rect.height
    const mx = (e.clientX - rect.left) * scaleX
    const my = (e.clientY - rect.top) * scaleY

    const state = useGameStore.getState()
    let dropped = false
    for (const mine of state.mineNodes) {
      const dist = Math.sqrt((mx - mine.x) ** 2 + (my - mine.y) ** 2)
      if (dist <= NODE_RADIUS + 10) {
        state.assignCartToMine(draggingCartId, mine.id)
        dropped = true
        break
      }
    }
    if (!dropped && isCanvasDrag.current) {
      state.showNotification("请将矿车拖到矿点上", "info")
    }

    setDraggingCartId(null)
    setMousePos(null)
    setIsDragging(false)
    setDragHoverMineId(null)
    setDragInvalidMineId(null)
    dragStartPos.current = null
  }, [draggingCartId])

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    // 如果是拖拽操作，跳过click
    if (isCanvasDrag.current || draggingCartId) {
      isCanvasDrag.current = false
      return
    }
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = MAP_WIDTH / rect.width
    const scaleY = MAP_HEIGHT / rect.height
    const mx = (e.clientX - rect.left) * scaleX
    const my = (e.clientY - rect.top) * scaleY

    const state = useGameStore.getState()
    const allNodes = [
      { id: "base", x: state.basePosition.x, y: state.basePosition.y, radius: BASE_RADIUS },
      ...state.mineNodes.map(m => ({ id: m.id, x: m.x, y: m.y, radius: NODE_RADIUS })),
    ]

    let clickedNode: { id: string; x: number; y: number } | null = null
    for (const node of allNodes) {
      const dist = Math.sqrt((mx - node.x) ** 2 + (my - node.y) ** 2)
      if (dist <= node.radius + 5) {
        clickedNode = node
        break
      }
    }

    if (clickedNode) {
      if (state.trackBuildMode) {
        if (!state.trackStartId) {
          state.setTrackStart(clickedNode.id)
          state.selectNode(clickedNode.id)
        } else if (state.trackStartId !== clickedNode.id) {
          state.buildTrack(state.trackStartId, clickedNode.id)
          state.setTrackStart(null)
          state.selectNode(null)
        }
      } else {
        state.selectNode(clickedNode.id)
      }
    } else {
      for (const cart of state.carts) {
        const dist = Math.sqrt((mx - cart.x) ** 2 + (my - cart.y) ** 2)
        if (dist <= CART_SIZE + 5) {
          state.selectCart(cart.id)
          state.selectRepairVehicle(null)
          return
        }
      }

      for (const rv of state.repairVehicles) {
        const dist = Math.sqrt((mx - rv.x) ** 2 + (my - rv.y) ** 2)
        if (dist <= 14) {
          state.selectRepairVehicle(rv.id)
          state.selectCart(null)
          state.selectNode(null)
          return
        }
      }

      const allTrackNodes = [
        { id: "base", x: state.basePosition.x, y: state.basePosition.y },
        ...state.mineNodes,
      ]
      for (const track of state.tracks) {
        if (track.status !== "broken") continue
        const from = allTrackNodes.find(n => n.id === track.fromId)
        const to = allTrackNodes.find(n => n.id === track.toId)
        if (!from || !to) continue
        const A = mx - from.x
        const B = my - from.y
        const C = to.x - from.x
        const D = to.y - from.y
        const dot = A * C + B * D
        const lenSq = C * C + D * D
        let param = lenSq !== 0 ? dot / lenSq : -1
        param = Math.max(0, Math.min(1, param))
        const xx = from.x + param * C
        const yy = from.y + param * D
        const distToTrack = Math.sqrt((mx - xx) ** 2 + (my - yy) ** 2)
        if (distToTrack <= 15) {
          const selectedRV = state.repairVehicles.find(r => r.id === state.selectedRepairVehicleId)
          if (selectedRV && selectedRV.status === "idle") {
            state.dispatchRepairVehicle(selectedRV.id, track.id)
          } else {
            const idleRV = state.repairVehicles.find(r => r.status === "idle")
            if (idleRV) {
              state.dispatchRepairVehicle(idleRV.id, track.id)
            } else {
              state.showNotification("没有可用的维修车，请购买或等待", "error")
            }
          }
          return
        }
      }

      state.selectNode(null)
      state.selectCart(null)
      state.selectRepairVehicle(null)
    }
  }, [draggingCartId])

  return (
    <div className="relative w-full h-full">
      <canvas
        ref={canvasRef}
        width={MAP_WIDTH}
        height={MAP_HEIGHT}
        onClick={handleCanvasClick}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`w-full h-full ${trackBuildMode ? "cursor-crosshair" : draggingCartId ? "cursor-grabbing" : isDragging ? "cursor-copy" : "cursor-crosshair"} select-none`}
        style={{ imageRendering: "auto" }}
      />

      {notification.visible && (
        <div
          className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-lg shadow-lg border text-sm font-medium z-20 transition-all duration-300 ${
            notification.type === "success"
              ? "bg-[#00ff8822] border-[#00ff8844] text-[#00ff88]"
              : notification.type === "error"
              ? "bg-[#ff444422] border-[#ff444444] text-[#ff6666]"
              : "bg-[#00d4ff22] border-[#00d4ff44] text-[#00d4ff]"
          }`}
          style={{ fontFamily: "'Noto Sans SC', sans-serif" }}
          onClick={hideNotification}
        >
          {notification.message}
        </div>
      )}
    </div>
  )
}
