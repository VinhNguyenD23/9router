// Suppress EPERM unhandled rejections from glob scanning on Windows.
// Next.js 16 file tracing can walk into OS junction points (e.g.
// C:\Users\*\Application Data) causing EPERM that crash the build.
// This preload script catches those before they become fatal.
process.on("unhandledRejection", (reason) => {
  if (reason?.code === "EPERM") return;
  console.error("[suppressEperm] FATAL unhandled rejection:", reason?.message || reason);
  process.exit(1);
});
