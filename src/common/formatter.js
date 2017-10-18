class LocaleFormatter
{
  constructor() {
    const monthIds = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december']
    const dayIds = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

    this.days = dayIds.map(T);
    this.shortDays = dayIds.map(d => T(`${d}_short`));
    this.months = monthIds.map(T);
    this.shortMonths = monthIds.map(m => T(`${m}_short`));

    this.format = d3.timeFormatLocale({
      "decimal": T('decimal_separator'),
      "thousands": T('thousands_separator'),
      "grouping": [3],
      "dateTime": T('date_time_format'),
      "date": T('date_format'),
      "time": T('time_format'),
      "periods": [T('time_period_am'), T('time_period_pm')],
      "days": this.days,
      "shortDays": this.shortDays,
      "months": this.months,
      "shortMonths": this.shortMonths
    }).format;
  }
}

const Locale = new LocaleFormatter();
