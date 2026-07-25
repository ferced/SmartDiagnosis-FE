/* eslint-disable perfectionist/sort-imports */
import 'src/utils/highlight';

// markdown plugins
import remarkGfm from 'remark-gfm';
import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';

import Link from '@mui/material/Link';

import { RouterLink } from 'src/routes/components';

import Image from '../image';
import StyledMarkdown from './styles';
import { MarkdownProps } from './types';

// ----------------------------------------------------------------------

// Everything rendered through this component is language-model output — the
// treatment plan and the follow-up chat — and that output is influenced by
// clinician-typed text and by uploaded patient documents, so it is untrusted
// input, not just "the model being weird".
//
// `rehype-raw` used to be enabled here, which parsed raw HTML in that output
// into real DOM. React blocks the textbook vectors (<script>, onerror), but
// `<iframe srcdoc>` survived: about:srcdoc inherits the parent origin, and
// sessionStorage holds both the access token and the user's own OpenAI API key.
// Raw HTML also allowed convincing spoofing inside a clinical result card — a
// fake "verified" banner is trivial to fake and costly to be fooled by.
//
// Nothing in this app needs raw HTML in markdown (the only two consumers are
// the treatment plan and the chat), so the surface is removed rather than
// filtered. Literal HTML now renders as visible text.
//
// remarkGfm also moved to remarkPlugins, where it belongs — it was being passed
// as a rehype plugin and only worked by accident.
export default function Markdown({ sx, ...other }: MarkdownProps) {
  return (
    <StyledMarkdown sx={sx}>
      <ReactMarkdown
        remarkPlugins={[[remarkGfm, { singleTilde: false }]]}
        rehypePlugins={[rehypeHighlight]}
        components={components}
        {...other}
      />
    </StyledMarkdown>
  );
}

// ----------------------------------------------------------------------

const components = {
  img: ({ ...props }) => <Image alt={props.alt} ratio="16/9" sx={{ borderRadius: 2 }} {...props} />,
  a: ({ ...props }) => {
    // href is optional: an anchor without one threw here and unmounted the whole
    // treatment section. Only in-app paths go through the router — a mailto:
    // or tel: link handed to RouterLink became a bogus in-app navigation.
    const {href} = props;
    const isInternal = typeof href === 'string' && href.startsWith('/');

    return isInternal ? (
      <Link component={RouterLink} href={href} {...props}>
        {props.children}
      </Link>
    ) : (
      <Link target="_blank" rel="noopener noreferrer" {...props} />
    );
  },
};
