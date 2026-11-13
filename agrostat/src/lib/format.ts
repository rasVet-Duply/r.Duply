import { format, parseISO } from 'date-fns';
import { getLang } from './i18n';

export const som = (v: number) => `${Math.round(v).toLocaleString('ru-RU')} ${{ uz: 'so‘m', en: 'UZS', ru: 'сум' }[getLang()]}`;
export const num = (v: number) => v.toLocaleString('ru-RU', { maximumFractionDigits: 1 });
export const fmtDate = (v?: unknown) => {
  if (!v || typeof v !== 'string') return '—';
  try {
    return format(parseISO(v), 'dd.MM.yyyy');
  } catch {
    return v;
  }
};
const MONTHS = {
  uz: ['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  ru: ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'],
};
export const monthLabel = (ym: string) => MONTHS[getLang()][Number(ym.slice(5, 7)) - 1] ?? ym;
export const PENDING_CODE_KEY = 'agrostat_invite_code';
