import test from 'node:test';
import assert from 'node:assert/strict';

function releaseAllowed(buyer, verifier, disputed) {
  return (buyer || verifier) && !disputed;
}

test('TapeOut release policy truth table', () => {
  const cases = [
    [false,false,false,false], [true,false,false,true],
    [false,true,false,true], [true,true,false,true],
    [false,false,true,false], [true,false,true,false],
    [false,true,true,false], [true,true,true,false]
  ];
  for (const [b,v,d,expected] of cases) assert.equal(releaseAllowed(b,v,d),expected);
});

test('approval alone is insufficient when dispute is open', () => {
  assert.equal(releaseAllowed(true,false,true),false);
  assert.equal(releaseAllowed(false,true,true),false);
});
