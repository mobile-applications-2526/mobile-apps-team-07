// Vessel type from database
export interface Vessel {
  id: number;
  name: string;
  imo: string;
  type: string;
  subtype: string;
  eta: string | null;
  port: string | null;
  image: string | null;
  hasQ88: boolean;
  createdAt: string;
  updatedAt: string;
}

// Input type for creating a new vessel
export interface CreateVesselInput {
  name: string;
  imo: string;
  type: string;
  subtype: string;
  eta?: string | null;
  port?: string | null;
  image?: string | null;
  hasQ88?: boolean;
}

// Input type for updating a vessel
export interface UpdateVesselInput {
  name?: string;
  imo?: string;
  type?: string;
  subtype?: string;
  eta?: string | null;
  port?: string | null;
  image?: string | null;
  hasQ88?: boolean;
}

// Legacy type alias for backward compatibility during migration
type Boat = {
  id: string;
  name: string;
  imo: string;
  type: string;
  subtype: string;
  eta?: string;
  port?: string;
  image?: string;
  hasQ88?: boolean;
};

export default Boat;