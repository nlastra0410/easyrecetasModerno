const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

code = code.replace(
`// Call syncDatabase in the background, don't await it to block routes
if (!process.env.VERCEL) {
  syncDatabase().catch(console.error);
}`,
`// Call syncDatabase in the background unconditionally (works on Vercel cold starts too)
syncDatabase().catch(console.error);`
);

fs.writeFileSync('server.ts', code);
