import { describe, it, expect } from '@jest/globals';
import { LegacyHl7Parser } from './LegacyHl7Parser';

describe('LegacyHl7Parser', () => {
    it('parses well-formed ORM^O01 message', () => {
        const parser = new LegacyHl7Parser();
        const hl7 =
            "MSH|^~\\&|OrderSystem|HospitalA|LabSystem|HospitalB|20240315120000||ORM^O01|MSG001|P|2.4|||AL|NE\r" +
            "PID|1||123456^^^HospitalA^MR||DOE^JOHN^A||19800101|M\r" +
            "ORC|NW|ORD-7890|||||^^^20240315||20240315120000|||PROVIDER^JANE^MD\r" +
            "OBR|1|ORD-7890||85025^CBC WITH DIFF^LN|||20240315120000|||||||||PROVIDER^JANE^MD";
        const record = parser.parse(hl7);

        expect(record.SendingApplication).toBe("OrderSystem");
        expect(record.MessageType).toBe("ORM^O01");
        expect(record.PatientId).toBe("123456");
        expect(record.PatientName).toBe("DOE^JOHN^A");
        expect(record.OrderControlCode).toBe("NW");
        expect(record.OrderId).toBe("ORD-7890");
        expect(record.UniversalServiceId).toBe("85025");
        expect(record.OrderedDateTime).toBeNull();
    });

    it('handles missing MSH-9 (MessageType) field', () => {
        const parser = new LegacyHl7Parser();
        const hl7 =
            "MSH|^~\\&|OrderSystem|HospitalA|LabSystem|HospitalB|20240315120000||||MSG001|P|2.4|||AL|NE\r" +
            "PID|1||123456^^^HospitalA^MR||DOE^JOHN^A||19800101|M";
        const record = parser.parse(hl7);
        expect(record.MessageType).toBeNull();
    });

    it('handles missing OBR segment', () => {
        const parser = new LegacyHl7Parser();
        const hl7 =
            "MSH|^~\\&|OrderSystem|HospitalA|LabSystem|HospitalB|20240315120000||ORM^O01|MSG001|P|2.4|||AL|NE\r" +
            "PID|1||123456^^^HospitalA^MR||DOE^JOHN^A||19800101|M\r" +
            "ORC|NW|ORD-7890|||||^^^20240315||20240315120000|||PROVIDER^JANE^MD";
        const record = parser.parse(hl7);
        expect(record.UniversalServiceId).toBeNull();
        expect(record.OrderedDateTime).toBeNull();
    });

    it.each([
        ["PID|1||12345^MR^HospitalA||DOE^JOHN^A||19800101|M", "12345"],
        ["PID|1||12345||DOE^JOHN^A||19800101|M", "12345"]
    ])('parses PID-3 with and without subcomponent: %s', (pidSegment, expectedPatientId) => {
        const parser = new LegacyHl7Parser();
        const hl7 =
            "MSH|^~\\&|OrderSystem|HospitalA|LabSystem|HospitalB|20240315120000||ORM^O01|MSG001|P|2.4|||AL|NE\r" +
            pidSegment;
        const record = parser.parse(hl7);
        expect(record.PatientId).toBe(expectedPatientId);
    });

    it('handles empty message and returns null fields', () => {
        const parser = new LegacyHl7Parser();
        const hl7 = "";
        const record = parser.parse(hl7);
        expect(record.SendingApplication).toBeNull();
        expect(record.MessageType).toBeNull();
        expect(record.PatientId).toBeNull();
        expect(record.PatientName).toBeNull();
        expect(record.OrderControlCode).toBeNull();
        expect(record.OrderId).toBeNull();
        expect(record.UniversalServiceId).toBeNull();
        expect(record.OrderedDateTime).toBeNull();
    });

    it('handles a file with only whitespace (edge case: Empty.hl7)', () => {
        const parser = new LegacyHl7Parser();
        const hl7 = "   \r\n\t";
        const record = parser.parse(hl7);
        expect(record.SendingApplication).toBeNull();
        expect(record.MessageType).toBeNull();
        expect(record.PatientId).toBeNull();
        expect(record.PatientName).toBeNull();
        expect(record.OrderControlCode).toBeNull();
        expect(record.OrderId).toBeNull();
        expect(record.UniversalServiceId).toBeNull();
        expect(record.OrderedDateTime).toBeNull();
    });

    it('parses all message in a file with multiple HL7 messages (edge case: MultipleMessages.hl7)', () => {
        const parser = new LegacyHl7Parser();
        const hl7 =
            "MSH|^~\\&|App1|Fac1|App2|Fac2|20240424120000||ORM^O01|MSG001|P|2.4|||AL|NE\r" +
            "PID|1||11111^^^Fac1^MR||DOE^JANE^A||19900101|F\r" +
            "ORC|NW|ORD-1111|||||^^^20240424||20240424120000|||PROVIDER^SMITH^MD\r" +
            "OBR|1|ORD-1111||80048^BASIC METABOLIC PANEL^LN|||20240424120000|||||||||PROVIDER^SMITH^MD\r" +
            "MSH|^~\\&|App3|Fac3|App4|Fac4|20240424130000||ORM^O01|MSG002|P|2.4|||AL|NE\r" +
            "PID|1||22222^^^Fac3^MR||DOE^JOHN^B||19850101|M\r" +
            "ORC|NW|ORD-2222|||||^^^20240424||20240424130000|||PROVIDER^LEE^MD\r" +
            "OBR|1|ORD-2222||85025^CBC WITH DIFF^LN|||20240424130000|||||||||PROVIDER^LEE^MD";
        const record = parser.parse(hl7);
        expect(record.SendingApplication).toBe("App3");
        expect(record.MessageType).toBe("ORM^O01");
        expect(record.PatientId).toBe("22222");
        expect(record.PatientName).toBe("DOE^JOHN^B");
        expect(record.OrderControlCode).toBe("NW");
        expect(record.OrderId).toBe("ORD-2222");
        expect(record.UniversalServiceId).toBe("85025");
        expect(record.OrderedDateTime).toBeNull();
    });

    it('handles malformed segments with missing fields', () => {
        const parser = new LegacyHl7Parser();
        const hl7 = "PID|1|||";
        const record = parser.parse(hl7);
        expect(record.PatientId).toBeNull();
        expect(record.PatientName).toBeNull();
    });

    it('handles unexpected segment order', () => {
        const parser = new LegacyHl7Parser();
        const hl7 =
            "PID|1||123456^^^HospitalA^MR||DOE^JOHN^A||19800101|M\r" +
            "MSH|^~\\&|OrderSystem|HospitalA|LabSystem|HospitalB|20240315120000||ORM^O01|MSG001|P|2.4|||AL|NE";
        const record = parser.parse(hl7);
        expect(record.PatientId).toBe("123456");
        expect(record.SendingApplication).toBe("OrderSystem");
    });

    it('ignores extra/unknown segments', () => {
        const parser = new LegacyHl7Parser();
        const hl7 =
            "MSH|^~\\&|OrderSystem|HospitalA|LabSystem|HospitalB|20240315120000||ORM^O01|MSG001|P|2.4|||AL|NE\r" +
            "NTE|1|Some note\r" +
            "PID|1||123456^^^HospitalA^MR||DOE^JOHN^A||19800101|M";
        const record = parser.parse(hl7);
        expect(record.PatientId).toBe("123456");
        expect(record.SendingApplication).toBe("OrderSystem");
    });

    it('handles multiple occurrences of the same segment (uses last)', () => {
        const parser = new LegacyHl7Parser();
        const hl7 =
            "PID|1||11111^^^HospitalA^MR||DOE^JANE^A||19900101|F\r" +
            "PID|1||22222^^^HospitalA^MR||DOE^JOHN^B||19850101|M";
        const record = parser.parse(hl7);
        expect(record.PatientId).toBe("22222");
        expect(record.PatientName).toBe("DOE^JOHN^B");
    });

    it('handles fields with only delimiters', () => {
        const parser = new LegacyHl7Parser();
        const hl7 = "PID|1||^||DOE^JOHN^A||19800101|M";
        const record = parser.parse(hl7);
        expect(record.PatientId).toBeNull();
    });

    it('parses non-ORM^O01 message type', () => {
        const parser = new LegacyHl7Parser();
        const hl7 = "MSH|^~\\&|OrderSystem|HospitalA|LabSystem|HospitalB|20240315120000||ADT^A01|MSG001|P|2.4|||AL|NE";
        const record = parser.parse(hl7);
        expect(record.MessageType).toBe("ADT^A01");
    });

    it('handles non-ASCII characters in fields', () => {
        const parser = new LegacyHl7Parser();
        const hl7 = "PID|1||123456^^^HospitalA^MR||DÖE^JOSÉ^A||19800101|M";
        const record = parser.parse(hl7);
        expect(record.PatientName).toBe("DÖE^JOSÉ^A");
    });

    it('handles very large message', () => {
        const parser = new LegacyHl7Parser();
        let hl7 = "MSH|^~\\&|OrderSystem|HospitalA|LabSystem|HospitalB|20240315120000||ORM^O01|MSG001|P|2.4|||AL|NE\r";
        for (let i = 0; i < 1000; i++) {
            hl7 += `NTE|${i}|Note line ${i}\r`;
        }
        hl7 += "PID|1||123456^^^HospitalA^MR||DOE^JOHN^A||19800101|M";
        const record = parser.parse(hl7);
        expect(record.PatientId).toBe("123456");
    });

    // it('handles null input gracefully', () => {
    //     const parser = new LegacyHl7Parser();
    //     const record = parser.parse(null);
    //     expect(record.SendingApplication).toBeNull();
    //     expect(record.MessageType).toBeNull();
    //     expect(record.PatientId).toBeNull();
    //     expect(record.PatientName).toBeNull();
    //     expect(record.OrderControlCode).toBeNull();
    //     expect(record.OrderId).toBeNull();
    //     expect(record.UniversalServiceId).toBeNull();
    //     expect(record.OrderedDateTime).toBeNull();
    // });

    it('handles message with only MSH segment', () => {
        const parser = new LegacyHl7Parser();
        const hl7 = "MSH|^~\\&|OrderSystem|HospitalA|LabSystem|HospitalB|20240315120000||ORM^O01|MSG001|P|2.4|||AL|NE";
        const record = parser.parse(hl7);
        expect(record.SendingApplication).toBe("OrderSystem");
        expect(record.MessageType).toBe("ORM^O01");
        expect(record.PatientId).toBeNull();
        expect(record.PatientName).toBeNull();
        expect(record.OrderControlCode).toBeNull();
        expect(record.OrderId).toBeNull();
        expect(record.UniversalServiceId).toBeNull();
        expect(record.OrderedDateTime).toBeNull();
    });

    it('handles message with OrderedDateTime in the 6th index of the OBR segment', () => {
         const parser = new LegacyHl7Parser();
         const hl7 =
             "MSH|^~\\&|OrderSystem|HospitalA|LabSystem|HospitalB|20240315120000||ORM^O01|MSG001|P|2.4|||AL|NE\r" +
             "PID|1||123456^^^HospitalA^MR||DOE^JOHN^A||19800101|M\r" +
             "OBR|1|ORD-7890||85025^CBC WITH DIFF^LN||20240315120000||||||||||PROVIDER^JANE^MD";
         const record = parser.parse(hl7);
         expect(record.UniversalServiceId).toBe("85025");
         expect(record.OrderedDateTime).toBe("20240315120000");
     });

     it('handles a message with no field data ', () => {
         const parser = new LegacyHl7Parser();
         const hl7 =
             "MSH\r";
         const record = parser.parse(hl7);
         expect(record.SendingApplication).toBeNull();
         expect(record.MessageType).toBeNull();
         expect(record.PatientId).toBeNull();
         expect(record.PatientName).toBeNull();
         expect(record.OrderControlCode).toBeNull();
         expect(record.OrderId).toBeNull();
         expect(record.UniversalServiceId).toBeNull();
         expect(record.OrderedDateTime).toBeNull();
     });

     it('handles message with no known FieldDefinition', () => {
         const parser = new LegacyHl7Parser();
         const hl7 =
             "JAM|^~\\&|OrderSystem|HospitalA|LabSystem|HospitalB|20240315120000||ORM^O01|MSG001|P|2.4|||AL|NE\r" +
             "POW|1||123456^^^HospitalA^MR||DOE^JOHN^A||19800101|M\r" +
             "WAM|1|ORD-7890||85025^CBC WITH DIFF^LN||20240315120000||||||||||PROVIDER^JANE^MD";
         const record = parser.parse(hl7);
         expect(record.SendingApplication).toBeNull();
         expect(record.MessageType).toBeNull();
         expect(record.PatientId).toBeNull();
         expect(record.PatientName).toBeNull();
         expect(record.OrderControlCode).toBeNull();
         expect(record.OrderId).toBeNull();
         expect(record.UniversalServiceId).toBeNull();
         expect(record.OrderedDateTime).toBeNull();
     });
});