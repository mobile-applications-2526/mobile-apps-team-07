import React from 'react';
import { RefreshControl } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataSection, DataRow } from '@/components/common';
import { KPIGraph } from '@/components/vessel/KPIGraph';
import { Vessel, VesselKPIs } from '@/types';
import { formatValue } from '@/lib/utils';

interface VesselOverviewSheetProps {
    vessel: Vessel;
    kpis: VesselKPIs | null;
    refreshing: boolean;
    onRefresh: () => void;
    isDark: boolean;
}

export function VesselOverviewSheet({
    vessel,
    kpis,
    refreshing,
    onRefresh,
    isDark
}: VesselOverviewSheetProps) {
    const insets = useSafeAreaInsets();
    const bottomSheetRef = React.useRef<BottomSheet>(null);

    // Calculate max height to stop slightly below the top app bar
    const topBarHeight = insets.top + 76;
    const maxSheetHeight = `${100 - ((topBarHeight + 64) / 812) * 100}%`;

    const snapPoints = React.useMemo(() => ['25%', '50%', maxSheetHeight], [maxSheetHeight]);

    return (
        <BottomSheet
            ref={bottomSheetRef}
            index={1}
            snapPoints={snapPoints}
            enablePanDownToClose={false}
            backgroundStyle={{ backgroundColor: isDark ? '#151718' : '#F2F2F7' }}
            handleIndicatorStyle={{ backgroundColor: isDark ? '#404040' : '#e5e7eb' }}
            enableDynamicSizing={false}
        >
            <BottomSheetScrollView
                contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
                showsVerticalScrollIndicator={false}
            >
                <DataSection title="Identification">
                    <DataRow label="IMO" value={formatValue(vessel.imoNumber)} />
                    <DataRow label="Flag" value={formatValue(vessel.flag)} />
                    <DataRow label="Classification" value={formatValue(vessel.classificationSociety)} />
                    <DataRow label="Build Year" value={formatValue(vessel.buildYear)} />
                </DataSection>

                <DataSection title="Capacity">
                    <DataRow label="DWT" value={formatValue(vessel.dwtMt, ' MT')} />
                    <DataRow label="Cubic Capacity" value={formatValue(vessel.cubicCapacityM3, ' M³')} />
                    <DataRow label="Cargo Tanks" value={formatValue(vessel.cargoTanksCount)} />
                    <DataRow label="Tank Coating" value={formatValue(vessel.tankCoating)} />
                </DataSection>

                <DataSection title="Performance vs Charter Party">
                    <KPIGraph
                        title="Speed"
                        actual={kpis?.speed.actual ?? null}
                        target={kpis?.speed.target ?? null}
                        actualLabel="Actual"
                        targetLabel="CP"
                        unit="kts"
                        status={kpis?.speed.status ?? 'no_data'}
                    />
                    <KPIGraph
                        title="Fuel Consumption"
                        actual={kpis?.fuelConsumption.actual ?? null}
                        target={kpis?.fuelConsumption.target ?? null}
                        actualLabel="Actual"
                        targetLabel="CP"
                        unit="MT/day"
                        status={kpis?.fuelConsumption.status ?? 'no_data'}
                        isLowerBetter
                    />
                    <KPIGraph
                        title="Cargo Temp"
                        actual={kpis?.cargoTemp.actual ?? null}
                        target={kpis?.cargoTemp.required ?? null}
                        actualLabel="Actual"
                        targetLabel="CP"
                        unit="°C"
                        status={kpis?.cargoTemp.status ?? 'no_voyage'}
                    />
                </DataSection>

                <DataSection title="Dimensions">
                    <DataRow label="DWT" value={formatValue(vessel.dwtMt, ' MT')} />
                    <DataRow label="Summer Draft" value={formatValue(vessel.summerDraftM, ' M')} />
                </DataSection>

                <DataSection title="Cargo Limits">
                    <DataRow label="Max Cargo Temp" value={formatValue(vessel.maxCargoTempC, '°C')} />
                    <DataRow label="Min Cargo Temp" value={formatValue(vessel.minCargoTempC, '°C')} />
                    <DataRow label="Max Pressure" value={formatValue(vessel.maxPressureBar, ' Bar')} />
                </DataSection>

                <DataSection title="Performance">
                    <DataRow label="Average Speed" value={formatValue(vessel.averageSpeedKnots, ' Knots')} />
                    <DataRow label="Fuel Consumption" value={formatValue(vessel.fuelConsumptionMtDay, ' MT/Day')} />
                </DataSection>

                <DataSection title="Build">
                    <DataRow label="Build Year" value={formatValue(vessel.buildYear)} />
                    <DataRow label="Drydock Due" value={formatValue(vessel.drydockDueDate?.toString())} />
                </DataSection>

                <DataSection title="Type">
                    <DataRow label="Vessel Type" value={formatValue(vessel.vesselType)} />
                    <DataRow label="Vessel Subtype" value={formatValue(vessel.vesselSubtype)} />
                </DataSection>
            </BottomSheetScrollView>
        </BottomSheet>
    );
}
