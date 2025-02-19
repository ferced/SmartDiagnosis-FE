import { Helmet } from 'react-helmet-async';

import ConversationDetailView from 'src/sections/history/view/conversation-details-view';

// ----------------------------------------------------------------------

export default function HistoryPage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Conversation</title>
      </Helmet>

      <ConversationDetailView />
    </>
  );
}
