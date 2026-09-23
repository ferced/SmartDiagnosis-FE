import { Helmet } from 'react-helmet-async';

import { ProductCreateView } from 'src/sections/product/view';

// ----------------------------------------------------------------------

export default function ProductCreatePage() {
  return (
    <>
      <Helmet>
        <title>Create a new diagnosis · AI Professor</title>
      </Helmet>

      <ProductCreateView />
    </>
  );
}
