import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePackText } from './parse.ts';

interface ParsedNodeTemplate {
    id: string;
    stats: {
        speedMultiplier?: number;
        powerConsumption?: number;
        moduleSlots?: number;
        metadata: Record<string, unknown>;
        speed?: number;
        power?: number;
    };
}

const MINIMAL_PACK = `
gamepack test {
    name "Test"
    game "Test"
    version "0.0.1"
}

node furnace {
    speed 2
    power 90
    port input Input
    port output Output
}
`;

test('node stats use the client-facing field names, not the DSL keyword names', async () => {
    const result = await parsePackText(MINIMAL_PACK);
    assert.ok(!result.errors, `expected no parse errors, got: ${JSON.stringify(result.errors)}`);

    const pack = result.result as { nodeTemplates: ParsedNodeTemplate[] };
    const node = pack.nodeTemplates.find(n => n.id === 'furnace');
    assert.ok(node, 'furnace node template should exist');

    // Regression: the generator used to emit `speed`/`power` (the DSL keywords)
    // instead of `speedMultiplier`/`powerConsumption` (what NodeStats/the client
    // model actually reads), leaving speedMultiplier undefined on every template
    // parsed from text and turning every stats-panel rate into NaN.
    assert.equal(node.stats.speedMultiplier, 2);
    assert.equal(node.stats.powerConsumption, 90);
    assert.equal(node.stats.speed, undefined);
    assert.equal(node.stats.power, undefined);
    assert.deepEqual(node.stats.metadata, {});
});

test('node stats default speedMultiplier to 1 when the DSL omits "speed"', async () => {
    const prat = `
gamepack test {
    name "Test"
    game "Test"
    version "0.0.1"
}

node pump {
    port output Output
}
`;
    const result = await parsePackText(prat);
    assert.ok(!result.errors, `expected no parse errors, got: ${JSON.stringify(result.errors)}`);

    const pack = result.result as { nodeTemplates: ParsedNodeTemplate[] };
    const node = pack.nodeTemplates.find(n => n.id === 'pump');
    assert.ok(node, 'pump node template should exist');
    assert.equal(node.stats.speedMultiplier, 1);
});
