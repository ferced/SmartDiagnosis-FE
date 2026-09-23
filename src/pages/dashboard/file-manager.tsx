import { Helmet } from 'react-helmet-async';

import { FileManagerView } from 'src/sections/file-manager/view';

// ----------------------------------------------------------------------

export default function FileManagerPage() {
  return (
    <>
      <Helmet>
        <title>File Manager · AI Professor</title>
      </Helmet>

      <FileManagerView />
    </>
  );
}
