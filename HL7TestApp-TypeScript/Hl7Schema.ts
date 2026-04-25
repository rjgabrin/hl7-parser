export interface FieldDefinition {
  index: number;
  subIndex?: number;
}

export interface SegmentSchema {
  [fieldName: string]: FieldDefinition;
}

export interface Hl7SchemaType {
  [segment: string]: SegmentSchema;
}

export const Hl7Schema: Hl7SchemaType = {
  MSH: {
    SendingApplication: { index: 2 },
    MessageType: { index: 8 }
  },
  PID: {
    PatientId: { index: 3, subIndex: 0 },
    PatientName: { index: 5 }
  },
  ORC: {
    OrderControlCode: { index: 1 },
    OrderId: { index: 2 }
  },
  OBR: {
    UniversalServiceId: { index: 4, subIndex: 0 },
    OrderedDateTime: { index: 6 } // 6 is the field index from the historical implementation, but the data shows that field 7 actually holds this OrderDateTime value. Not changing for feature parity.
  }
};
