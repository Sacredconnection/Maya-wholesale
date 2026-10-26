// Enabled by default until the public launch. Set MAINTENANCE_MODE=false
// and redeploy/restart to restore the storefront.
export function isMaintenanceMode() {
  return process.env.MAINTENANCE_MODE !== "false";
}
