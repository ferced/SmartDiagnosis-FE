import { Helmet } from 'react-helmet-async';

import HowItWorksView from 'src/sections/how-it-works/view/how-it-works-view';

// ----------------------------------------------------------------------

export default function HowItWorksPage() {
  return (
    <>
      <Helmet>
        <title>How it works · AI Professor</title>
      </Helmet>

      <HowItWorksView />
    </>
  );
}
