import { m } from 'framer-motion';

import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';

import { Wordmark, LANDING as T } from './tokens';

/**
 * Public landing of SmartDiagnosis.
 *
 * Every claim on this page maps to something the engine actually does today
 * (see the backend pipeline: symbolic verification, independent verifier,
 * PubMed / RxNorm / HPO grounding, evidence gate, confidence gate, hash-chained
 * audit trail). Nothing here promises certification, accuracy figures or
 * modalities that are still on the roadmap. Keep it that way.
 */

// ── Motion ──────────────────────────────────────────────────────────────
const rise = {
  hidden: { opacity: 0, y: 22 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] },
  }),
};
const inView = { once: true, amount: 0.25 } as const;

// ── Content ─────────────────────────────────────────────────────────────
const REFUSALS = [
  {
    n: '01',
    title: 'Close a diagnosis on a value nobody measured.',
    body: 'Before a differential can be called, the engine checks which findings it depends on. If one was never measured, the diagnosis stays provisional, its confidence is capped at 40% and the answer becomes "work-up first", with the exact tests listed.',
    label: 'Evidence gate',
    color: T.provisional,
  },
  {
    n: '02',
    title: 'Guess when the differentials cannot be told apart.',
    body: 'When the leading hypothesis sits below 45% confidence, or two candidates are indistinguishable on the available data, the engine abstains and says why. Not knowing is a valid output.',
    label: 'Confidence gate',
    color: T.ruledOut,
  },
  {
    n: '03',
    title: 'Cite a paper that does not exist.',
    body: 'Model-generated references are replaced by real PubMed records, each with a resolvable PMID. Drug names resolve to RxNorm concepts; findings are mapped to HPO terms. What cannot be verified is flagged, not presented as fact.',
    label: 'Grounding',
    color: T.verified,
  },
];

const STAGES = [
  {
    id: 'Neural reasoning',
    text: 'Two model calls in parallel: common differentials and rare ones. Prior tests and treatments are part of the prompt, so nothing already done is recommended again.',
  },
  {
    id: 'Finding normalization',
    text: 'Free-text symptoms are mapped to Human Phenotype Ontology concepts, so the case is anchored to a standard vocabulary rather than to prose.',
  },
  {
    id: 'Symbolic verification',
    text: 'Hard rules of clinical consistency discard impossible candidates for this patient, with the rule that fired.',
  },
  {
    id: 'Independent verification',
    text: 'A second, different model reviews the differential and votes on each diagnosis. The system does not confirm itself.',
  },
  {
    id: 'Literature grounding',
    text: 'Every reference is resolved against PubMed. Citations that do not resolve are dropped; the ones that remain carry a verifiable PMID.',
  },
  {
    id: 'Drug grounding',
    text: 'Each drug in an interaction resolves to an RxNorm concept. A name that fails to resolve is marked unverified instead of shown as a fact.',
  },
  {
    id: 'Evidence gate',
    text: 'No differential is closed while a finding it depends on is missing. Pending items cap confidence and turn the answer into a work-up plan.',
  },
  {
    id: 'Confidence gate',
    text: 'Low or indistinguishable confidence means abstention, with the reason. Otherwise, the ranked differential is released.',
  },
  {
    id: 'Audit trail',
    text: 'Each case writes a hash-chained entry: what every stage did, and the decision the engine deliberately did not take. Edits and deletions are detectable.',
  },
];

const OUTPUT = [
  ['Ranked differential', 'Common and rare candidates, each with probability, prevalence and the symptoms that discriminate it from its neighbours.'],
  ['Work-up before conclusions', 'The tests a diagnosis depends on, and what each one would change. Provisional means provisional.'],
  ['Treatment at class level', 'Drug classes, decision criteria, contraindications and monitoring. No dosing schedules: that is a boundary of intended use, not a gap.'],
  ['Interactions, verified', 'Interactions with the patient’s current medication, severity-graded, with both drugs resolved to RxNorm.'],
  ['Evidence you can open', 'PubMed references with PMIDs, attached to the diagnosis they support.'],
  ['Follow-up that stops', 'Targeted questions for up to three rounds; once history is sufficient, or the clinician asks for tests, the engine commits.'],
];

