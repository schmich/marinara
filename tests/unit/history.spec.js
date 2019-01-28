
import { assert } from 'chai';
import * as History from '@/background/History';

describe('History', () => {
  it('merges empty history', () => {
    const basic = {
      pomodoros: [1],
      durations: [25],
      timezones: [0]
    };

    const empty = {
      pomodoros: [],
      durations: [],
      timezones: []
    };

    var { count, merged } = History.merge(empty, empty);
    assert.equal(count, 0);
    assert.deepEqual(merged, empty);

    var { count, merged } = History.merge(basic, empty);
    assert.equal(count, 0);
    assert.deepEqual(merged, basic);

    var { count, merged } = History.merge(empty, basic);
    assert.equal(count, 1);
    assert.deepEqual(merged, basic);
  });

  it('does not merge duplicate Pomodoros', () => {
    const history = {
      pomodoros: [1, 2, 3, 4, 5],
      durations: [25, 25, 25, 25, 25],
      timezones: [5, 5, 5, 5, 5]
    };

    const { count, merged } = History.merge(history, history);
    assert.equal(count, 0);
    assert.deepEqual(merged, history);
  });

  it('merges Pomodoros', () => {
    const left = {
      pomodoros: [1, 3, 5, 7],
      durations: [10, 11, 12, 13],
      timezones: [60, 120, 180, 240]
    };

    const right = {
      pomodoros: [0, 2, 4, 6, 7],
      durations: [20, 21, 22, 23, 13],
      timezones: [300, 360, 420, 480, 240]
    };

    const expected = {
      pomodoros: [0, 1, 2, 3, 4, 5, 6, 7],
      durations: [20, 10, 21, 11, 22, 12, 23, 13],
      timezones: [300, 60, 360, 120, 420, 180, 480, 240]
    };

    const { count, merged } = History.merge(left, right);
    assert.equal(count, 4);
    assert.deepEqual(merged, expected);
  });
});