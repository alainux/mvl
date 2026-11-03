import test from 'node:test';
import assert from 'node:assert/strict';
import {
  emptyStack, stackFits, stackDropY, stackLock, rotateStackShape,
  STACK_SHAPES, STACK_WIDTH, STACK_HEIGHT,
} from '../docs/assets/ui/stack-game.js';

test('tetrominoes rotate, collide with walls and fall to the lowest open row', () => {
  const board = emptyStack();
  const line = STACK_SHAPES[0];
  assert.equal(STACK_WIDTH, 10);
  assert.equal(STACK_HEIGHT, 16);
  assert.equal(stackFits(board, line, 3, 0), true);
  assert.equal(stackFits(board, line, 8, 0), false);
  assert.equal(stackDropY(board, line, 3, 0), 15);
  let rotated = line;
  for (let i = 0; i < 4; i++) rotated = rotateStackShape(rotated);
  assert.deepEqual([...rotated].sort(), [...line].sort());
});

test('a block only charges its matching two-column grammar lane', () => {
  const shape = STACK_SHAPES[1];
  const matching = stackLock(emptyStack(), shape, 4, 14, 'argument');
  assert.equal(matching.charged, true);
  assert.equal(matching.lines, 0);
  assert.equal(matching.board[15][4].lane, 'argument');

  const missed = stackLock(emptyStack(), shape, 4, 14, 'power');
  assert.equal(missed.charged, false);
  assert.equal(missed.board[15][4].charged, false);
});

test('a complete row clears and upper blocks drop down, with no phantom line', () => {
  const board = emptyStack().map((row) => [...row]);
  for (let col = 0; col < 8; col++) board[15][col] = { lane: 'agent', charged: true };
  const result = stackLock(board, STACK_SHAPES[1], 8, 14, 'power');
  assert.equal(result.lines, 1);
  assert.equal(result.charged, true);
  assert.ok(result.board[0].every((cell) => cell === null));
  assert.deepEqual(result.board[15].slice(8), [
    { lane: 'power', charged: true },
    { lane: 'power', charged: true },
  ]);
  assert.equal(result.board[15][0], null);
});
