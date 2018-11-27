import M from './Messages';
import { formatter } from './LocaleFormat';

function integer(value) {
  return value.toLocaleString();
}

function float(value, digits) {
  return value.toLocaleString(navigator.language, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

function strftime(value, format) {
  return formatter(format)(value);
}

function pomodoroCount(count) {
  if (count === 0) {
    return M.pomodoro_count_zero;
  } else if (count === 1) {
    return M.pomodoro_count_one;
  } else {
    return M.pomodoro_count_many(count.toLocaleString());
  }
}

export {
  float,
  integer,
  strftime,
  pomodoroCount
};