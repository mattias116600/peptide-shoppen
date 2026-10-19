import { companyInfo, supportInfo } from '@/lib/products';

/** The seller's identity as e-handelslagen requires it; every surface renders it from here. */
export function CompanyDetails({ className = 'company-details' }: { className?: string }) {
  return (
    <address className={className}>
      <strong>{companyInfo.name}</strong>
      {companyInfo.orgNr && <span>Org.nr {companyInfo.orgNr}</span>}
      {companyInfo.address && <span>{companyInfo.address}</span>}
      <span>E-post: <a href={`mailto:${companyInfo.email}`}>{companyInfo.email}</a></span>
      <span>Telegram: <a href={supportInfo.url} target="_blank" rel="noopener noreferrer">{supportInfo.handle}</a></span>
    </address>
  );
}
