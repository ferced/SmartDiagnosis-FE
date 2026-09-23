import { m } from 'framer-motion';
import { useRef, useState, useEffect, useCallback } from 'react';

import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';

import { RouterLink } from 'src/routes/components';

import { LANDING as T } from 'src/sections/landing/tokens';
import { Body, Eyebrow, Statement } from 'src/sections/landing/type';

/**
 * Guided walkthrough of one case (/demo). Scripted, no API call, no account.
 *
 * It has to behave like the real engine, not like a brochure: the case was
 * chosen so the evidence gate fires (lymphoma cannot be closed without
 * histology), which makes the honest output a work-up plan, not a verdict.
 * Every PMID, HPO code and RxCUI on this page was resolved against PubMed,
 * ontology.jax.org and RxNav on 2026-09-23. Do not add identifiers that were
 * not checked the same way, and do not add dosing: treatment is class-level
 * by intended use.
 */

// ── Case ────────────────────────────────────────────────────────────────
const PATIENT: [string, string][] = [
  ['Patient', '45-year-old male'],
  ['Presentation', 'Fatigue for 3 months, 8 kg unintentional weight loss, night sweats, intermittent low-grade fever, painless swelling on the left side of the neck.'],
  ['Examination', 'Firm, non-tender left supraclavicular node, about 3 cm. No hepatosplenomegaly recorded.'],
  ['History', 'Type 2 diabetes (2019), hypertension. Atrial fibrillation.'],
  ['Medication', 'Metformin, lisinopril, warfarin'],
  ['Allergies', 'Penicillin'],
  ['Tests already done', 'None'],
];

const HPO = [
  ['fatigue', 'HP:0012378', 'Fatigue'],
  ['weight loss', 'HP:0001824', 'Weight loss'],
  ['night sweats', 'HP:0030166', 'Night sweats'],
  ['low-grade fever', 'HP:0001945', 'Fever'],
  ['swelling in the neck', 'HP:0025289', 'Cervical lymphadenopathy'],
];

const DRUGS = [
  ['Warfarin', '11289'],
  ['Metformin', '6809'],
  ['Lisinopril', '29046'],
  ['Iohexol (contrast)', '5956'],
];

const EVIDENCE = [
  { pmid: '40961306', cite: 'Am Fam Physician, 2025', title: 'Lymphadenopathy: evaluation and differential diagnosis', for: 'All candidates' },
  { pmid: '28153383', cite: 'Lancet, 2017', title: 'Non-Hodgkin lymphoma', for: 'Non-Hodgkin lymphoma' },
  { pmid: '33493434', cite: 'Lancet, 2021', title: 'Classical Hodgkin lymphoma', for: 'Classical Hodgkin lymphoma' },
  { pmid: '28084205', cite: 'Microbiol Spectr, 2016', title: 'Tuberculous lymphadenitis and parotitis', for: 'Tuberculous lymphadenitis' },
];

type Tone = 'ok' | 'hold' | 'stop';
const TONE: Record<Tone, string> = { ok: T.verified, hold: T.provisional, stop: T.ruledOut };

const DIFFERENTIAL = [
  { name: 'Non-Hodgkin lymphoma', model: '62%', shown: '40%', tone: 'hold' as Tone, note: 'Capped. Depends on lymph node histology, not done.' },
  { name: 'Classical Hodgkin lymphoma', model: '44%', shown: '40%', tone: 'hold' as Tone, note: 'Capped. Depends on lymph node histology, not done.' },
  { name: 'Tuberculous lymphadenitis', model: '21%', shown: '21%', tone: 'hold' as Tone, note: 'Depends on IGRA and mycobacterial culture.' },
  { name: 'Metastatic head and neck squamous cell carcinoma', model: '12%', shown: '12%', tone: 'hold' as Tone, note: 'Depends on ENT examination and histology.' },
  { name: 'Castleman disease', model: '3%', shown: '3%', tone: 'hold' as Tone, note: 'Rare. Kept on the list; histology also decides it.' },
  { name: 'Kikuchi–Fujimoto disease', model: '2%', shown: '2%', tone: 'hold' as Tone, note: 'Rare. Second model: unlikely at this age and sex.' },
];

