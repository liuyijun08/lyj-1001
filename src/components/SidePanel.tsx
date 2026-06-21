import TrackBuildPanel from "@/components/panels/TrackBuildPanel"
import PowerGridPanel from "@/components/panels/PowerGridPanel"
import WarehousePanel from "@/components/panels/WarehousePanel"
import MineInfoPanel from "@/components/panels/MineInfoPanel"
import CartDispatchPanel from "@/components/panels/CartDispatchPanel"
import RepairVehiclePanel from "@/components/panels/RepairVehiclePanel"
import ConflictPanel from "@/components/ConflictPanel"

export default function SidePanel() {
  return (
    <div className="w-[320px] min-w-[320px] h-full bg-[#0d1220] border-l border-[#1a2540] overflow-y-auto flex flex-col">
      <TrackBuildPanel />
      <PowerGridPanel />
      <WarehousePanel />
      <MineInfoPanel />
      <CartDispatchPanel />
      <RepairVehiclePanel />
      <ConflictPanel />
    </div>
  )
}
