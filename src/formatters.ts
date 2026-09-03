export function formatBytes(bytes?: number | null, decimals: number = 2): string {
  if (bytes === undefined || bytes === null || isNaN(bytes) || bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  if (i < 0 || i >= sizes.length) return `${bytes} B`;
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export function formatBitrate(kbps?: number | null): string {
  if (kbps === undefined || kbps === null || isNaN(kbps) || kbps <= 0) {
    return '0 Kbps';
  }
  if (kbps < 1000) {
    return `${kbps.toFixed(0)} Kbps`;
  }
  return `${(kbps / 1000).toFixed(1)} Mbps`;
}

export function formatUptime(seconds?: number | null): string {
  if (seconds === undefined || seconds === null || isNaN(seconds) || seconds <= 0) {
    return '0s';
  }
  const days = Math.floor(seconds / (3600 * 24));
  const hours = Math.floor((seconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0 || days > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours > 0 || days > 0) parts.push(`${minutes}m`);
  parts.push(`${secs}s`);
  return parts.join(' ');
}

export function formatCurrency(amount?: number | null, currency: string = 'BDT'): string {
  const num = (amount !== undefined && amount !== null && !isNaN(Number(amount))) ? Number(amount) : 0;
  return `${num.toLocaleString()} ${currency}`;
}

export function getStatusBadgeClass(status?: string | null): string {
  if (!status) return 'bg-slate-800 text-slate-300 border-slate-700';
  switch (status.toUpperCase()) {
    case 'ACTIVE':
    case 'CONNECTED':
    case 'UP':
    case 'ONLINE':
    case 'PAID':
    case 'APPROVED':
    case 'SUCCESS':
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case 'SUSPENDED':
    case 'BLOCKED':
    case 'FAILED':
    case 'ERROR':
    case 'REJECTED':
    case 'OVERDUE':
    case 'DOWN':
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    case 'EXPIRED':
    case 'TERMINATING':
    case 'DISCONNECTED':
    case 'CANCELLED':
      return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
    case 'PENDING':
    case 'PARTIAL':
    case 'CONNECTING':
    case 'INACTIVE':
      return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
    default:
      return 'bg-slate-800 text-slate-300 border-slate-700';
  }
}