const WORKUP = [
  {
    test: 'Excisional lymph node biopsy',
    detail: 'Histology, immunohistochemistry, flow cytometry and mycobacterial culture. The one test that separates all four leading candidates.',
    flag: 'On warfarin: plan peri-procedural anticoagulation and check INR before the biopsy.',
  },
  {
    test: 'CBC with differential, LDH, ESR',
    detail: 'Supports staging and suggests marrow involvement. Does not close the diagnosis on its own.',
  },
  {
    test: 'Interferon-gamma release assay and chest X-ray',
    detail: 'Keeps or drops tuberculous lymphadenitis before histology is back.',
  },
  {
    test: 'Contrast CT of neck, chest, abdomen and pelvis',
    detail: 'Staging, once a lymphoma is confirmed.',
    flag: 'Metformin × iodinated contrast flagged: follow the local contrast protocol.',
  },
];

type Stage = { id: string; tone: Tone; summary: string; detail?: 'hpo' | 'drugs' | 'pmids' };

const STAGES: Stage[] = [
  {
    id: 'Neural reasoning',
    tone: 'ok',
    summary: 'Common and rare differentials are generated in parallel: 4 common candidates, 2 rare ones. No prior tests or treatments on record, so nothing is excluded as already done.',
  },
  {
    id: 'Finding normalization',
    tone: 'ok',
    summary: 'The free-text presentation is mapped to Human Phenotype Ontology terms.',
    detail: 'hpo',
  },
  {
    id: 'Symbolic verification',
    tone: 'ok',
    summary: 'All 6 candidates are consistent with a 45-year-old male. Nothing is ruled out, and the check is still recorded.',
  },
  {
    id: 'Independent verification',
    tone: 'ok',
    summary: 'A second, different model reviews the list. It agrees on 5 of 6 and marks Kikuchi–Fujimoto disease as unlikely at this age and sex.',
  },
  {
    id: 'Literature grounding',
    tone: 'ok',
    summary: 'References are resolved against PubMed. Four resolve and keep their PMID; one model-generated citation did not resolve and was dropped.',
    detail: 'pmids',
  },
  {
    id: 'Drug grounding',
    tone: 'ok',
    summary: 'Every drug resolves to an RxNorm concept. RxNorm verifies the drugs, not the severity: the “moderate” grading of metformin × contrast is the model’s.',
    detail: 'drugs',
  },
  {
    id: 'Evidence gate',
    tone: 'hold',
    summary: 'Every leading candidate depends on histology that has not been done. They stay provisional; the two lymphomas are capped at 40%.',
  },
  {
    id: 'Confidence gate',
    tone: 'stop',
    summary: 'The top candidate sits at 40%, below the 45% threshold. No diagnosis is released: the answer becomes a work-up plan.',
  },
  {
    id: 'Audit trail',
    tone: 'ok',
    summary: 'A hash-chained entry records the input hash (no PII), what each stage did, and the decision not taken: provisional 6 · work-up first · 4 outstanding tests.',
  },
];

const STEP_MS = 750;

// ── Pieces ──────────────────────────────────────────────────────────────
function Mono({ children, color = T.ink3, sx = {} }: { children: React.ReactNode; color?: string; sx?: object }) {
  return (
    <Typography component="span" sx={{ fontFamily: T.mono, fontSize: 12, letterSpacing: '0.02em', color, ...sx }}>
      {children}
    </Typography>
  );
}

