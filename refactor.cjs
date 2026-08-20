const fs = require('fs');
let code = fs.readFileSync('server.ts', 'utf8');

// Replace the startServer definition
code = code.replace(/async function startServer\(\) \{\n\s*const app = express\(\);\n\s*const PORT = 3000;\n\n\s*app\.use\(express\.json\(\)\);/, 
`const app = express();
app.use(express.json());

// Move DB init into its own async function
async function syncDatabase() {`);

// Now we need to find where DB init ends and AUTH ENDPOINTS begin.
// Looking at the file:
//   } catch (dbSyncErr) {
//     console.warn("[DB SYNC WARNING]", dbSyncErr);
//   }
// 
//   // AUTH ENDPOINTS
code = code.replace(/  \} catch \(dbSyncErr\) \{\n    console\.warn\("\[DB SYNC WARNING\]", dbSyncErr\);\n  \}/, 
`  } catch (dbSyncErr) {
    console.warn("[DB SYNC WARNING]", dbSyncErr);
  }
}
// Call syncDatabase in the background, don't await it to block routes
if (!process.env.VERCEL) {
  syncDatabase().catch(console.error);
}`);

// Now we need to handle the vite middleware and app.listen at the end.
// Look for:
//   // Vite middleware for development
//   if (process.env.NODE_ENV !== "production") {
//     const vite = await createViteServer({
code = code.replace(/\/\/ Vite middleware for development\n\s*if \(process\.env\.NODE_ENV !== "production"\) \{\n\s*const vite = await createViteServer\(\{/,
`// Setup local server if not on Vercel
async function setupLocalServer() {
  if (process.env.VERCEL) return;
  const PORT = 3000;
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({`);

// And at the very end:
//   app.listen(PORT, "0.0.0.0", () => {
//     console.log(`Server running on http://localhost:${PORT}`);
//   });
// }
// 
// startServer();
code = code.replace(/  app\.listen\(PORT, "0\.0\.0\.0", \(\) => \{\n    console\.log\(`Server running on http:\/\/localhost:\$\{PORT\}`\);\n  \}\);\n\}\n\nstartServer\(\);/,
`  app.listen(PORT, "0.0.0.0", () => {
    console.log(\`Server running on http://localhost:\${PORT}\`);
  });
}

setupLocalServer().catch(console.error);

export default app;`);

fs.writeFileSync('server.ts', code);
console.log('Refactored server.ts');
