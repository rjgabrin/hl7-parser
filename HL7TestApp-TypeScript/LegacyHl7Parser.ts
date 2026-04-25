import { OrderRecord } from "./OrderRecord";
import { Hl7Schema, Hl7SchemaType, SegmentSchema, FieldDefinition } from "./Hl7Schema";

export class LegacyHl7Parser {

    parse(rawMessage: string): OrderRecord {
        const segments = rawMessage.split('\r');

        const record: OrderRecord = {
            SendingApplication: null,
            MessageType: null,
            PatientId: null,
            PatientName: null,
            OrderControlCode: null,
            OrderId: null,
            UniversalServiceId: null,
            OrderedDateTime: null
        };

        for (const segment of segments) {
            const fields = segment.split('|');
            if (fields.length === 0) continue;

            const segmentType = fields[0] as keyof Hl7SchemaType;
            const schema = Hl7Schema[segmentType];
            if (!schema) continue;

            switch (segmentType) {
                case "MSH":
                    record.SendingApplication = this.getFieldFromSchema(fields, schema, "SendingApplication");
                    record.MessageType = this.getFieldFromSchema(fields, schema, "MessageType");
                    break;

                case "PID":
                    record.PatientId = this.getFieldFromSchema(fields, schema, "PatientId");
                    record.PatientName = this.getFieldFromSchema(fields, schema, "PatientName");
                    break;

                case "ORC":
                    record.OrderControlCode = this.getFieldFromSchema(fields, schema, "OrderControlCode");
                    record.OrderId = this.getFieldFromSchema(fields, schema, "OrderId");
                    break;

                case "OBR":
                    record.UniversalServiceId = this.getFieldFromSchema(fields, schema, "UniversalServiceId");
                    record.OrderedDateTime = this.getFieldFromSchema(fields, schema, "OrderedDateTime");
                    break;
            }
        }

        return record;
    }

    private getFieldFromSchema(
        fields: string[],
        schema: SegmentSchema,
        key: keyof SegmentSchema
    ): string | null {
        const def: FieldDefinition = schema[key];
        if (!def) return null;

        if (def.subIndex !== undefined) {
            return this.getSubcomponentOrNull(fields, def.index, def.subIndex);
        }

        return this.getValueOrNull(fields, def.index);
    }

    private getValueOrNull(fields: string[], index: number): string | null {
        if (fields.length > index && fields[index] && fields[index].length > 0) {
            return fields[index];
        }
        return null;
    }

    private getSubcomponentOrNull(fields: string[], index: number, subIndex: number): string | null {
        if (fields.length > index && fields[index] && fields[index].length > 0) {
            const parts = fields[index].split('^');
            if (parts.length > subIndex && parts[subIndex] && parts[subIndex].length > 0) {
                return parts[subIndex];
            }
        }
        return null;
    }
}