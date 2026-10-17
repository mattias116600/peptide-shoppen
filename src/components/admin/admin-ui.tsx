import { orderStatusLabel, type OrderStatus } from '@/lib/commerce';

export const formatDateTime = (iso: string) => new Date(iso).toLocaleString('sv-SE', { dateStyle: 'short', timeStyle: 'short' });

export function StatusPill({ status }: { status: OrderStatus }) {
  return <span className="admin-pill" data-status={status}>{orderStatusLabel[status]}</span>;
}
