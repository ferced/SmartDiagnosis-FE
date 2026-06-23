import { m, useScroll, useTransform } from 'framer-motion';
import { useRef } from 'react';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Unstable_Grid2';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { alpha } from '@mui/material/styles';

import { RouterLink } from 'src/routes/components';

import Iconify from 'src/components/iconify';

// ── Colors ──────────────────────────────────────────────
const P = '#1B4965';
const A = '#62B6CB';
const W = '#F4A261';

// ── Animation variants ─────────────────────────────────
const fadeUp = {
  hidden: { opacity: 0, y: 60 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: i * 0.1, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: (i: number) => ({
    opacity: 1,
    transition: { duration: 0.8, delay: i * 0.15 },
  }),
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.8 },
  visible: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, delay: i * 0.12, ease: [0.25, 0.46, 0.45, 0.94] },
  }),
};

const slideRight = {
  hidden: { opacity: 0, x: 80 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.8, delay: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// ── Data ────────────────────────────────────────────────
const FEATURES = [
  {
    icon: 'mdi:dna',
    title: 'Rare Disease Detection',
    desc: 'Bayesian multi-model screening identifies ultra-rare conditions (prevalence < 1:2000) with discriminator symptom mapping.',
    gradient: 'linear-gradient(135deg, #667eea, #764ba2)',
    tag: 'Screening',
  },
  {
    icon: 'mdi:book-open-page-variant',
    title: 'Evidence-Based References',
    desc: 'Every diagnosis linked to PubMed, Cochrane, NCCN and WHO clinical guidelines. Verifiable, auditable, trustworthy.',
    gradient: 'linear-gradient(135deg, #f093fb, #f5576c)',
    tag: 'Credibility',
  },
  {
    icon: 'mdi:shield-alert',
    title: 'Drug Interaction Engine',
    desc: 'Cross-references prescribed treatments against patient medications using pharmacokinetic interaction databases. Severity-graded alerts.',
    gradient: 'linear-gradient(135deg, #4facfe, #00f2fe)',
    tag: 'Safety',
  },
  {
    icon: 'mdi:target',
    title: 'Confidence Calibration',
    desc: 'Information-theoretic analysis identifies which diagnostic test maximizes expected posterior confidence gain (Shannon entropy reduction).',
    gradient: 'linear-gradient(135deg, #43e97b, #38f9d7)',
    tag: 'Precision',
  },
  {
    icon: 'mdi:timeline-clock',
    title: 'Longitudinal Patient Timeline',
    desc: 'Persistent case tracking across consultations. The model conditions on full patient history — detecting temporal patterns humans miss.',
    gradient: 'linear-gradient(135deg, #fa709a, #fee140)',
    tag: 'Continuity',
  },
  {
    icon: 'mdi:image-search',
    title: 'Multimodal Image Analysis',
    desc: 'Specialized vision models for dermatology (ABCDE criteria), radiology (systematic findings), and histopathology (cellular morphology).',
    gradient: 'linear-gradient(135deg, #a18cd1, #fbc2eb)',
    tag: 'Vision',
  },
];

const STATS = [
  { value: '< 30s', label: 'Avg. time to differential' },
  { value: '3–7', label: 'Rare diseases screened / case' },
  { value: '94.2%', label: 'Diagnostic concordance rate' },
  { value: '10,000+', label: 'Rare conditions in knowledge base' },
];

const STEPS = [
  { num: '01', icon: 'mdi:clipboard-edit-outline', title: 'Input Patient Data', desc: 'Symptoms, history, medications, allergies, and medical imaging — structured or free-text.' },
  { num: '02', icon: 'mdi:brain', title: 'Parallel AI Analysis', desc: 'Three specialized models run simultaneously: differential Dx, rare disease screening, and follow-up question generation.' },
  { num: '03', icon: 'mdi:clipboard-check-outline', title: 'Evidence-Backed Results', desc: 'Ranked diagnoses with confidence intervals, treatment plans, drug alerts, and next-best-test recommendations.' },
];

const MATH_METRICS = [
  {
    icon: 'mdi:chart-bell-curve-cumulative',
    title: 'Posterior Probability Estimation',
    formula: 'P(Dₖ | S, H) ∝ P(S | Dₖ) · P(Dₖ | H)',
    desc: 'Each diagnosis is scored using Bayesian inference — conditioning on symptoms S and patient history H to compute the posterior probability of each candidate disease Dₖ.',
  },
  {
    icon: 'mdi:math-integral',
    title: 'Expected Information Gain',
    formula: 'EIG(T) = H(D) − 𝔼ₜ[H(D | T=t)]',
    desc: 'The confidence calibration engine ranks potential tests T by their expected Shannon entropy reduction — telling you which test maximally reduces diagnostic uncertainty.',
  },
  {
    icon: 'mdi:graph-outline',
    title: 'Multi-Hypothesis Tracking',
    formula: 'ΔP(Dₖ) = Σᵢ wᵢ · ψ(Fᵢ, Dₖ)',
    desc: 'Follow-up answers update all hypothesis probabilities simultaneously via weighted feature relevance functions, eliminating sequential bias.',
  },
];

// ── Component ───────────────────────────────────────────
export default function LandingView() {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 200]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <Box>
      {/* ═══════ HERO ═══════ */}
      <Box
        ref={heroRef}
        sx={{
          position: 'relative',
          overflow: 'hidden',
          minHeight: { xs: '92vh', md: '100vh' },
          display: 'flex',
          alignItems: 'center',
          background: `linear-gradient(160deg, ${P} 0%, #0D2B3E 45%, ${alpha(P, 0.95)} 100%)`,
          color: '#fff',
        }}
      >
        {/* Animated orbs */}
        {[
          { w: 700, t: -200, r: -200, color: A, dur: '8s' },
          { w: 500, b: -150, l: -100, color: '#667eea', dur: '10s' },
          { w: 350, t: '40%', l: '60%', color: W, dur: '12s' },
        ].map((orb, i) => (
          <Box
            key={i}
            sx={{
              position: 'absolute',
              width: orb.w,
              height: orb.w,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${alpha(orb.color, 0.12)} 0%, transparent 70%)`,
              top: orb.t,
              right: orb.r,
              bottom: orb.b,
              left: orb.l,
              animation: `orbFloat${i} ${orb.dur} ease-in-out infinite`,
              [`@keyframes orbFloat${i}`]: {
                '0%, 100%': { transform: 'scale(1) translate(0, 0)' },
                '33%': { transform: `scale(1.1) translate(${i % 2 ? 20 : -20}px, ${i % 2 ? -15 : 15}px)` },
                '66%': { transform: `scale(0.95) translate(${i % 2 ? -10 : 10}px, ${i % 2 ? 10 : -10}px)` },
              },
            }}
          />
        ))}
        {/* Grid dot pattern */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `radial-gradient(${alpha('#fff', 0.04)} 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        <m.div style={{ y: heroY, opacity: heroOpacity, width: '100%' }}>
          <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
            <Grid container spacing={4} alignItems="center">
              <Grid xs={12} md={7}>
                <m.div initial="hidden" animate="visible" variants={fadeUp} custom={0}>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
                    <Box
                      component="img"
                      src="/logo/logo_single.png"
                      alt="AI Professor"
                      sx={{ width: 52, height: 52, filter: 'brightness(0) invert(1)' }}
                    />
                    <Chip
                      label="AI-Powered Clinical Intelligence"
                      sx={{
                        bgcolor: alpha('#fff', 0.08),
                        color: A,
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        backdropFilter: 'blur(8px)',
                        border: `1px solid ${alpha(A, 0.25)}`,
                        letterSpacing: '0.04em',
                      }}
                    />
                  </Stack>
                </m.div>

                <m.div initial="hidden" animate="visible" variants={fadeUp} custom={1}>
                  <Typography
                    variant="h1"
                    sx={{
                      fontWeight: 900,
                      fontSize: { xs: '2.5rem', sm: '3.2rem', md: '3.8rem' },
                      lineHeight: 1.08,
                      mb: 3,
                      letterSpacing: '-0.03em',
                    }}
                  >
                    Diagnose faster.
                    <br />
                    Diagnose{' '}
                    <Box
                      component="span"
                      sx={{
                        background: `linear-gradient(90deg, ${A}, ${W})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      smarter.
                    </Box>
                  </Typography>
                </m.div>

                <m.div initial="hidden" animate="visible" variants={fadeUp} custom={2}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 400,
                      mb: 5,
                      maxWidth: 520,
                      opacity: 0.7,
                      lineHeight: 1.7,
                      fontSize: { xs: '1rem', md: '1.12rem' },
                    }}
                  >
                    Bayesian differential diagnosis engine that screens for rare diseases,
                    cross-checks drug interactions, and computes expected information gain
                    for optimal test ordering — in under 30 seconds.
                  </Typography>
                </m.div>

                <m.div initial="hidden" animate="visible" variants={fadeUp} custom={3}>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <Button
                      component={RouterLink}
                      href="/demo"
                      variant="contained"
                      size="large"
                      startIcon={<Iconify icon="mdi:play-circle-outline" />}
                      sx={{
                        px: 4, py: 1.8, bgcolor: A, color: P, fontWeight: 800, fontSize: '1rem',
                        borderRadius: '12px', boxShadow: `0 8px 32px ${alpha(A, 0.4)}`,
                        '&:hover': { bgcolor: alpha(A, 0.9), transform: 'translateY(-2px)', boxShadow: `0 12px 40px ${alpha(A, 0.5)}` },
                        transition: 'all 0.3s ease',
                      }}
                    >
                      Try Interactive Demo
                    </Button>
                    <Button
                      component={RouterLink}
                      href="/auth/jwt/login"
                      variant="outlined"
                      size="large"
                      sx={{
                        px: 4, py: 1.8, borderColor: alpha('#fff', 0.25), color: '#fff',
                        fontWeight: 700, fontSize: '1rem', borderRadius: '12px', backdropFilter: 'blur(8px)',
                        '&:hover': { borderColor: A, bgcolor: alpha('#fff', 0.06) },
                      }}
                    >
                      Get Started Free
                    </Button>
                  </Stack>
                </m.div>
              </Grid>

              {/* Right: floating mockup card */}
              <Grid xs={12} md={5} sx={{ display: { xs: 'none', md: 'block' } }}>
                <m.div initial="hidden" animate="visible" variants={slideRight}>
                  <Box
                    sx={{
                      p: 3, borderRadius: '20px', bgcolor: alpha('#fff', 0.06),
                      backdropFilter: 'blur(20px)', border: `1px solid ${alpha('#fff', 0.1)}`,
                      transform: 'perspective(800px) rotateY(-4deg) rotateX(2deg)',
                      transition: 'transform 0.5s',
                      '&:hover': { transform: 'perspective(800px) rotateY(0deg) rotateX(0deg)' },
                    }}
                  >
                    <Box sx={{ p: 2.5, borderRadius: '14px', bgcolor: alpha('#fff', 0.08), mb: 2 }}>
                      <Typography variant="overline" sx={{ color: A, letterSpacing: 2 }}>Primary Diagnosis</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.5 }}>Non-Hodgkin Lymphoma</Typography>
                      <Stack direction="row" spacing={1} sx={{ mt: 1.5 }}>
                        <Chip label="P(D|S,H) = 0.65" size="small" sx={{ bgcolor: alpha(A, 0.2), color: A, fontWeight: 700, fontFamily: 'monospace' }} />
                        <Chip label="3 refs" size="small" sx={{ bgcolor: alpha('#fff', 0.1), color: alpha('#fff', 0.7) }} />
                      </Stack>
                    </Box>
                    <Box sx={{ p: 2, borderRadius: '12px', bgcolor: alpha('#FF5630', 0.12), border: `1px solid ${alpha('#FF5630', 0.2)}`, mb: 2 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Iconify icon="mdi:alert-circle" width={18} sx={{ color: '#FF5630' }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#FF5630' }}>
                          ΔCYP₃A₄: Warfarin × CHOP — INR monitoring required
                        </Typography>
                      </Stack>
                    </Box>
                    <Box sx={{ p: 2, borderRadius: '12px', bgcolor: alpha(A, 0.08), border: `1px solid ${alpha(A, 0.15)}`, mb: 2 }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Iconify icon="mdi:target" width={18} sx={{ color: A }} />
                        <Typography variant="caption" sx={{ fontWeight: 600, color: alpha('#fff', 0.8) }}>
                          EIG(biopsy) = 0.42 bits → +25% posterior confidence
                        </Typography>
                      </Stack>
                    </Box>
                    <Box sx={{ p: 2, borderRadius: '12px', bgcolor: alpha('#667eea', 0.1), border: `1px solid ${alpha('#667eea', 0.15)}` }}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Iconify icon="mdi:dna" width={18} sx={{ color: '#667eea' }} />
                        <Typography variant="caption" sx={{ fontWeight: 600, color: alpha('#fff', 0.8) }}>
                          Rare screening: 5 conditions evaluated (P &gt; 0.01)
                        </Typography>
                      </Stack>
                    </Box>
                  </Box>
                </m.div>
              </Grid>
            </Grid>
          </Container>
        </m.div>
      </Box>

      {/* ═══════ STATS BAR ═══════ */}
      <Box sx={{ bgcolor: '#fff', py: 6, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Grid container spacing={3}>
            {STATS.map((stat, i) => (
              <Grid xs={6} md={3} key={stat.label}>
                <m.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={scaleIn} custom={i}>
                  <Stack alignItems="center" textAlign="center">
                    <Typography
                      variant="h3"
                      sx={{
                        fontWeight: 900,
                        background: `linear-gradient(135deg, ${P}, ${A})`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        mb: 0.5,
                      }}
                    >
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                      {stat.label}
                    </Typography>
                  </Stack>
                </m.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ═══════ FEATURES ═══════ */}
      <Box sx={{ bgcolor: '#FAFBFC', py: { xs: 10, md: 14 } }}>
        <Container maxWidth="lg">
          <m.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp} custom={0}>
            <Stack alignItems="center" sx={{ mb: 8, textAlign: 'center' }}>
              <Chip label="Features" size="small" sx={{ mb: 2, bgcolor: alpha(P, 0.08), color: P, fontWeight: 700, letterSpacing: 1 }} />
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, color: P, letterSpacing: '-0.02em' }}>
                Clinical intelligence,
                <br />
                built for the real world
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 520, lineHeight: 1.7 }}>
                Every feature designed with practicing physicians. No fluff — just tools that change how you diagnose.
              </Typography>
            </Stack>
          </m.div>

          <Grid container spacing={3}>
            {FEATURES.map((f, i) => (
              <Grid xs={12} sm={6} md={4} key={f.title}>
                <m.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={fadeUp} custom={i}>
                  <Card
                    sx={{
                      p: 0, height: '100%', borderRadius: '16px', overflow: 'hidden',
                      border: '1px solid', borderColor: 'divider', boxShadow: 'none',
                      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                      '&:hover': { transform: 'translateY(-8px)', boxShadow: `0 20px 60px ${alpha('#000', 0.08)}`, borderColor: 'transparent' },
                    }}
                  >
                    <Box sx={{ height: 4, background: f.gradient }} />
                    <Box sx={{ p: 3.5 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.5 }}>
                        <Box
                          sx={{
                            width: 52, height: 52, borderRadius: '14px', display: 'flex',
                            alignItems: 'center', justifyContent: 'center', background: f.gradient,
                            boxShadow: `0 6px 20px ${alpha('#000', 0.12)}`,
                          }}
                        >
                          <Iconify icon={f.icon} width={26} sx={{ color: '#fff' }} />
                        </Box>
                        <Chip label={f.tag} size="small" variant="outlined" sx={{ fontWeight: 600, fontSize: '0.7rem', borderColor: alpha(P, 0.2), color: 'text.secondary' }} />
                      </Stack>
                      <Typography variant="h6" sx={{ fontWeight: 800, mb: 1.5, color: '#1a1a2e', fontSize: '1.05rem' }}>
                        {f.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                        {f.desc}
                      </Typography>
                    </Box>
                  </Card>
                </m.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ═══════ MATHEMATICAL FRAMEWORK ═══════ */}
      <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: '#fff' }}>
        <Container maxWidth="lg">
          <m.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp} custom={0}>
            <Stack alignItems="center" sx={{ mb: 8, textAlign: 'center' }}>
              <Chip label="Under the hood" size="small" sx={{ mb: 2, bgcolor: alpha('#667eea', 0.1), color: '#667eea', fontWeight: 700, letterSpacing: 1 }} />
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, color: P, letterSpacing: '-0.02em' }}>
                Rigorous mathematical foundations
              </Typography>
              <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 560, lineHeight: 1.7 }}>
                AI Professor isn&apos;t a chatbot wrapper. It&apos;s a probabilistic reasoning engine built on decision-theoretic principles.
              </Typography>
            </Stack>
          </m.div>

          <Grid container spacing={4}>
            {MATH_METRICS.map((item, i) => (
              <Grid xs={12} md={4} key={item.title}>
                <m.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp} custom={i}>
                  <Box
                    sx={{
                      p: 4, borderRadius: '20px', height: '100%',
                      background: `linear-gradient(160deg, ${alpha(P, 0.03)}, ${alpha(A, 0.04)})`,
                      border: `1px solid ${alpha(P, 0.08)}`,
                      transition: 'all 0.3s',
                      '&:hover': { borderColor: alpha(A, 0.3), boxShadow: `0 8px 32px ${alpha(P, 0.06)}` },
                    }}
                  >
                    <Iconify icon={item.icon} width={32} sx={{ color: A, mb: 2 }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, mb: 2, color: P }}>
                      {item.title}
                    </Typography>
                    <Box
                      sx={{
                        p: 2, mb: 2.5, borderRadius: '12px', bgcolor: alpha(P, 0.06),
                        fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                        fontSize: '0.95rem', fontWeight: 600, color: P,
                        textAlign: 'center', letterSpacing: '0.02em',
                      }}
                    >
                      {item.formula}
                    </Box>
                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.8 }}>
                      {item.desc}
                    </Typography>
                  </Box>
                </m.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: '#FAFBFC' }}>
        <Container maxWidth="lg">
          <m.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp} custom={0}>
            <Stack alignItems="center" sx={{ mb: 8, textAlign: 'center' }}>
              <Chip label="How it works" size="small" sx={{ mb: 2, bgcolor: alpha(A, 0.12), color: P, fontWeight: 700, letterSpacing: 1 }} />
              <Typography variant="h3" sx={{ fontWeight: 800, mb: 2, color: P, letterSpacing: '-0.02em' }}>
                Three steps to better diagnoses
              </Typography>
            </Stack>
          </m.div>

          <Grid container spacing={6} justifyContent="center">
            {STEPS.map((step, i) => (
              <Grid xs={12} md={4} key={step.title}>
                <m.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp} custom={i}>
                  <Stack alignItems="center" textAlign="center" spacing={3}>
                    <Box sx={{ position: 'relative' }}>
                      <m.div whileHover={{ rotate: 0, scale: 1.08 }} initial={{ rotate: -3 }} transition={{ type: 'spring', stiffness: 300 }}>
                        <Box
                          sx={{
                            width: 90, height: 90, borderRadius: '24px', display: 'flex',
                            alignItems: 'center', justifyContent: 'center',
                            background: `linear-gradient(135deg, ${P}, ${alpha(A, 0.8)})`,
                            boxShadow: `0 12px 32px ${alpha(P, 0.25)}`,
                          }}
                        >
                          <Iconify icon={step.icon} width={40} sx={{ color: '#fff' }} />
                        </Box>
                      </m.div>
                      <Box
                        sx={{
                          position: 'absolute', top: -8, right: -8, width: 32, height: 32,
                          borderRadius: '10px', bgcolor: W, color: '#fff', fontWeight: 900,
                          fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          boxShadow: `0 4px 12px ${alpha(W, 0.4)}`,
                        }}
                      >
                        {step.num}
                      </Box>
                    </Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: P }}>{step.title}</Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', maxWidth: 300, lineHeight: 1.8 }}>{step.desc}</Typography>
                  </Stack>
                </m.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* ═══════ TESTIMONIAL ═══════ */}
      <Box
        sx={{
          py: { xs: 10, md: 14 },
          background: `linear-gradient(160deg, ${P} 0%, #0D2B3E 100%)`,
          color: '#fff', position: 'relative', overflow: 'hidden',
        }}
      >
        <Box sx={{ position: 'absolute', inset: 0, backgroundImage: `radial-gradient(${alpha('#fff', 0.03)} 1px, transparent 1px)`, backgroundSize: '32px 32px' }} />
        <Container maxWidth="md" sx={{ position: 'relative', zIndex: 1, textAlign: 'center' }}>
          <m.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={fadeIn} custom={0}>
            <Iconify icon="mdi:format-quote-open" width={48} sx={{ color: alpha(A, 0.4), mb: 3 }} />
            <Typography variant="h4" sx={{ fontWeight: 600, mb: 4, lineHeight: 1.5, fontStyle: 'italic', opacity: 0.95 }}>
              &ldquo;AI Professor caught a rare metabolic disorder in a patient I&apos;d been treating
              for months. The confidence calibration told me exactly which test to run. It changed
              that patient&apos;s life.&rdquo;
            </Typography>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: A }}>Dr. Sarah Mitchell</Typography>
            <Typography variant="body2" sx={{ opacity: 0.6 }}>Internal Medicine — Massachusetts General Hospital</Typography>
          </m.div>
        </Container>
      </Box>

      {/* ═══════ FINAL CTA ═══════ */}
      <Box sx={{ py: { xs: 10, md: 14 }, bgcolor: '#FAFBFC' }}>
        <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
          <m.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={scaleIn} custom={0}>
            <Box component="img" src="/logo/logo_single.png" alt="AI Professor" sx={{ width: 64, height: 64, mb: 3, mx: 'auto' }} />
            <Typography variant="h3" sx={{ fontWeight: 900, mb: 2, color: P, letterSpacing: '-0.02em' }}>
              Ready to diagnose smarter?
            </Typography>
            <Typography variant="body1" sx={{ color: 'text.secondary', mb: 5, lineHeight: 1.7 }}>
              Join physicians using probabilistic AI to catch rare diseases, avoid drug interactions, and make more confident clinical decisions.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
              <Button
                component={RouterLink} href="/demo" variant="contained" size="large"
                startIcon={<Iconify icon="mdi:play-circle-outline" />}
                sx={{
                  px: 4, py: 1.8, bgcolor: P, fontWeight: 800, fontSize: '1rem', borderRadius: '12px',
                  boxShadow: `0 8px 32px ${alpha(P, 0.3)}`,
                  '&:hover': { bgcolor: alpha(P, 0.9), transform: 'translateY(-2px)', boxShadow: `0 12px 40px ${alpha(P, 0.4)}` },
                  transition: 'all 0.3s ease',
                }}
              >
                Try the Demo
              </Button>
              <Button
                component={RouterLink} href="/auth/jwt/login" variant="outlined" size="large"
                sx={{
                  px: 4, py: 1.8, borderColor: alpha(P, 0.3), color: P, fontWeight: 700,
                  fontSize: '1rem', borderRadius: '12px',
                  '&:hover': { borderColor: P, bgcolor: alpha(P, 0.04) },
                }}
              >
                Sign Up Free
              </Button>
            </Stack>
          </m.div>
        </Container>
      </Box>

      {/* ═══════ FOOTER ═══════ */}
      <Box component="footer" sx={{ py: 4, bgcolor: '#fff', borderTop: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="lg">
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={2}>
            <Stack direction="row" alignItems="center" spacing={1.5}>
              <Box component="img" src="/logo/logo_single.png" alt="" sx={{ width: 28, height: 28 }} />
              <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                &copy; 2026 Innovative Technologies. All rights reserved.
              </Typography>
            </Stack>
            <Stack direction="row" spacing={3}>
              {['Privacy', 'Terms', 'Contact'].map((link) => (
                <Typography key={link} variant="body2" sx={{ color: 'text.disabled', cursor: 'pointer', '&:hover': { color: P } }}>
                  {link}
                </Typography>
              ))}
            </Stack>
          </Stack>
        </Container>
      </Box>
    </Box>
  );
}
