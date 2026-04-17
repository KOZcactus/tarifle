import * as Sentry from "@sentry/nextjs";

export async function register() {
  // TEMP debug — smoke test sonrası kaldır
  console.log(
    `[instrumentation] register() fired, NEXT_RUNTIME=${process.env.NEXT_RUNTIME}`,
  );
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// TEMP debug wrapper — smoke test sonrası `export const onRequestError =
// Sentry.captureRequestError` haline geri dönecek.
export const onRequestError: typeof Sentry.captureRequestError = (
  err,
  request,
  context,
) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error(`[onRequestError] fired: ${message}`);
  return Sentry.captureRequestError(err, request, context);
};
