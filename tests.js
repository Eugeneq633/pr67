/* Модульні перевірки на console.assert().
   Тут немає звернень до DOM та localStorage: запуск не змінює інтерфейс і дані користувача. */
function runUnitTests() {
  let total = 0;
  let failed = 0;
  function check(condition, message) {
    total++;
    console.assert(condition, message);
    if (!condition) failed++;
  }

  // validateInput: валідне значення, порожній рядок, пробіли, некоректний тип, межа довжини
  check(validateInput('Євген') === true, 'validateInput: звичайний текст має бути валідним');
  check(validateInput('') === false, 'validateInput: порожній рядок має бути невалідним');
  check(validateInput('    ') === false, 'validateInput: рядок із пробілів має бути невалідним');
  check(validateInput(null) === false, 'validateInput: null має бути невалідним');
  check(validateInput(42) === false, 'validateInput: число має бути невалідним');
  check(validateInput('a'.repeat(60), 60) === true, 'validateInput: рядок рівно на межі має бути валідним');
  check(validateInput('a'.repeat(61), 60) === false, 'validateInput: рядок довший за межу має бути невалідним');

  // validateEmail
  check(validateEmail('user@example.com') === true, 'validateEmail: коректна пошта');
  check(validateEmail('user@example') === false, 'validateEmail: без домену верхнього рівня');
  check(validateEmail('us er@example.com') === false, 'validateEmail: пробіл усередині');
  check(validateEmail(undefined) === false, 'validateEmail: undefined');

  // isValidState / isValidRoute
  check(isValidState('loading') === true, 'isValidState: loading допустимий');
  check(isValidState('content') === true, 'isValidState: content допустимий');
  check(isValidState('unknown') === false, 'isValidState: невідомий стан недопустимий');
  check(isValidState(undefined) === false, 'isValidState: undefined недопустимий');
  check(isValidRoute('library') === true, 'isValidRoute: library допустимий');
  check(isValidRoute('<script>') === false, 'isValidRoute: довільний рядок недопустимий');

  // isSafeUrl: лише https і lnk.to
  check(isSafeUrl('https://gtavi-thealbum.lnk.to/rhyno') === true, 'isSafeUrl: офіційне посилання lnk.to');
  check(isSafeUrl('https://justice.lnk.to/pusher') === true, 'isSafeUrl: піддомен lnk.to');
  check(isSafeUrl('http://justice.lnk.to/pusher') === false, 'isSafeUrl: http відхиляється');
  check(isSafeUrl('javascript:alert(1)') === false, 'isSafeUrl: javascript: відхиляється');
  check(isSafeUrl('https://evil.example/lnk.to') === false, 'isSafeUrl: чужий домен відхиляється');
  check(isSafeUrl('https://notlnk.to/x') === false, 'isSafeUrl: схожий домен відхиляється');
  check(isSafeUrl(null) === false, 'isSafeUrl: null відхиляється');

  // filterTracks: за назвою або виконавцем
  const sample = [{ title: 'RHYNO', artist: 'Travis Scott' }, { title: 'Banshee', artist: 'Overmono' }];
  check(filterTracks(sample, 'rhy').length === 1, 'filterTracks: пошук за назвою без урахування регістру');
  check(filterTracks(sample, 'OVERMONO').length === 1, 'filterTracks: пошук за виконавцем');
  check(filterTracks(sample, '   ').length === 2, 'filterTracks: пробіли дорівнюють порожньому запиту');
  check(filterTracks(sample, 'zzz').length === 0, 'filterTracks: нічого не знайдено');
  check(filterTracks(null, 'a').length === 0, 'filterTracks: не масив повертає порожній масив');
  check(filterTracks(sample, '<img src=x onerror=alert(1)>').length === 0, 'filterTracks: HTML у запиті сприймається як текст');

  // truncate
  check(truncate('abc', 5) === 'abc', 'truncate: короткий текст не змінюється');
  check(truncate('a'.repeat(300), 60).length === 61, 'truncate: довгий текст скорочується до 60 символів і «…»');

  // дані: усі посилання в TRACKS мають бути безпечними
  check(Array.isArray(TRACKS) && TRACKS.length === 58, 'TRACKS: має бути 58 записів');
  check(TRACKS.every(t => isSafeUrl(t.url)), 'TRACKS: усі посилання проходять isSafeUrl');

  console.info(`Модульні перевірки: ${total - failed} з ${total} пройдено`);
  return failed === 0;
}

runUnitTests();
