import { promises as fs } from 'fs';
import * as path from 'path';
import { LegacyHl7Parser } from './LegacyHl7Parser';

async function processFileAsync(filePath: string, parser: LegacyHl7Parser) {
    try {
        let hl7Message = await fs.readFile(filePath, 'utf-8');
        hl7Message = hl7Message.replace(/\r\n/g, '\r').replace(/\n/g, '\r');
        
        const record = parser.parse(hl7Message);

        console.log(`\nDecoded HL7 Message from ${path.basename(filePath)}:`);
        console.log('----------------------------------------');
        console.log(`SendingApplication: ${record.SendingApplication}`);
        console.log(`MessageType: ${record.MessageType}`);
        console.log(`PatientId: ${record.PatientId}`);
        console.log(`PatientName: ${record.PatientName}`);
        console.log(`OrderControlCode: ${record.OrderControlCode}`);
        console.log(`OrderId: ${record.OrderId}`);
        console.log(`UniversalServiceId: ${record.UniversalServiceId}`);
        console.log(`OrderedDateTime: ${record.OrderedDateTime}`);
    } catch (ex: any) {
        console.log(`Error processing ${path.basename(filePath)}: ${ex.message}`);
    }
}

async function main() {
    const hl7Directory = process.argv.length > 2 ? process.argv[2] : '.';
    let hl7Files: string[];
    try {
        const files = await fs.readdir(hl7Directory);
        hl7Files = files.filter((f: string) => f.endsWith('.hl7')).map((f: string) => path.join(hl7Directory, f));
    } catch {
        console.log(`Could not read directory: ${hl7Directory}`);
        return;
    }

    if (hl7Files.length === 0) {
        console.log(`No .hl7 files found in directory: ${hl7Directory}`);
        return;
    }

    const parser = new LegacyHl7Parser();
    await Promise.all(hl7Files.map(file => processFileAsync(file, parser)));
}

main();