function Dot({ color }: { color: string }) {
  return <Box component="span" sx={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />;
}

function CaseFile({ onRun, state }: { onRun: () => void; state: 'idle' | 'running' | 'done' }) {
  return (
    <Box sx={{ border: `1px solid ${T.hairline}`, bgcolor: '#FBF9F5', boxShadow: '0 30px 60px -34px rgba(20,24,28,0.35)' }}>
      <Box sx={{ px: 2.5, py: 1.75, borderBottom: `1px solid ${T.hairline}`, display: 'flex', justifyContent: 'space-between' }}>
        <Mono color={T.ink2}>Case file</Mono>
        <Mono>illustrative</Mono>
      </Box>
      <Box component="dl" sx={{ m: 0, px: 2.5, py: 1 }}>
        {PATIENT.map(([k, v]) => (
          <Box key={k} sx={{ py: 1.25, borderBottom: `1px solid ${T.hairline}`, '&:last-of-type': { borderBottom: 'none' } }}>
            <Typography component="dt" sx={{ fontFamily: T.mono, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.ink3, mb: 0.5 }}>
              {k}
            </Typography>
            <Typography component="dd" sx={{ m: 0, fontFamily: T.sans, fontSize: 14.5, lineHeight: 1.55, color: T.ink }}>
              {v}
            </Typography>
          </Box>
        ))}
      </Box>
      <Box sx={{ p: 2.5, pt: 1 }}>
        <Button
          fullWidth
          onClick={onRun}
          disabled={state === 'running'}
          sx={{
            fontFamily: T.sans,
            fontWeight: 500,
            fontSize: 15,
            py: 1.3,
            borderRadius: 999,
            bgcolor: T.ink,
            color: T.paper,
            '&:hover': { bgcolor: '#2A3036' },
            '&.Mui-disabled': { bgcolor: T.paper2, color: T.ink3 },
          }}
        >
          {state === 'idle' && 'Run the case'}
          {state === 'running' && 'Running…'}
          {state === 'done' && 'Run it again'}
        </Button>
      </Box>
    </Box>
  );
}

function StageDetail({ kind }: { kind: NonNullable<Stage['detail']> }) {
  if (kind === 'hpo') {
    return (
      <Stack spacing={0.5} sx={{ mt: 1.5 }}>
        {HPO.map(([input, code, name]) => (
          <Stack key={code} direction="row" spacing={1} alignItems="baseline" sx={{ flexWrap: 'wrap' }}>
            <Typography sx={{ fontFamily: T.sans, fontSize: 13.5, color: T.ink2 }}>“{input}”</Typography>
            <Mono>→</Mono>
            <Link href={`https://hpo.jax.org/browse/term/${code}`} target="_blank" rel="noopener" underline="hover" sx={{ fontFamily: T.mono, fontSize: 12.5, color: T.verified }}>
              {code}
            </Link>
            <Typography sx={{ fontFamily: T.sans, fontSize: 13.5, color: T.ink }}>{name}</Typography>
          </Stack>
        ))}
      </Stack>
    );
  }
  if (kind === 'drugs') {
    return (
      <Stack direction="row" sx={{ mt: 1.5, flexWrap: 'wrap', gap: 1 }}>
        {DRUGS.map(([name, rxcui]) => (
          <Box key={rxcui} sx={{ border: `1px solid ${T.hairline}`, px: 1.25, py: 0.5, display: 'inline-flex', gap: 1, alignItems: 'baseline' }}>
            <Typography sx={{ fontFamily: T.sans, fontSize: 13.5, color: T.ink }}>{name}</Typography>
            <Mono color={T.verified}>RxCUI {rxcui}</Mono>
          </Box>
        ))}
      </Stack>
    );
  }
  return (
    <Stack direction="row" sx={{ mt: 1.5, flexWrap: 'wrap', gap: 1 }}>
      {EVIDENCE.map((e) => (
        <Link
          key={e.pmid}
          href={`https://pubmed.ncbi.nlm.nih.gov/${e.pmid}/`}
          target="_blank"
          rel="noopener"
          underline="hover"
          sx={{ fontFamily: T.mono, fontSize: 12.5, color: T.verified, border: `1px solid ${T.hairline}`, px: 1.25, py: 0.5 }}
        >
          PMID {e.pmid}
        </Link>
      ))}
    </Stack>
  );
}

function StageLog({ revealed }: { revealed: number }) {
  return (
    <Box component="ol" aria-live="polite" sx={{ listStyle: 'none', m: 0, p: 0, borderTop: `1px solid ${T.hairline}` }}>
      {STAGES.map((s, i) => {
        const done = i < revealed;
        const color = done ? TONE[s.tone] : T.hairline;
        return (
          <Box
            component="li"
            key={s.id}
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '32px 1fr', sm: '48px 1fr' },
              gap: { xs: 1.5, sm: 2 },
              py: 2.25,
              borderBottom: `1px solid ${T.hairline}`,
              opacity: done ? 1 : 0.42,
              transition: 'opacity .4s ease',
            }}
          >
            <Mono sx={{ fontSize: 12.5, pt: 0.5 }}>{String(i + 1).padStart(2, '0')}</Mono>
            <Box>
              <Stack direction="row" spacing={1.25} alignItems="center">
                <Dot color={color} />
                <Typography sx={{ fontFamily: T.serif, fontSize: 21, lineHeight: 1.2, color: T.ink }}>{s.id}</Typography>
              </Stack>
              {done && (
                <m.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
                  <Typography sx={{ fontFamily: T.sans, fontSize: 15, lineHeight: 1.6, color: T.ink2, mt: 0.75 }}>
                    {s.summary}
                  </Typography>
                  {s.detail && <StageDetail kind={s.detail} />}
                </m.div>
              )}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Typography sx={{ fontFamily: T.mono, fontSize: 11.5, letterSpacing: '0.14em', textTransform: 'uppercase', color: T.ink3, mb: 2 }}>
      {children}
    </Typography>
  );
}

function Response() {
  return (
    <Box sx={{ border: `1px solid ${T.hairline}`, bgcolor: '#FBF9F5' }}>
      {/* Verdict banner */}
      <Box sx={{ px: { xs: 2.5, md: 4 }, py: 3, borderBottom: `1px solid ${T.hairline}`, borderLeft: `3px solid ${T.provisional}` }}>
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 1 }}>
          <Dot color={T.provisional} />
          <Mono color={T.provisional} sx={{ textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 11.5 }}>
            Work-up first · no diagnosis released
          </Mono>
        </Stack>
        <Typography sx={{ fontFamily: T.serif, fontSize: { xs: 24, md: 28 }, lineHeight: 1.2, letterSpacing: '-0.01em', color: T.ink }}>
          A lymphoma is the leading hypothesis, and it cannot be called without tissue.
        </Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' } }}>
        {/* Differential */}
        <Box sx={{ p: { xs: 2.5, md: 4 }, borderRight: { md: `1px solid ${T.hairline}` }, borderBottom: { xs: `1px solid ${T.hairline}`, md: 'none' } }}>
          <SectionLabel>Differential · provisional</SectionLabel>
          <Stack divider={<Box sx={{ borderTop: `1px solid ${T.hairline}` }} />}>
            {DIFFERENTIAL.map((d) => (
              <Box key={d.name} sx={{ py: 1.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="baseline" spacing={2}>
                  <Typography sx={{ fontFamily: T.serif, fontSize: 18.5, lineHeight: 1.25, color: T.ink }}>{d.name}</Typography>
                  <Box sx={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                    {d.model !== d.shown && (
                      <Mono sx={{ textDecoration: 'line-through', mr: 1 }}>{d.model}</Mono>
                    )}
                    <Mono color={TONE[d.tone]} sx={{ fontSize: 14 }}>{d.shown}</Mono>
                  </Box>
                </Stack>
                <Typography sx={{ fontFamily: T.sans, fontSize: 13, color: T.ink2, mt: 0.5 }}>{d.note}</Typography>
              </Box>
            ))}
          </Stack>
        </Box>

        {/* Work-up */}
        <Box sx={{ p: { xs: 2.5, md: 4 } }}>
          <SectionLabel>Recommended work-up, in order</SectionLabel>
          <Box component="ol" sx={{ m: 0, p: 0, listStyle: 'none' }}>
            {WORKUP.map((w, i) => (
              <Box component="li" key={w.test} sx={{ display: 'grid', gridTemplateColumns: '28px 1fr', py: 1.5, borderTop: i ? `1px solid ${T.hairline}` : 'none' }}>
                <Mono sx={{ pt: 0.4 }}>{i + 1}</Mono>
                <Box>
                  <Typography sx={{ fontFamily: T.sans, fontWeight: 500, fontSize: 15, color: T.ink }}>{w.test}</Typography>
                  <Typography sx={{ fontFamily: T.sans, fontSize: 13.5, lineHeight: 1.55, color: T.ink2, mt: 0.25 }}>{w.detail}</Typography>
                  {w.flag && (
                    <Stack direction="row" spacing={1} alignItems="baseline" sx={{ mt: 0.75 }}>
                      <Mono color={T.ruledOut}>!</Mono>
                      <Typography sx={{ fontFamily: T.sans, fontSize: 13, lineHeight: 1.5, color: T.ruledOut }}>{w.flag}</Typography>
                    </Stack>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      </Box>

      {/* Treatment + evidence */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, borderTop: `1px solid ${T.hairline}` }}>
        <Box sx={{ p: { xs: 2.5, md: 4 }, borderRight: { md: `1px solid ${T.hairline}` }, borderBottom: { xs: `1px solid ${T.hairline}`, md: 'none' } }}>
          <SectionLabel>Treatment</SectionLabel>
          <Typography sx={{ fontFamily: T.sans, fontSize: 14.5, lineHeight: 1.6, color: T.ink2 }}>
            Not the question yet. With every candidate provisional, the response leads with the
            work-up. When treatment is discussed, it stays at drug-class level with decision
            criteria and contraindications: no regimens, no dosing.
          </Typography>
        </Box>
        <Box sx={{ p: { xs: 2.5, md: 4 } }}>
          <SectionLabel>Evidence · resolved in PubMed</SectionLabel>
          <Stack spacing={1.25}>
            {EVIDENCE.map((e) => (
              <Box key={e.pmid}>
                <Link
                  href={`https://pubmed.ncbi.nlm.nih.gov/${e.pmid}/`}
                  target="_blank"
                  rel="noopener"
                  underline="hover"
                  sx={{ fontFamily: T.sans, fontSize: 14.5, color: T.ink, textDecorationColor: T.hairline }}
                >
                  {e.title}
                </Link>
                <Box>
                  <Mono>{e.cite} · </Mono>
                  <Mono color={T.verified}>PMID {e.pmid}</Mono>
                  <Mono> · {e.for}</Mono>
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>
      </Box>

      <Box sx={{ px: { xs: 2.5, md: 4 }, py: 2, bgcolor: T.paper2, borderTop: `1px solid ${T.hairline}` }}>
        <Typography sx={{ fontFamily: T.sans, fontSize: 12.5, lineHeight: 1.6, color: T.ink2 }}>
          Decision support for qualified clinicians. It does not replace clinical judgment; the
          physician accepts, modifies or overrides every output. This disclaimer travels with every
          response.
        </Typography>
      </Box>
    </Box>
  );
}

// ── Page ────────────────────────────────────────────────────────────────
export default function DemoView() {
  const [revealed, setRevealed] = useState(0);
  const [state, setState] = useState<'idle' | 'running' | 'done'>('idle');
  const timer = useRef<ReturnType<typeof setInterval>>();
  const responseRef = useRef<HTMLDivElement>(null);
  const pipelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => clearInterval(timer.current), []);

  const run = useCallback(() => {
    clearInterval(timer.current);
    // Stacked layout: the pipeline sits below the case file, out of view.
    if (window.innerWidth < 900) {
      pipelineRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      setRevealed(STAGES.length);
      setState('done');
      return;
    }
    setRevealed(0);
    setState('running');
    let n = 0;
    timer.current = setInterval(() => {
      n += 1;
      setRevealed(n);
      if (n >= STAGES.length) {
        clearInterval(timer.current);
        setState('done');
      }
    }, STEP_MS);
  }, []);

  const skip = () => {
    clearInterval(timer.current);
    setRevealed(STAGES.length);
    setState('done');
  };

  return (
    <Box sx={{ bgcolor: T.paper, color: T.ink }}>
      {/* ═══ INTRO ═══ */}
      <Box component="section" sx={{ pt: { xs: 14, md: 18 }, pb: { xs: 6, md: 8 } }}>
        <Container maxWidth="lg">
          <Eyebrow>Guided case &middot; illustrative data &middot; no account needed</Eyebrow>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '7fr 5fr' }, gap: { xs: 3, md: 8 }, alignItems: 'end' }}>
            <Typography
              component="h1"
              sx={{ fontFamily: T.serif, fontWeight: 400, fontSize: { xs: 40, sm: 52, md: 64 }, lineHeight: 1.02, letterSpacing: '-0.025em', textWrap: 'balance' }}
            >
              One case, through all nine stages.
            </Typography>
            <Body>
              A scripted walkthrough, not a live call. The patient is illustrative; every PMID, HPO
              code and RxNorm concept on this page resolves in the real public source. Watch what
              the engine does when the answer depends on a test nobody has run yet.
            </Body>
          </Box>
        </Container>
      </Box>

      {/* ═══ CASE + PIPELINE ═══ */}
      <Box component="section" sx={{ pb: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 7fr' }, gap: { xs: 5, md: 8 } }}>
            <Box sx={{ position: { md: 'sticky' }, top: { md: 96 }, alignSelf: 'start' }}>
              <CaseFile onRun={run} state={state} />
            </Box>
            <Box ref={pipelineRef} sx={{ scrollMarginTop: 76 }}>
              <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 2 }}>
                <Mono color={T.ink2}>Pipeline · {revealed}/{STAGES.length}</Mono>
                {state === 'running' && (
                  <Button onClick={skip} sx={{ fontFamily: T.sans, fontSize: 13.5, color: T.ink2, px: 1, minWidth: 0, '&:hover': { bgcolor: 'transparent', color: T.ink } }}>
                    Skip to the response &rarr;
                  </Button>
                )}
                {state === 'done' && (
                  <Button
                    onClick={() => responseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                    sx={{ fontFamily: T.sans, fontSize: 13.5, color: T.ink, px: 1, minWidth: 0, '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' } }}
                  >
                    Read the response &darr;
                  </Button>
                )}
              </Stack>
              <StageLog revealed={revealed} />
              {state === 'idle' && (
                <Typography sx={{ fontFamily: T.sans, fontSize: 14, color: T.ink3, mt: 2.5 }}>
                  Press <b>Run the case</b> to send the case file through the pipeline.
                </Typography>
              )}
            </Box>
          </Box>
        </Container>
      </Box>

      {/* ═══ RESPONSE ═══ */}
      {state === 'done' && (
        <Box ref={responseRef} component="section" sx={{ bgcolor: T.paper2, py: { xs: 8, md: 12 }, scrollMarginTop: 68 }}>
          <Container maxWidth="lg">
            <m.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Eyebrow>What the clinician receives</Eyebrow>
              <Statement>A plan to get the missing evidence, not a guess.</Statement>
              <Box sx={{ mt: { xs: 4, md: 6 } }}>
                <Response />
              </Box>
            </m.div>
          </Container>
        </Box>
      )}

      {/* ═══ CLOSE ═══ */}
      <Box component="section" sx={{ py: { xs: 10, md: 14 }, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Statement>Same pipeline, your cases.</Statement>
          <Body sx={{ mt: 2.5, mx: 'auto', maxWidth: 520 }}>
            Accounts are created by an administrator for qualified clinicians. If you already have
            one, sign in.
          </Body>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center" sx={{ mt: 4.5 }}>
            <Button
              component={RouterLink}
              href="/auth/jwt/login"
              sx={{ fontFamily: T.sans, fontWeight: 500, fontSize: 15, px: 3.5, py: 1.4, borderRadius: 999, bgcolor: T.ink, color: T.paper, '&:hover': { bgcolor: '#2A3036' } }}
            >
              Sign in
            </Button>
            <Button
              component={RouterLink}
              href="/"
              variant="outlined"
              sx={{ fontFamily: T.sans, fontWeight: 500, fontSize: 15, px: 3.5, py: 1.4, borderRadius: 999, color: T.ink, borderColor: T.ink, '&:hover': { bgcolor: 'rgba(20,24,28,0.05)', borderColor: T.ink } }}
            >
              How the engine works
            </Button>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
