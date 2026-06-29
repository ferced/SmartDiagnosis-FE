import { useState, useEffect } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Link from '@mui/material/Link';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import { alpha } from '@mui/material/styles';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import ToggleButton from '@mui/material/ToggleButton';
import LinearProgress from '@mui/material/LinearProgress';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

import { useSettingsContext } from 'src/components/settings';
import CustomBreadcrumbs from 'src/components/custom-breadcrumbs';

import { DiagnosisData, DiagnosisDetail, ClinicalConcept } from 'src/sections/product/view/types';

// ----------------------------------------------------------------------
// A realistic sample response that exercises every reasoning stage, so the page
// is always demonstrable (e.g. for the EIC panel) even with no recent case.
// 72yo male: new headache + jaw claudication + systemic inflammatory signs.
const SAMPLE: DiagnosisData = {
  disclaimer:
    'GMIS is a clinical decision-support tool. It assists, it does not replace clinical judgement. The physician accepts, modifies or overrides every output.',
  normalized_concepts: [
    { input: 'new headache', code: 'HP:0002315', name: 'Headache', system: 'HPO', url: 'https://hpo.jax.org/browse/term/HP:0002315' },
    { input: 'fatigue', code: 'HP:0012378', name: 'Fatigue', system: 'HPO', url: 'https://hpo.jax.org/browse/term/HP:0012378' },
    { input: 'low-grade fever', code: 'HP:0001945', name: 'Fever', system: 'HPO', url: 'https://hpo.jax.org/browse/term/HP:0001945' },
    { input: 'weight loss', code: 'HP:0001824', name: 'Weight loss', system: 'HPO', url: 'https://hpo.jax.org/browse/term/HP:0001824' },
    { input: 'visual disturbance', code: 'HP:0000505', name: 'Visual impairment', system: 'HPO', url: 'https://hpo.jax.org/browse/term/HP:0000505' },
  ],
  common_diagnoses: [
    {
      diagnosis: 'Giant cell arteritis',
      treatment: 'Start high-dose corticosteroids promptly; temporal artery biopsy to confirm.',
      probability: 'High (~70%)',
      discriminatorSymptoms: ['Jaw claudication', 'Scalp tenderness', 'Elevated ESR/CRP'],
      recommendedTests: ['ESR', 'CRP', 'Temporal artery ultrasound/biopsy'],
      symbolic_check: { status: 'ok' },
      independent_check: { agree: true, confidence: 'high', note: 'Age >50, jaw claudication and raised inflammatory markers strongly fit.', model: 'gpt-4o' },
      evidence_links: [
        { title: '2021 ACR/VF Guideline for the Management of Giant Cell Arteritis', source: 'PubMed', description: 'Arthritis Rheumatol, 2021', pmid: '34235884', url: 'https://pubmed.ncbi.nlm.nih.gov/34235884/', verified: true },
      ],
    },
    {
      diagnosis: 'Polymyalgia rheumatica',
      treatment: 'Low-dose corticosteroids; monitor response.',
      probability: 'Moderate (~20%)',
      discriminatorSymptoms: ['Shoulder/hip girdle stiffness'],
      recommendedTests: ['ESR', 'CRP'],
      symbolic_check: { status: 'ok' },
      independent_check: { agree: true, confidence: 'medium', note: 'Commonly overlaps with GCA; plausible but secondary.', model: 'gpt-4o' },
    },
    {
      diagnosis: 'Tension headache',
      treatment: 'Simple analgesia; address triggers.',
      probability: 'Low (~10%)',
      symbolic_check: { status: 'ok' },
      independent_check: { agree: false, confidence: 'low', note: 'Does not explain systemic inflammatory signs or visual disturbance.', model: 'gpt-4o' },
    },
  ],
  rare_diagnoses: [],
  follow_up_questions: [],
  ruled_out: [
    {
      diagnosis: 'Ectopic pregnancy',
      treatment: '',
      probability: '',
      symbolic_check: {
        status: 'blocked',
        rule: 'anatomy.female-only-in-male',
        reason: 'Requiere anatomía reproductiva femenina; el paciente es de sexo masculino.',
      },
    },
  ],
  evidence_grounded: true,
  independently_verified: true,
  abstained: false,
  top_confidence: '70%',
};

