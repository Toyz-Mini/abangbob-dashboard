/**
 * Screen 12 — Settings (11_DESIGN/SCREEN_SPEC.md).
 *
 * Read-only in this build. It exposes the versions and locked operational
 * limits an analysis depends on, because a user who cannot see which rule set
 * produced a finding cannot audit it.
 */

import { AppShell, PageHeader } from '@/components/app-shell'
import { Card, CardHeader, DefinitionRow, Pill } from '@/components/primitives'
import {
  AI_SCHEMA_VERSION,
  API_VERSION,
  CONFIDENCE_MODEL_VERSION,
  DIAGNOSTIC_ENGINE_VERSION,
  HEALTH_SCORE_VERSION,
  METRIC_VERSION,
  RULE_SET_VERSION,
} from '@/lib/contracts/versions'
import { IMPLEMENTED_RULES, SPEC_INCOMPLETE_RULES } from '@/lib/contracts/rule-catalog'
import { getAnalysisView } from '@/lib/view/analysis-view'

export const dynamic = 'force-dynamic'

export default function SettingsPage() {
  const view = getAnalysisView()

  return (
    <AppShell
      currentPath="/settings"
      shopName={view?.shop.name ?? 'No shop selected'}
      synthetic={view?.synthetic ?? false}
    >
      <PageHeader
        screenId="Screen 12"
        title="Settings"
        description="Shop configuration, contract versions and the operational limits every import and analysis runs under."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="Shop" />
          <dl>
            <DefinitionRow term="Name">{view?.shop.name ?? 'No shop selected'}</DefinitionRow>
            <DefinitionRow term="Currency">{view?.shop.currency ?? '—'}</DefinitionRow>
            <DefinitionRow term="Timezone">{view?.shop.timezone ?? '—'}</DefinitionRow>
          </dl>
        </Card>

        <Card>
          <CardHeader
            title="Contract versions"
            description="Persisted on every analysis snapshot so a finding can be replayed"
          />
          <dl>
            <DefinitionRow term="Metric semantics">{METRIC_VERSION}</DefinitionRow>
            <DefinitionRow term="Rule set">{RULE_SET_VERSION}</DefinitionRow>
            <DefinitionRow term="Diagnostic engine">{DIAGNOSTIC_ENGINE_VERSION}</DefinitionRow>
            <DefinitionRow term="Confidence model">{CONFIDENCE_MODEL_VERSION}</DefinitionRow>
            <DefinitionRow term="Health score">{HEALTH_SCORE_VERSION}</DefinitionRow>
            <DefinitionRow term="AI output schema">{AI_SCHEMA_VERSION}</DefinitionRow>
            <DefinitionRow term="API">{API_VERSION}</DefinitionRow>
          </dl>
        </Card>

        <Card>
          <CardHeader
            title="Rule coverage"
            description="Which P0 rules this build can actually evaluate"
          />
          <div className="mb-4 flex gap-2">
            <Pill>{IMPLEMENTED_RULES.length} implemented</Pill>
            <Pill tone="warning">{SPEC_INCOMPLETE_RULES.length} unspecified</Pill>
          </div>
          <ul className="space-y-1.5 text-sm">
            {IMPLEMENTED_RULES.map((rule) => (
              <li key={rule.id} className="flex gap-3 text-muted">
                <span aria-hidden="true" className="text-success">✓</span>
                <span>
                  <span className="text-content">{rule.id}</span> — {rule.name}
                </span>
              </li>
            ))}
            {SPEC_INCOMPLETE_RULES.map((rule) => (
              <li key={rule.id} className="flex gap-3 text-muted">
                <span aria-hidden="true" className="text-warning">▲</span>
                <span>
                  <span className="text-content">{rule.id}</span> — declared in MVP scope, no
                  trigger specified
                </span>
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader
            title="Operational limits"
            description="Locked in 01_PRODUCT/OPEN_DECISIONS.md; changing one requires an ADR"
          />
          <dl>
            <DefinitionRow term="Upload size">50 MB maximum</DefinitionRow>
            <DefinitionRow term="Rows per file">500,000 maximum</DefinitionRow>
            <DefinitionRow term="Concurrent imports per shop">2</DefinitionRow>
            <DefinitionRow term="Import timeout">15 minutes</DefinitionRow>
            <DefinitionRow term="Analysis timeout">10 minutes</DefinitionRow>
            <DefinitionRow term="API request timeout">30 seconds</DefinitionRow>
            <DefinitionRow term="Raw file retention">90 days</DefinitionRow>
            <DefinitionRow term="Analysis snapshot retention">24 months</DefinitionRow>
            <DefinitionRow term="Audit retention">24 months</DefinitionRow>
          </dl>
        </Card>
      </div>
    </AppShell>
  )
}
