import { Helmet } from 'react-helmet-async';

import { HistoryView } from 'src/sections/history/view';

// ----------------------------------------------------------------------

export default function HistoryPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: History</title>
      </Helmet>

      <HistoryView />
    </>
  );
}
