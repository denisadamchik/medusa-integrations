import type { ExecArgs } from "@medusajs/framework/types";
import { INTEGRATION_MODULE, IntegrationModuleService } from "@gorgo/medusa-integration";
import { ProviderKeys } from "../types";

// The provider identifier was "1c" until the paid 1C:Enterprise plugin took it over, so settings
// saved before that are keyed by `int_1c[_<instance>]`. Moves them to the current identifier once,
// when `medusa db:migrate` runs.
const LEGACY_PROVIDER_ID = "int_1c";

export default async function renameOnecProviderId({ container }: ExecArgs) {
  const logger = container.resolve("logger");
  const integrationService: IntegrationModuleService =
    container.resolve(INTEGRATION_MODULE);

  const integrations = await integrationService.listIntegrations(
    {},
    { select: ["id", "provider_id"] }
  );
  const providerIds = new Set(integrations.map((i) => i.provider_id));
  const updates = integrations
    .filter(
      (i) =>
        i.provider_id === LEGACY_PROVIDER_ID ||
        i.provider_id.startsWith(`${LEGACY_PROVIDER_ID}_`)
    )
    .map((i) => ({
      id: i.id,
      provider_id: `int_${ProviderKeys.ONEC}${i.provider_id.slice(LEGACY_PROVIDER_ID.length)}`,
    }))
    .filter((u) => !providerIds.has(u.provider_id));

  if (!updates.length) return;

  await integrationService.updateIntegrations(updates);
  logger.info(
    `Moved ${updates.length} 1C integration(s) from ${LEGACY_PROVIDER_ID} to int_${ProviderKeys.ONEC}`
  );
}
