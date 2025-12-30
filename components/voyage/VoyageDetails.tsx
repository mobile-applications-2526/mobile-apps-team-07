/**
 * VoyageDetails Component
 * 
 * Card component displaying vessel information in a list.
 */
import { Fragment, useState } from 'react';
import { TouchableOpacity, View, ScrollView } from 'react-native';
import { useColorScheme } from 'nativewind';
import { ChevronLeft, ChevronRight, Anchor, EyeOff } from 'lucide-react-native';
import { ThemedText, DataSection, DataRow } from '@/components/common';
import { CharterParty, Document, VesselStatus, Voyage, VoyagePort } from '@/types';
import { Cargo } from '@/types/cargo';
import { useDocuments } from '@/hooks';
import { DocumentsSection } from '@/components/common/DocumentSection';
import NoonReportCard from '../noonReport/NoonReportCard';
import CargoCard from '../cargo/cargoCard';

interface VoyageDetailsProps {
  voyage: Voyage;
  status: VesselStatus | null;
  noonReports: VesselStatus[];
  cargoes: Cargo[];
  ports: VoyagePort[];
  charterParty: CharterParty | null;
  getDocuments: ()=>Promise<Document[]>;
  onCycleVoyage: (direction: 'next' | 'previous') => void;
  onAdd: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
  isFirstVoyage?: boolean;
  isLastVoyage?: boolean;
  hasNoVoyages?: boolean;
  onCreateFirstVoyage?: () => void;
}

