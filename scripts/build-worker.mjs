import fs from 'node:fs';
import ts from 'typescript';
fs.mkdirSync('worker/core', { recursive: true });
for (const name of ['api', 'oauth', 'instagram', 'security', 'schema', 'worker', 'webhook']) {
  let s = fs.readFileSync('functions/src/' + name + '.ts', 'utf8');
  s = s.replace(
    "import { defineSecret } from 'firebase-functions/params';",
    "import { defineSecret } from '../runtime.js';",
  );
  if (name === 'webhook') {
    s = "import { processEvent } from './worker';\n" + s;
    s = s.replace(
      'if ((error as { code?: number }).code !== 6) throw error;\n        }',
      "if ((error as { code?: number }).code !== 6) throw error;\n        }\n        const saved = await db.doc('eventQueue/' + key).get();\n        await processEvent(saved.ref, saved.data() as Parameters<typeof processEvent>[1]);",
    );
  }
  s = s.replaceAll('process.env.', 'settings().');
  if (s.includes('settings()')) s = "import { settings } from '../runtime.js';\n" + s;
  s = s.replace(/from '(\.\/[^']+)'/g, "from '$1.js'");
  fs.writeFileSync(
    'worker/core/' + name + '.js',
    ts.transpileModule(s, {
      compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
    }).outputText,
  );
}