const EUROPE = [
  {
    k: 'Data residency',
    title: 'Frankfurt, end to end.',
    body: 'API, database and document storage run in the eu-central-1 region. Patient documents never leave the EU; fonts are served from an EU mirror.',
  },
  {
    k: 'Documentation path',
    title: 'Auditable by design.',
    body: 'The tamper-evident trail records inputs (hashed, no PII), every verification stage and every abstention: the material a medical-device technical file and AI Act transparency obligations ask for.',
  },
  {
    k: 'Second opinion',
    title: 'A verifier you can host.',
    body: 'The independent verifier can point at an open-weight model hosted inside the EU, so the second opinion does not depend on a single vendor or jurisdiction.',
  },
  {
    k: 'Access',
    title: 'Roles, limits and logs.',
    body: 'Admin, manager and clinician roles; per-user usage limits; activity logs with retention rules. Accounts are created by an administrator, not self-registered.',
  },
];

/**
 * Illustrative case for the hero. Each row shows a real mechanism of the
 * engine: a leading diagnosis with a verified PMID (26926407 is a real
 * PubMed record on acute bacterial prostatitis), a provisional one capped by
 * the evidence gate, and one discarded by the symbolic verifier's
 * sex/anatomy rule. The interaction is a real, high-severity pair.
 */
const CASE = {
  header: 'Case · 34 M · fever, perineal pain, dysuria · on warfarin',
  rows: [
    {
      name: 'Acute bacterial prostatitis',
      p: '66%',
      state: 'Leading',
      color: T.verified,
      notes: ['PubMed · PMID 26926407 · verified', 'Second model: agrees'],
    },
    {
      name: 'Diverticulitis',
      p: '40%',
      state: 'Provisional · capped',
      color: T.provisional,
      notes: ['Work-up first: CT abdomen/pelvis, CBC, CRP'],
    },
    {
      name: 'Pelvic inflammatory disease',
      p: '—',
      state: 'Ruled out',
      color: T.ruledOut,
      notes: ['Symbolic rule: anatomically incompatible for a male patient'],
    },
  ],
  footer: [
    'Ciprofloxacin × warfarin → both resolved to RxNorm · severity high',
    'Audit entry written · hash-chained · provisional: 1 · work-up first',
  ],
};

// ── Small pieces ────────────────────────────────────────────────────────
function Eyebrow({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <Typography
      component="p"
      sx={{
        fontFamily: T.mono,
        fontSize: 11.5,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        color: light ? 'rgba(245,242,236,0.6)' : T.ink3,
        mb: 2.5,
      }}
    >
      {children}
    </Typography>
  );
}

function Statement({
  children,
  light = false,
  size = 'md',
}: {
  children: React.ReactNode;
  light?: boolean;
  size?: 'md' | 'lg';
}) {
  return (
    <Typography
      component="h2"
      sx={{
        fontFamily: T.serif,
        fontWeight: 400,
        letterSpacing: '-0.02em',
        lineHeight: 1.05,
        fontSize: size === 'lg' ? { xs: 40, sm: 52, md: 64 } : { xs: 34, sm: 42, md: 50 },
        color: light ? T.paper : T.ink,
        textWrap: 'balance',
      }}
    >
      {children}
    </Typography>
  );
}

function Body({ children, light = false, sx = {} }: { children: React.ReactNode; light?: boolean; sx?: object }) {
  return (
    <Typography
      sx={{
        fontFamily: T.sans,
        fontSize: { xs: 16, md: 17 },
        lineHeight: 1.6,
        color: light ? 'rgba(245,242,236,0.72)' : T.ink2,
        ...sx,
      }}
    >
      {children}
    </Typography>
  );
}

