import { VesselStatus } from "@/types";
import { EyeOff, View } from "lucide-react-native";
import { Card, DataRow, ThemedText } from "../common";
import { TouchableOpacity } from "react-native";

type NoonReportCardProps = {
  index: number,
  report: VesselStatus,
  formatDate: (date: Date)=>string
};

export default function NoonReportCard({
  index,
  report,
  formatDate
}: NoonReportCardProps){

    return (
        <Card
          key={index}
          className="mb-3"
        >
          <ThemedText className="text-lg font-bold mb-3">
            {formatDate(new Date(report.reportDateTime))}
          </ThemedText>
          <DataRow
            label="Position"
            value={`${report.latitude}°N, ${report.longitude}°E`}
          />
          <DataRow
            label="Speed"
            value={`${report.averageSpeedKnots} kts`}
          />
          <DataRow
            label="Fuel"
            value={`${report.fuelRob} MT/day`}
          />
          <TouchableOpacity className="flex-row items-center gap-2">
            <EyeOff size={20} color="#6b7280" />
            <ThemedText className="text-gray-600 dark:text-gray-400">
              View Report
            </ThemedText>
          </TouchableOpacity>
        </Card>
    )
}
