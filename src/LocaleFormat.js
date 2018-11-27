import M from './Messages';
import { timeFormatLocale } from 'd3';

const monthIds = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const dayIds = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

const days = dayIds.map(d => M[d]);
const shortDays = dayIds.map(d => M[`${d}_short`]);
const months = monthIds.map(m => M[m]);
const shortMonths = monthIds.map(m => M[`${m}_short`]);

const formatter = timeFormatLocale({
  decimal: M.decimal_separator,
  thousands: M.thousands_separator,
  grouping: [3],
  dateTime: M.date_time_format,
  date: M.date_format,
  time: M.time_format,
  periods: [M.time_period_am, M.time_period_pm],
  days,
  shortDays,
  months,
  shortMonths
}).format;

export {
    days,
    shortDays,
    months,
    shortMonths,
    formatter
};