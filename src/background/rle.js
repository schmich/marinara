class Rle
{
  static encode(arr) {
    let result = [];
    let start = 0;
    let group = arr[0];

    // Intentionally go past the end of the array to simplify adding last group.
    for (let i = 1; i <= arr.length; ++i) {
      if (arr[i] === group) {
        continue;
      }

      result.push(i - start);
      result.push(group);
      start = i;
      group = arr[i];
    }

    return result;
  }

  static decode(arr) {
    let result = [];
    for (let i = 0; i < arr.length; i += 2) {
      for (let j = 0; j < arr[i]; ++j) {
        result.push(arr[i + 1]);
      }
    }

    return result;
  }

  static append(arr, el) {
    if (arr.length > 0 && el === arr[arr.length - 1]) {
      arr[arr.length - 2]++;
    } else {
      arr.push(1, el);
    }

    return arr;
  }
}