// ----------------------------------------------------------------------

function parsePct(s?: string): number | null {
  if (!s) return null;
  const m = s.match(/(\d{1,3})\s*%/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? Math.min(100, Math.max(0, n)) : null;
}

// Pull the DiagnosisData out of whatever was stored (the backend wraps it as
// { conversationId, diagnoses } but tolerate the bare shape too).
function extractData(raw: any): DiagnosisData | null {
  if (!raw || typeof raw !== 'object') return null;
  if (raw.diagnoses && typeof raw.diagnoses === 'object') return raw.diagnoses as DiagnosisData;
  if (Array.isArray(raw.common_diagnoses)) return raw as DiagnosisData;
  return null;
}

// ----------------------------------------------------------------------

type StageProps = {
  index: number;
  title: string;
  subtitle: string;
  color: string;
  ran: boolean;
  children: React.ReactNode;
};

function Stage({ index, title, subtitle, color, ran, children }: StageProps) {
  return (
    <Stack direction="row" spacing={2.5} sx={{ position: 'relative' }}>
      {/* rail */}
      <Stack alignItems="center" sx={{ minWidth: 40 }}>
        <Box
          sx={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            flexShrink: 0,
            display: 'grid',
            placeItems: 'center',
            fontWeight: 800,
            color: '#fff',
            bgcolor: color,
            boxShadow: (theme) => `0 0 0 4px ${alpha(color, 0.15)}`,
          }}
        >
          {index}
        </Box>
        <Box sx={{ flex: 1, width: 2, my: 1, bgcolor: 'divider' }} />
      </Stack>

      {/* body */}
      <Box sx={{ flex: 1, pb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
          <Typography variant="h6">{title}</Typography>
          <Chip
            size="small"
            label={ran ? 'LIVE' : 'no se ejecutó'}
            sx={{
              height: 20,
              fontSize: 11,
              fontWeight: 700,
              color: ran ? 'success.dark' : 'text.disabled',
              bgcolor: (theme) =>
                ran ? alpha(theme.palette.success.main, 0.16) : alpha(theme.palette.grey[500], 0.16),
            }}
          />
        </Stack>
        <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, mb: 1.5 }}>
          {subtitle}
        </Typography>
        {children}
      </Box>
    </Stack>
  );
}

// ----------------------------------------------------------------------

