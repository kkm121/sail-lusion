import fs from 'fs';
import readline from 'readline';

const rl = readline.createInterface({
  input: fs.createReadStream('C:/Users/muthu/.gemini/antigravity/brain/0af52059-3fcb-4fd2-8bb3-6f3dca5ae5a3/.system_generated/logs/transcript_full.jsonl'),
  crlfDelay: Infinity
});

let lineIdx = 0;
rl.on('line', (line) => {
  lineIdx++;
  if (lineIdx === 7698) {
    try {
      const data = JSON.parse(line);
      const writeCall = data.tool_calls.find(c => c.name === 'write_file');
      if (writeCall) {
        fs.writeFileSync('scratch/recovered_vortex_lattice.jsx', writeCall.args.Content);
        console.log('Saved scratch/recovered_vortex_lattice.jsx! Length:', writeCall.args.Content.length);
      }
    } catch (e) {
      console.error(e);
    }
  }
});
