import { Helmet } from 'react-helmet-async';

import PatientTimelineView from 'src/sections/patient-timeline/view/patient-timeline-view';

// ----------------------------------------------------------------------

export default function PatientTimelinePage() {
  return (
    <>
      <Helmet>
        <title> Dashboard: Patient Timeline</title>
      </Helmet>

      <PatientTimelineView />
    </>
  );
}
