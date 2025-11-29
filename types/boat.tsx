type Boat = {
  id: string;
  name: string;
  imo: string;
  type: string;
  subtype: string;
  eta?: string;
  port?: string;
  image?: string;
  hasQ88?: boolean; // Whether Q88 document is uploaded
};

export default Boat;