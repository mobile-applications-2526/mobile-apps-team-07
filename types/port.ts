/**
 * Port Types
 * 
 * Type definitions for port-related data structures.
 */

import { Timestamp } from "react-native-reanimated/lib/typescript/commonTypes";

export interface VoyagePort {
  id: number,
  portType: PortType,
  portSequence: number,
  portName: string;
  laycanStart: Timestamp;
  laycanEnd: Timestamp;
  eta: Timestamp;
  etb: Timestamp;
  atb: Timestamp;
  etd: Timestamp;
  atd: Timestamp;
  norTendered: Timestamp;
  norAccepted: Timestamp;
  remarks: string;
}

export type PortType = 
  |"Load"  
  |"Discharge";
