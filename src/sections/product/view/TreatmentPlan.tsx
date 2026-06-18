import { useMemo } from 'react';

import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Box, Accordion, Typography, AccordionDetails, AccordionSummary } from '@mui/material';

import Markdown from 'src/components/markdown';

// ----------------------------------------------------------------------

type Section = { title: string; body: string };

// Split a markdown treatment writeup into collapsible sections by its headings
// (#, ##, ### or "**N. Title**" / "N. Title" lines) so a long plan reads as a
// scannable set of sections instead of one giant wall of text.
function parseSections(md: string): Section[] {
  if (!md) return [];
  const lines = md.replace(/\r/g, '').split('\n');
  const sections: Section[] = [];
  let current: Section | null = null;

  const isHeading = (line: string): string | null => {
    // Major markdown heading (1–2 hashes only — deeper levels stay as body so we
    // don't over-split into dozens of tiny sections).
    const hashed = line.match(/^\s{0,3}#{1,2}\s+(.+\S)\s*$/);
    if (hashed) return hashed[1];
    // Top-level numbered section, possibly prefixed by hashes or bold:
    // "3. Acute Relapse Management", "### 3. ...", "**3. ...**"
    const numbered = line.match(
      /^\s*#{0,3}\s*\*{0,2}\s*([0-9]{1,2}[.)])\s+([A-Z][^*\n]{3,80}?)\*{0,2}\s*$/
    );
    if (numbered) return `${numbered[1]} ${numbered[2]}`.trim();
    return null;
  };

  const clean = (t: string) => t.replace(/[*_`#]/g, '').trim();

  lines.forEach((line) => {
    const h = isHeading(line);
    if (h) {
      if (current) sections.push(current);
      current = { title: clean(h), body: '' };
    } else if (current) {
      current.body += `${line}\n`;
    } else if (line.trim()) {
      current = { title: 'Overview', body: `${line}\n` };
    }
  });
  if (current) sections.push(current);

  return sections.filter((s) => s.title && (s.body.trim() || s.title));
}

export default function TreatmentPlan({ markdown }: { markdown: string }) {
  const sections = useMemo(() => parseSections(markdown), [markdown]);

  // If we couldn't find a meaningful structure, fall back to plain markdown.
  if (sections.length <= 1) {
    return <Markdown>{markdown}</Markdown>;
  }

  return (
    <Box>
      {sections.map((s, i) => (
        <Accordion
          key={i}
          defaultExpanded={i === 0}
          disableGutters
          elevation={0}
          sx={{
            mb: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            '&:before': { display: 'none' },
            overflow: 'hidden',
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{ bgcolor: 'background.neutral', '& .MuiAccordionSummary-content': { my: 1 } }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {s.title}
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ pt: 1 }}>
            <Markdown>{s.body}</Markdown>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );
}