export function VoyageDetails({
  voyage,
  status,
  noonReports,
  cargoes,
  ports,
  charterParty,
  getDocuments,
  onCycleVoyage,
  onAdd,
  isFirstVoyage = false,
  isLastVoyage = false,
  hasNoVoyages = false,
  onCreateFirstVoyage,
}: VoyageDetailsProps) {

  const { colorScheme } = useColorScheme();
  const iconColor = colorScheme === 'dark' ? '#fff' : '#000';

  const {
    documents,
    onDownload,
    uploadDocument,
    replaceDocument,
    deleteDocument
  } = useDocuments('voyages', voyage.id, getDocuments);

  const [activeTab, setActiveTab] = useState<'reports' | 'cargo'>('reports');
  const [showAllPorts, setShowAllPorts] = useState(false);

  // Format dates
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Get status color based on voyage status
  const getStatusColor = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    if (normalizedStatus.includes('progress') || normalizedStatus.includes('laden') || normalizedStatus.includes('loading')) {
      return 'bg-green-500';
    } else if (normalizedStatus.includes('complete')) {
      return 'bg-gray-500';
    } else if (normalizedStatus.includes('pending') || normalizedStatus.includes('ballast')) {
      return 'bg-blue-500';
    }
    return 'bg-blue-500';
  };

  const formatETA = (distanceToGoNm: number, averageSpeedKnots: number, nextPort?: string): string => {
    const hours = distanceToGoNm / averageSpeedKnots;
    const etaDate = new Date();
    etaDate.setHours(etaDate.getHours() + hours);

    const monthAbbr = etaDate.toLocaleString('en-US', { month: 'short' });
    const day = etaDate.getDate();
    const timeStr = etaDate.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });

    const portText = nextPort ? ` to ${nextPort}` : '';
    return `${monthAbbr} ${day}, ${timeStr} UTC${portText}`;
  };

  // Get load and discharge ports
  const loadPorts = ports.filter(p => p.portType === 'Load');
  const dischargePorts = ports.filter(p => p.portType === 'Discharge');

  const visibleLoadPorts = showAllPorts ? loadPorts : loadPorts.slice(0, 2);
  const visibleDischargePorts = showAllPorts ? dischargePorts : dischargePorts.slice(0, 2);
  const hasMorePorts = loadPorts.length + dischargePorts.length > 4;

  // Get next port for ETA
  const nextPort = dischargePorts.length > 0 ? dischargePorts[0].portName : null;

  // Empty state for no voyages
  if (hasNoVoyages) {
    return (
      <View className="flex-1 bg-gray-50 dark:bg-black items-center justify-center p-8">
        <Anchor size={64} color="#9ca3af" />
        <ThemedText className="text-2xl font-bold mt-4 mb-2">No Voyages Yet</ThemedText>
        <ThemedText className="text-gray-600 dark:text-gray-400 text-center mb-6">
          Create your first voyage to start tracking
        </ThemedText>
        <TouchableOpacity
          onPress={onCreateFirstVoyage}
          className="px-6 py-3 bg-blue-600 rounded-xl"
        >
          <ThemedText className="text-white font-semibold">Create First Voyage</ThemedText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50 dark:bg-black">
      <View className="p-4">
        {/* Header */}
        <View className="flex-row items-center justify-between mb-4 px-2">
          <TouchableOpacity
            onPress={() => onCycleVoyage('previous')}
            className={`p-2 rounded-full ${isFirstVoyage ? 'opacity-30' : 'active:bg-gray-200 dark:active:bg-gray-800'}`}
            disabled={isFirstVoyage}
          >
            <ChevronLeft size={24} color={isFirstVoyage ? "#9ca3af" : iconColor} />
          </TouchableOpacity>

          <ThemedText className="text-lg font-bold">
            {voyage.voyageNumber}
          </ThemedText>

          <TouchableOpacity
            onPress={() => onCycleVoyage('next')}
            className={`p-2 rounded-full ${isLastVoyage ? 'opacity-30' : 'active:bg-gray-200 dark:active:bg-gray-800'}`}
            disabled={isLastVoyage}
          >
            <ChevronRight size={24} color={isLastVoyage ? "#9ca3af" : iconColor} />
          </TouchableOpacity>
        </View>

        {/* Route Visualization */}
        <DataSection
          title="Route"
          rightContent={
            <View className={`px-2 py-1 rounded-full ${getStatusColor(voyage.voyageStatus)}`}>
              <ThemedText className="text-xs font-medium text-white">
                {voyage.voyageStatus}
              </ThemedText>
            </View>
          }
        >
          <View className="mt-4">
            {/* Row 1: Circles and Lines */}
            <View className="flex-row items-center justify-between mb-2">
              {/* Load Ports */}
              {visibleLoadPorts.map((_, index) => (
                <Fragment key={`load-circle-${index}`}>
                  <View className="flex-1 items-center">
                    <View className={`w-12 h-12 ${index === 0 ? 'bg-blue-600' : 'bg-white dark:bg-[#1c1c1e] border-4 border-blue-600'} rounded-full items-center justify-center z-10`}>
                      {index === 0 && <Anchor size={24} color="#fff" />}
                    </View>
                  </View>
                  {(index < visibleLoadPorts.length - 1 || visibleDischargePorts.length > 0) && (
                    <View className="flex-1 h-0.5 bg-blue-600 -mx-4" />
                  )}
                </Fragment>
              ))}

              {/* Discharge Ports */}
              {visibleDischargePorts.map((_, index) => (
                <Fragment key={`discharge-circle-${index}`}>
                  <View className="flex-1 items-center">
                    <View className="w-12 h-12 bg-white dark:bg-[#1c1c1e] border-4 border-blue-600 rounded-full z-10" />
                  </View>
                  {index < visibleDischargePorts.length - 1 && (
                    <View className="flex-1 h-0.5 bg-blue-600 -mx-4" />
                  )}
                </Fragment>
              ))}
            </View>

            {/* Row 2: Labels */}
            <View className="flex-row items-start justify-between">
              {/* Load Ports Labels */}
              {visibleLoadPorts.map((port, index) => (
                <Fragment key={`load-label-${index}`}>
                  <View className="flex-1 items-center">
                    <ThemedText className="text-xs font-semibold text-center w-full px-1" numberOfLines={2}>
                      {port.portName}
                    </ThemedText>
                  </View>
                  {(index < visibleLoadPorts.length - 1 || visibleDischargePorts.length > 0) && (
                    <View className="flex-1 -mx-4" />
                  )}
                </Fragment>
              ))}

              {/* Discharge Ports Labels */}
              {visibleDischargePorts.map((port, index) => (
                <Fragment key={`discharge-label-${index}`}>
                  <View className="flex-1 items-center">
                    <ThemedText className="text-xs font-semibold text-center w-full px-1" numberOfLines={2}>
                      {port.portName}
                    </ThemedText>
                  </View>
                  {index < visibleDischargePorts.length - 1 && (
                    <View className="flex-1 -mx-4" />
                  )}
                </Fragment>
              ))}
            </View>
          </View>

          {/* Show all ports link */}
          {hasMorePorts && (
            <TouchableOpacity
              onPress={() => setShowAllPorts(!showAllPorts)}
              className="mt-4"
            >
              <ThemedText className="text-blue-600 text-center text-sm font-medium">
                {showAllPorts ? 'Show less' : `Show all ports (${loadPorts.length + dischargePorts.length})`}
              </ThemedText>
            </TouchableOpacity>
          )}
        </DataSection>

        {/* Voyage Info */}
        <DataSection title="Voyage Info">
          <View>
            {voyage.voyageStartDate && voyage.voyageEndDate && (
              <DataRow
                label="Laycan"
                value={`${formatDate(voyage.voyageStartDate)} - ${formatDate(voyage.voyageEndDate)}`}
              />
            )}

            {charterParty ? (
              <>
                <DataRow label="Charter Party" value={charterParty.chartererName} />
                {charterParty.isVC && (
                  <View className="flex-row justify-between py-2">
                    <ThemedText className="text-sm text-gray-500 dark:text-gray-400">Type:</ThemedText>
                    <View className="px-3 py-1 bg-blue-600 rounded-full">
                      <ThemedText className="text-xs font-medium text-white">VC</ThemedText>
                    </View>
                  </View>
                )}
              </>
            ) : (
              <DataRow label="Charter Party" value="None" />
            )}

            {status && (
              <DataRow
                label="Current Position"
                value={`${status.latitude}°N, ${status.longitude}°E`}
              />
            )}

            {status && (
              <DataRow
                label="ETA"
                value={formatETA(status.distanceToGoNm, status.averageSpeedKnots, nextPort || undefined)}
              />
            )}
          </View>
        </DataSection>

        {/* Tabs - Native Segmented Control Style */}
        <View className="flex-row mb-4 bg-gray-200 dark:bg-gray-800 p-1 rounded-xl">
          <TouchableOpacity
            onPress={() => setActiveTab('reports')}
            style={{ flex: 1 }}
          >
            <View className={`py-1.5 rounded-lg items-center justify-center ${activeTab === 'reports' ? 'bg-white' : 'bg-transparent'}`}>
              <ThemedText className={`text-sm font-medium ${activeTab === 'reports' ? 'text-black' : 'text-gray-500 dark:text-gray-400'}`}>
                Noon Reports
              </ThemedText>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('cargo')}
            style={{ flex: 1 }}
          >
            <View className={`py-1.5 rounded-lg items-center justify-center ${activeTab === 'cargo' ? 'bg-white' : 'bg-transparent'}`}>
              <ThemedText className={`text-sm font-medium ${activeTab === 'cargo' ? 'text-black' : 'text-gray-500 dark:text-gray-400'}`}>
                Cargo
              </ThemedText>
            </View>
          </TouchableOpacity>
        </View>

        {/* Noon Reports Tab */}
        {activeTab === 'reports' && (
          <>
            {noonReports.length > 0 ? (
              <View>
                {noonReports.map((report, index) => (
                  <NoonReportCard
                    index={index}
                    report={report}
                    formatDate={formatDate}/>
                ))}
              </View>
            ) : (
              <View className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-8 mb-4 items-center">
                <EyeOff size={48} color="#9ca3af" />
                <ThemedText className="text-center text-gray-500 dark:text-gray-400 mt-3">
                  No noon reports submitted for this voyage
                </ThemedText>
              </View>
            )}
          </>
        )} 

        {/* Cargo Tab Content */}
        {activeTab === 'cargo' && (
          <>
            {cargoes.length > 0 ? (
              <View>
                {cargoes.map((cargo, index) => (
                  <CargoCard
                    index={index}
                    cargo={cargo}
                    formatDate={formatDate}/>
                ))}
              </View>
            ) : (
              <View className="bg-white dark:bg-[#1c1c1e] rounded-2xl p-8 mb-4 items-center">
                <ThemedText className="text-center text-gray-500 dark:text-gray-400">
                  Cargo Details here
                </ThemedText>
              </View>
            )}
          </>
        )}

        {/* Remarks */}
        {voyage.remarks && (
          <DataSection title="Remarks">
            <ThemedText className="text-gray-800 dark:text-gray-200">
              {voyage.remarks}
            </ThemedText>
          </DataSection>
        )}

        {/* Document Upload Section */}
        <DataSection title="Voyage Documents">
          <DocumentsSection
            documents={documents}
            category='voyages'
            // Title handled by DataSection now
            onUpload={uploadDocument}
            onReplace={replaceDocument}
            onDownload={onDownload}
            onDelete={deleteDocument}
          />
        </DataSection>
      </View>
    </ScrollView>
  );
}