export default function HowItWorksView() {
  const settings = useSettingsContext();

  const [stored, setStored] = useState<DiagnosisData | null>(null);
  const [source, setSource] = useState<'real' | 'sample'>('sample');

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('lastDiagnosisResponse');
      if (raw) {
        const data = extractData(JSON.parse(raw));
        if (data && Array.isArray(data.common_diagnoses) && data.common_diagnoses.length) {
          setStored(data);
          setSource('real');
        }
      }
    } catch (e) {
      /* ignore malformed storage */
    }
  }, []);

  const data = source === 'real' && stored ? stored : SAMPLE;

  const common = data.common_diagnoses || [];
  const ruledOut = data.ruled_out || [];
  const concepts: ClinicalConcept[] = data.normalized_concepts || [];
  const groundedLinks = common
    .flatMap((d) => (d.evidence_links || []).map((l) => ({ ...l, dx: d.diagnosis })))
    .filter((l) => l.verified);
  const independent = common.filter((d) => d.independent_check);

  const C = {
    neural: '#1b4965',
    symbolic: '#8957d6',
    independent: '#1f8a8a',
    evidence: '#3a6ee0',
    gate: '#c98a14',
  };

  return (
    <Container maxWidth={settings.themeStretch ? false : 'lg'}>
      <CustomBreadcrumbs
        heading="How it works"
        links={[{ name: 'Dashboard', href: '/dashboard' }, { name: 'How it works' }]}
        sx={{ mb: { xs: 3, md: 4 } }}
      />

      <Card sx={{ p: 3, mb: 3, bgcolor: (t) => alpha(t.palette.primary.main, 0.04) }}>
        <Typography variant="h5" gutterBottom>
          GMIS razona — y muestra su trabajo
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
          Esta página descompone la <b>cadena de razonamiento real</b> de un diagnóstico, etapa por
          etapa. El modelo neuronal <b>propone</b>; las capas simbólica e independiente{' '}
          <b>verifican</b>; la evidencia se <b>ancla a PubMed</b>; los síntomas se{' '}
          <b>normalizan a conceptos estándar (HPO)</b>; y el confidence gate <b>se abstiene</b> antes
          que adivinar. Nada de caja negra.
        </Typography>

        <ToggleButtonGroup
          size="small"
          exclusive
          value={source}
          onChange={(_, v) => v && setSource(v)}
        >
          <ToggleButton value="real" disabled={!stored}>
            Última respuesta real
          </ToggleButton>
          <ToggleButton value="sample">Caso de ejemplo</ToggleButton>
        </ToggleButtonGroup>
        {!stored && (
          <Typography variant="caption" sx={{ display: 'block', mt: 1, color: 'text.disabled' }}>
            Generá un diagnóstico en “New Diagnosis” y volvé acá para ver la cadena real de ese caso.
          </Typography>
        )}
      </Card>

      <Card sx={{ p: { xs: 2.5, md: 4 } }}>
        {/* Stage 1 — Neural */}
        <Stage
          index={1}
          title="Razonamiento neural"
          subtitle="Fusiona los datos del paciente y normaliza cada síntoma a un concepto clínico estándar (HPO). Así el caso queda anclado en un vocabulario auditable, no en texto libre."
          color={C.neural}
          ran={concepts.length > 0}
        >
          {concepts.length ? (
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {concepts.map((c) => (
                <Chip
                  key={c.code + c.input}
                  component={c.url ? Link : 'div'}
                  href={c.url}
                  target="_blank"
                  clickable={!!c.url}
                  variant="outlined"
                  label={
                    <span>
                      <b>{c.name}</b>{' '}
                      <span style={{ opacity: 0.6 }}>· {c.code}</span>
                    </span>
                  }
                  title={`"${c.input}" → ${c.system} ${c.code}`}
                />
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.disabled">
              Sin conceptos normalizados en esta respuesta.
            </Typography>
          )}
        </Stage>

        {/* Stage 2 — Symbolic */}
        <Stage
          index={2}
          title="Verificación simbólica"
          subtitle="Revisa cada candidato contra reglas duras de consistencia clínica y descarta lo imposible para este paciente — con el motivo. Esto es lo que hace al sistema auditable."
          color={C.symbolic}
          ran
        >
          {ruledOut.length ? (
            <Stack spacing={1}>
              {ruledOut.map((d) => (
                <Alert key={d.diagnosis} severity="error" variant="outlined" sx={{ py: 0.5 }}>
                  <b>{d.diagnosis}</b> — descartado.{' '}
                  {d.symbolic_check?.reason}
                  {d.symbolic_check?.rule && (
                    <Typography variant="caption" sx={{ display: 'block', opacity: 0.7 }}>
                      regla: {d.symbolic_check.rule}
                    </Typography>
                  )}
                </Alert>
              ))}
            </Stack>
          ) : (
            <Alert severity="success" variant="outlined" sx={{ py: 0.5 }}>
              Todos los candidatos pasaron la verificación de consistencia (ninguno anatómicamente
              imposible para este paciente).
            </Alert>
          )}
        </Stage>

        {/* Stage 3 — Independent verification */}
        <Stage
          index={3}
          title="Verificación independiente"
          subtitle="Un SEGUNDO modelo, distinto del primario, revisa el diferencial y vota si cada diagnóstico es plausible. El sistema no se auto-confirma."
          color={C.independent}
          ran={data.independently_verified || independent.length > 0}
        >
          {independent.length ? (
            <Stack spacing={1.5}>
              {independent.map((d) => {
                const v = d.independent_check!;
                return (
                  <Box
                    key={d.diagnosis}
                    sx={{ p: 1.5, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}
                  >
                    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                      <Chip
                        size="small"
                        label={v.agree ? '✓ De acuerdo' : '✕ En desacuerdo'}
                        color={v.agree ? 'success' : 'error'}
                        variant="soft"
                      />
                      <Typography variant="subtitle2">{d.diagnosis}</Typography>
                      {v.confidence && (
                        <Chip size="small" variant="outlined" label={`confianza: ${v.confidence}`} />
                      )}
                      {v.model && (
                        <Typography variant="caption" color="text.disabled">
                          · {v.model}
                        </Typography>
                      )}
                    </Stack>
                    {v.note && (
                      <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5 }}>
                        {v.note}
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.disabled">
              La verificación independiente no se ejecutó para esta respuesta.
            </Typography>
          )}
        </Stage>

        {/* Stage 4 — Evidence grounding */}
        <Stage
          index={4}
          title="Anclaje de evidencia (PubMed)"
          subtitle="Reemplaza las citas generadas por el modelo con artículos reales de PubMed: cada cita resuelve a un PMID existente y verificable."
          color={C.evidence}
          ran={!!data.evidence_grounded || groundedLinks.length > 0}
        >
          {groundedLinks.length ? (
            <Stack spacing={1}>
              {groundedLinks.map((l) => (
                <Box
                  key={l.pmid}
                  sx={{ p: 1.5, borderRadius: 1.5, border: '1px solid', borderColor: 'divider' }}
                >
                  <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                    <Chip size="small" color="info" variant="soft" label="PubMed verificado" />
                    <Typography variant="caption" color="text.disabled">
                      PMID {l.pmid} · para {l.dx}
                    </Typography>
                  </Stack>
                  <Link href={l.url} target="_blank" variant="subtitle2" sx={{ display: 'block', mt: 0.5 }}>
                    {l.title}
                  </Link>
                  <Typography variant="caption" color="text.secondary">
                    {l.description}
                  </Typography>
                </Box>
              ))}
            </Stack>
          ) : (
            <Typography variant="body2" color="text.disabled">
              Sin citas verificadas contra PubMed en esta respuesta.
            </Typography>
          )}
        </Stage>

        {/* Stage 5 — Confidence gate + ranked output */}
        <Stage
          index={5}
          title="Confidence gate y salida"
          subtitle="Si la confianza es baja o los diferenciales son indistinguibles, el sistema se abstiene en vez de adivinar. Si no, entrega el diferencial rankeado."
          color={C.gate}
          ran
        >
          {data.abstained ? (
            <Alert severity="warning" variant="outlined">
              <b>El sistema se abstuvo.</b> {data.abstention_reason}
            </Alert>
          ) : (
            <>
              {data.top_confidence && (
                <Typography variant="body2" sx={{ mb: 1.5 }}>
                  Confianza del diagnóstico principal: <b>{data.top_confidence}</b> — por encima del
                  umbral, así que el sistema responde.
                </Typography>
              )}
              <Stack spacing={1.5}>
                {common.map((d: DiagnosisDetail, i) => {
                  const pct = parsePct(d.probability);
                  return (
                    <Box key={d.diagnosis}>
                      <Stack direction="row" justifyContent="space-between" alignItems="baseline">
                        <Typography variant="subtitle2">
                          {i + 1}. {d.diagnosis}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {d.probability}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={pct ?? (i === 0 ? 70 : 25)}
                        sx={{ height: 8, borderRadius: 1, mt: 0.5 }}
                      />
                    </Box>
                  );
                })}
              </Stack>
            </>
          )}
        </Stage>

        <Divider sx={{ mb: 2 }} />
        <Typography variant="caption" color="text.secondary">
          {data.disclaimer}
        </Typography>
      </Card>
    </Container>
  );
}
