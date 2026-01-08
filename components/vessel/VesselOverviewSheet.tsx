import React from 'react';
import { RefreshControl, View, Text } from 'react-native';
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DataSection, DataRow } from '@/components/common';
import { KPIGraph } from '@/components/vessel/KPIGraph';
import { Vessel, VesselKPIs, VesselStatus, Voyage, CharterParty, BunkerInventory, WaterInventory } from '@/types';
import { formatValue, formatDate } from '@/lib/utils';

// Helper to format fuel type names
const formatFuelType = (type: string) => {
    const names: Record<string, string> = {
        HFO: 'Heavy Fuel Oil',
        LSFO: 'Low Sulphur FO',
        MGO: 'Marine Gas Oil',
        MDO: 'Marine Diesel',
        ULSFO: 'Ultra Low Sulphur',
    };
    return names[type] || type;
};

// Helper to format water type names
const formatWaterType = (type: string) => {
    const names: Record<string, string> = {
        FRESH: 'Fresh Water',
        BALLAST: 'Ballast Water',
        GRAY: 'Gray Water',
        PRODUCED: 'Produced Water',
    };
    return names[type] || type;
};

interface VesselOverviewSheetProps {
    vessel: Vessel;
    kpis: VesselKPIs | null;
    refreshing: boolean;
    onRefresh: () => void;
    isDark: boolean;
    vesselStatus?: VesselStatus | null;
    activeVoyage?: Voyage | null;
    activeCharter?: CharterParty | null;
}

