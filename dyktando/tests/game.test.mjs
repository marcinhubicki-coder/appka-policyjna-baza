import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { Game, CATEGORIES, validateWords, accuracy, cleanSettings } from '../game.mjs';
const words = (await Promise.all(Array.from({length:8}, (_,i) => readFile(new URL(`../data/words-0${i+1}.json`, import.meta.url), 'utf8').then(JSON.parse)))).flat();
test('400 unique approved records, counts, options and reconstruction', () => assert.equal(validateWords(words).length, 400));
for (const category of CATEGORIES) test(`${category}: correct, wrong, feedback, pause, shuffle cycles`, () => {
  let time = 0; const game = new Game(words, category, 180, () => time);
  const seen = new Set(); const count = game.pool.length;
  for (let i = 0; i < count; i++) {
    assert.ok(!seen.has(game.current.word)); seen.add(game.current.word);
    assert.equal(game.options.length, 2);
    const correct = i % 2 === 0;
    assert.ok(game.answer(correct ? game.current.answer : game.options.find(o => o !== game.current.answer)));
    assert.equal(game.answer(game.current.answer), false);
    assert.equal(game.state, correct ? 'feedback-correct' : 'feedback-wrong');
    game.skipFeedback();
  }
  assert.equal(seen.size, count); assert.equal(game.question, count + 1);
  assert.equal(game.correct + game.wrong, count);
  game.answer(game.current.answer); time += 300; game.pause();
  const remaining = game.remaining, question = game.question;
  time += 10000; game.tick(); game.skipFeedback(); assert.equal(game.remaining, remaining); assert.equal(game.question, question);
  game.resume(); time += 399; game.tick(); assert.equal(game.question, question);
  time += 1; game.tick(); assert.equal(game.question, question + 1);
});
test('unlimited questions, no boundary repeat and no skipped question at auto-next race', () => {
  let time = 0; const game = new Game(words, 'ć/ci', 180, () => time);
  for (let i = 0; i < 450; i++) {
    const previous = game.current.word; game.answer(game.current.answer);
    time += 700; game.skipFeedback();
    if (game.state === 'ended') break;
    assert.equal(game.question, i + 2); assert.notEqual(game.current.word, previous);
    if (game.state === 'ended') break;
  }
  assert.ok(game.question > 30);
});
test('deadline rejects late answers and finishes during feedback', () => {
  let time = 0; const game = new Game(words, 'all', 60, () => time);
  time = 59900; game.answer(game.current.answer); time = 60000; game.tick();
  assert.equal(game.state, 'ended'); assert.equal(game.correct, 1); assert.equal(game.remaining, 0);
  const late = new Game(words, 'all', 60, () => time); time += 60000;
  assert.equal(late.answer(late.current.answer), false); assert.equal(late.correct, 0);
});
test('wrong auto-next delay and active timer', () => {
  let time=0; const game=new Game(words,'all',180,()=>time);
  game.answer(game.options.find(o=>o!==game.current.answer)); time=1099; game.tick(); assert.equal(game.question,1);
  time=1100; game.tick(); assert.equal(game.question,2); assert.equal(game.remaining,178900);
});
test('safe settings and zero accuracy', () => {
  assert.equal(accuracy(0,0),0); assert.equal(accuracy(3,1),75);
  assert.deepEqual(cleanSettings({duration:2,sound:'false',difficulty:null}), {duration:180,sound:true,difficulty:true});
});
