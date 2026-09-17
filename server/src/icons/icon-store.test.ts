import { test } from 'node:test';
import assert from 'node:assert/strict';
import { addIcon, getIcon, initIconStore, listIcons } from './icon-store.js';

// A minimal 1x1 red PNG, base64-encoded.
const RED_PIXEL_PNG =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
const BLUE_PIXEL_PNG =
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

test('addIcon dedupes identical content and returns the same id', () => {
    initIconStore(':memory:');
    const first = addIcon(RED_PIXEL_PNG, 'red');
    const second = addIcon(RED_PIXEL_PNG, 'red again');
    assert.equal(first.id, second.id);
    assert.equal(listIcons().length, 1);
});

test('addIcon gives distinct images distinct ids', () => {
    initIconStore(':memory:');
    const red = addIcon(RED_PIXEL_PNG);
    const blue = addIcon(BLUE_PIXEL_PNG);
    assert.notEqual(red.id, blue.id);
    assert.equal(listIcons().length, 2);
});

test('getIcon round-trips the stored bytes and mime type', () => {
    initIconStore(':memory:');
    const stored = addIcon(RED_PIXEL_PNG, 'red');
    const fetched = getIcon(stored.id);
    assert.ok(fetched);
    assert.equal(fetched.mime, 'image/png');
    assert.equal(fetched.label, 'red');
    const expectedBytes = Buffer.from(RED_PIXEL_PNG.split(',')[1], 'base64');
    assert.deepEqual(Buffer.from(fetched.data), expectedBytes);
});

test('getIcon returns null for an unknown id', () => {
    initIconStore(':memory:');
    assert.equal(getIcon('does-not-exist'), null);
});