export function VesselOverviewSheet({
    vessel,
    kpis,
    refreshing,
    onRefresh,
    isDark,
    vesselStatus,
    activeVoyage,
    activeCharter
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

                {/* Performance vs Charter Party - moved to top for visibility */}
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
                        title="Fuel Cons."
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

                {/* Latest Status from Noon Report */}
                {vesselStatus && (
                    <DataSection title="Latest Status (Noon Report)">
                        <DataRow label="Report Type" value={formatValue(vesselStatus.reportType)} />
                        <DataRow label="Activity" value={formatValue(vesselStatus.activity)} />
                        <DataRow label="Position" value={
                            vesselStatus.latitude && vesselStatus.longitude
                                ? `${vesselStatus.latitude.toFixed(4)}°, ${vesselStatus.longitude.toFixed(4)}°`
                                : '-'
                        } />
                        <DataRow label="Avg Speed" value={formatValue(vesselStatus.averageSpeedKnots, ' kts')} />
                        <DataRow label="Distance Travelled" value={formatValue(vesselStatus.distanceTravelledNm, ' NM')} />
                        <DataRow label="Distance To Go" value={formatValue(vesselStatus.distanceToGoNm, ' NM')} />
                        <DataRow label="Cargo Temp" value={formatValue(vesselStatus.cargoTempAvgC, '°C')} />
                        <DataRow label="Cargo Pressure" value={formatValue(vesselStatus.cargoPressureAvgBar, ' Bar')} />
                        <DataRow label="Fuel ROB" value={formatValue(vesselStatus.fuelRob, ' MT')} />
                        <DataRow label="Sea Condition" value={formatValue(vesselStatus.seaCondition)} />
                        <DataRow label="Wind Force" value={formatValue(vesselStatus.windForceBeaufort, ' Beaufort')} />
                    </DataSection>
                )}

                {/* Bunker Inventory (ROB) */}
                {vesselStatus?.bunkerInventory && vesselStatus.bunkerInventory.length > 0 && (
                    <DataSection title="Bunker ROB (Fuel on Board)">
                        {vesselStatus.bunkerInventory.map((bunker, index) => (
                            <View key={`bunker-${index}`}>
                                <DataRow
                                    label={formatFuelType(bunker.fuelType)}
                                    value={formatValue(bunker.robMt, ' MT')}
                                />
                                {bunker.consumedMt !== undefined && bunker.consumedMt > 0 && (
                                    <DataRow
                                        label={`  └ Consumed`}
                                        value={formatValue(bunker.consumedMt, ' MT/day')}
                                    />
                                )}
                                {bunker.sulphurPercent !== undefined && (
                                    <DataRow
                                        label={`  └ Sulphur`}
                                        value={formatValue(bunker.sulphurPercent, '%')}
                                    />
                                )}
                            </View>
                        ))}
                    </DataSection>
                )}

                {/* Water Inventory (WOB) */}
                {vesselStatus?.waterInventory && vesselStatus.waterInventory.length > 0 && (
                    <DataSection title="Water on Board">
                        {vesselStatus.waterInventory.map((water, index) => (
                            <View key={`water-${index}`}>
                                <DataRow
                                    label={formatWaterType(water.waterType)}
                                    value={formatValue(water.quantityMt, ' MT')}
                                />
                                {water.capacityMt !== undefined && water.capacityMt > 0 && (
                                    <DataRow
                                        label={`  └ Capacity`}
                                        value={`${((water.quantityMt / water.capacityMt) * 100).toFixed(0)}% of ${water.capacityMt} MT`}
                                    />
                                )}
                            </View>
                        ))}
                    </DataSection>
                )}

                {/* Crew on Board */}
                {vesselStatus?.crewOnBoard !== undefined && vesselStatus.crewOnBoard > 0 && (
                    <DataSection title="Crew">
                        <DataRow label="Crew on Board" value={formatValue(vesselStatus.crewOnBoard)} />
                    </DataSection>
                )}

                {/* Active Voyage Information */}
                {activeVoyage && (
                    <DataSection title="Active Voyage">
                        <DataRow label="Voyage Number" value={formatValue(activeVoyage.voyageNumber)} />
                        <DataRow label="Status" value={formatValue(activeVoyage.voyageStatus)} />
                        <DataRow label="Load Region" value={formatValue(activeVoyage.loadRegion)} />
                        <DataRow label="Discharge Region" value={formatValue(activeVoyage.dischargeRegion)} />
                        <DataRow label="Start Date" value={formatDate(activeVoyage.voyageStartDate)} />
                        <DataRow label="End Date" value={formatDate(activeVoyage.voyageEndDate)} />
                        {activeVoyage.remarks && (
                            <DataRow label="Remarks" value={activeVoyage.remarks} />
                        )}
                    </DataSection>
                )}

                {/* Active Charter Information */}
                {activeCharter && (
                    <DataSection title="Active Charter Party">
                        <DataRow label="Charter Ref" value={formatValue(activeCharter.charterReference)} />
                        <DataRow label="Charterer" value={formatValue(activeCharter.chartererName)} />
                        <DataRow label="Charter Type" value={activeCharter.isVC ? 'Voyage Charter' : 'Time Charter'} />
                        <DataRow label="Start Date" value={formatDate(activeCharter.charterDateStart)} />
                        <DataRow label="End Date" value={formatDate(activeCharter.charterDateEnd)} />
                        {!activeCharter.isVC && 'dailyHireRate' in activeCharter && (
                            <DataRow label="Daily Hire Rate" value={formatValue(activeCharter.dailyHireRate, ' USD/day')} />
                        )}
                        {activeCharter.isVC && 'freightRateMt' in activeCharter && (
                            <>
                                <DataRow label="Freight Rate" value={formatValue(activeCharter.freightRateMt, ' USD/MT')} />
                                <DataRow label="Demurrage Rate" value={formatValue(activeCharter.demurrageRateHourly, ' USD/hr')} />
                                <DataRow label="Laytime Load" value={formatValue(activeCharter.laytimeHoursLoad, ' hrs')} />
                                <DataRow label="Laytime Discharge" value={formatValue(activeCharter.laytimeHoursDischarge, ' hrs')} />
                            </>
                        )}
                        <DataRow label="Representative" value={formatValue(activeCharter.charterRepresentativeName)} />
                        {activeCharter.charterRepresentativeEmail && (
                            <DataRow label="Email" value={activeCharter.charterRepresentativeEmail} />
                        )}
                    </DataSection>
                )}

                <DataSection title="Capacity">
                    <DataRow label="DWT" value={formatValue(vessel.dwtMt, ' MT')} />
                    <DataRow label="Cubic Capacity" value={formatValue(vessel.cubicCapacityM3, ' M³')} />
                    <DataRow label="Cargo Tanks" value={formatValue(vessel.cargoTanksCount)} />
                    <DataRow label="Tank Coating" value={formatValue(vessel.tankCoating)} />
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