function CaseDossier() {
  return (
    <Box
      sx={{
        border: `1px solid ${T.hairline}`,
        bgcolor: '#FBF9F5',
        boxShadow: '0 30px 60px -30px rgba(20,24,28,0.35)',
        fontFamily: T.sans,
      }}
    >
      <Box sx={{ px: 2.5, py: 1.75, borderBottom: `1px solid ${T.hairline}`, display: 'flex', justifyContent: 'space-between', gap: 2 }}>
        <Typography sx={{ fontFamily: T.mono, fontSize: 11.5, color: T.ink2, letterSpacing: '0.02em' }}>
          {CASE.header}
        </Typography>
        <Typography sx={{ fontFamily: T.mono, fontSize: 11.5, color: T.ink3, whiteSpace: 'nowrap' }}>
          differential
        </Typography>
      </Box>

      {CASE.rows.map((row, i) => (
        <m.div key={row.name} initial="hidden" animate="visible" variants={rise} custom={i + 4}>
          <Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${T.hairline}` }}>
            <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={2}>
              <Typography sx={{ fontFamily: T.serif, fontSize: 21, color: row.color === T.ruledOut ? T.ink3 : T.ink, textDecoration: row.color === T.ruledOut ? 'line-through' : 'none', textDecorationThickness: 1 }}>
                {row.name}
              </Typography>
              <Typography sx={{ fontFamily: T.mono, fontSize: 14, color: row.color, whiteSpace: 'nowrap' }}>
                {row.p}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.75, flexWrap: 'wrap', rowGap: 0.5 }}>
              <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.75, fontFamily: T.mono, fontSize: 11, color: row.color, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: row.color }} />
                {row.state}
              </Box>
              {row.notes.map((n) => (
                <Typography key={n} sx={{ fontFamily: T.sans, fontSize: 12.5, color: T.ink2 }}>
                  {n}
                </Typography>
              ))}
            </Stack>
          </Box>
        </m.div>
      ))}

      <m.div initial="hidden" animate="visible" variants={rise} custom={8}>
        <Box sx={{ px: 2.5, py: 1.75, bgcolor: T.paper2 }}>
          {CASE.footer.map((f) => (
            <Typography key={f} sx={{ fontFamily: T.mono, fontSize: 11.5, color: T.ink2, lineHeight: 1.7 }}>
              {f}
            </Typography>
          ))}
        </Box>
      </m.div>
    </Box>
  );
}

// ── Page ────────────────────────────────────────────────────────────────
export default function LandingView() {
  return (
    <Box sx={{ bgcolor: T.paper, color: T.ink, overflowX: 'hidden' }}>
      {/* ═══ HERO ═══ */}
      <Box
        component="section"
        sx={{
          position: 'relative',
          pt: { xs: 15, md: 20 },
          pb: { xs: 10, md: 14 },
          backgroundImage: `radial-gradient(${T.hairline} 0.8px, transparent 0.8px)`,
          backgroundSize: '22px 22px',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, rgba(245,242,236,0.2) 0%, ${T.paper} 85%)`,
            pointerEvents: 'none',
          }}
        />
        <Container maxWidth="lg" sx={{ position: 'relative' }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' }, gap: { xs: 6, md: 8 }, alignItems: 'center' }}>
            <Box>
              <m.div initial="hidden" animate="visible" variants={rise} custom={0}>
                <Eyebrow>Clinical decision support &middot; Differential diagnosis</Eyebrow>
              </m.div>
              <m.div initial="hidden" animate="visible" variants={rise} custom={1}>
                <Typography
                  component="h1"
                  sx={{
                    fontFamily: T.serif,
                    fontWeight: 400,
                    fontSize: { xs: 44, sm: 58, md: 72 },
                    lineHeight: 1.0,
                    letterSpacing: '-0.025em',
                    textWrap: 'balance',
                    mb: 3.5,
                  }}
                >
                  A differential that shows its evidence,{' '}
                  <Box component="em" sx={{ fontStyle: 'italic', color: T.verified }}>
                    and knows when to stop.
                  </Box>
                </Typography>
              </m.div>
              <m.div initial="hidden" animate="visible" variants={rise} custom={2}>
                <Body sx={{ maxWidth: 560, fontSize: { xs: 17, md: 19 }, mb: 4.5 }}>
                  SmartDiagnosis turns a patient presentation into a ranked differential with
                  verified literature, checked drug names and standardized findings. When the
                  evidence is not there, it says so instead of guessing.
                </Body>
              </m.div>
              <m.div initial="hidden" animate="visible" variants={rise} custom={3}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
                  <Button
                    component={RouterLink}
                    href="/demo"
                    sx={{
                      fontFamily: T.sans,
                      fontWeight: 500,
                      fontSize: 15,
                      px: 3,
                      py: 1.4,
                      borderRadius: 999,
                      bgcolor: T.ink,
                      color: T.paper,
                      '&:hover': { bgcolor: '#2A3036' },
                    }}
                  >
                    Walk through a case
                  </Button>
                  <Button
                    component={RouterLink}
                    href="/auth/jwt/login"
                    sx={{
                      fontFamily: T.sans,
                      fontWeight: 500,
                      fontSize: 15,
                      px: 2,
                      color: T.ink,
                      '&:hover': { bgcolor: 'rgba(20,24,28,0.05)' },
                    }}
                  >
                    Sign in &rarr;
                  </Button>
                </Stack>
              </m.div>
              <m.div initial="hidden" animate="visible" variants={rise} custom={5}>
                <Stack direction="row" spacing={3} sx={{ mt: 6, flexWrap: 'wrap', rowGap: 1 }}>
                  {['Abstains below 45% confidence', 'PubMed, RxNorm and HPO grounded', 'Hosted in Frankfurt'].map((f) => (
                    <Typography key={f} sx={{ fontFamily: T.mono, fontSize: 12, color: T.ink3, letterSpacing: '0.02em' }}>
                      &mdash; {f}
                    </Typography>
                  ))}
                </Stack>
              </m.div>
            </Box>

            <m.div initial="hidden" animate="visible" variants={rise} custom={3}>
              <CaseDossier />
            </m.div>
          </Box>
        </Container>
      </Box>

      {/* ═══ THE THREE REFUSALS ═══ */}
      <Box id="gates" component="section" sx={{ bgcolor: T.ink, color: T.paper, py: { xs: 10, md: 14 } }}>
        <Container maxWidth="lg">
          <m.div initial="hidden" whileInView="visible" viewport={inView} variants={rise}>
            <Eyebrow light>Safety is the product</Eyebrow>
            <Statement light size="lg">Three things the engine refuses to do.</Statement>
            <Body light sx={{ maxWidth: 620, mt: 3 }}>
              Most medical AI is judged on how often it is right. We also engineered how it behaves
              when it cannot be: each refusal is a deterministic stage in the pipeline, with tests,
              not a line in a prompt.
            </Body>
          </m.div>
          <Box sx={{ mt: { xs: 6, md: 9 }, display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 0, borderTop: '1px solid rgba(245,242,236,0.16)' }}>
            {REFUSALS.map((r, i) => (
              <m.div key={r.n} initial="hidden" whileInView="visible" viewport={inView} variants={rise} custom={i}>
                <Box
                  sx={{
                    pt: 4,
                    pb: { xs: 5, md: 2 },
                    pr: { md: 5 },
                    borderRight: { md: i < 2 ? '1px solid rgba(245,242,236,0.16)' : 'none' },
                    pl: { md: i > 0 ? 5 : 0 },
                    height: '100%',
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 3 }}>
                    <Typography sx={{ fontFamily: T.mono, fontSize: 13, color: 'rgba(245,242,236,0.5)' }}>{r.n}</Typography>
                    <Typography sx={{ fontFamily: T.mono, fontSize: 11, letterSpacing: '0.14em', textTransform: 'uppercase', color: r.color, filter: 'brightness(1.5)' }}>
                      {r.label}
                    </Typography>
                  </Stack>
                  <Typography sx={{ fontFamily: T.serif, fontSize: { xs: 27, md: 30 }, lineHeight: 1.15, letterSpacing: '-0.015em', mb: 2.5, textWrap: 'balance' }}>
                    {r.title}
                  </Typography>
                  <Body light sx={{ fontSize: 15.5 }}>{r.body}</Body>
                </Box>
              </m.div>
            ))}
          </Box>
        </Container>
      </Box>

      {/* ═══ THE ENGINE ═══ */}
      <Box id="engine" component="section" sx={{ py: { xs: 10, md: 14 } }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' }, gap: { xs: 5, md: 10 } }}>
            <Box sx={{ position: { md: 'sticky' }, top: { md: 110 }, alignSelf: 'start' }}>
              <m.div initial="hidden" whileInView="visible" viewport={inView} variants={rise}>
                <Eyebrow>How a case moves through the engine</Eyebrow>
                <Statement>The model proposes. Nine stages check, ground and record.</Statement>
                <Body sx={{ mt: 3 }}>
                  A neural model is good at generating hypotheses and bad at knowing what it does
                  not know. So the hypotheses go through a fixed sequence of symbolic checks,
                  external sources and gates before a clinician sees them.
                </Body>
                <Typography sx={{ fontFamily: T.mono, fontSize: 12.5, color: T.ink3, mt: 3, lineHeight: 1.7 }}>
                  Every stage is switchable and fails open: a stage error never blocks the
                  clinician, it only removes that stage&apos;s guarantee from the audit entry.
                </Typography>
              </m.div>
            </Box>
            <Box component="ol" sx={{ listStyle: 'none', m: 0, p: 0, borderTop: `1px solid ${T.hairline}` }}>
              {STAGES.map((s, i) => (
                <m.li key={s.id} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.4 }} variants={rise} custom={0}>
                  <Box
                    sx={{
                      display: 'grid',
                      gridTemplateColumns: { xs: '40px 1fr', sm: '56px 200px 1fr' },
                      gap: { xs: 1.5, sm: 3 },
                      py: 2.75,
                      borderBottom: `1px solid ${T.hairline}`,
                      alignItems: 'baseline',
                    }}
                  >
                    <Typography sx={{ fontFamily: T.mono, fontSize: 12.5, color: T.ink3 }}>
                      {String(i + 1).padStart(2, '0')}
                    </Typography>
                    <Typography sx={{ fontFamily: T.serif, fontSize: 21, lineHeight: 1.2, color: T.ink }}>
                      {s.id}
                    </Typography>
                    <Typography sx={{ fontFamily: T.sans, fontSize: 15, lineHeight: 1.6, color: T.ink2, gridColumn: { xs: '2', sm: 'auto' } }}>
                      {s.text}
                    </Typography>
                  </Box>
                </m.li>
              ))}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ═══ OUTPUT ═══ */}
      <Box id="output" component="section" sx={{ bgcolor: T.paper2, py: { xs: 10, md: 14 } }}>
        <Container maxWidth="lg">
          <m.div initial="hidden" whileInView="visible" viewport={inView} variants={rise}>
            <Eyebrow>What the clinician gets back</Eyebrow>
            <Statement>A working document, not a verdict.</Statement>
          </m.div>
          <Box sx={{ mt: { xs: 5, md: 8 }, display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(3, 1fr)' }, gap: { xs: 4, md: 6 } }}>
            {OUTPUT.map(([title, body], i) => (
              <m.div key={title} initial="hidden" whileInView="visible" viewport={inView} variants={rise} custom={i % 3}>
                <Box sx={{ borderTop: `1px solid ${T.ink}`, pt: 2.5 }}>
                  <Typography sx={{ fontFamily: T.serif, fontSize: 24, lineHeight: 1.15, mb: 1.5 }}>{title}</Typography>
                  <Typography sx={{ fontFamily: T.sans, fontSize: 15, lineHeight: 1.6, color: T.ink2 }}>{body}</Typography>
                </Box>
              </m.div>
            ))}
          </Box>
          <m.div initial="hidden" whileInView="visible" viewport={inView} variants={rise}>
            <Box sx={{ mt: { xs: 6, md: 9 }, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 4, alignItems: 'end' }}>
              <Body>
                Documents and images travel with the case: reports, prior labs, imaging. They are
                stored per conversation, in the EU, and fed to the reasoning stage only. Prior tests
                and treatments are remembered across rounds, so the plan escalates instead of
                repeating itself.
              </Body>
              <Button
                component={RouterLink}
                href="/demo"
                sx={{ fontFamily: T.sans, fontWeight: 500, fontSize: 15, color: T.ink, justifySelf: { md: 'end' }, px: 0, '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}
              >
                See the full response on a sample case &rarr;
              </Button>
            </Box>
          </m.div>
        </Container>
      </Box>

      {/* ═══ EUROPE ═══ */}
      <Box id="europe" component="section" sx={{ py: { xs: 10, md: 14 } }}>
        <Container maxWidth="lg">
          <m.div initial="hidden" whileInView="visible" viewport={inView} variants={rise}>
            <Eyebrow>Built for European clinical settings</Eyebrow>
            <Statement>Decision support that can be inspected, hosted and governed.</Statement>
          </m.div>
          <Box sx={{ mt: { xs: 5, md: 8 }, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            {EUROPE.map((e, i) => (
              <m.div key={e.k} initial="hidden" whileInView="visible" viewport={inView} variants={rise} custom={i}>
                <Box sx={{ border: `1px solid ${T.hairline}`, bgcolor: '#FBF9F5', p: { xs: 3, md: 4 }, height: '100%' }}>
                  <Typography sx={{ fontFamily: T.mono, fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.ink3, mb: 2 }}>
                    {e.k}
                  </Typography>
                  <Typography sx={{ fontFamily: T.serif, fontSize: 28, lineHeight: 1.1, mb: 1.75, letterSpacing: '-0.01em' }}>{e.title}</Typography>
                  <Typography sx={{ fontFamily: T.sans, fontSize: 15.5, lineHeight: 1.6, color: T.ink2 }}>{e.body}</Typography>
                </Box>
              </m.div>
            ))}
          </Box>
          <m.div initial="hidden" whileInView="visible" viewport={inView} variants={rise}>
            <Box sx={{ mt: 4, p: { xs: 3, md: 4 }, border: `1px solid ${T.hairline}`, display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 2fr' }, gap: { xs: 2, md: 6 } }}>
              <Typography sx={{ fontFamily: T.mono, fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.ink3 }}>
                Intended use
              </Typography>
              <Typography sx={{ fontFamily: T.sans, fontSize: 15.5, lineHeight: 1.65, color: T.ink2 }}>
                SmartDiagnosis is decision support for qualified clinicians. It does not diagnose
                autonomously and it does not replace clinical judgment. It is not yet a certified
                medical device: the pipeline, the treatment scope and the audit trail are designed
                to make that path documentable, and every response carries that disclaimer.
              </Typography>
            </Box>
          </m.div>
        </Container>
      </Box>

      {/* ═══ MEASURED ═══ */}
      <Box component="section" sx={{ bgcolor: T.ink, color: T.paper, py: { xs: 10, md: 14 } }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' }, gap: { xs: 5, md: 10 } }}>
            <m.div initial="hidden" whileInView="visible" viewport={inView} variants={rise}>
              <Eyebrow light>Measured, not asserted</Eyebrow>
              <Statement light>Numbers you can re-run.</Statement>
            </m.div>
            <m.div initial="hidden" whileInView="visible" viewport={inView} variants={rise} custom={1}>
              <Stack spacing={3.5} sx={{ borderLeft: '1px solid rgba(245,242,236,0.2)', pl: { xs: 3, md: 5 } }}>
                {[
                  ['Reproducible benchmark', 'Accuracy is computed by a scoring harness (top-1 / top-5) over a fixed case set, offline from saved predictions or live against the API. The same cases can be run again by anyone with access.'],
                  ['Live source tests', 'The PubMed, RxNorm and HPO integrations are tested against the real services, not mocks only, so a source changing shape is caught before a clinician is.'],
                  ['Independent clinical review', 'The production system is exercised by an external clinical reviewer on real-shaped cases, including the cases where the correct output is to abstain.'],
                ].map(([t, b]) => (
                  <Box key={t}>
                    <Typography sx={{ fontFamily: T.serif, fontSize: 24, lineHeight: 1.15, mb: 1 }}>{t}</Typography>
                    <Body light sx={{ fontSize: 15.5 }}>{b}</Body>
                  </Box>
                ))}
              </Stack>
            </m.div>
          </Box>
        </Container>
      </Box>

      {/* ═══ CLOSE ═══ */}
      <Box component="section" sx={{ py: { xs: 12, md: 18 }, textAlign: 'center' }}>
        <Container maxWidth="md">
          <m.div initial="hidden" whileInView="visible" viewport={inView} variants={rise}>
            <Statement size="lg">See a case go through the engine.</Statement>
            <Body sx={{ mt: 3, mx: 'auto', maxWidth: 520 }}>
              A guided sample case shows every stage, every verification and the response a
              clinician would receive. No account needed.
            </Body>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center" sx={{ mt: 5 }}>
              <Button
                component={RouterLink}
                href="/demo"
                sx={{ fontFamily: T.sans, fontWeight: 500, fontSize: 15, px: 3.5, py: 1.4, borderRadius: 999, bgcolor: T.ink, color: T.paper, '&:hover': { bgcolor: '#2A3036' } }}
              >
                Walk through a case
              </Button>
              <Button
                component={RouterLink}
                href="/auth/jwt/login"
                variant="outlined"
                sx={{ fontFamily: T.sans, fontWeight: 500, fontSize: 15, px: 3.5, py: 1.4, borderRadius: 999, color: T.ink, borderColor: T.ink, '&:hover': { bgcolor: 'rgba(20,24,28,0.05)', borderColor: T.ink } }}
              >
                Sign in
              </Button>
            </Stack>
          </m.div>
        </Container>
      </Box>

      {/* ═══ FOOTER ═══ */}
      <Box component="footer" sx={{ borderTop: `1px solid ${T.hairline}`, py: 5 }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'auto 1fr auto' }, gap: 3, alignItems: 'center' }}>
            <Wordmark />
            <Typography sx={{ fontFamily: T.sans, fontSize: 13, color: T.ink3, lineHeight: 1.6, maxWidth: 640 }}>
              Clinical decision support for qualified professionals. Not a substitute for clinical
              judgment. Not a certified medical device.
            </Typography>
            <Typography sx={{ fontFamily: T.mono, fontSize: 12, color: T.ink3, justifySelf: { md: 'end' } }}>
              Engineered by Ferced &middot; Infrastructure in Frankfurt
            </Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}
