import { Cargo } from "@/types";
import { EyeOff, View } from "lucide-react-native";
import { Card, DataRow, ThemedText } from "../common";
import { TouchableOpacity } from "react-native";

type CargoCardProps = {
  index: number,
  cargo: Cargo,
  formatDate: (date: Date)=>string
};

export default function CargoCard({
  index,
  cargo,
  formatDate
}: CargoCardProps){

    return (
        <Card
          key={index}
          className="mb-3"
        >
          <ThemedText className="text-lg font-bold mb-3">
            {cargo.cargoType}
          </ThemedText>
          <DataRow
            label="Type"
            value={`${cargo.cargoType}`}
          />
          <DataRow
            label="required Temperature"
            value={`${cargo.requiredTempC} °C`}
          />
          <DataRow
            label="Charterer"
            value={`${cargo.chartererName}`}
          />
          <DataRow
            label="Receiver"
            value={`${cargo.receiverName}`}
          />
        </Card>
    )
}
