import type { NextPage } from 'next';
import dynamic from 'next/dynamic';
import React from 'react';

import PageNextJs from 'nextjs/PageNextJs';

const ContractEditor = dynamic(() => import('ui/pages/ContractEditor'), { ssr: false });

const Page: NextPage = () => {
  return (
    <PageNextJs pathname="/contract-editor">
      <ContractEditor/>
    </PageNextJs>
  );
};

export default Page;

export { contractEditor as getServerSideProps } from 'nextjs/getServerSideProps/main';
